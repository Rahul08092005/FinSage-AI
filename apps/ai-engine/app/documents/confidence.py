"""Confidence scoring for document-extracted transaction data.

Combines extraction engine assessment with field presence checks.
"""
from typing import Any, Dict

DEFAULT_CATEGORY = "Other"


def score_extraction(extracted: Dict[str, Any]) -> float:
    """Return a 0.0-1.0 confidence score for an extracted transaction dict.

    Evaluates:
      - Amount presence and validity (> 0)
      - Date presence (valid ISO date)
      - Merchant / description quality
      - Category classification
    """
    # Use base confidence if provided by model or extractor
    base_confidence = extracted.get("confidence")
    if base_confidence is not None and isinstance(base_confidence, (int, float)):
        score = float(base_confidence)
    else:
        score = 0.85

    # Critical: Amount check
    amount = extracted.get("amount")
    if amount is None or amount <= 0:
        score = min(score, 0.45)
        score -= 0.30

    # Date check
    date = extracted.get("date")
    if not date:
        score -= 0.15

    # Description / Merchant check
    desc = str(extracted.get("description") or extracted.get("merchant") or "").strip()
    if len(desc) < 3 or desc.lower() in ("unreadable document", "receipt expense", "file not found", "template1-preview"):
        score -= 0.20

    # Category check
    cat = extracted.get("category") or DEFAULT_CATEGORY
    if cat == DEFAULT_CATEGORY:
        score -= 0.10

    # If amount, date, and description are all valid and high quality
    if amount and amount > 0 and date and len(desc) >= 3 and cat != DEFAULT_CATEGORY:
        score = max(score, 0.85)

    return max(0.0, min(1.0, round(score, 2)))
