<<<<<<< HEAD
"""Embeddings utility for text embedding generation."""
import os
import hashlib
from typing import List


def embed_text(text: str) -> List[float]:
    """Generates text embedding using Gemini API if GEMINI_API_KEY is available,
    otherwise returns a deterministic mock vector fallback.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            result = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            if isinstance(result, dict) and "embedding" in result:
                return result["embedding"]
        except Exception:
            pass

    # Mock embedding: generate 768-dim float vector based on text hash
    hash_bytes = hashlib.sha256(text.encode("utf-8")).digest()
    mock_vector = [(b / 255.0) - 0.5 for b in hash_bytes]
    while len(mock_vector) < 768:
        mock_vector.extend(mock_vector)
    return mock_vector[:768]
=======
"""Person 2 (Rahul) owns this file.

Phase 2: a single embed_text() function, provider-agnostic like llm_client.py.
Phase 3 wires this into the ingestion pipeline for the 5 RAG domains.
"""
import hashlib
import os

EMBEDDING_DIM = 768  # matches Gemini text-embedding-004; keep consistent with pgvector column


def embed_text(text: str) -> list[float]:
    """Returns a vector embedding for the given text.

    Falls back to a deterministic mock embedding (hash-based) if no
    GEMINI_API_KEY is set, so RAG plumbing can be built and tested by
    teammates without an API key.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return _mock_embedding(text)

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        result = genai.embed_content(model="models/text-embedding-004", content=text)
        return result["embedding"]
    except Exception:
        return _mock_embedding(text)


def _mock_embedding(text: str) -> list[float]:
    """Deterministic, fast, dependency-free — same text always returns the
    same vector, which is enough to test storage/retrieval plumbing."""
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    # repeat the 32-byte digest to fill EMBEDDING_DIM floats in [0, 1)
    values = [(digest[i % len(digest)] / 255.0) for i in range(EMBEDDING_DIM)]
    return values
>>>>>>> d3cc9308c81467a590e531df3aadff88e23e2030
