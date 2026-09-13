"""Receipt parser -- extracts transaction-shaped financial data from receipt images.

Uses:
  1. OCRAdapter (preprocessing + WinOCR/Tesseract) to extract raw text
  2. Financial Extractor (Groq JSON mode + deterministic regex) to extract fields
"""
import logging
import os
from typing import Optional

from app.documents.extractor import extract_financial_data
from app.documents.ocr_adapter import OCRAdapter

logger = logging.getLogger("finsage.ocr.receipt_parser")


def parse_receipt(image_path: str) -> dict:
    """Extract transaction fields from a receipt image.

    Args:
        image_path: Path to the receipt image (jpg, jpeg, png, webp).

    Returns:
        Dict with keys: amount, date, description, merchant, category,
        currency, confidence, raw_text.
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
            "confidence": 0.0,
            "raw_text": "",
        }

    # Extract structured fields
    extracted = extract_financial_data(raw_text)

    return {
        "amount": extracted.get("amount"),
        "date": extracted.get("date"),
        "description": extracted.get("description") or extracted.get("merchant") or "Receipt expense",
        "merchant": extracted.get("merchant"),
        "category": extracted.get("category") or "Other",
        "currency": extracted.get("currency") or "INR",
        "confidence": extracted.get("confidence", 0.5),
        "raw_text": raw_text,
    }
