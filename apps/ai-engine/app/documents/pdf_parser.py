"""Bank-statement PDF parser.

Uses pypdf to extract text from each page and then applies a permissive
regex that covers the two most common Indian bank-statement line shapes:

  DD/MM/YYYY   description text   1234.56
  DD-MM-YYYY   description text   Rs. 1234.56

If pypdf is not installed (ImportError), the function falls back to
returning an empty list with a warning -- same graceful-fallback pattern
used by OCRAdapter for Tesseract.
"""
import re
from typing import Optional

from app.analytics.categorization import categorize_transaction
from app.analytics.pii_masking import mask_pii

# ---------------------------------------------------------------------------
# Regex for bank-statement lines
# ---------------------------------------------------------------------------
# Group 1: date (DD/MM/YYYY or DD-MM-YYYY)
# Group 2: description (one or more words, non-greedy)
# Group 3: amount (with optional "Rs." / "INR" prefix and commas)
_STATEMENT_LINE = re.compile(
    r"(\d{2}[\/\-]\d{2}[\/\-]\d{4})"   # date
    r"\s+"
    r"(.+?)"                             # description (non-greedy)
    r"\s+"
    r"(?:Rs\.?\s*|INR\s*)?"             # optional currency label
    r"([\d,]+(?:\.\d{1,2})?)"           # amount
    r"\s*$",
    re.IGNORECASE,
)


def _parse_line(line: str) -> Optional[dict]:
    """Attempt to parse one text line into a transaction dict.  Returns None if
    the line does not match the expected statement shape."""
    m = _STATEMENT_LINE.match(line.strip())
    if not m:
        return None

    date_str, description, amount_str = m.group(1), m.group(2).strip(), m.group(3)
    try:
        amount = float(amount_str.replace(",", ""))
    except ValueError:
        return None

    return {
        "amount": amount,
        "date": date_str,
        "description": mask_pii(description),
        "category": categorize_transaction(description),
        "raw_text": mask_pii(line.strip()),
    }


def parse_bank_statement_pdf(pdf_path: str) -> list[dict]:
    """Extract transaction rows from a text-based bank-statement PDF.

    Args:
        pdf_path: Absolute or relative path to the PDF file.

    Returns:
        A list of dicts (amount, date, description, category, raw_text).
        Raises ValueError if the file is corrupted, encrypted, or invalid PDF.
    """
    try:
        import pypdf  # lazy import so the module loads even without pypdf
    except ImportError:
        # pypdf not installed -- return empty list with a console warning
        import warnings
        warnings.warn(
            "pypdf is not installed. Install it with: pip install pypdf==4.3.1",
            ImportWarning,
            stacklevel=2,
        )
        return []

    rows: list[dict] = []
    try:
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            text = page.extract_text() or ""
            for line in text.splitlines():
                parsed = _parse_line(line)
                if parsed:
                    rows.append(parsed)
    except Exception as exc:
        raise ValueError(f"Could not read PDF file — file may be corrupted, encrypted, or invalid ({exc})") from exc

    return rows

