"""PII (Personally Identifiable Information) masking utilities.

Redacts common Indian financial PII patterns (PAN, Aadhaar, Account Numbers)
from text strings before data reaches LLM prompts or persistent logs.
Deterministic regex-based masking -- no external service or LLM required.
"""
import re
from typing import Optional

# PAN: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g. ABCDE1234F)
_PAN_PATTERN = re.compile(r"\b[A-Za-z]{5}[0-9]{4}[A-Za-z]\b")

# Aadhaar: 12 digits, often formatted as 4-4-4 with spaces or hyphens (e.g. 1234 5678 9012 or 123456789012)
_AADHAAR_PATTERN = re.compile(r"\b\d{4}[\s\-]\d{4}[\s\-]\d{4}\b")

# Account numbers / long numeric identifiers (10 to 18 consecutive digits)
# Note: Continuous 12 digits will be caught here if not separated by spaces/hyphens
_ACCOUNT_NUM_PATTERN = re.compile(r"\b\d{10,18}\b")


def mask_pii(text: Optional[str]) -> str:
    """Mask common Indian financial PII patterns in the input text.

    Replaces:
      - PAN cards (5 letters + 4 digits + 1 letter) with [REDACTED-PAN]
      - Aadhaar numbers (12-digit grouped sequences) with [REDACTED-AADHAAR]
      - Account numbers and long digit sequences (10-18 digits) with [REDACTED-ACCOUNT]

    Args:
        text: Raw input string possibly containing sensitive identifiers.

    Returns:
        Sanitized string with sensitive identifiers masked. Returns empty
        string if text is None or empty.
    """
    if not text:
        return ""

    sanitized = str(text)

    # 1. Mask PAN numbers
    sanitized = _PAN_PATTERN.sub("[REDACTED-PAN]", sanitized)

    # 2. Mask Aadhaar numbers formatted with spaces or hyphens
    sanitized = _AADHAAR_PATTERN.sub("[REDACTED-AADHAAR]", sanitized)

    # 3. Mask continuous account numbers / continuous 10-18 digit strings
    # Check if a 12-digit continuous sequence is present:
    def _replace_long_digits(match: re.Match) -> str:
        val = match.group(0)
        if len(val) == 12:
            return "[REDACTED-AADHAAR]"
        return "[REDACTED-ACCOUNT]"

    sanitized = _ACCOUNT_NUM_PATTERN.sub(_replace_long_digits, sanitized)

    return sanitized
