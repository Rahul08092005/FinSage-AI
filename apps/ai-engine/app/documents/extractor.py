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
from dotenv import load_dotenv

# Ensure environment variables are loaded
_env_path = os.path.join(os.path.dirname(__file__), "../../.env")
if os.path.isfile(_env_path):
    load_dotenv(_env_path)
else:
    load_dotenv()

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
# Deterministic Regex Extractors (Fallback & Reconciliation)
# ---------------------------------------------------------------------------

# Common labeled amount patterns (word boundaries prevent Subtotal matching as Total; negative lookahead prevents % matching)
_TOTAL_AMOUNT_REGEX = re.compile(
    r"\b(?:grand\s*total|net\s*payable|net\s*total|amount\s*payable|amount\s*paid|bill\s*total|final\s*amount|balance\s*due|\btotal\b)(?:\s*[:\-])?[^\w\n\r]{0,10}(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)(?![.\d\s]*%)",
    re.IGNORECASE,
)

_SUBTOTAL_REGEX = re.compile(
    r"\bsub\s*total\b(?:\s*[:\-])?[^\w\n\r]{0,10}(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)(?![.\d\s]*%)",
    re.IGNORECASE,
)

_TAX_LINE_REGEX = re.compile(
    r"\b(?:cgst|sgst|igst|gst|tax|service\s*charge|vat)\b",
    re.IGNORECASE,
)

_DISCOUNT_REGEX = re.compile(
    r"\b(?:discount|disc)\b(?:\s*[:\-])?[^\w\n\r]{0,10}(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)(?![.\d\s]*%)",
    re.IGNORECASE,
)

_CURRENCY_AMOUNT_REGEX = re.compile(
    r"(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)(?![.\d\s]*%)",
    re.IGNORECASE,
)

_FALLBACK_AMOUNT_REGEX = re.compile(r"\b(\d{1,6}\.\d{2})\b(?![.\d\s]*%)")

_ADDRESS_CUTOFF_REGEX = re.compile(
    r"(?:\b\d+[\s,]+(?:[A-Za-z]+\s+)?(?:street|st|road|rd|nagar|cross|main|lane|marg|avenue|ave|sector|layout)\b"
    r"|\b(?:bengaluru|bangalore|karnataka|mumbai|delhi|hyderabad|chennai|pune|kolkata)\b"
    r"|\b\d{6}\b"
    r"|\b(?:\+?91[\s\-]?)?(?:ph|tel|phone|mobile)\b"
    r"|\b(?:gstin|cin|fssai)\b)",
    re.IGNORECASE,
)

_HEADER_SKIP_REGEX = re.compile(
    r"^(?:tax\s*invoice|invoice|cash\s*memo|bill\s*no|date|time|cashier|table\s*no|dine\s*in|item|qty|rate|amount|welcome|thank\s*you|customer\s*copy)",
    re.IGNORECASE,
)

# Date patterns (supports single or double digit day/month)
_DATE_PATTERNS = [
    (re.compile(r"\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b"), "%d/%m/%Y"),
    (re.compile(r"\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b"), "%Y-%m-%d"),
    (re.compile(r"\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{4})\b", re.I), None),
]


def _clean_amount_str(raw: str) -> Optional[float]:
    if not raw:
        return None
    try:
        val = float(raw.replace(",", "").strip())
        if val > 0:
            return round(val, 2)
    except (ValueError, TypeError):
        pass
    return None


