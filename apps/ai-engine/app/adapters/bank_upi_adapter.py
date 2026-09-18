"""Bank / UPI SMS-parsing adapter.

Follows the same BaseIntegrationAdapter pattern as SplitwiseAdapter and
OCRAdapter — subclasses the base, implements fetch_data / normalize_data /
health_check, and adds a standalone ``parse_sms`` function for direct use.

parse_sms() uses regex to extract amount, merchant/description, and
transaction type (debit/credit) from common Indian bank SMS formats.
Returns ``None`` when no recognizable pattern matches — never guesses.

No external dependencies — only ``re`` from stdlib.
"""
import re
from datetime import datetime
from typing import Any

from app.adapters.base_adapter import BaseIntegrationAdapter


# ---------------------------------------------------------------------------
# SMS parsing patterns
# ---------------------------------------------------------------------------
# Each pattern is a (compiled_regex, transaction_type) tuple.
# Regexes are intentionally broad enough to cover SBI, HDFC, ICICI, Axis,
# Kotak, and similar bank SMS wording, but narrow enough to avoid false
# positives on non-transactional messages.

_AMOUNT_RE = r"(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)"

_PATTERNS: list[tuple[re.Pattern, str]] = [
    # --- Debit patterns ---

    # "Rs.500 debited from A/c ...5678 on 12-Sep to AMAZON"
    # "INR 1,200.00 debited from A/c XX1234 on 12-Sep-2024 to SWIGGY"
    (re.compile(
        _AMOUNT_RE + r"\s+debited\s+from\s+.*?(?:to|at)\s+(.+?)(?:\s+on|\s*[.\-]|$)",
        re.IGNORECASE,
    ), "debit"),

    # "Rs.500 debited from A/c ...5678 on 12-Sep" (no merchant)
    (re.compile(
        _AMOUNT_RE + r"\s+debited\s+from\s+.*?(?:A/?c|account)\s*[.\s]*(\S+)",
        re.IGNORECASE,
    ), "debit"),

    # "INR 1,200.00 credited to your account" / "Rs.500 credited ..."
    (re.compile(
        _AMOUNT_RE + r"\s+credited\s+to\s+(?:your\s+)?(?:A/?c|account)?\s*[.\s]*(\S*)",
        re.IGNORECASE,
    ), "credit"),

    # "Paid Rs.200 to merchant@upi" / "paid Rs.500 to ZOMATO"
    (re.compile(
        r"(?:paid|sent)\s+" + _AMOUNT_RE + r"\s+to\s+(.+?)(?:\s+on|\s*[.\-]|$)",
        re.IGNORECASE,
    ), "debit"),

    # "Received Rs.1000 from RAHUl" / "received INR 500 from ..."
    (re.compile(
        r"(?:received)\s+" + _AMOUNT_RE + r"\s+from\s+(.+?)(?:\s+on|\s*[.\-]|$)",
        re.IGNORECASE,
    ), "credit"),

    # UPI: "UPI txn of Rs.200 from A/c X1234 to merchant@upi on ..."
    (re.compile(
        r"UPI\s+(?:txn|transaction)\s+(?:of\s+)?" + _AMOUNT_RE +
        r"\s+from\s+.*?(?:to)\s+(.+?)(?:\s+on|\s*[.\-]|$)",
        re.IGNORECASE,
    ), "debit"),

    # Generic debit with "withdrawn" / "purchase"
    (re.compile(
        _AMOUNT_RE + r"\s+(?:withdrawn|spent|purchase)\b.*?(?:at|from|for)\s+(.+?)(?:\s+on|\s*[.\-]|$)",
        re.IGNORECASE,
    ), "debit"),
]

# Date patterns commonly found in Indian bank SMSes
_DATE_PATTERNS: list[str] = [
    r"(\d{1,2}[-/]\w{3}[-/]?\d{0,4})",   # 12-Sep, 12-Sep-2024, 12/Sep/24
    r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})",   # 12-09-2024, 12/09/24
]


def _extract_date(sms_text: str) -> str | None:
    """Try to extract a date string from the SMS text.

    Returns the raw matched string (not parsed) — the caller / normalizer
    can parse it further.  Returns ``None`` if no date-like substring found.
    """
    for pat in _DATE_PATTERNS:
        m = re.search(pat, sms_text)
        if m:
            return m.group(1)
    return None


def _clean_amount(raw: str) -> float:
    """Convert '1,200.50' or '500' to a float, stripping commas."""
    return float(raw.replace(",", ""))


def parse_sms(sms_text: str) -> dict | None:
    """Extract transaction details from a single Indian bank/UPI SMS.

    Attempts to match the SMS against known debit/credit patterns for
    common Indian banks (SBI, HDFC, ICICI, Axis, Kotak, etc.) and UPI
    transaction messages.

    Args:
        sms_text: The raw SMS string.

    Returns:
        A dict with keys ``amount``, ``description``, ``type`` ('debit' or
        'credit'), and optionally ``date`` — or ``None`` if no recognizable
        transactional pattern matches.  Returning None is intentional: we
        never guess on unrecognized text.
    """
    if not sms_text or not isinstance(sms_text, str):
        return None

    text = sms_text.strip()
    if len(text) < 10:
        return None

    for pattern, txn_type in _PATTERNS:
        m = pattern.search(text)
        if m:
            try:
                amount = _clean_amount(m.group(1))
            except (ValueError, IndexError):
                continue

            # Group 2 is the merchant / description (may be empty)
            description = (m.group(2) or "").strip().rstrip(".")
            if not description:
                description = "Bank transaction"

            result: dict[str, Any] = {
                "amount": round(amount, 2),
                "description": description,
                "type": txn_type,
            }

            # Try to extract a date from the full SMS text
            date_str = _extract_date(text)
            if date_str:
                result["date"] = date_str

            return result

    # No pattern matched — refuse to guess
    return None


# ---------------------------------------------------------------------------
# Adapter class
# ---------------------------------------------------------------------------


class BankUPIAdapter(BaseIntegrationAdapter):
    """Bank / UPI SMS-parsing adapter.

    Stateless, regex-based — no external API or credentials required.
    Swappable for a real bank-aggregator API client in a later phase.
    """

    def fetch_data(self, user_id: str, params: dict) -> dict:
        """Parse an SMS from ``params['sms_text']`` and return the result.

        Returns an empty dict if no SMS text provided or if parsing fails.
        """
        sms_text = params.get("sms_text", "")
        parsed = parse_sms(sms_text)
        return parsed if parsed is not None else {}

    def normalize_data(self, raw_data: dict) -> list[dict[str, Any]]:
        """Reshape a parsed SMS result into the standard transaction shape.

        Returns an empty list if ``raw_data`` is empty (parse failure).
        """
        if not raw_data or "amount" not in raw_data:
            return []

        return [{
            "date": raw_data.get("date"),
            "description": raw_data.get("description", ""),
            "amount": float(raw_data.get("amount", 0)),
            "category": "General",      # categorization is handled downstream
            "source": "bank_sms",
            "type": raw_data.get("type", "debit"),
        }]

    def health_check(self) -> bool:
        """Always True — regex parsing requires no external dependencies."""
        return True
