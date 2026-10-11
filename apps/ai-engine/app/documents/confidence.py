"""Confidence scoring for document-extracted transaction data.

Combines extraction engine assessment with field presence and arithmetic verification checks.
"""
from typing import Any, Dict

DEFAULT_CATEGORY = "Other"

_ADDRESS_INDICATORS = (
    "street", "road", "bengaluru", "bangalore", "karnataka", "mumbai", "delhi", "560001", "pincode", "nagar", "layout"
)


def score_extraction(extracted: Dict[str, Any]) -> float:
    """Return a 0.0-1.0 confidence score for an extracted transaction dict.

    Evaluates:
      - Amount presence, positivity, and arithmetic verification (amount_verified)
      - Date presence (valid date)
      - Merchant / description quality (absence of address leakage)
      - Category classification
    """
    amount = extracted.get("amount")
    amount_verified = extracted.get("amount_verified")
    date = extracted.get("date")
    desc = str(extracted.get("description") or extracted.get("merchant") or "").strip()
    merchant = str(extracted.get("merchant") or "").strip()
    cat = extracted.get("category") or DEFAULT_CATEGORY

    if amount is None or amount <= 0:
        return 0.0

    base_confidence = extracted.get("confidence")
    if base_confidence is not None and isinstance(base_confidence, (int, float)):
        score = float(base_confidence)
    else:
        score = 0.50

    # Critical: amount verification
    if amount_verified is True:
        score = max(score, 0.85)
        score += 0.05
    elif amount_verified is False:
        # Unverified or contradicted amount: hard cap at 0.60
        score = min(score, 0.60)

    # Date check
    if not date:
        score -= 0.15
        score = min(score, 0.60)

    # Description / Merchant check
    if len(desc) < 3 or desc.lower() in ("unreadable document", "receipt expense", "file not found", "template1-preview"):
        score -= 0.20
        score = min(score, 0.60)

    # Address leakage check in description or merchant
    lower_desc = desc.lower()
    lower_merch = merchant.lower()
    if any(aw in lower_desc for aw in _ADDRESS_INDICATORS) or any(aw in lower_merch for aw in _ADDRESS_INDICATORS):
        score -= 0.20
        score = min(score, 0.60)

    # Category check
    if cat == DEFAULT_CATEGORY:
        score -= 0.05

    # If amount is explicitly verified and all primary fields are present and clean
    if amount_verified is True and date and len(desc) >= 3 and cat != DEFAULT_CATEGORY:
        score = max(score, 0.90)

    return max(0.0, min(1.0, round(score, 2)))