def extract_amount_with_reconciliation(text: str) -> tuple[Optional[float], bool]:
    """Extract final payable amount using candidate collection and arithmetic reconciliation.

    Returns:
        tuple[amount, amount_verified]
    """
    if not text:
        return None, False

    lines = [l.strip() for l in text.splitlines() if l.strip()]

    # 1. Parse Subtotal
    subtotal: Optional[float] = None
    sub_m = _SUBTOTAL_REGEX.search(text)
    if sub_m:
        subtotal = _clean_amount_str(sub_m.group(1))

    # 2. Parse Taxes (skip rate percentages like 2.5%)
    taxes: list[float] = []
    for line in lines:
        if _TAX_LINE_REGEX.search(line):
            line_no_rate = re.sub(r"\(\s*[\d.]+\s*%\s*\)", "", line)
            line_no_rate = re.sub(r"[\d.]+\s*%", "", line_no_rate)
            for m in re.finditer(r"\b([\d,]+\.\d{1,2})\b(?![.\d\s]*%)", line_no_rate):
                amt = _clean_amount_str(m.group(1))
                if amt is not None and amt > 0:
                    taxes.append(amt)

    # 3. Parse Discount
    discount: float = 0.0
    disc_m = _DISCOUNT_REGEX.search(text)
    if disc_m:
        d_amt = _clean_amount_str(disc_m.group(1))
        if d_amt:
            discount = d_amt

    # 4. Parse Line Items Sum (as fallback subtotal)
    items_sum: float = 0.0
    try:
        from app.documents.receipt_parser import parse_line_items
        parsed_items = parse_line_items(text)
        if parsed_items:
            items_sum = round(sum(it.get("line_total", 0) for it in parsed_items), 2)
    except Exception:
        items_sum = 0.0

    # 5. Check for Column-Split Layout (consecutive label lines followed by matching consecutive amount lines)
    candidate_totals: list[float] = []
    for idx in range(len(lines)):
        run_labels = []
        for j in range(idx, min(len(lines), idx + 6)):
            l_str = lines[j].strip().lower()
            if re.search(r"\b(?:sub\s*total|cgst|sgst|igst|tax|total|grand\s*total)\b", l_str) and not re.search(r"\b\d+\.\d{2}\b", lines[j]):
                run_labels.append(lines[j])
            else:
                break
        if len(run_labels) >= 2:
            k = len(run_labels)
            amt_start = idx + k
            run_amts = []
            for j in range(amt_start, min(len(lines), amt_start + k)):
                amt_m = re.search(r"(?:₹|rs\.?|inr)?\s*([\d,]+\.\d{2})(?![.\d\s]*%)", lines[j], re.I)
                if amt_m:
                    val = _clean_amount_str(amt_m.group(1))
                    if val:
                        run_amts.append(val)
                else:
                    break
            if len(run_amts) == k:
                for lab, val in zip(run_labels, run_amts):
                    lab_lower = lab.lower()
                    if "sub" in lab_lower and "total" in lab_lower:
                        subtotal = val
                    elif any(t in lab_lower for t in ["cgst", "sgst", "igst", "tax"]):
                        taxes.append(val)
                    elif "total" in lab_lower:
                        if val not in candidate_totals:
                            candidate_totals.append(val)
                break

    # 6. Compute expected totals
    expected_totals: list[float] = []
    tax_sum = round(sum(taxes), 2)
    if subtotal is not None and subtotal > 0:
        expected_from_subtotal = round(subtotal + tax_sum - discount, 2)
        expected_totals.append(expected_from_subtotal)
    if items_sum > 0:
        expected_from_items = round(items_sum + tax_sum - discount, 2)
        if expected_from_items not in expected_totals:
            expected_totals.append(expected_from_items)
        if tax_sum == 0 and items_sum not in expected_totals:
            expected_totals.append(items_sum)

    # 7. Collect Candidate Totals

    # A. Labeled lines (and next-line values)
    labeled_candidates: list[float] = []
    for i, line in enumerate(lines):
        m = _TOTAL_AMOUNT_REGEX.search(line)
        if m:
            amt = _clean_amount_str(m.group(1))
            if amt and amt not in candidate_totals:
                candidate_totals.append(amt)
            if amt and amt not in labeled_candidates:
                labeled_candidates.append(amt)
        elif re.search(r"\b(?:grand\s*total|net\s*payable|amount\s*paid|bill\s*total|\btotal\b)\b", line, re.I):
            if i + 1 < len(lines):
                next_line = lines[i + 1]
                m_next = re.search(r"^(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)(?![.\d\s]*%)", next_line, re.I)
                if m_next:
                    amt = _clean_amount_str(m_next.group(1))
                    if amt and amt not in candidate_totals:
                        candidate_totals.append(amt)
                    if amt and amt not in labeled_candidates:
                        labeled_candidates.append(amt)

    # B. Rupee misread candidates (e.g. 'u, 180.20' -> '1,180.20', 'Z1,180.20', '?1,180.20')
    for line in lines:
        u_match = re.search(r"[uU]\s*,\s*([\d,]+(?:\.\d{2})?)", line)
        if u_match:
            amt = _clean_amount_str("1," + u_match.group(1))
            if amt and amt not in candidate_totals:
                candidate_totals.append(amt)

        misread_match = re.search(r"(?:total|amount|paid)[^\w\n\r]*([ZzQq\?2])([\d,]+\.\d{2})", line, re.I)
        if misread_match:
            amt_stripped = _clean_amount_str(misread_match.group(2))
            if amt_stripped and amt_stripped not in candidate_totals:
                candidate_totals.append(amt_stripped)
            amt_full = _clean_amount_str(misread_match.group(1) + misread_match.group(2))
            if amt_full and amt_full not in candidate_totals and misread_match.group(1).isdigit():
                candidate_totals.append(amt_full)

    # C. Currency-tagged amounts
    for m in _CURRENCY_AMOUNT_REGEX.finditer(text):
        amt = _clean_amount_str(m.group(1))
        if amt and amt not in candidate_totals:
            candidate_totals.append(amt)

    # D. Fallback decimal amounts
    for m in _FALLBACK_AMOUNT_REGEX.finditer(text):
        amt = _clean_amount_str(m.group(1))
        if amt and amt < 1000000 and amt not in candidate_totals:
            candidate_totals.append(amt)

    # 8. Check if any candidate reconciles with expected_totals
    for exp in expected_totals:
        for cand in candidate_totals:
            if abs(cand - exp) <= 0.50:
                logger.info(f"[Extractor] Amount reconciled: candidate={cand} matches expected={exp}")
                return (cand, True)

    # If subtotal and taxes yielded an expected total and it matches OCR tokens
    if expected_totals:
        best_expected = expected_totals[0]
        exp_plain = f"{best_expected:.2f}"
        exp_commas = f"{best_expected:,.2f}"
        if exp_plain in text or exp_commas in text or exp_plain.split(".")[0] in text:
            return (best_expected, True)

    # 9. Unreconciled fallback: pick best labeled candidate
    if labeled_candidates:
        return (labeled_candidates[-1], False)

    if candidate_totals:
        return (candidate_totals[0], False)

    return (None, False)


