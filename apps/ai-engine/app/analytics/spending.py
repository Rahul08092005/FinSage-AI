import pandas as pd


def calculate_monthly_spending(transactions: pd.DataFrame) -> dict:
    """Takes a normalized transactions DataFrame (date, description, amount,
    category) and returns total spend per month, per category.
    """
    if transactions.empty:
        return {"by_month": {}, "by_category": {}, "total": 0.0}

    df = transactions.copy()
    df["month"] = df["date"].dt.to_period("M").astype(str)

    by_month = df.groupby("month")["amount"].sum().round(2).to_dict()
    by_category = df.groupby("category")["amount"].sum().round(2).to_dict()
    total = round(float(df["amount"].sum()), 2)

    return {"by_month": by_month, "by_category": by_category, "total": total}


def calculate_category_breakdown(transactions: list[dict]) -> dict:
    """Person 3, Phase 2: works directly on a list of normalized transaction
    dicts (as produced by normalization.normalize_batch), so the BFF can send
    JSON straight from Prisma without a CSV round-trip. Returns spend and
    percentage share per category.
    """
    if not transactions:
        return {"by_category": {}, "total": 0.0}

    df = pd.DataFrame(transactions)
    total = round(float(df["amount"].sum()), 2)
    if total == 0:
        return {"by_category": {}, "total": 0.0}

    grouped = df.groupby("category")["amount"].sum().round(2)
    by_category = {
        cat: {"amount": float(amt), "percent": round(float(amt) / total * 100, 1)}
        for cat, amt in grouped.items()
    }
    return {"by_category": by_category, "total": total}
