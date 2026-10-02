"""Natural language transaction query tools for 'Ask FinSage'."""
import io
import json
import re
from typing import Any, Dict, Optional
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

try:
    from langchain_core.tools import tool
except ImportError:
    from langchain.tools import tool

from app.services.llm_client import generate

PARSER_SYSTEM_PROMPT = (
    "You are a financial query parser for FinSage AI. "
    "Given a user's natural language question about their transactions, extract the query filters into a JSON object. "
    "Return ONLY a valid JSON object with the following fields:\n"
    '- "category": string (e.g., "Food", "Dining", "Groceries", "Entertainment", "Travel", "Rent", "Utilities") or null\n'
    '- "date_from": string in "YYYY-MM-DD" format or null\n'
    '- "date_to": string in "YYYY-MM-DD" format or null\n'
    '- "day_of_week": string ("weekend", "weekday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday") or null\n'
    '- "min_amount": number (float) or null\n'
    '- "max_amount": number (float) or null\n'
    '- "group_by": string (e.g., "category", "day", "month") or null\n\n'
    "Rules:\n"
    "1. Do NOT compute any math, counts, or totals.\n"
    "2. Return ONLY the raw JSON object. Do not include markdown code fences, comments, or explanations."
)


def _clean_json_str(text: str) -> str:
    """Strip code fences and whitespace from LLM JSON output."""
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```[a-zA-Z]*\n?", "", t)
        t = re.sub(r"\n?```$", "", t).strip()
    match = re.search(r"\{.*\}", t, re.DOTALL)
    if match:
        return match.group(0).strip()
    return t


def _load_transactions_df(transactions_json: Any) -> pd.DataFrame:
    """Robust conversion of transactions input to pandas DataFrame."""
    if not transactions_json:
        return pd.DataFrame()

    if isinstance(transactions_json, dict) and "transactions_json" in transactions_json:
        transactions_json = transactions_json["transactions_json"]

    if isinstance(transactions_json, str):
        if not transactions_json.strip():
            return pd.DataFrame()
        try:
            df = pd.read_json(io.StringIO(transactions_json))
        except Exception:
            try:
                data = json.loads(transactions_json)
                df = pd.DataFrame(data)
            except Exception:
                return pd.DataFrame()
    elif isinstance(transactions_json, list):
        df = pd.DataFrame(transactions_json)
    elif isinstance(transactions_json, pd.DataFrame):
        df = transactions_json.copy()
    else:
        return pd.DataFrame()

    if not df.empty and "transactionDate" in df.columns and "date" not in df.columns:
        df["date"] = df["transactionDate"]

    if not df.empty and "amount" in df.columns:
        df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0.0)

    return df


