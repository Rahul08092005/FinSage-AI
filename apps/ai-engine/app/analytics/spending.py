<<<<<<< HEAD
"""Person 3 (Kavya) owns this file.

Phase 1: the first deterministic calculation function — proves the
"Person 3 owns the math, Person 2's agents only call it" contract.
Phase 4 adds calculate_budget_variance, detect_anomalies,
calculate_health_score, forecast_expenses, calculate_goal_projection.
"""
=======
>>>>>>> d3cc9308c81467a590e531df3aadff88e23e2030
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
<<<<<<< HEAD
=======


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


# ---------------------------------------------------------------------------
# Phase 3 additions (Steps 9) -- deterministic, no LLM calls
# ---------------------------------------------------------------------------


def calculate_budget_recommendation(transactions: pd.DataFrame) -> dict:
    """Suggest monthly spending limits per category based on historical data.

    Heuristic: recommended limit = historical monthly average * 1.10 (i.e., 10%
    above average).  This is a simple demo heuristic, not financial advice.
    Returns an empty dict if the DataFrame is empty or lacks required columns.

    Args:
        transactions: DataFrame with at least 'date' (datetime), 'amount' (float),
                      and 'category' (str) columns.

    Returns:
        { category: recommended_monthly_limit_float }
    """
    required = {"date", "amount", "category"}
    if transactions.empty or not required.issubset(transactions.columns):
        return {}

    df = transactions.copy()
    df["month"] = df["date"].dt.to_period("M").astype(str)

    # Average spend per category per month
    monthly_by_cat = (
        df.groupby(["category", "month"])["amount"]
        .sum()
        .groupby(level="category")
        .mean()
    )

    # Recommend 10% above the historical monthly average
    return {
        cat: round(float(avg) * 1.10, 2)
        for cat, avg in monthly_by_cat.items()
    }


def detect_anomalies(transactions: pd.DataFrame) -> list[dict]:
    """Flag transactions whose amount exceeds 2 standard deviations above the
    per-category mean.

    Categories with fewer than 4 transactions are skipped -- not enough data
    for a meaningful standard deviation.

    Args:
        transactions: DataFrame with at least 'amount' and 'category' columns.

    Returns:
        List of flagged transaction dicts, each augmented with a 'reason' key.
    """
    required = {"amount", "category"}
    if transactions.empty or not required.issubset(transactions.columns):
        return []

    df = transactions.copy()
    anomalies: list[dict] = []

    for cat, group in df.groupby("category"):
        if len(group) < 4:
            # Not enough data to compute a reliable stddev -- skip
            continue

        mean = group["amount"].mean()
        std  = group["amount"].std()
        if std == 0:
            continue

        flagged = group[group["amount"] > mean + 2 * std]
        for _, row in flagged.iterrows():
            entry = row.to_dict()
            entry["reason"] = (
                f"Amount {row['amount']:.2f} is more than 2 std deviations "
                f"above the {cat} category mean ({mean:.2f}, std={std:.2f})."
            )
            anomalies.append(entry)

    return anomalies


def calculate_health_score(
    transactions: pd.DataFrame,
    budgets: dict,
    goals: list[dict],
    total_income: float = 0.0,
) -> dict:
    """Compute a 0-100 financial health score.

    Formula (clearly documented -- not financial advice):
      Start at 100.
      For each category that is over its budget limit:
          subtract min(20, 20 * (overage_ratio))
          where overage_ratio = (actual - limit) / limit, capped at 1.0.
      If total_income > 0 and total spend > total_income:
          subtract 15 points.
      For each goal with 'progress' > 0 (any positive progress):
          add 5 points (capped so score cannot exceed 100).

    Args:
        transactions: DataFrame with 'amount' and 'category' columns.
        budgets:      { category: monthly_limit } as returned by
                      calculate_budget_recommendation().
        goals:        List of dicts, each with at least 'progress' (float,
                      0.0-1.0 or absolute amount > 0).
        total_income: Optional total income for the period; 0.0 means unknown.

    Returns:
        { "score": int (0-100), "breakdown": { reason: points_change } }
    """
    score = 100
    breakdown: dict[str, float] = {}

    # Category budget checks
    if not transactions.empty and "category" in transactions.columns and budgets:
        actual_by_cat = transactions.groupby("category")["amount"].sum().to_dict()
        for cat, limit in budgets.items():
            actual = actual_by_cat.get(cat, 0.0)
            if limit > 0 and actual > limit:
                overage_ratio = min(1.0, (actual - limit) / limit)
                deduction = round(20 * overage_ratio, 1)
                score -= deduction
                breakdown[f"{cat} over budget"] = -deduction

    # Income vs spend check
    if total_income > 0 and not transactions.empty and "amount" in transactions.columns:
        total_spend = float(transactions["amount"].sum())
        if total_spend > total_income:
            score -= 15
            breakdown["Total spend exceeds income"] = -15

    # Goal progress bonus
    for goal in goals:
        progress = goal.get("progress", 0)
        if isinstance(progress, (int, float)) and progress > 0:
            bonus = 5
            score = min(100, score + bonus)
            label = goal.get("name", "goal")
            breakdown[f"Positive progress on '{label}'"] = +bonus

    score = max(0, min(100, round(score)))

    return {"score": score, "breakdown": breakdown}
>>>>>>> d3cc9308c81467a590e531df3aadff88e23e2030
