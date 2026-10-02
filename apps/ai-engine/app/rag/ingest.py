"""RAG Ingestion and retrieval module."""
from typing import List, Dict, Any
from app.rag.embeddings import embed_text
from app.rag.vector_store import insert_chunk, search_similar
from app.rag.domains import route_to_domain


def ingest_text(domain: str, content: str, chunk_size: int = 1000) -> int:
    """Splits content into chunks, generates embeddings,
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
    results = search_similar(domain=domain, query_embedding=query_vec, top_k=top_k)
    matching = [r for r in results if r.get("domain") == domain]
    if not matching:
        seed_demo_knowledge()
        results = search_similar(domain=domain, query_embedding=query_vec, top_k=top_k)
        matching = [r for r in results if r.get("domain") == domain]
    return matching if matching else results


def seed_indian_tax_knowledge() -> Dict[str, Any]:
    """Ingests comprehensive real knowledge on Indian Tax and Finance into
    the 'indian_tax_finance' domain (PPF, ELSS, SIP basics, and Old vs New Tax Regime).
    """
    ppf_content = (
        "Public Provident Fund (PPF) is a government-backed long-term savings instrument in India offering "
        "guaranteed returns and sovereign capital safety. It features a mandatory 15-year lock-in period, "
        "with partial withdrawal and loan facilities permitted after specified tenures. Annual contributions up to "
        "Rs 1.5 lakh are fully eligible for tax deduction under Section 80C of the Income Tax Act. The interest rate "
        "is reviewed and set quarterly by the Government of India, and PPF enjoys Exempt-Exempt-Exempt (EEE) status "
        "where the deposit, interest earned, and maturity proceeds are all completely tax-free."
    )

    elss_content = (
        "Equity Linked Savings Scheme (ELSS) is a category of diversified equity mutual funds eligible for tax "
        "deduction under Section 80C up to Rs 1.5 lakh per financial year. ELSS has a mandatory lock-in period of "
        "3 years, which is the shortest lock-in among all Section 80C tax-saving instruments including PPF, NPS, and "
        "5-year tax-saving fixed deposits. By investing predominantly in equities, ELSS offers the potential for higher "
        "inflation-beating long-term returns alongside market volatility. Long Term Capital Gains (LTCG) upon redemption "
        "are taxed at 12.5% on gains exceeding Rs 1.25 lakh in a financial year."
    )

    sip_content = (
        "A Systematic Investment Plan (SIP) is an investment mechanism that allows individuals to invest a fixed sum "
        "into mutual funds at regular intervals, typically monthly. SIP eliminates the risk of market timing through "
        "rupee-cost averaging, purchasing more units when prices fall and fewer units when prices rise. Compared to a "
        "lump-sum investment, a SIP reduces downside volatility and instills financial discipline without requiring "
        "large upfront capital. Over extended investment horizons, consistent SIP contributions benefit significantly "
        "from the power of compounding."
    )

    regime_content = (
        "The Indian income tax framework offers individual taxpayers a choice between the Old Tax Regime and the "
        "New Tax Regime. The Old Regime retains an extensive structure of itemized deductions and exemptions, notably "
        "Section 80C (PPF, ELSS, EPF), Section 80D (health insurance), House Rent Allowance (HRA), and home loan interest. "
        "In contrast, the New Regime features lower concessional tax slabs across brackets but disallows most popular "
        "deductions and Section 80C exemptions. The optimal choice conceptually depends on whether a taxpayer's cumulative "
        "eligible deductions exceed the threshold where the lower base tax rates of the New Regime become more beneficial."
    )

    c1 = ingest_text("indian_tax_finance", ppf_content)
    c2 = ingest_text("indian_tax_finance", elss_content)
    c3 = ingest_text("indian_tax_finance", sip_content)
    c4 = ingest_text("indian_tax_finance", regime_content)

    return {"status": "success", "domain": "indian_tax_finance", "chunks_stored": c1 + c2 + c3 + c4}


def seed_guru_philosophy_knowledge() -> Dict[str, Any]:
    """Ingests comprehensive financial wisdom and distinct investor philosophies
    into the 'guru_philosophy' domain (Buffett, Munger, Bogle, Graham, Lynch, Dalio, Marks).
    """
    buffett_munger_content = (
        "Warren Buffett and Charlie Munger champion value investing focused on buying wonderful businesses "
        "with durable economic moats at fair prices, rather than fair businesses at wonderful prices. Buffett "
        "and Munger advocate holding high-return-on-capital companies for the ultra-long term ('our favorite "
        "holding period is forever'), staying strictly within one's circle of competence, and avoiding speculative "
        "fads or leverage. Charlie Munger emphasizes mental models, worldly wisdom, and inversion—avoiding stupidity "
        "consistently rather than trying to be brilliant."
    )

    bogle_content = (
        "John Bogle, founder of Vanguard, pioneered low-cost index investing and the mathematics of relentless "
        "cost minimization. Bogle argued that attempting to beat the market or time macroeconomic cycles is a loser's "
        "game for the vast majority of investors due to compounding management fees, brokerage commissions, and "
        "tax turnover. Instead, Bogle advises owning the entire market through broad-market index funds, capturing "
        "aggregate economic compounding, reinvesting dividends, and tuning out short-term market noise."
    )

    graham_content = (
        "Benjamin Graham, the father of modern value investing and mentor to Warren Buffett, established the core "
        "doctrine of Margin of Safety. Graham taught that price is what you pay, while value is what you get. "
        "Disciplined investors must view equities as fractional stakes in real businesses, maintain strict emotional "
        "detachment from 'Mr. Market's' volatile daily mood swings, and invest with a substantial safety buffer "
        "below conservative intrinsic business value to preserve principal capital."
    )

    lynch_content = (
        "Peter Lynch, renowned manager of the Fidelity Magellan Fund, championed Growth at a Reasonable Price (GARP) "
        "and the philosophy of 'invest in what you know.' Lynch urges retail investors to leverage their practical "
        "firsthand consumer observations to discover emerging business winners before institutional analysts. He "
        "emphasizes checking balance sheets, ensuring debt is manageable, validating that the P/E ratio is justified by "
        "the growth rate (PEG ratio), and holding tenaciously onto multi-baggers."
    )

    dalio_marks_content = (
        "Ray Dalio and Howard Marks focus on market cycles, risk mitigation, and second-level thinking. Ray Dalio's "
        "All-Weather philosophy advocates strategic asset allocation balancing uncorrelated asset classes (equities, "
        "bonds, commodities, gold) across distinct economic regimes of growth and inflation. Howard Marks teaches "
        "that outstanding investment performance is achieved through superior risk control and understanding cyclical "
        "pendulums, rather than chasing high returns through aggressive, unhedged risk-taking."
    )

    c1 = ingest_text("guru_philosophy", buffett_munger_content)
    c2 = ingest_text("guru_philosophy", bogle_content)
    c3 = ingest_text("guru_philosophy", graham_content)
    c4 = ingest_text("guru_philosophy", lynch_content)
    c5 = ingest_text("guru_philosophy", dalio_marks_content)

    return {"status": "success", "domain": "guru_philosophy", "chunks_stored": c1 + c2 + c3 + c4 + c5}


def seed_demo_knowledge() -> Dict[str, Any]:
    """Ingests short hardcoded knowledge paragraphs into financial_knowledge,
    comprehensive knowledge into indian_tax_finance, and distinct investor philosophies
    into guru_philosophy for demo retrieval.
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

    c1 = ingest_text("financial_knowledge", fk_content_1)
    c2 = ingest_text("financial_knowledge", fk_content_2)
    tax_result = seed_indian_tax_knowledge()
    guru_result = seed_guru_philosophy_knowledge()

    total_chunks = (
        c1 + c2 + tax_result.get("chunks_stored", 0) + guru_result.get("chunks_stored", 0)
    )
    return {"status": "success", "chunks_stored": total_chunks}