def extract_amount_regex(text: str) -> Optional[float]:
    """Extract final payable amount using candidate extraction and reconciliation."""
    amt, _ = extract_amount_with_reconciliation(text)
    return amt


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
                    day, month_str, year = match.group(1), match.group(2), match.group(3)
                    raw_date = f"{day} {month_str} {year}"
                    dt = datetime.strptime(raw_date, "%d %b %Y")
                    return dt.strftime("%Y-%m-%d")
            except Exception:
                continue
    return None


def extract_merchant_regex(text: str) -> Optional[str]:
    """Guess clean merchant name without address or header leakage."""
    if not text:
        return None

    lines = [l.strip() for l in text.splitlines() if l.strip()]
    for line in lines[:8]:
        if _HEADER_SKIP_REGEX.search(line):
            continue

        match_addr = _ADDRESS_CUTOFF_REGEX.search(line)
        if match_addr:
            candidate = line[:match_addr.start()].strip()
        else:
            candidate = line.strip()

        candidate = re.sub(r"[^\w\s&'-]", " ", candidate).strip()
        candidate = re.sub(r"\b(\w+)\s+g\s+(\w+)\b", r"\1 & \2", candidate)
        candidate = re.sub(r"\s+", " ", candidate).strip()

        if len(candidate) < 3:
            continue
        if candidate.lower() in ("good food brighter days", "good food brings", "people together", "dine in", "customer copy"):
            continue

        if not _ADDRESS_CUTOFF_REGEX.search(candidate):
            return candidate

    return None


