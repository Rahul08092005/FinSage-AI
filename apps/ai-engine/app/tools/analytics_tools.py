"""Analytics tools for financial agent interactions."""
import json
from typing import Optional
from langchain_core.tools import tool
from app.analytics.spending import calculate_monthly_spending
from app.analytics.csv_parser import parse_transactions_csv


@tool
def get_spending_summary(transactions_json: Optional[str] = "") -> dict:
    """Calculates monthly and category spending summary from raw CSV or JSON transactions data."""
    if not transactions_json:
        return {"by_month": {}, "by_category": {}, "total": 0.0}

    try:
        df = parse_transactions_csv(transactions_json.encode("utf-8"))
        return calculate_monthly_spending(df)
    except Exception:
        return {"by_month": {}, "by_category": {}, "total": 0.0, "error": "Invalid transactions format"}
