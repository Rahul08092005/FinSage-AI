"""PDF document parser for receipts, invoices, and bank statements.

Supports:
  1. Text-based PDFs via pypdf (fast native extraction)
  2. Scanned/image-only PDFs via pypdfium2 page rendering + OCRAdapter
  3. Multi-page document aggregation
  4. Both tabular bank statements and single-purchase invoices/receipts
"""
import logging
import os
import re
from typing import Any, List, Optional

from app.analytics.categorization import categorize_transaction
from app.analytics.pii_masking import mask_pii
from app.documents.extractor import extract_financial_data
from app.documents.ocr_adapter import OCRAdapter

logger = logging.getLogger("finsage.ocr.pdf_parser")

# Standard statement line pattern: Date   Description   Amount
_STATEMENT_LINE = re.compile(
    r"(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})"
    r"\s+"
    r"(.+?)"
    r"\s+"
    r"(?:Rs\.?\s*|INR\s*|₹\s*)?"
    r"([\d,]+(?:\.\d{1,2})?)"
    r"\s*$",
    re.IGNORECASE,
)


def _parse_statement_line(line: str) -> Optional[dict]:
    m = _STATEMENT_LINE.match(line.strip())
    if not m:
        return None

    date_str, description, amount_str = m.group(1), m.group(2).strip(), m.group(3)
    try:
        amount = float(amount_str.replace(",", ""))
        if amount <= 0:
            return None
    except ValueError:
        return None

    return {
        "amount": amount,
        "date": date_str,
        "description": mask_pii(description),
        "merchant": mask_pii(description),
        "category": categorize_transaction(description),
        "currency": "INR",
        "raw_text": mask_pii(line.strip()),
    }


def _render_pdf_to_images(pdf_path: str, max_pages: int = 5) -> List[Any]:
    """Render PDF pages to PIL Images using pypdfium2 (requires no poppler)."""
    images = []
    try:
        import pypdfium2 as pdfium
        pdf = pdfium.PdfDocument(pdf_path)
        total_pages = min(len(pdf), max_pages)
        for i in range(total_pages):
            page = pdf[i]
            # Render at 200 DPI (scale factor ~2.77)
            pil_img = page.render(scale=2.0).to_pil()
            images.append(pil_img)
        pdf.close()
    except Exception as exc:
        logger.warning(f"[PDF] pypdfium2 rendering failed ({exc})")
    return images


def parse_pdf_document(pdf_path: str, doc_type: str = "receipt") -> List[dict]:
    """Parse a PDF document (text or scanned).

    Returns a list of transaction dicts.
    """
    if not os.path.isfile(pdf_path):
        return []

    full_text = ""
    statement_rows = []

    # 1. Try native text extraction using pypdf
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            t = page.extract_text() or ""
            if t.strip():
                full_text += t + "\n"
                for line in t.splitlines():
                    parsed = _parse_statement_line(line)
                    if parsed:
                        statement_rows.append(parsed)
    except Exception as exc:
        logger.warning(f"[PDF] pypdf extraction error: {exc}")

    # If it's a bank statement and we found multiple line-by-line statement rows:
    if doc_type == "bank_statement" and len(statement_rows) >= 1:
        logger.info(f"[PDF] Extracted {len(statement_rows)} bank statement rows via pypdf")
        return statement_rows

    # 2. If insufficient text was extracted (< 30 characters), render pages to images and OCR
    if len(full_text.strip()) < 30:
        logger.info(f"[PDF] Insufficient text extracted ({len(full_text)} chars). Rendering PDF pages to images for OCR...")
        page_images = _render_pdf_to_images(pdf_path)
        if page_images:
            adapter = OCRAdapter()
            ocr_texts = []
            for idx, img in enumerate(page_images):
                page_text = adapter.extract_text_from_pil(img)
                if page_text.strip():
                    ocr_texts.append(page_text)
                    # Check for statement rows inside OCR text
                    for line in page_text.splitlines():
                        parsed = _parse_statement_line(line)
                        if parsed:
                            statement_rows.append(parsed)
            full_text = "\n".join(ocr_texts)

    if doc_type == "bank_statement" and statement_rows:
        return statement_rows

    # 3. For invoices or receipts (or fallback), run structured financial extraction on full_text
    if full_text.strip():
        extracted = extract_financial_data(full_text)
        return [{
            "amount": extracted.get("amount"),
            "date": extracted.get("date"),
            "description": extracted.get("description") or extracted.get("merchant") or "PDF Document",
            "merchant": extracted.get("merchant"),
            "category": extracted.get("category") or "Other",
            "currency": extracted.get("currency") or "INR",
            "confidence": extracted.get("confidence", 0.6),
            "raw_text": full_text[:1000],
        }]

    return []
