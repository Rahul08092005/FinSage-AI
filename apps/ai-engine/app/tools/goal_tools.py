"""Goal tracking and projection tools."""
import io
import json
from typing import Any, Optional
import pandas as pd
try:
    from langchain_core.tools import tool
except ImportError:
    from langchain.tools import tool

from app.analytics.spending import calculate_goal_projection


@tool
def track_goal_progress(
    goals_json: Any = "[]",
    transactions_json: Any = "",
    monthly_salary: Optional[float] = None,
) -> dict:
    """Calculates progress percentage, on-track status, and projected completion date
    for user financial goals using Kavya's calculate_goal_projection formula.
    """
    if isinstance(goals_json, dict) and "goals_json" in goals_json:
        monthly_salary = goals_json.get("monthly_salary", monthly_salary)
        transactions_json = goals_json.get("transactions_json", transactions_json)
        goals_json = goals_json.get("goals_json", "[]")

    try:
        goals = json.loads(goals_json) if isinstance(goals_json, str) else goals_json
    except Exception:
        goals = []

    if not isinstance(goals, list):
        goals = [goals] if goals else []

    df = pd.DataFrame()
    if transactions_json:
        if isinstance(transactions_json, dict) and "transactions_json" in transactions_json:
            transactions_json = transactions_json["transactions_json"]

        if isinstance(transactions_json, str) and transactions_json.strip():
            try:
                data = json.loads(transactions_json)
                df = pd.DataFrame(data if isinstance(data, list) else [data])
            except Exception:
                try:
                    df = pd.read_json(io.StringIO(transactions_json))
                except Exception:
                    try:
                        from app.analytics.csv_parser import parse_transactions_csv
                        df = parse_transactions_csv(transactions_json.encode("utf-8"))
                    except Exception:
                        df = pd.DataFrame()
        elif isinstance(transactions_json, list):
            df = pd.DataFrame(transactions_json)
        elif isinstance(transactions_json, pd.DataFrame):
            df = transactions_json

    if not df.empty and "transactionDate" in df.columns and "date" not in df.columns:
        df["date"] = df["transactionDate"]

    results = []
    for g in goals:
        if not isinstance(g, dict):
            continue

        name = g.get("name", g.get("title", "Goal"))
        target_amount = float(g.get("target_amount", g.get("targetAmount", 100000)))
        current_saved = float(g.get("current_saved", g.get("currentSaved", 0.0)))
        remaining = max(0.0, target_amount - current_saved)

        percent_complete = round((current_saved / target_amount) * 100.0, 2) if target_amount > 0 else 100.0

        # Call Kavya's calculate_goal_projection directly
        projection = calculate_goal_projection(goal=g, transactions=df, monthly_salary=monthly_salary)

        projected_date = projection.get("projected_date")
        months_remaining = projection.get("months_remaining", 0)
        on_track = projection.get("on_track", True)

        monthly_pace = round(remaining / max(1, months_remaining), 2) if remaining > 0 else 0.0

        results.append({
            "goal_name": name,
            "target_amount": target_amount,
            "current_saved": current_saved,
            "percent_complete": min(100.0, percent_complete),
            "projected_completion_date": projected_date,
            "months_remaining": months_remaining,
            "on_track": on_track,
            "monthly_savings_pace": monthly_pace,
        })

    return {"goals_progress": results}

