"""Financial data extractor for document OCR text.

Combines:
  1. Groq LLM Structured JSON Extraction (model: groq/compound-mini)
  2. Deterministic Regex & Heuristic Fallback (amounts, dates, merchants, categories)

Guarantees:
  - Never outputs amount = 0 when unreadable (outputs None)
  - Never invents dates (outputs None if not found)
  - Uses existing FinSage category taxonomy
"""
import json
import logging
import os
import re
from datetime import datetime
from typing import Any, Optional

from app.analytics.categorization import categorize_transaction, DEFAULT_CATEGORY

logger = logging.getLogger("finsage.ocr.extractor")

ALLOWED_CATEGORIES = [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Healthcare",
    "Other",
]

# ---------------------------------------------------------------------------
# Deterministic Regex Extractors (Fallback)
# ---------------------------------------------------------------------------

# Common labeled amount patterns
_TOTAL_AMOUNT_REGEX = re.compile(
    r"(?:grand\s*total|net\s*total|total\s*amount|amount\s*payable|amount\s*paid|bill\s*total|final\s*amount|total|balance)[^\d\n\r]{0,15}(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)",
    re.IGNORECASE,
)

_CURRENCY_AMOUNT_REGEX = re.compile(
    r"(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)",
    re.IGNORECASE,
)

_FALLBACK_AMOUNT_REGEX = re.compile(r"\b(\d{1,6}\.\d{2})\b")

# Date patterns
_DATE_PATTERNS = [
    (re.compile(r"\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b"), "%d/%m/%Y"),
    (re.compile(r"\b(\d{4})[\/\-](\d{2})[\/\-](\d{2})\b"), "%Y-%m-%d"),
    (re.compile(r"\b(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{4})\b", re.I), None),
]


def _clean_amount_str(raw: str) -> Optional[float]:
    try:
        val = float(raw.replace(",", "").strip())
        if val > 0:
            return round(val, 2)
    except (ValueError, TypeError):
        pass
    return None


def extract_amount_regex(text: str) -> Optional[float]:
    """Extract final payable amount using prioritized regex patterns."""
    # 1. Look for explicit total labels
    matches = _TOTAL_AMOUNT_REGEX.findall(text)
    for m in reversed(matches):  # totals often appear near the bottom
        amt = _clean_amount_str(m)
        if amt is not None:
            return amt

    # 2. Look for currency-tagged amounts
    matches = _CURRENCY_AMOUNT_REGEX.findall(text)
    candidates = [_clean_amount_str(m) for m in matches if _clean_amount_str(m) is not None]
    if candidates:
        return max(candidates)

    # 3. Look for decimal numbers (likely totals)
    matches = _FALLBACK_AMOUNT_REGEX.findall(text)
    candidates = [_clean_amount_str(m) for m in matches if _clean_amount_str(m) is not None]
    # Filter out year-like numbers (e.g. 2026.00) or phone numbers
    filtered = [c for c in candidates if c < 1000000]
    return max(filtered) if filtered else None


def extract_date_regex(text: str) -> Optional[str]:
    """Extract and normalize date to YYYY-MM-DD."""
    for pattern, fmt in _DATE_PATTERNS:
        match = pattern.search(text)
        if match:
            try:
                if fmt == "%d/%m/%Y":
                    day, month, year = match.group(1), match.group(2), match.group(3)
                    dt = datetime(int(year), int(month), int(day))
                    return dt.strftime("%Y-%m-%d")
                elif fmt == "%Y-%m-%d":
                    year, month, day = match.group(1), match.group(2), match.group(3)
                    dt = datetime(int(year), int(month), int(day))
                    return dt.strftime("%Y-%m-%d")
                else:
                    raw_date = match.group(0)
                    dt = datetime.strptime(raw_date.replace(",", ""), "%d %b %Y")
                    return dt.strftime("%Y-%m-%d")
            except Exception:
                continue
    return None


def extract_merchant_regex(text: str) -> Optional[str]:
    """Guess merchant name from the top non-empty lines."""
    for line in text.splitlines()[:6]:
        cleaned = re.sub(r"[^\w\s&'-]", "", line).strip()
        # Exclude header noise, numbers, or single letters
        if len(cleaned) >= 3 and not cleaned.isdigit() and not cleaned.lower().startswith(("tax", "invoice", "date", "cash", "tel")):
            return cleaned
    return None


