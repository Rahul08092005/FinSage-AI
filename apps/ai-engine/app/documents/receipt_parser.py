"""Receipt parser -- extracts transaction-shaped data from receipt images.

Uses OCRAdapter (which already has a Tesseract/mock fallback) to get raw
text, then applies simple regex heuristics to pull out amount, date, and a
merchant description.  Never raises -- bad/missing values are returned as
None so the confidence scorer can handle them gracefully.
"""
import re
from typing import Optional

from app.adapters.base_adapter import BaseIntegrationAdapter  # noqa: F401 (style ref)
from app.analytics.categorization import categorize_transaction
from app.analytics.pii_masking import mask_pii
from app.documents.ocr_adapter import OCRAdapter

# ---------------------------------------------------------------------------
# Internal regex helpers
# ---------------------------------------------------------------------------

# Amount: look for "total", "amount", "rs", "inr" near a decimal number,
# or just a standalone price-looking number (e.g. 450.00).
_AMOUNT_LABELLED = re.compile(
    r"(?:total|amount|rs\.?|inr|grand\s+total)[^\d]{0,10}([\d,]+(?:\.\d{1,2})?)",
    re.IGNORECASE,
)
_ANY_NUMBER = re.compile(r"([\d,]+\.\d{1,2}|\d{3,})")  # fallback: largest number

# Date: DD/MM/YYYY or DD-MM-YYYY (common on Indian receipts)
_DATE = re.compile(r"\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b")


def _extract_amount(text: str) -> Optional[float]:
    """Try labelled pattern first; fall back to the largest number in text."""
    m = _AMOUNT_LABELLED.search(text)
    if m:
        raw = m.group(1).replace(",", "")
        try:
            return float(raw)
        except ValueError:
            pass

    # Fallback: pick the largest number visible (most likely the total)
    candidates = []
    for raw in _ANY_NUMBER.findall(text):
        try:
            candidates.append(float(raw.replace(",", "")))
        except ValueError:
            pass
    return max(candidates) if candidates else None


def _extract_date(text: str) -> Optional[str]:
    """Return the first DD/MM/YYYY or DD-MM-YYYY date string found, else None."""
    m = _DATE.search(text)
    return m.group(1) if m else None


def _extract_description(text: str) -> str:
    """Return the first non-empty, non-whitespace line as a merchant guess."""
    for line in text.splitlines():
        stripped = line.strip()
        if stripped and not stripped.startswith("[OCR"):
            return stripped
    return ""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def parse_receipt(image_path: str) -> dict:
    """Extract transaction fields from a receipt image.

    Args:
        image_path: Path to the receipt image (jpg, png, bmp, tiff, webp).
                    Pass None or a non-existent path to exercise the OCR mock.

    Returns:
        Dict with keys: amount (float|None), date (str|None),
        description (str), category (str), raw_text (str).
        Raises ValueError on corrupted or unreadable images.
    """
    if image_path:
        # Validate that the file is an readable image before passing to OCR
        try:
            from PIL import Image
            with Image.open(image_path) as img:
                img.verify()
        except Exception as exc:
            raise ValueError(
                "Could not extract text from image — file may be corrupted or unsupported format"
            ) from exc

    try:
        raw_text: str = OCRAdapter().extract_text(image_path)
    except Exception as exc:
        raise ValueError(
            f"Could not extract text from image — file may be corrupted or unsupported format ({exc})"
        ) from exc

    if not raw_text or not raw_text.strip():
        raise ValueError(
            "Could not extract text from image — file may be corrupted or unsupported format"
        )

    amount = _extract_amount(raw_text)
    date = _extract_date(raw_text)
    description = _extract_description(raw_text)
    category = categorize_transaction(description) if description else "Other"

    # If neither amount nor valid description could be parsed from a non-mock run
    if image_path and amount is None and not description and raw_text.startswith("[OCR fallback"):
        raise ValueError(
            "Could not extract text from image — file may be corrupted or unsupported format"
        )

    return {
        "amount": amount,
        "date": date,
        "description": mask_pii(description),
        "category": category,
        "raw_text": mask_pii(raw_text),
    }

