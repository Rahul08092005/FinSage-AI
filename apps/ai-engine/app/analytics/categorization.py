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
    text = description.lower()
    for category, keywords in CATEGORY_RULES.items():
        if any(kw in text for kw in keywords):
            return category
    return DEFAULT_CATEGORY
