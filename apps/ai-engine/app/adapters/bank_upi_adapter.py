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

# Amount regex matching Rs, Rs., INR, etc.
_AMOUNT_RE = r"(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)"

_PATTERNS: list[tuple[re.Pattern, str]] = [
    # --- Debit patterns ---

    # "A/c XX7314 debited with INR 780.00 on 20-09-2026 for FRESH MART GROCERY. Ref No: ..."
    (re.compile(
        r"(?:A/?c|account|card)\s*[\w*X-]+\s+debited\s+(?:with|by|for)?\s*" + _AMOUNT_RE +
        r".*?(?:for|to|at|towards)\s+(.+?)(?:\.\s*Ref|\s+Ref|\s+on\s+\d|\s+Txn|\s+Avail|\s*[.\-]|$)",
        re.IGNORECASE,
    ), "debit"),

    # "debited with/by INR 780.00 on 20-09-2026 for FRESH MART GROCERY"
    (re.compile(
        r"debited\s+(?:with|by|for)\s+" + _AMOUNT_RE +
        r".*?(?:for|to|at|towards)\s+(.+?)(?:\.\s*Ref|\s+Ref|\s+on\s+\d|\s+Txn|\s+Avail|\s*[.\-]|$)",
        re.IGNORECASE,
    ), "debit"),

    # "Rs.500 debited from A/c ...5678 on 12-Sep to AMAZON"
    # "INR 1,200.00 debited from A/c XX1234 on 12-Sep-2024 to SWIGGY"
    (re.compile(
        _AMOUNT_RE + r"\s+debited\s+(?:from\s+.*?)?(?:to|at|for|towards)\s+(.+?)(?:\s+on\s+\d|\.\s*Ref|\s+Ref|\s*[.\-]|$)",
        re.IGNORECASE,
    ), "debit"),

    # "Rs.500 debited from A/c ...5678 on 12-Sep" (no merchant)
    (re.compile(
        _AMOUNT_RE + r"\s+debited\s+from\s+.*?(?:A/?c|account)\s*[.\s]*(\S+)",
        re.IGNORECASE,
    ), "debit"),

    # "Paid Rs.200 to merchant@upi" / "paid Rs.500 to ZOMATO"
    (re.compile(
        r"(?:paid|sent)\s+" + _AMOUNT_RE + r"\s+(?:to|at|for)\s+(.+?)(?:\s+on\s+\d|\.\s*Ref|\s+Ref|\s*[.\-]|$)",
        re.IGNORECASE,
    ), "debit"),

    # UPI: "UPI txn of Rs.200 from A/c X1234 to merchant@upi on ..."
    (re.compile(
        r"UPI\s+(?:txn|transaction)\s+(?:of\s+)?" + _AMOUNT_RE +
        r"\s+from\s+.*?(?:to)\s+(.+?)(?:\s+on\s+\d|\.\s*Ref|\s+Ref|\s*[.\-]|$)",
        re.IGNORECASE,
    ), "debit"),

    # Generic debit with "withdrawn" / "spent" / "purchase" / "transaction of"
    (re.compile(
        r"(?:withdrawn|spent|purchase|transaction\s+of)\s+" + _AMOUNT_RE +
        r".*?(?:at|from|for|to)\s+(.+?)(?:\s+on\s+\d|\.\s*Ref|\s+Ref|\s*[.\-]|$)",
        re.IGNORECASE,
    ), "debit"),

    (re.compile(
        _AMOUNT_RE + r"\s+(?:withdrawn|spent|purchase|used\s+at)\b.*?(?:at|from|for|to)\s+(.+?)(?:\s+on\s+\d|\.\s*Ref|\s+Ref|\s*[.\-]|$)",
        re.IGNORECASE,
    ), "debit"),

    # --- Credit patterns ---

    # "A/c ... credited with/by INR 780.00 on 20-09-2026 by/from ..."
    (re.compile(
        r"(?:A/?c|account|card)\s*[\w*X-]+\s+credited\s+(?:with|by|for)?\s*" + _AMOUNT_RE +
        r".*?(?:from|by|towards)\s+(.+?)(?:\.\s*Ref|\s+Ref|\s+on\s+\d|\s+Txn|\s+Avail|\s*[.\-]|$)",
        re.IGNORECASE,
    ), "credit"),

    (re.compile(
        r"credited\s+(?:with|by|for)\s+" + _AMOUNT_RE +
        r".*?(?:from|by|towards)\s+(.+?)(?:\.\s*Ref|\s+Ref|\s+on\s+\d|\s+Txn|\s+Avail|\s*[.\-]|$)",
        re.IGNORECASE,
    ), "credit"),

    # "INR 1,200.00 credited to your account" / "Rs.500 credited ..."
    (re.compile(
        _AMOUNT_RE + r"\s+credited\s+to\s+(?:your\s+)?(?:A/?c|account)?\s*[.\s]*(\S*)",
        re.IGNORECASE,
    ), "credit"),

    # "Received Rs.1000 from RAHUl" / "received INR 500 from ..."
    (re.compile(
        r"(?:received)\s+" + _AMOUNT_RE + r"\s+(?:from|by)\s+(.+?)(?:\s+on\s+\d|\.\s*Ref|\s+Ref|\s*[.\-]|$)",
        re.IGNORECASE,
    ), "credit"),
]

