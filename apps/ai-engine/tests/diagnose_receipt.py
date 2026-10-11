"""
Diagnostic script for reciept.jpeg
Step 0 of document-processing-fix
"""
import os
import sys
import json
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)  # apps/ai-engine
sys.path.insert(0, ROOT)

from dotenv import load_dotenv
load_dotenv(os.path.join(ROOT, ".env"))

FIXTURE_PATH = os.path.join(HERE, "fixtures", "reciept.jpeg")

def main():
    print("=" * 70)
    print("DIAGNOSE RECEIPT: Step 0")
    print(f"Fixture: {FIXTURE_PATH}")
    print(f"Exists: {os.path.isfile(FIXTURE_PATH)}")
    print("=" * 70)

    if not os.path.isfile(FIXTURE_PATH):
        print(f"ERROR: Fixture not found at {FIXTURE_PATH}")
        sys.exit(1)

    from app.documents.ocr_adapter import OCRAdapter
    from app.documents.preprocessor import preprocess_image_for_ocr
    from app.documents.extractor import (
        extract_amount_regex,
        extract_date_regex,
        extract_merchant_regex,
        extract_payment_mode_regex,
        extract_financial_data_groq,
        extract_financial_data,
    )
    from app.documents.receipt_parser import parse_line_items
    from app.documents.pipeline import process_document

    adapter = OCRAdapter()
    print(f"OCR Engines: WinOCR={adapter._winocr_available}, Tesseract={adapter._pytesseract_available}")

    # 1. OCR comparison on raw, enhanced, thresholded
    raw_img = Image.open(FIXTURE_PATH)
    raw_text = adapter.extract_text_from_pil(raw_img)

    enhanced_img, thresh_img = preprocess_image_for_ocr(FIXTURE_PATH)
    enhanced_text = adapter.extract_text_from_pil(enhanced_img) if enhanced_img else ""
    thresh_text = adapter.extract_text_from_pil(thresh_img) if thresh_img else ""

    print("\n--- 1. OCR Variants ---")
    print(f"Raw Image OCR:        {len(raw_text)} chars")
    print(f"Enhanced Image OCR:   {len(enhanced_text)} chars")
    print(f"Thresholded Image OCR:{len(thresh_text)} chars")

    print("\n[RAW OCR TEXT]:\n" + raw_text)
    print("\n" + "-" * 50)
    print("\n[ENHANCED OCR TEXT]:\n" + enhanced_text)
    print("\n" + "-" * 50)
    print("\n[THRESHOLDED OCR TEXT]:\n" + thresh_text)

    # Determine best OCR text
    texts = [("raw", raw_text), ("enhanced", enhanced_text), ("thresh", thresh_text)]
    best_variant, best_text = max(texts, key=lambda t: len(t[1]))
    print(f"\nBest variant by length: '{best_variant}' ({len(best_text)} chars)")

    # Also check what adapter.extract_text(FIXTURE_PATH) currently selects
    actual_pipeline_text = adapter.extract_text(FIXTURE_PATH)
    print(f"actual OCRAdapter.extract_text() length: {len(actual_pipeline_text)} chars")

    # 2. Regex extractors on actual_pipeline_text and best_text
    print("\n--- 2. Deterministic Regex Extraction ---")
    for label, txt in [("Pipeline Text", actual_pipeline_text), ("Raw Text", raw_text)]:
        print(f"\nTesting regex on [{label}]:")
        amt = extract_amount_regex(txt)
        dt = extract_date_regex(txt)
        merch = extract_merchant_regex(txt)
        pm, pd = extract_payment_mode_regex(txt)
        print(f"  amount:       {amt}")
        print(f"  date:         {dt}")
        print(f"  merchant:     {merch}")
        print(f"  payment_mode: {pm}, details={pd}")

    # 3. Groq Extraction test
    print("\n--- 3. Groq LLM Structured Extraction ---")
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("Skipped: no GROQ_API_KEY in environment")
        groq_res = None
    else:
        try:
            groq_res = extract_financial_data_groq(actual_pipeline_text)
            print("Groq Result:\n", json.dumps(groq_res, indent=2))
        except Exception as e:
            print(f"Groq Extraction Failed: {e}")
            groq_res = None

    # Overall extract_financial_data
    overall_extraction = extract_financial_data(actual_pipeline_text)
    print("\nOverall extract_financial_data() result:\n", json.dumps(overall_extraction, indent=2))

    # 4. Line items
    print("\n--- 4. Line Items Parser ---")
    items = parse_line_items(actual_pipeline_text)
    print(f"Parsed {len(items)} items:")
    item_sum = 0.0
    for it in items:
        tot = it.get("line_total", 0.0)
        item_sum += tot
        print(f"  - {it.get('item_name') or it.get('name')}: qty={it.get('quantity')}, unit={it.get('unit_price')}, total={tot}")
    print(f"Sum of line item totals: {item_sum:.2f}")

    # 5. Full Pipeline process_document
    print("\n--- 5. Full Pipeline process_document() ---")
    pipeline_res = process_document(FIXTURE_PATH, "receipt")
    print(json.dumps(pipeline_res, indent=2, default=str))

    # 6. Worker decision simulation.
    print("\n--- 6. document.worker.ts Decision Simulation ---")
    confidence = pipeline_res.get("confidence", 0.0)
    txs = pipeline_res.get("transactions", [])
    first_tx = txs[0] if txs else {}
    amt = first_tx.get("amount")
    has_valid_amount = amt is not None and amt > 0
    has_valid_date = bool(first_tx.get("date"))
    is_confident = (confidence >= 0.85) and has_valid_amount and has_valid_date
    status = "COMPLETED" if is_confident else "NEEDS_REVIEW"
    print(f"Confidence: {confidence}")
    print(f"hasValidAmount: {has_valid_amount} ({amt})")
    print(f"hasValidDate: {has_valid_date} ({first_tx.get('date')})")
    print(f"isConfident (>= 0.85): {is_confident}")
    print(f"Worker would set status to: {status}")
    print(f"Worker would auto-create ledger transaction: {is_confident}")

if __name__ == "__main__":
    main()
