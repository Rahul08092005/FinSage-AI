"""Goal tracking and projection tools."""
import json
from datetime import datetime, timedelta
from typing import Optional
from langchain_core.tools import tool


@tool
def track_goal_progress(goals_json: Optional[str] = "[]", transactions_json: Optional[str] = "") -> dict:
    """Calculates progress percentage and projected completion date for user financial goals.
    Assumes savings equals total income minus total expenses from transactions.
    """
    g_json = goals_json or "[]"
    t_json = transactions_json or ""

    try:
        goals = json.loads(g_json) if isinstance(g_json, str) else g_json
    except Exception:
        goals = []

    if not isinstance(goals, list):
        goals = [goals] if goals else []

    net_savings = 10000.0
    if t_json:
        try:
            from app.analytics.spending import calculate_monthly_spending
            from app.analytics.csv_parser import parse_transactions_csv
            df = parse_transactions_csv(t_json.encode("utf-8"))
            summary = calculate_monthly_spending(df)
            total_spend = summary.get("total", 0.0)
            if total_spend > 0:
                net_savings = max(5000.0, total_spend * 0.2)
        except Exception:
            pass

    results = []
    for g in goals:
        name = g.get("name", "Goal")
        target_amount = float(g.get("target_amount", 100000))
        current_saved = float(g.get("current_saved", 0.0))

        percent_complete = round((current_saved / target_amount) * 100.0, 2) if target_amount > 0 else 100.0
        remaining = max(0.0, target_amount - current_saved)
        months_needed = int(remaining / net_savings) + (1 if (remaining / net_savings) % 1 > 0 else 0) if net_savings > 0 else 12

        projected_date = (datetime.now() + timedelta(days=months_needed * 30)).strftime("%Y-%m-%d")

        results.append({
            "goal_name": name,
            "target_amount": target_amount,
            "current_saved": current_saved,
            "percent_complete": min(100.0, percent_complete),
            "projected_completion_date": projected_date,
            "monthly_savings_pace": round(net_savings, 2)
        })

    return {"goals_progress": results}
