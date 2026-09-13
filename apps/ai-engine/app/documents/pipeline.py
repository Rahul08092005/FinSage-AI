"""Document processing pipeline.

Single entry point for the /internal/documents/process endpoint.
Dispatches to the correct parser by doc_type and file extension,
normalises the extracted rows, and computes an aggregate confidence score.

Response contract (Aditi's worker depends on this exact shape):
    {
        "transactions": [ ...normalized rows... ],
        "confidence":   float,          # 0.0-1.0
        "ocr_text":     str,            # raw extracted text
        "error":        str | None
    }
"""
import logging
import os
from typing import Any, Optional

from app.analytics.normalization import normalize_batch
from app.documents.confidence import score_extraction
from app.documents.pdf_parser import parse_pdf_document
from app.documents.receipt_parser import parse_receipt

logger = logging.getLogger("finsage.ocr.pipeline")

MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
ALLOWED_DOC_TYPES = {"receipt", "bank_statement", "other"}


def validate_document_input(file_path: Optional[str], doc_type: Optional[str]) -> Optional[str]:
    """Validate document input parameters before attempting to parse."""
    if not file_path or not isinstance(file_path, str):
        return "File path is required."

    if not os.path.isfile(file_path):
        return f"File does not exist: '{file_path}'"

    try:
        file_size = os.path.getsize(file_path)
        if file_size > MAX_DOCUMENT_SIZE_BYTES:
            size_mb = round(file_size / (1024 * 1024), 2)
            return f"File size ({size_mb} MB) exceeds maximum allowed limit of 25 MB."
    except Exception as exc:
        return f"Could not inspect file attributes: {exc}"

    if not doc_type or doc_type not in ALLOWED_DOC_TYPES:
        allowed = ", ".join(sorted(ALLOWED_DOC_TYPES))
        return f"Unsupported document type '{doc_type}'. Allowed types are: {allowed}."

    return None


def _sanitize_for_normalize(rows: list[dict]) -> list[dict]:
    """Replace None amount/date with safe defaults before passing to normalize_batch."""
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
    """Parse a document and return normalised transactions with a confidence score."""
    logger.info(f"[OCR] Processing started for file='{file_path}', type='{doc_type}'")

    validation_error = validate_document_input(file_path, doc_type)
    if validation_error:
        logger.error(f"[OCR] Validation error: {validation_error}")
        return {
            "transactions": [],
            "confidence": 0.0,
            "ocr_text": "",
            "error": validation_error,
        }

    raw_rows: list[dict] = []
    ocr_text_accum = ""

    try:
        is_pdf = file_path.lower().endswith(".pdf")

        if is_pdf or doc_type == "bank_statement":
            raw_rows = parse_pdf_document(file_path, doc_type)
        else:
            # Receipt or general image
            parsed = parse_receipt(file_path)
            raw_rows = [parsed] if parsed else []

        if raw_rows:
            ocr_text_accum = "\n".join(r.get("raw_text", "") for r in raw_rows if r.get("raw_text"))

    except Exception as exc:
        logger.error(f"[OCR] Failed to process document: {exc}", exc_info=True)
        return {
            "transactions": [],
            "confidence": 0.0,
            "ocr_text": "",
            "error": f"Failed to process document: {exc}",
        }

    # Calculate overall confidence score
    if raw_rows:
        confidence = round(
            sum(score_extraction(r) for r in raw_rows) / len(raw_rows), 2
        )
    else:
        confidence = 0.0

    # Ensure amount and date fields in raw_rows are preserved as None if unreadable
    # normalize_batch converts them for frontend consumption
    normalised = normalize_batch(_sanitize_for_normalize(raw_rows), source="ocr")

    # Restore None for amount if raw was None (normalize_batch turns missing to 0.0)
    for idx, row in enumerate(raw_rows):
        if idx < len(normalised) and row.get("amount") is None:
            normalised[idx]["amount"] = None
        if idx < len(normalised) and row.get("merchant"):
            normalised[idx]["merchant"] = row["merchant"]

    logger.info(f"[OCR] Processing completed: rows={len(normalised)}, confidence={confidence}")

    return {
        "transactions": normalised,
        "confidence": confidence,
        "ocr_text": ocr_text_accum[:2000],
        "error": None,
    }