def extract_financial_data_deterministic(text: str) -> dict[str, Any]:
    """Fast deterministic parser without LLM dependency."""
    amount = extract_amount_regex(text)
    date = extract_date_regex(text)
    merchant = extract_merchant_regex(text)
    description = merchant or "Receipt expense"
    category = categorize_transaction(f"{merchant} {text[:100]}")
    if category not in ALLOWED_CATEGORIES:
        category = DEFAULT_CATEGORY

    # Baseline rule-based confidence
    confidence = 0.5
    if amount is not None and amount > 0:
        confidence += 0.25
    if date is not None:
        confidence += 0.15
    if merchant and len(merchant) > 3:
        confidence += 0.10

    return {
        "merchant": merchant,
        "date": date,
        "amount": amount,
        "currency": "INR",
        "category": category,
        "description": description,
        "confidence": round(min(1.0, confidence), 2),
    }


def extract_financial_data_groq(text: str) -> Optional[dict[str, Any]]:
    """Use Groq JSON mode to extract structured financial data from OCR text."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None

    try:
        from groq import Groq
        client = Groq(api_key=api_key)

        prompt = f"""You are an expert financial receipt and invoice parser.
Analyze this raw OCR text extracted from a document and return a strict JSON object:

Expected JSON shape:
{{
  "merchant": string or null (store, vendor, restaurant, or business name),
  "date": "YYYY-MM-DD" or null (transaction date, normalize to ISO YYYY-MM-DD),
  "amount": number or null (FINAL payable total amount as decimal, e.g. 1450.00. Do NOT use 0 if unreadable; use null),
  "currency": "INR" or string,
  "category": "Food" | "Transport" | "Shopping" | "Bills" | "Entertainment" | "Healthcare" | "Other",
  "description": string (short description of the purchase or merchant),
  "confidence": number between 0.0 and 1.0 (accuracy assessment of the extracted data)
}}

Raw OCR text:
\"\"\"
{text[:2500]}
\"\"\"
"""
        completion = client.chat.completions.create(
            model=os.getenv("GROQ_MODEL", "groq/compound-mini"),
            messages=[
                {"role": "system", "content": "You are a precise financial data extraction engine. Return only JSON."},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.0,
        )

        raw_json = completion.choices[0].message.content
        data = json.loads(raw_json)

        # Validate extracted fields
        amount = data.get("amount")
        if amount is not None:
            try:
                amount = float(amount)
                if amount <= 0:
                    amount = None
                else:
                    amount = round(amount, 2)
            except (ValueError, TypeError):
                amount = None

        date = data.get("date")
        if date:
            # Validate YYYY-MM-DD
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", str(date)):
                date = extract_date_regex(text)

        category = data.get("category")
        if category not in ALLOWED_CATEGORIES:
            category = categorize_transaction(str(data.get("merchant") or data.get("description") or ""))

        confidence = data.get("confidence")
        try:
            confidence = float(confidence) if confidence is not None else 0.8
        except (ValueError, TypeError):
            confidence = 0.8

        logger.info(f"[Extractor] Groq extracted: merchant={data.get('merchant')}, amount={amount}, category={category}")
        return {
            "merchant": data.get("merchant"),
            "date": date,
            "amount": amount,
            "currency": data.get("currency") or "INR",
            "category": category,
            "description": data.get("description") or data.get("merchant") or "Receipt expense",
            "confidence": round(max(0.0, min(1.0, confidence)), 2),
        }

    except Exception as exc:
        logger.warning(f"[Extractor] Groq extraction failed ({exc}), falling back to regex")
        return None


def extract_financial_data(text: str) -> dict[str, Any]:
    """Primary extraction entry point with AI + regex fallback."""
    if not text or not text.strip():
        return {
            "merchant": None,
            "date": None,
            "amount": None,
            "currency": "INR",
            "category": DEFAULT_CATEGORY,
            "description": "Unreadable document",
            "confidence": 0.0,
        }

    # 1. Try Groq AI extraction
    ai_result = extract_financial_data_groq(text)
    if ai_result:
        # Cross-verify amount with regex if AI couldn't find amount
        if ai_result["amount"] is None:
            regex_amt = extract_amount_regex(text)
            if regex_amt is not None:
                ai_result["amount"] = regex_amt
        return ai_result

    # 2. Fallback to deterministic regex extractor
    return extract_financial_data_deterministic(text)
