"""Vector store integration using PostgreSQL pgvector with fallback in-memory store."""
import os
import math
from typing import List, Dict, Any, Optional

_IN_MEMORY_CHUNKS: List[Dict[str, Any]] = []


def insert_chunk(domain: str, content: str, embedding: Optional[List[float]] = None) -> int:
    """Inserts a text chunk and its embedding into vector store (rag_chunks table).
    Supports postgres/pgvector if DATABASE_URL or POSTGRES_DB is set, otherwise uses in-memory store.
    """
    if embedding is None:
        from app.rag.embeddings import embed_text
        embedding = embed_text(content)

    db_url = os.getenv("DATABASE_URL")
    if db_url or os.getenv("POSTGRES_DB"):
        try:
            import psycopg2
            conn_str = db_url or (
                f"dbname={os.getenv('POSTGRES_DB', 'finsage_db')} "
                f"user={os.getenv('POSTGRES_USER', 'finsage')} "
                f"password={os.getenv('POSTGRES_PASSWORD', 'finsage_dev_pw')} "
                f"host={os.getenv('POSTGRES_HOST', 'localhost')} "
                f"port={os.getenv('POSTGRES_PORT', '5432')}"
            )
            conn = psycopg2.connect(conn_str)
            cur = conn.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS rag_chunks (
                    id SERIAL PRIMARY KEY,
                    domain VARCHAR(100),
                    content TEXT,
                    embedding VECTOR(768)
                )
            """)
            embedding_str = f"[{','.join(map(str, embedding))}]"
            cur.execute(
                "INSERT INTO rag_chunks (domain, content, embedding) VALUES (%s, %s, %s)",
                (domain, content, embedding_str)
            )
            conn.commit()
            cur.close()
            conn.close()
            return 1
        except Exception:
            pass

    # Fallback in-memory storage
    chunk_id = len(_IN_MEMORY_CHUNKS) + 1
    _IN_MEMORY_CHUNKS.append({
        "id": chunk_id,
        "domain": domain,
        "content": content,
        "embedding": embedding
    })
    return chunk_id


def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1)) or 1.0
    norm2 = math.sqrt(sum(b * b for b in vec2)) or 1.0
    return dot / (norm1 * norm2)


def search_similar(
    domain: str,
    query_embedding: Optional[List[float]] = None,
    embedding: Optional[List[float]] = None,
    top_k: int = 3
) -> List[Dict[str, Any]]:
    """Searches similar chunks in specified domain using vector similarity."""
    target_embedding = query_embedding if query_embedding is not None else embedding
    if target_embedding is None:
        return []

    db_url = os.getenv("DATABASE_URL")
    if db_url or os.getenv("POSTGRES_DB"):
        try:
            import psycopg2
            conn_str = db_url or (
                f"dbname={os.getenv('POSTGRES_DB', 'finsage_db')} "
                f"user={os.getenv('POSTGRES_USER', 'finsage')} "
                f"password={os.getenv('POSTGRES_PASSWORD', 'finsage_dev_pw')} "
                f"host={os.getenv('POSTGRES_HOST', 'localhost')} "
                f"port={os.getenv('POSTGRES_PORT', '5432')}"
            )
            conn = psycopg2.connect(conn_str)
            cur = conn.cursor()
            embedding_str = f"[{','.join(map(str, target_embedding))}]"
            cur.execute(
                """
                SELECT id, domain, content, 1 - (embedding <=> %s::vector) AS similarity
                FROM rag_chunks
                WHERE domain = %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (embedding_str, domain, embedding_str, top_k)
            )
            rows = cur.fetchall()
            cur.close()
            conn.close()
            return [
                {"id": r[0], "domain": r[1], "content": r[2], "similarity": float(r[3])}
                for r in rows
            ]
        except Exception:
            pass

    # Fallback in-memory search
    domain_chunks = [c for c in _IN_MEMORY_CHUNKS if c["domain"] == domain]
    if not domain_chunks:
        domain_chunks = _IN_MEMORY_CHUNKS

    scored = []
    for c in domain_chunks:
        sim = _cosine_similarity(target_embedding, c["embedding"])
        scored.append({
            "id": c["id"],
            "domain": c["domain"],
            "content": c["content"],
            "similarity": sim
        })

    scored.sort(key=lambda x: x["similarity"], reverse=True)
    return scored[:top_k]
