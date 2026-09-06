"""Budgeting recommendation tools."""
import json
from typing import Optional
from langchain_core.tools import tool


def calculate_budget_recommendation(transactions_json: Optional[str] = "") -> dict:
    """Calculates suggested monthly budget limits per category based on historical spend."""
    if not transactions_json:
        return {"suggested_monthly_budget": {}, "total_recommended_budget": 0.0}

    try:
        from app.analytics.spending import calculate_monthly_spending
        from app.analytics.csv_parser import parse_transactions_csv
        df = parse_transactions_csv(transactions_json.encode("utf-8"))
        summary = calculate_monthly_spending(df)
        cat_spending = summary.get("by_category", {})
        
        recommendations = {}
        total_rec = 0.0
        for cat, amt in cat_spending.items():
            suggested = round(float(amt) * 0.9, 2)
            recommendations[cat] = suggested
            total_rec += suggested

        return {
            "suggested_monthly_budget": recommendations,
            "total_recommended_budget": round(total_rec, 2)
        }
    except Exception as e:
        return {"suggested_monthly_budget": {}, "total_recommended_budget": 0.0, "error": str(e)}


@tool
def get_budget_recommendation(transactions_json: Optional[str] = "") -> dict:
    """Returns budgeting recommendations based on spending history."""
    return calculate_budget_recommendation(transactions_json or "")
