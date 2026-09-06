"""Embeddings utility for text embedding generation."""
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
    values = [(digest[i % len(digest)] / 255.0) for i in range(EMBEDDING_DIM)]
    return values
