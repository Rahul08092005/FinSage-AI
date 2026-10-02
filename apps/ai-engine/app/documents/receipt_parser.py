"""Receipt parser -- extracts transaction-shaped financial data and line items from receipt images.

Uses:
  1. OCRAdapter (preprocessing + WinOCR/Tesseract) to extract raw text
  2. Financial Extractor (Groq JSON mode + deterministic regex) to extract fields
  3. Deterministic regex line item parser to extract itemized purchases
"""
import logging
import os
import re
from typing import Optional

from app.documents.extractor import extract_financial_data
from app.documents.ocr_adapter import OCRAdapter

logger = logging.getLogger("finsage.ocr.receipt_parser")

SKIP_WORDS = {
    "total", "subtotal", "sub", "tax", "cgst", "sgst", "igst", "gst", "vat",
    "discount", "tip", "balance", "cash", "card", "change", "paid",
    "date", "time", "invoice", "receipt", "bill", "order", "phone", "tel",
    "thank", "thanks", "welcome", "payment", "due", "net", "amount", "summary",
    "merchant", "store", "pos", "credit", "debit", "visa", "mastercard", "upi",
    "ref", "reference", "auth", "trans", "transaction", "account", "customer"
}

INVALID_ITEM_NAMES = {
    "item", "items", "description", "qty", "quantity", "price", "rate", "amount",
    "no", "num", "number", "table", "page", "sr", "s.no", "sl.no", "sl", "particulars",
    "ref", "reference", "date", "time"
}


def _is_skip_line(line: str) -> bool:
    """Helper to check if a receipt text line is a header, total, or summary line."""
    clean = line.strip().lower()
    if not clean:
        return True
    if not any(c.isalpha() for c in clean):
        return True

    first_word = clean.split()[0].rstrip(":#.")
    if first_word in SKIP_WORDS:
        return True

    skip_phrases = [
        "amount due", "sub total", "grand total", "net amount",
        "thank you", "payment mode", "credit card", "reference #"
    ]
    for phrase in skip_phrases:
        if clean.startswith(phrase):
            return True

    return False


def _clean_item_name(name: str) -> Optional[str]:
    """Clean and validate candidate line item names."""
    cleaned = name.strip(" :-#.*")
    if not cleaned:
        return None
    if cleaned.lower() in INVALID_ITEM_NAMES:
        return None
    if len(cleaned) < 2 or not any(c.isalpha() for c in cleaned):
        return None
    return cleaned


def parse_line_items(raw_text: str) -> list[dict]:
    """Extract individual itemized line items from receipt raw text.

    Uses deterministic best-effort regex extraction for line formats such as:
      - COFFEE 1 120.00
      - Sandwich x2 240
      - Cold Coffee 2 x 150.00 300.00
      - 2 x Milk 60.00
      - Capuccino 250.00

    Args:
        raw_text: Raw OCR text extracted from the receipt.

    Returns:
        List of dicts, each with keys:
          - item_name: str
          - quantity: int (default 1)
          - unit_price: float | None
          - line_total: float
        Returns an empty list when no matches are found or text is invalid (never null).
    """
    if not raw_text or not isinstance(raw_text, str):
        return []

    items: list[dict] = []

    # Patterns evaluated in order of specificity
    patterns = [
        # Pattern 1: Item Qty x/@ UnitPrice Total (e.g. Cold Coffee 2 x 150.00 300.00)
        re.compile(
            r'^(?P<item>[A-Za-z0-9\s\-\.\'\&\/]+?)\s+(?P<qty>\d+)\s*(?:x|@|\*)\s*(?P<uprice>\d+(?:\.\d+)?)\s+(?P<total>\d+(?:\.\d+)?)$',
            re.IGNORECASE,
        ),
        # Pattern 2: Item Qty UnitPrice Total (e.g. COFFEE 1 120.00 120.00)
        re.compile(
            r'^(?P<item>[A-Za-z0-9\s\-\.\'\&\/]+?)\s+(?P<qty>\d+)\s+(?P<uprice>\d+(?:\.\d+)?)\s+(?P<total>\d+(?:\.\d+)?)$',
            re.IGNORECASE,
        ),
        # Pattern 3: Item xQty / Qtyx Total (e.g. Sandwich x2 240, Sandwich 2x 240.00)
        re.compile(
            r'^(?P<item>[A-Za-z0-9\s\-\.\'\&\/]+?)\s+(?:x\s*(?P<qty1>\d+)|(?P<qty2>\d+)\s*x)\s+(?P<total>\d+(?:\.\d+)?)$',
            re.IGNORECASE,
        ),
        # Pattern 4: Item Qty Total (e.g. COFFEE 1 120.00)
        re.compile(
            r'^(?P<item>[A-Za-z0-9\s\-\.\'\&\/]+?)\s+(?P<qty>\d+)\s+(?P<total>\d+(?:\.\d+)?)$',
            re.IGNORECASE,
        ),
        # Pattern 5: Leading Qty (opt x) Item Total (e.g. 2 x Milk 60.00, 2x Milk 60)
        re.compile(
            r'^(?P<qty>\d+)\s*(?:x\s+)?(?P<item>[A-Za-z0-9\s\-\.\'\&\/]+?)\s+(?P<total>\d+(?:\.\d+)?)$',
            re.IGNORECASE,
        ),
        # Pattern 6: Item Total (default qty 1) (e.g. Capuccino 250.00)
        re.compile(
            r'^(?P<item>[A-Za-z0-9\s\-\.\'\&\/]+?)\s+(?P<total>\d+(?:\.\d+)?)$',
            re.IGNORECASE,
        ),
    ]

    for line in raw_text.splitlines():
        line_str = line.strip()
        if _is_skip_line(line_str):
            continue

        for pat in patterns:
            m = pat.match(line_str)
            if not m:
                continue

            gd = m.groupdict()
            raw_item = gd.get("item", "")
            item_name = _clean_item_name(raw_item)
            if not item_name:
                continue

            try:
                line_total = float(gd["total"])
            except (ValueError, TypeError):
                continue

            qty = 1
            if "qty" in gd and gd["qty"] is not None:
                qty = int(gd["qty"])
            elif "qty1" in gd and gd["qty1"] is not None:
                qty = int(gd["qty1"])
            elif "qty2" in gd and gd["qty2"] is not None:
                qty = int(gd["qty2"])

            if qty <= 0:
                qty = 1

            unit_price = None
            if "uprice" in gd and gd["uprice"] is not None:
                try:
                    unit_price = float(gd["uprice"])
                except ValueError:
                    unit_price = None

            if unit_price is None and qty > 0:
                unit_price = round(line_total / qty, 2)

            items.append({
                "item_name": item_name,
                "quantity": qty,
                "unit_price": unit_price,
                "line_total": round(line_total, 2),
            })
            break

    return items


