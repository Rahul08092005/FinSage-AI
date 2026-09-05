"""Confidence scoring for document-extracted transaction data.

Rule-based, fully deterministic -- no LLM calls.
Deductions are additive from a base of 1.0; floor is 0.0.
"""
from app.analytics.categorization import DEFAULT_CATEGORY


def score_extraction(extracted: dict) -> float:
    """Return a 0.0-1.0 confidence score for a single extracted transaction dict.

    Scoring rules (all are independent deductions):
      -0.3  amount is missing, None, or zero
      -0.3  date is missing or None
      -0.2  description is missing, empty, or shorter than 3 characters
      -0.2  category is the default "Other" (categorizer found no match)

    Args:
        extracted: A dict produced by receipt_parser or pdf_parser, expected
                   keys: amount, date, description, category.

    Returns:
        A float in [0.0, 1.0].
    """
    score = 1.0

    # Amount check
    amount = extracted.get("amount")
    if amount is None or amount == 0:
        score -= 0.3

    # Date check
    date = extracted.get("date")
    if date is None:
        score -= 0.3

    # Description check
    description = extracted.get("description") or ""
    if len(str(description).strip()) < 3:
        score -= 0.2

    # Category check -- "Other" means the categorizer found no keyword match
    category = extracted.get("category") or DEFAULT_CATEGORY
    if category == DEFAULT_CATEGORY:
        score -= 0.2

    return max(0.0, round(score, 4))