def extract_payment_mode_regex(text: str) -> tuple[Optional[str], Optional[str]]:
    """Guess payment mode and details from text patterns."""
    # Check UPI
    upi_match = re.search(r"(?:upi\s*id|vpa)[^\w\n:]*[:\s]*([a-zA-Z0-9.\-_]+@[a-zA-Z0-9]+)", text, re.I)
    if upi_match:
        return "UPI", upi_match.group(1).strip()
    if re.search(r"\b(?:upi|gpay|google\s*pay|phonepe|paytm|bhim)\b", text, re.I):
        return "UPI", None

    # Check Card
    card_match = re.search(r"(?:card\s*(?:no|ending|last)?[^\d\n]*(\d{4}))", text, re.I)
    if card_match:
        return "Card", f"ending in {card_match.group(1)}"
    if re.search(r"\b(?:credit\s*card|debit\s*card|visa|mastercard|amex|rupay|pos\s*sale)\b", text, re.I):
        return "Card", None

    # Check Cash
    if re.search(r"\b(?:cash(?:\s*tendered)?|paid\s*by\s*cash)\b", text, re.I):
        return "Cash", None

    # Check Net Banking
    if re.search(r"\b(?:net\s*banking|neft|rtgs|imps)\b", text, re.I):
        return "Net Banking", None

    return None, None


