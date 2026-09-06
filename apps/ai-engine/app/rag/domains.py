"""Domain definitions and keyword-based routing for RAG retrieval."""

DOMAINS = [
    "financial_knowledge",
    "guru_philosophy",
    "indian_tax_finance",
    "investment_education",
    "user_documents",
]

_INDIAN_TAX_KEYWORDS = {
    "tax", "ppf", "elss", "itr", "80c", "gst", "deduction",
    "income tax", "tds", "nps", "section 80c", "taxable"
}

_GURU_KEYWORDS = {
    "buffett", "munger", "graham", "bogle", "philosophy",
    "rule of", "principle", "wisdom", "warren", "charlie"
}

_INVESTMENT_KEYWORDS = {
    "stock", "mutual fund", "equity", "bond", "sip", "portfolio",
    "cagr", "index fund", "asset allocation", "asset", "dividend",
    "investing", "compounding"
}

_USER_DOC_KEYWORDS = {
    "my doc", "document", "uploaded", "statement", "pdf",
    "receipt", "invoice", "file"
}


def route_to_domain(query: str) -> str:
    """Selects the best matching domain for a query based on keyword analysis.
    Defaults to 'financial_knowledge'.
    """
    if not query:
        return "financial_knowledge"

    q_lower = query.lower()

    for kw in _INDIAN_TAX_KEYWORDS:
        if kw in q_lower:
            return "indian_tax_finance"

    for kw in _GURU_KEYWORDS:
        if kw in q_lower:
            return "guru_philosophy"

    for kw in _INVESTMENT_KEYWORDS:
        if kw in q_lower:
            return "investment_education"

    for kw in _USER_DOC_KEYWORDS:
        if kw in q_lower:
            return "user_documents"

    return "financial_knowledge"
