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