def store_line_items(document_id: str, line_items: list[dict]) -> dict:
    """Placeholder handoff interface for persisting parsed line items for a document.

    Note for Aditi: The persistence architecture decision (e.g. creating a dedicated
    LineItem table vs. storing as a JSON column on the Document table) will be decided
    during schema design. This function acts as the contract handoff.

    Args:
        document_id: Unique ID of the parsed document.
        line_items: List of line item dicts extracted from the receipt.

    Returns:
        Dict confirming receipt of handoff payload with status metadata.
    """
    logger.info(f"Handoff store_line_items for document '{document_id}': {len(line_items)} line items")
    return {
        "document_id": document_id,
        "item_count": len(line_items),
        "line_items": line_items,
        "status": "pending_persistence_design",
    }


def parse_receipt(image_path: str) -> dict:
    """Extract transaction fields and line items from a receipt image.

    Args:
        image_path: Path to the receipt image (jpg, jpeg, png, webp).

    Returns:
        Dict with keys: amount, date, description, merchant, category,
        currency, payment_mode, payment_details, confidence, raw_text, line_items.
    """
    if not image_path or not os.path.isfile(image_path):
        return {
            "amount": None,
            "date": None,
            "description": "File not found",
            "merchant": None,
            "category": "Other",
            "currency": "INR",
            "confidence": 0.0,
            "raw_text": "",
            "line_items": [],
        }

    try:
        adapter = OCRAdapter()
        raw_text = adapter.extract_text(image_path)
    except Exception as exc:
        logger.error(f"OCR extraction failed on {image_path}: {exc}")
        return {
            "amount": None,
            "date": None,
            "description": "OCR extraction failed",
            "merchant": None,
            "category": "Other",
            "currency": "INR",
            "confidence": 0.0,
            "raw_text": f"[Error: {exc}]",
            "line_items": [],
        }

    if not raw_text or not raw_text.strip():
        logger.warning(f"No text extracted from image {image_path}")
        return {
            "amount": None,
            "date": None,
            "description": "Unreadable document",
            "merchant": None,
            "category": "Other",
            "currency": "INR",
            "payment_mode": None,
            "payment_details": None,
            "confidence": 0.0,
            "raw_text": "",
            "line_items": [],
        }

    # Extract structured fields
    extracted = extract_financial_data(raw_text)
    line_items = parse_line_items(raw_text)

    return {
        "amount": extracted.get("amount"),
        "date": extracted.get("date"),
        "description": extracted.get("description") or extracted.get("merchant") or "Receipt expense",
        "merchant": extracted.get("merchant"),
        "category": extracted.get("category") or "Other",
        "currency": extracted.get("currency") or "INR",
        "payment_mode": extracted.get("payment_mode"),
        "payment_details": extracted.get("payment_details"),
        "confidence": extracted.get("confidence", 0.5),
        "raw_text": raw_text,
        "line_items": line_items,
    }

