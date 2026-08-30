from datetime import datetime
from typing import Any

from app.analytics.categorization import categorize_transaction


def normalize_transaction(raw: dict[str, Any], source: str) -> dict[str, Any]:
    description = str(raw.get("description", "")).strip()
    category = raw.get("category") or categorize_transaction(description)

    date_value = raw.get("date") or raw.get("transactionDate")
    if isinstance(date_value, str):
        date_value = datetime.fromisoformat(date_value.replace("Z", "+00:00"))

    return {
        "date": date_value,
        "description": description,
        "amount": float(raw.get("amount", 0)),
        "category": category,
        "source": source,
    }


def normalize_batch(raw_rows: list[dict[str, Any]], source: str) -> list[dict[str, Any]]:
    return [normalize_transaction(row, source) for row in raw_rows]
