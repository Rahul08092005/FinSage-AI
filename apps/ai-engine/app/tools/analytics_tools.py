"""Analytics tools for financial agent interactions."""
import io
import json
from typing import Any
import pandas as pd
from langchain.tools import tool

from app.analytics.spending import calculate_monthly_spending


@tool
def get_spending_summary(transactions_json: Any = "") -> dict:
    """Given a JSON array of transactions (date, description, amount, category),
    returns total spend by month and by category. Use this when the user asks
    about their spending, budget, or expenses."""
    if not transactions_json:
        return {"by_month": {}, "by_category": {}, "total": 0.0}

    if isinstance(transactions_json, dict) and "transactions_json" in transactions_json:
        transactions_json = transactions_json["transactions_json"]

    if isinstance(transactions_json, str):
        if not transactions_json.strip():
            return {"by_month": {}, "by_category": {}, "total": 0.0}
        try:
            df = pd.read_json(io.StringIO(transactions_json))
        except Exception:
            try:
                data = json.loads(transactions_json)
                df = pd.DataFrame(data)
            except Exception:
                return {"by_month": {}, "by_category": {}, "total": 0.0}
    elif isinstance(transactions_json, list):
        df = pd.DataFrame(transactions_json)
    elif isinstance(transactions_json, pd.DataFrame):
        df = transactions_json
    else:
        return {"by_month": {}, "by_category": {}, "total": 0.0}

    return calculate_monthly_spending(df)
