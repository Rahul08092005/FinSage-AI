"""Document processing pipeline.

Single entry point for the /internal/documents/process endpoint.
Dispatches to the correct parser by doc_type, normalises the extracted
rows, and computes an aggregate confidence score.

Response contract (Aditi's worker depends on this exact shape):
    {
        "transactions": [ ...normalized rows... ],
        "confidence":   float          # 0.0-1.0, average across all rows
    }

Step 5 -- image-PDF fallback:
    If doc_type=="bank_statement" and pypdf returns no rows (scanned /
    image-only PDF), the code tries to render each page to an image via
    pdf2image and run OCR on each page image.  This requires the
    external `poppler` utility to be installed on the system.  If
    pdf2image or poppler is unavailable the fallback is skipped and the
    empty-list result is returned (no silent crash).
"""
import warnings
from typing import Any

from app.analytics.categorization import categorize_transaction
from app.analytics.normalization import normalize_batch
from app.documents.confidence import score_extraction
from app.documents.ocr_adapter import OCRAdapter
from app.documents.pdf_parser import parse_bank_statement_pdf
from app.documents.receipt_parser import parse_receipt


def _image_pdf_fallback(pdf_path: str) -> list[dict]:
    """Attempt to OCR a scanned (image-only) PDF page by page.

    Requires:
        pip install pdf2image
        System: poppler  (https://poppler.freedesktop.org/)

    If either dependency is missing, logs a warning and returns [].
    """
    try:
        from pdf2image import convert_from_path  # type: ignore[import]
    except ImportError:
        warnings.warn(
            "pdf2image is not installed -- image-PDF fallback unavailable. "
            "Install with: pip install pdf2image  (also requires system poppler).",
            ImportWarning,
            stacklevel=3,
        )
        return []

    rows: list[dict] = []
    try:
        pages = convert_from_path(pdf_path)
        adapter = OCRAdapter()
        for page_img in pages:
            import tempfile
            import os
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                page_img.save(tmp.name)
                tmp_path = tmp.name
            try:
                raw_text = adapter.extract_text(tmp_path)
            finally:
                os.unlink(tmp_path)

            description = (raw_text.strip().splitlines() or [""])[0][:120]
            rows.append({
                "amount": None,
                "date": None,
                "description": description,
                "category": categorize_transaction(description),
                "raw_text": raw_text,
            })
    except Exception as exc:  # poppler not installed or PDF unreadable
        warnings.warn(
            f"image-PDF fallback failed ({exc}). "
            "Make sure poppler is installed and on PATH.",
            RuntimeWarning,
            stacklevel=3,
        )

    return rows


def _sanitize_for_normalize(rows: list[dict]) -> list[dict]:
    """Replace None amount/date with safe defaults before passing to normalize_batch.

    normalize_transaction() does float(raw.get("amount", 0)) which only falls
    back to 0 when the key is *absent*, not when the value is explicitly None.
    Parsers may return None for missing fields, so we coerce here rather than
    modifying the existing normalize_transaction signature.
    """
    sanitized = []
    for row in rows:
        r = dict(row)
        if r.get("amount") is None:
            r["amount"] = 0
        if r.get("date") is None:
            r["date"] = ""
        sanitized.append(r)
    return sanitized


def process_document(file_path: str, doc_type: str) -> dict[str, Any]:
    """Parse a document and return normalised transactions with a confidence score.

    Args:
        file_path: Path to the file on disk.
        doc_type:  One of "receipt", "bank_statement", or any other string
                   (falls back to raw OCR).

    Returns:
        {
            "transactions": list of dicts (normalised by normalize_batch),
            "confidence":   float 0.0-1.0
        }
        Never raises.
    """
    raw_rows: list[dict] = []

    if doc_type == "receipt":
        # parse_receipt returns a single dict; wrap it for uniform processing
        raw_rows = [parse_receipt(file_path)]

    elif doc_type == "bank_statement":
        raw_rows = parse_bank_statement_pdf(file_path)
        # Step 5: if pypdf found no text (scanned/image-only PDF), try image fallback
        if not raw_rows:
            raw_rows = _image_pdf_fallback(file_path)

    else:
        # Unknown doc_type -- run raw OCR, treat as a single low-confidence entry
        raw_text = OCRAdapter().extract_text(file_path)
        description = (raw_text.strip().splitlines() or [""])[0][:120]
        raw_rows = [{
            "amount": None,
            "date": None,
            "description": description,
            "category": "Other",   # deliberately low-confidence
            "raw_text": raw_text,
        }]

    # Compute confidence BEFORE sanitizing -- we score raw extraction quality
    if raw_rows:
        confidence = round(
            sum(score_extraction(r) for r in raw_rows) / len(raw_rows), 4
        )
    else:
        confidence = 0.0

    # Sanitize None fields so normalize_transaction does not crash, then normalise
    normalised = normalize_batch(_sanitize_for_normalize(raw_rows), source="ocr")

    return {"transactions": normalised, "confidence": confidence}
