"""Document processing pipeline.

Single entry point for the /internal/documents/process endpoint.
Dispatches to the correct parser by doc_type, normalises the extracted
rows, and computes an aggregate confidence score.

Response contract (Aditi's worker depends on this exact shape):
    {
        "transactions": [ ...normalized rows... ],
        "confidence":   float          # 0.0-1.0, average across all rows
        # Optional error field populated when parsing or validation fails:
        "error":        str
    }

Step 5 -- image-PDF fallback:
    If doc_type=="bank_statement" and pypdf returns no rows (scanned /
    image-only PDF), the code tries to render each page to an image via
    pdf2image and run OCR on each page image.  This requires the
    external `poppler` utility to be installed on the system.  If
    pdf2image or poppler is unavailable the fallback is skipped and the
    empty-list result is returned (no silent crash).
"""
import os
import warnings
from typing import Any, Optional

from app.analytics.categorization import categorize_transaction
from app.analytics.normalization import normalize_batch
from app.analytics.pii_masking import mask_pii
from app.documents.confidence import score_extraction
from app.documents.ocr_adapter import OCRAdapter
from app.documents.pdf_parser import parse_bank_statement_pdf
from app.documents.receipt_parser import parse_receipt

# Maximum allowed file size for document processing (10 MB)
MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024

# Allowed document types expected from upload endpoints
ALLOWED_DOC_TYPES = {"receipt", "bank_statement", "other"}


def validate_document_input(file_path: Optional[str], doc_type: Optional[str]) -> Optional[str]:
    """Validate document input parameters before attempting to parse.

    Checks:
      1. file_path is provided and exists on disk.
      2. File size is under the 10 MB limit.
      3. doc_type is in {'receipt', 'bank_statement', 'other'}.

    Args:
        file_path: Path to the target document.
        doc_type:  Document type string.

    Returns:
        Human-readable error message if validation fails, or None if valid.
    """
    if not file_path or not isinstance(file_path, str):
        return "File path is required."

    if not os.path.isfile(file_path):
        return f"File does not exist: '{file_path}'"

    try:
        file_size = os.path.getsize(file_path)
        if file_size > MAX_DOCUMENT_SIZE_BYTES:
            size_mb = round(file_size / (1024 * 1024), 2)
            return f"File size ({size_mb} MB) exceeds maximum allowed limit of 10 MB."
    except Exception as exc:
        return f"Could not inspect file attributes: {exc}"

    if not doc_type or doc_type not in ALLOWED_DOC_TYPES:
        allowed = ", ".join(sorted(ALLOWED_DOC_TYPES))
        return f"Unsupported document type '{doc_type}'. Allowed types are: {allowed}."

    return None


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
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                page_img.save(tmp.name)
                tmp_path = tmp.name
            try:
                raw_text = mask_pii(adapter.extract_text(tmp_path))
            finally:
                if os.path.exists(tmp_path):
                    os.unlink(tmp_path)

            first_line = (raw_text.strip().splitlines() or [""])[0][:120]
            description = mask_pii(first_line)
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
        doc_type:  One of 'receipt', 'bank_statement', or 'other'.

    Returns:
        {
            "transactions": list of dicts (normalised by normalize_batch),
            "confidence":   float 0.0-1.0,
            "error":        str (only present when parsing fails)
        }
        Never raises.
    """
    # 1. Input validation check
    validation_error = validate_document_input(file_path, doc_type)
    if validation_error:
        return {
            "transactions": [],
            "confidence": 0.0,
            "error": validation_error,
        }

    raw_rows: list[dict] = []

    try:
        if doc_type == "receipt":
            # parse_receipt returns a single dict; wrap it for uniform processing
            raw_rows = [parse_receipt(file_path)]

        elif doc_type == "bank_statement":
            raw_rows = parse_bank_statement_pdf(file_path)
            # If pypdf found no text (scanned/image-only PDF), try image fallback
            if not raw_rows:
                raw_rows = _image_pdf_fallback(file_path)

            if not raw_rows:
                return {
                    "transactions": [],
                    "confidence": 0.0,
                    "error": "No transaction-shaped lines found in PDF",
                }

        else:
            # doc_type == "other" or fallback
            raw_text = mask_pii(OCRAdapter().extract_text(file_path))
            first_line = (raw_text.strip().splitlines() or [""])[0][:120]
            description = mask_pii(first_line)
            raw_rows = [{
                "amount": None,
                "date": None,
                "description": description,
                "category": "Other",   # deliberately low-confidence
                "raw_text": raw_text,
            }]

    except ValueError as exc:
        return {
            "transactions": [],
            "confidence": 0.0,
            "error": str(exc),
        }
    except Exception as exc:
        return {
            "transactions": [],
            "confidence": 0.0,
            "error": f"Failed to process document: {exc}",
        }

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
