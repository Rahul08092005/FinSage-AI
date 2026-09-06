from app.analytics.ml_categorizer import predict_category


CATEGORY_RULES: dict[str, list[str]] = {
    "Food": ["swiggy", "zomato", "restaurant", "cafe", "food"],
    "Transport": ["uber", "ola", "metro", "petrol", "fuel", "irctc"],
    "Shopping": ["amazon", "flipkart", "myntra", "mall"],
    "Bills": ["electricity", "water bill", "recharge", "broadband", "gas bill"],
    "Entertainment": ["netflix", "spotify", "hotstar", "movie", "bookmyshow"],
    "Healthcare": ["pharmacy", "hospital", "clinic", "medplus", "apollo"],
    "Education": ["udemy", "coursera", "tuition", "college", "course"],
    "Investment": ["mutual fund", "sip", "zerodha", "groww", "stocks"],
    "Rent": ["rent", "landlord"],
}
DEFAULT_CATEGORY = "Other"


def categorize_transaction(description: str) -> str:
    """Return the most appropriate category for a transaction description.

    Resolution order:
      1. ML model (predict_category) -- used when a trained model exists.
      2. Keyword rules (CATEGORY_RULES) -- always-available fallback.
      3. DEFAULT_CATEGORY ("Other") -- when no rule matches.

    The existing keyword rules are never removed; they are the fallback and
    the bootstrap-training source for the ML model.
    """
    # 1. Try ML prediction first
    ml_result = predict_category(description)
    if ml_result is not None:
        return ml_result

    # 2. Keyword rule fallback (original logic, unchanged)
    text = description.lower()
    for category, keywords in CATEGORY_RULES.items():
        if any(kw in text for kw in keywords):
            return category
    return DEFAULT_CATEGORY