@tool
def ask_finsage(question: str, transactions_json: Any = "") -> dict:
    """Turns a plain-English question about transactions into a structured filter + aggregation.
    Returns both the answer and the underlying data used to produce it.
    """
    # 1. Parse intent into structured filter using LLM
    parse_error = False
    filters = {}
    try:
        raw_llm_out = generate(prompt=question, system=PARSER_SYSTEM_PROMPT)
        cleaned_json = _clean_json_str(raw_llm_out)
        parsed = json.loads(cleaned_json)
        if isinstance(parsed, dict):
            filters = parsed
        else:
            parse_error = True
    except Exception:
        parse_error = True

    # Normalize active filters (drop None, empty, or 'null' values)
    active_filters: Dict[str, Any] = {}
    if not parse_error:
        for k, v in filters.items():
            if v is not None and v != "" and str(v).lower() != "null":
                active_filters[k] = v

    # 2. Ingest and filter transactions using pandas (Zero LLM arithmetic boundary)
    df = _load_transactions_df(transactions_json)

    if df.empty:
        total = 0.0
        count = 0
        matching_transactions = []
        if parse_error:
            answer = "Could not parse query filters; no transactions were provided to analyze."
        else:
            answer = "No transactions available to analyze."
        return {
            "answer": answer,
            "filters_used": active_filters,
            "matching_transactions": matching_transactions,
            "total": total,
            "count": count,
        }

    filtered_df = df.copy()

    # Category / description filter
    if "category" in active_filters and "category" in filtered_df.columns:
        cat_val = str(active_filters["category"]).strip().lower()
        cat_pattern = re.escape(cat_val)
        cat_mask = filtered_df["category"].astype(str).str.lower().str.contains(cat_pattern, na=False)
        if "description" in filtered_df.columns:
            desc_mask = filtered_df["description"].astype(str).str.lower().str.contains(cat_pattern, na=False)
            filtered_df = filtered_df[cat_mask | desc_mask]
        else:
            filtered_df = filtered_df[cat_mask]

    # Date and day of week filters
    has_date_filter = any(k in active_filters for k in ("date_from", "date_to", "day_of_week"))
    if has_date_filter and "date" in filtered_df.columns:
        parsed_dates = pd.to_datetime(filtered_df["date"], errors="coerce")

        if "date_from" in active_filters:
            try:
                from_dt = pd.to_datetime(active_filters["date_from"])
                date_mask = parsed_dates >= from_dt
                filtered_df = filtered_df[date_mask]
                parsed_dates = parsed_dates[date_mask]
            except Exception:
                pass

        if "date_to" in active_filters:
            try:
                to_dt = pd.to_datetime(active_filters["date_to"])
                date_mask = parsed_dates <= to_dt
                filtered_df = filtered_df[date_mask]
                parsed_dates = parsed_dates[date_mask]
            except Exception:
                pass

        if "day_of_week" in active_filters:
            dow = str(active_filters["day_of_week"]).strip().lower()
            if dow in ("weekend", "weekends"):
                # Saturday (5) and Sunday (6)
                mask = parsed_dates.dt.dayofweek.isin([5, 6])
                filtered_df = filtered_df[mask]
                parsed_dates = parsed_dates[mask]
            elif dow in ("weekday", "weekdays"):
                # Monday (0) to Friday (4)
                mask = parsed_dates.dt.dayofweek.isin([0, 1, 2, 3, 4])
                filtered_df = filtered_df[mask]
                parsed_dates = parsed_dates[mask]
            else:
                day_map = {
                    "monday": 0, "mon": 0,
                    "tuesday": 1, "tue": 1,
                    "wednesday": 2, "wed": 2,
                    "thursday": 3, "thu": 3,
                    "friday": 4, "fri": 4,
                    "saturday": 5, "sat": 5,
                    "sunday": 6, "sun": 6,
                }
                if dow in day_map:
                    target_day = day_map[dow]
                    mask = parsed_dates.dt.dayofweek == target_day
                    filtered_df = filtered_df[mask]
                    parsed_dates = parsed_dates[mask]

    # Amount filters
    if "min_amount" in active_filters and "amount" in filtered_df.columns:
        try:
            min_val = float(active_filters["min_amount"])
            filtered_df = filtered_df[filtered_df["amount"] >= min_val]
        except Exception:
            pass

    if "max_amount" in active_filters and "amount" in filtered_df.columns:
        try:
            max_val = float(active_filters["max_amount"])
            filtered_df = filtered_df[filtered_df["amount"] <= max_val]
        except Exception:
            pass

    # 3. Calculate deterministic numbers
    total = round(float(filtered_df["amount"].sum()), 2) if not filtered_df.empty and "amount" in filtered_df.columns else 0.0
    count = int(len(filtered_df))

    # Convert matching records cleanly for JSON serialization
    records = filtered_df.to_dict(orient="records")
    clean_records = []
    for r in records:
        clean_row = {}
        for k, v in r.items():
            if pd.isna(v):
                clean_row[k] = None
            elif hasattr(v, "strftime"):
                if getattr(v, "hour", 0) == 0 and getattr(v, "minute", 0) == 0 and getattr(v, "second", 0) == 0:
                    clean_row[k] = v.strftime("%Y-%m-%d")
                else:
                    clean_row[k] = v.isoformat()
            elif hasattr(v, "isoformat"):
                clean_row[k] = v.isoformat()
            else:
                clean_row[k] = v
        clean_records.append(clean_row)

    # 4. Generate natural-language sentence from computed numbers
    if parse_error:
        answer = f"Could not parse specific query filters; analyzing all {count} transactions totaling Rs. {total:,.2f}."
    else:
        narrative_prompt = (
            f"User Question: {question}\n"
            f"Active Query Filters: {json.dumps(active_filters)}\n"
            f"Computed Transaction Count: {count}\n"
            f"Computed Total Amount: Rs. {total:,.2f}\n\n"
            "Write a single natural-language sentence summarizing these exact computed numbers "
            "(e.g., 'Found 18 transactions totaling Rs.8,420 for food on weekends.'). "
            "Do NOT calculate or modify any numbers. Use Indian Rupee format (Rs. or ₹)."
        )
        try:
            narrated = generate(
                prompt=narrative_prompt,
                system=(
                    "You are the FinSage AI natural language assistant. "
                    "Narrate the computed financial metrics accurately and concisely. "
                    "Do not invent or recompute numbers."
                ),
            ).strip()
            if not narrated or narrated.startswith("[mock"):
                raise ValueError("Mock or empty narration")
            answer = narrated
        except Exception:
            desc_parts = []
            if "category" in active_filters:
                desc_parts.append(f"in {active_filters['category']}")
            if "day_of_week" in active_filters:
                desc_parts.append(f"on {active_filters['day_of_week']}")
            if "date_from" in active_filters or "date_to" in active_filters:
                desc_parts.append(f"between {active_filters.get('date_from', 'start')} and {active_filters.get('date_to', 'end')}")
            desc_str = f" for {' '.join(desc_parts)}" if desc_parts else ""
            answer = f"Found {count} transactions{desc_str} totaling Rs. {total:,.2f}."

    return {
        "answer": answer,
        "filters_used": active_filters,
        "matching_transactions": clean_records,
        "total": total,
        "count": count,
    }
