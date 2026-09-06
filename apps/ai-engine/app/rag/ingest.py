"""RAG Ingestion and retrieval module."""
from typing import List, Dict, Any
from app.rag.embeddings import embed_text
from app.rag.vector_store import insert_chunk, search_similar
from app.rag.domains import route_to_domain


def ingest_text(domain: str, content: str, chunk_size: int = 500) -> int:
    """Splits content into naive fixed-size chunks, generates embeddings,
    and inserts each chunk into vector store. Returns number of chunks stored.
    """
    if not content:
        return 0

    chunks = []
    for i in range(0, len(content), chunk_size):
        chunk = content[i:i + chunk_size].strip()
        if chunk:
            chunks.append(chunk)

    stored_count = 0
    for chunk in chunks:
        vec = embed_text(chunk)
        insert_chunk(domain=domain, content=chunk, embedding=vec)
        stored_count += 1

    return stored_count


def search_domain(domain: str, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """Embeds query and retrieves top_k similar chunks in specified domain."""
    query_vec = embed_text(query)
    return search_similar(domain=domain, query_embedding=query_vec, top_k=top_k)


def seed_demo_knowledge() -> Dict[str, Any]:
    """Ingests short hardcoded knowledge paragraphs into financial_knowledge
    and indian_tax_finance for demo retrieval.
    """
    fk_content_1 = (
        "The 50/30/20 budget rule suggests allocating 50% of net income to needs, "
        "30% to wants, and 20% toward savings and debt repayment. Needs include housing, "
        "groceries, and utilities. Wants encompass dining out and hobbies."
    )
    fk_content_2 = (
        "An emergency fund should ideally cover 3 to 6 months of living expenses. "
        "Store emergency funds in liquid assets like savings accounts or liquid mutual funds "
        "so they are readily accessible during unexpected medical or financial situations."
    )

    tax_content_1 = (
        "Public Provident Fund (PPF) is a popular long-term savings scheme in India. "
        "It offers tax savings under Section 80C up to Rs 1.5 lakh per financial year. "
        "PPF enjoys EEE (Exempt-Exempt-Exempt) tax status, making interest earned and maturity "
        "returns completely tax-free."
    )
    tax_content_2 = (
        "Equity Linked Savings Scheme (ELSS) is an equity mutual fund eligible for tax deduction "
        "under Section 80C. ELSS has a 3-year lock-in period, which is the shortest among all "
        "Section 80C tax-saving options such as PPF and tax-saver FDs."
    )

    c1 = ingest_text("financial_knowledge", fk_content_1)
    c2 = ingest_text("financial_knowledge", fk_content_2)
    c3 = ingest_text("indian_tax_finance", tax_content_1)
    c4 = ingest_text("indian_tax_finance", tax_content_2)

    total_chunks = c1 + c2 + c3 + c4
    return {"status": "success", "chunks_stored": total_chunks}