# Date patterns commonly found in Indian bank SMSes
_DATE_PATTERNS: list[str] = [
    r"(\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b)",   # 20-09-2026, 12-09-2024, 12/09/24
    r"(\b\d{1,2}[-/][A-Za-z]{3}[-/]?\d{0,4}\b)",   # 12-Sep, 12-Sep-2024, 12/Sep/24
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


def _clean_description(desc: str) -> str:
    """Clean up extracted merchant string, stripping trailing ref numbers or bank disclaimers."""
    if not desc:
        return "Bank transaction"
    # Strip trailing Ref No, UPI Ref, Txn ID, Avail Bal, on <date>, etc.
    desc = re.sub(
        r"(?:\.|\s+)?\b(?:Ref(?:\s*No)?|UPI\s*Ref|Txn(?:\s*ID|\s*No)?|Bal(?:ance)?|Avail(?:\s*Bal)?|Info|UTR|A/?c|on\s+\d{1,2}[-/]|on\s+[A-Za-z]{3})[\s:].*$",
        "",
        desc,
        flags=re.IGNORECASE,
    )
    desc = re.sub(r"\s+on\s+\d{1,2}[-/].*$", "", desc, flags=re.IGNORECASE)
    desc = desc.strip(" .,-:\n\t")
    return desc if desc else "Bank transaction"


def _infer_category(desc: str) -> str:
    """Classify merchant description into standard FinSage categories."""
    d = desc.lower()
    if any(k in d for k in ["mart", "grocery", "groceries", "supermarket", "vegetable", "d-mart", "bigbasket", "blinkit", "zepto", "reliance fresh", "spencer"]):
        return "Groceries"
    if any(k in d for k in ["zomato", "swiggy", "cafe", "restaurant", "dining", "pizza", "burger", "starbucks", "mcdonald", "kfc", "domino", "food", "tea", "coffee"]):
        return "Food & Dining"
    if any(k in d for k in ["uber", "ola", "metro", "petrol", "fuel", "shell", "hpcl", "bpcl", "flight", "irctc", "train", "travel", "auto", "rapido"]):
        return "Travel"
    if any(k in d for k in ["amazon", "flipkart", "myntra", "zara", "h&m", "shopping", "ajio", "nykaa", "croma", "meesho"]):
        return "Shopping"
    if any(k in d for k in ["apollo", "pharmacy", "hospital", "clinic", "medicine", "health", "1mg", "netmeds", "pharmeasy"]):
        return "Healthcare"
    if any(k in d for k in ["netflix", "hotstar", "spotify", "bookmyshow", "cinema", "pvr", "inox", "entertainment", "movie"]):
        return "Entertainment"
    if any(k in d for k in ["electricity", "bescom", "tneb", "water", "gas", "wifi", "airtel", "jio", "broadband", "utility", "bill", "recharge"]):
        return "Utilities"
    return "General"


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

    # Also extract account number if present (e.g., A/c XX7314, card ending 1234)
    acc_m = re.search(r"(?:A/?c|account|card)\s*(?:no\.?\s*)?([*X\d-]+)", text, re.IGNORECASE)
    account_mask = acc_m.group(1).strip() if acc_m else None

    for pattern, txn_type in _PATTERNS:
        m = pattern.search(text)
        if m:
            try:
                amount = _clean_amount(m.group(1))
            except (ValueError, IndexError):
                continue

            # Group 2 is the merchant / description
            raw_desc = m.group(2) if len(m.groups()) >= 2 and m.group(2) else ""
            description = _clean_description(raw_desc)
            category = _infer_category(description)

            result: dict[str, Any] = {
                "amount": round(amount, 2),
                "description": description,
                "category": category,
                "type": txn_type,
            }

            if account_mask:
                result["account"] = account_mask

            # Try to extract a date from the full SMS text
            date_str = _extract_date(text)
            if date_str:
                result["date"] = date_str

            return result

    # Fallback: check if we can at least find amount and debit/credit keyword
    amt_m = re.search(_AMOUNT_RE, text, re.IGNORECASE)
    if amt_m:
        try:
            amt = _clean_amount(amt_m.group(1))
            is_credit = bool(re.search(r"\b(?:credited|received|deposit)\b", text, re.IGNORECASE))
            desc = "Bank transaction"
            # Try to extract after 'for', 'to', 'at'
            for_m = re.search(r"\b(?:for|to|at|towards)\s+([A-Za-z0-9 &.'_-]{3,40})", text, re.IGNORECASE)
            if for_m:
                desc = _clean_description(for_m.group(1))

            date_str = _extract_date(text)
            return {
                "amount": round(amt, 2),
                "description": desc,
                "category": _infer_category(desc),
                "type": "credit" if is_credit else "debit",
                "date": date_str,
                "account": account_mask,
            }
        except Exception:
            pass

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
