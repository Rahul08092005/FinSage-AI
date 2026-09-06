"""Person 3 (Kavya) owns this file.

Phase 1: the first deterministic calculation function — proves the
"Person 3 owns the math, Person 2's agents only call it" contract.
Phase 4 adds calculate_budget_variance, detect_anomalies,
calculate_health_score, forecast_expenses, calculate_goal_projection.
"""
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
