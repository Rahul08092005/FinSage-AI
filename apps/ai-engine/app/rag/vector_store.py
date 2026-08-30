"""Person 2 (Rahul) owns this file.

Phase 2: connect to the same PostgreSQL + pgvector instance Person 1 (Aditi)
runs via docker-compose, and expose insert/search functions. Phase 3 adds the
5-domain routing on top of this.
"""
import os

import psycopg2
from psycopg2.extras import execute_values

from app.rag.embeddings import EMBEDDING_DIM

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://finsage:finsage_dev_pw@localhost:5432/finsage_db"
)


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def ensure_schema():
    """Creates the pgvector extension and a minimal chunks table if missing.
    Safe to call on every startup — Phase 3 will move this into a real
    migration owned by Person 1 instead."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            cur.execute(
                f"""
                CREATE TABLE IF NOT EXISTS rag_chunks (
                    id SERIAL PRIMARY KEY,
                    domain TEXT NOT NULL,
                    content TEXT NOT NULL,
                    embedding VECTOR({EMBEDDING_DIM})
                );
                """
            )
        conn.commit()


def insert_chunk(domain: str, content: str, embedding: list[float]) -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO rag_chunks (domain, content, embedding) VALUES (%s, %s, %s)",
                (domain, content, embedding),
            )
        conn.commit()


def search_similar(domain: str, embedding: list[float], top_k: int = 5) -> list[dict]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT content, embedding <-> %s::vector AS distance
                FROM rag_chunks
                WHERE domain = %s
                ORDER BY distance ASC
                LIMIT %s
                """,
                (embedding, domain, top_k),
            )
            rows = cur.fetchall()
    return [{"content": r[0], "distance": float(r[1])} for r in rows]