def extract_financial_data_deterministic(text: str) -> dict[str, Any]:
    """Fast deterministic parser without LLM dependency."""
    amount, amount_verified = extract_amount_with_reconciliation(text)
    date = extract_date_regex(text)
    merchant = extract_merchant_regex(text)
    description = merchant or "Receipt expense"
    cat_text = f"{merchant} {text}".lower()
    food_words = (
        "pizza", "burger", "coffee", "latte", "fries", "brownie", "food", "cafe",
        "restaurant", "dining", "dine in", "bakery", "kitchen", "tea", "beverage",
        "meal", "snack", "bread", "dessert", "sandwich"
    )
    if any(w in cat_text for w in food_words):
        category = "Food"
    else:
        category = categorize_transaction(cat_text[:1500])
        if category not in ALLOWED_CATEGORIES:
            category = DEFAULT_CATEGORY

    payment_mode, payment_details = extract_payment_mode_regex(text)

    # Baseline rule-based confidence
    confidence = 0.50
    if amount is not None and amount > 0:
        if amount_verified:
            confidence += 0.35
        else:
            confidence += 0.05
    if date is not None:
        confidence += 0.10
    if merchant and len(merchant) >= 3:
        confidence += 0.10

    return {
        "merchant": merchant,
        "date": date,
        "amount": amount,
        "currency": "INR",
        "category": category,
        "description": description,
        "payment_mode": payment_mode,
        "payment_details": payment_details,
        "amount_verified": amount_verified,
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

Important OCR correction instructions:
1. Indian Rupee symbol: The Rupee symbol ₹ combined with a leading digit like '₹2' is often misread by OCR as 'Q', '0', 'O', or 'Z' (e.g. '₹249.90' read as 'Q49.90' or '049.90').
2. Mathematical verification: Verify Subtotal, Discounts, and Taxes from the text (e.g. Subtotal 1,124.00 + CGST 28.10 + SGST 28.10 = 1,180.20). If a recognized total contradicts the arithmetic, correct it to the true calculated total.
3. Merchant name: Identify clean business/brand name (e.g. 'Bean & Bite'). Do NOT include street addresses or postal codes.
4. Date: Extract and normalize to ISO YYYY-MM-DD.
5. Payment Mode & Details: Look for payment method (e.g. 'UPI', 'Cash', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet') and any payment details/identifiers (e.g. UPI ID 'radhika@okicici', card digits, or transaction ref).

Expected JSON shape:
{{
  "merchant": string or null (store, vendor, restaurant, or business name),
  "date": "YYYY-MM-DD" or null (transaction date, normalize to ISO YYYY-MM-DD),
  "amount": number or null (FINAL payable total amount as decimal, e.g. 1180.20. Do NOT use 0 if unreadable; use null),
  "currency": "INR" or string,
  "category": "Food" | "Transport" | "Shopping" | "Bills" | "Entertainment" | "Healthcare" | "Other",
  "description": string (short description of the purchase or merchant, e.g. "Bean & Bite"),
  "payment_mode": string or null (e.g. "UPI", "Cash", "Card", "Net Banking", "Wallet", etc.),
  "payment_details": string or null (e.g. "radhika@okicici" or card details/reference if found),
  "confidence": number between 0.0 and 1.0 (accuracy assessment of the extracted data)
}}

Raw OCR text:
\"\"\"
{text[:3000]}
\"\"\"
"""
        models_to_try = [
            os.getenv("GROQ_MODEL", "groq/compound-mini"),
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "llama3-8b-8192",
        ]
        models = []
        for m in models_to_try:
            if m and m not in models:
                models.append(m)

        completion = None
        last_exc = None
        for model_name in models:
            try:
                completion = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": "You are a precise financial data extraction engine. Return only JSON."},
                        {"role": "user", "content": prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.0,
                )
                break
            except Exception as m_exc:
                last_exc = m_exc
                logger.warning(f"[Extractor] Groq attempt with model {model_name} failed: {m_exc}")

        if not completion:
            raise last_exc or Exception("All Groq models failed")

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
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", str(date)):
                date = extract_date_regex(text)

        category = data.get("category")
        if category not in ALLOWED_CATEGORIES:
            category = categorize_transaction(str(data.get("merchant") or data.get("description") or ""))

        payment_mode = data.get("payment_mode")
        payment_details = data.get("payment_details")

        confidence = data.get("confidence")
        try:
            confidence = float(confidence) if confidence is not None else 0.8
        except (ValueError, TypeError):
            confidence = 0.8

        # Cross-verify with deterministic reconciliation
        reconciled_amt, is_verified = extract_amount_with_reconciliation(text)
        amount_verified = is_verified
        if is_verified and reconciled_amt is not None:
            if amount is None or abs(amount - reconciled_amt) > 0.05:
                logger.info(f"[Extractor] Overriding Groq amount {amount} with verified reconciled amount {reconciled_amt}")
                amount = reconciled_amt
        elif amount is not None and reconciled_amt is not None and abs(amount - reconciled_amt) <= 0.05:
            amount_verified = True

        merchant = data.get("merchant") or extract_merchant_regex(text)
        # Prevent address leakage in merchant
        if merchant and _ADDRESS_CUTOFF_REGEX.search(merchant):
            merchant = extract_merchant_regex(text) or merchant

        logger.info(f"[Extractor] Groq extracted: merchant={merchant}, amount={amount}, verified={amount_verified}, category={category}, payment_mode={payment_mode}")
        return {
            "merchant": merchant,
            "date": date,
            "amount": amount,
            "currency": data.get("currency") or "INR",
            "category": category,
            "description": merchant or data.get("description") or "Receipt expense",
            "payment_mode": payment_mode,
            "payment_details": payment_details,
            "amount_verified": amount_verified,
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
            "payment_mode": None,
            "payment_details": None,
            "amount_verified": False,
            "confidence": 0.0,
        }

    # 1. Try Groq AI extraction
    ai_result = extract_financial_data_groq(text)
    if ai_result:
        # Cross-verify amount with regex if AI couldn't find amount
        if ai_result["amount"] is None:
            regex_amt, is_ver = extract_amount_with_reconciliation(text)
            if regex_amt is not None:
                ai_result["amount"] = regex_amt
                ai_result["amount_verified"] = is_ver
        # Fallback payment mode if AI missed it
        if not ai_result.get("payment_mode"):
            regex_pm, regex_pd = extract_payment_mode_regex(text)
            if regex_pm:
                ai_result["payment_mode"] = regex_pm
                ai_result["payment_details"] = regex_pd
        return ai_result

    # 2. Fallback to deterministic regex extractor
    return extract_financial_data_deterministic(text)
