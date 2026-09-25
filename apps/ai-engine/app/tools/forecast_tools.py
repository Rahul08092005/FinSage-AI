"""Forecast tools wrapping spending analytics functions."""
import io
import json
from typing import Any, Dict, Optional
import pandas as pd
try:
    from langchain_core.tools import tool
except ImportError:
    from langchain.tools import tool

from app.analytics.spending import forecast_expenses


@tool
def get_expense_forecast(transactions_json: Any = "", months_ahead: int = 1) -> Dict[str, Any]:
    """Forecasts future monthly spending per category based on transaction history.
    Uses linear trend fitting (least-squares) when >= 3 months of history exist,
    or falls back to historical monthly average otherwise.
    """
    if not transactions_json:
        return {"forecast": {}, "months_ahead": months_ahead, "total_projected": 0.0}

    if isinstance(transactions_json, dict) and "transactions_json" in transactions_json:
        transactions_json = transactions_json["transactions_json"]

    df = pd.DataFrame()
    if isinstance(transactions_json, str):
        if not transactions_json.strip():
            return {"forecast": {}, "months_ahead": months_ahead, "total_projected": 0.0}
        try:
            df = pd.read_json(io.StringIO(transactions_json))
        except Exception:
            try:
                data = json.loads(transactions_json)
                df = pd.DataFrame(data if isinstance(data, list) else [data])
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

    forecast = forecast_expenses(df, months_ahead=months_ahead)
    total_projected = round(sum(forecast.values()), 2) if forecast else 0.0

    return {
        "forecast": forecast,
        "months_ahead": months_ahead,
        "total_projected": total_projected,
    }
