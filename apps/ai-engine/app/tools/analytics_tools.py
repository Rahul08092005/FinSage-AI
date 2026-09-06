"""Person 2 (Rahul) owns this file.

Phase 2: the first real LangChain-style tool, wrapping Person 3's deterministic
calculate_monthly_spending() — this is the "Person 2 wraps, Person 3 owns the
math" contract from the architecture doc, made real.
"""
from langchain.tools import tool

from app.analytics.spending import calculate_monthly_spending
import pandas as pd


@tool
def get_spending_summary(transactions_json: str) -> dict:
    """Given a JSON array of transactions (date, description, amount, category),
    returns total spend by month and by category. Use this when the user asks
    about their spending, budget, or expenses."""
    import io
    import json

    if isinstance(transactions_json, str):
        try:
            df = pd.read_json(io.StringIO(transactions_json))
        except Exception:
            data = json.loads(transactions_json)
            df = pd.DataFrame(data)
    elif isinstance(transactions_json, list):
        df = pd.DataFrame(transactions_json)
    else:
        return {"by_month": {}, "by_category": {}, "total": 0.0}

    return calculate_monthly_spending(df)
