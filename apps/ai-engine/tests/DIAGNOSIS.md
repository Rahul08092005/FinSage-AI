# Receipt Diagnosis (Step 0)

## Overview
- **Fixture tested**: `apps/ai-engine/tests/fixtures/reciept.jpeg`
- **Receipt Ground Truth**:
  - Merchant: Bean & Bite
  - Address: 12, Park Street Bengaluru, Karnataka - 560001
  - Date: 10 Sep 2025 (`2025-09-10`)
  - Subtotal: 1,124.00
  - CGST: 28.10 (2.5%), SGST: 28.10 (2.5%)
  - Total: 1,180.20
  - Items: 5 items (Margherita Pizza, Iced Latte (Regular), Classic Burger, French Fries, Chocolate Brownie)
  - Payment: UPI, radhika@okicici

## Key Findings

### 1. OCR Engine & Preprocessing Comparison
- **WinOCR availability**: True (`winocr` is installed and running).
- **Tesseract availability**: True (`pytesseract` is installed).
- **Raw Image OCR**: 568 chars.
- **Enhanced Image OCR**: 540 chars.
- **Thresholded Image OCR**: 553 chars.
- **Finding**: Raw image produced higher character count than Otsu/CLAHE preprocessed versions.
- **WinOCR Line Flattening Issue**: `winocr.recognize_pil_sync` returns a dictionary with both `lines` (structured line objects containing bounding rectangles) and `text` (a single string where lines are joined by spaces without newlines). `ocr_adapter.py` simply took `res.get("text")`, flattening the entire receipt into one single unbroken line. When words are clustered spatially by vertical coordinate, the layout is clean with all columns aligned.

### 2. Extraction Path Executed
- **Groq LLM**: `extract_financial_data_groq` attempted to query `model=os.getenv("GROQ_MODEL", "groq/compound-mini")`.
- Groq returned **HTTP 404 Model Not Found** (`The model groq/compound-mini does not exist or you do not have access to it`).
- Consequently, the system **always fell back to the deterministic regex extractor** (`extract_financial_data_deterministic`).

### 3. Exact Mechanism Behind Amount = 2.5
- In `extractor.py`, `_TOTAL_AMOUNT_REGEX` is:
  `r"(?:grand\s*total|net\s*total|total\s*amount|amount\s*payable|amount\s*paid|bill\s*total|final\s*amount|total|balance)[^\d\n\r]{0,15}(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)"`
- Because `total` lacked word boundaries `\b`, it matched the substring `total` inside `Subtotal`:
  `... Subtotal CGST (2.5%) SGST (2.5%) Total ...`
- `Subtotal` followed by `CGST (` matched `[^\d\n\r]{0,15}` and captured `2.5`!
- The code then did `for m in reversed(matches): ... return amt`, selecting the last match `2.5` (the CGST/SGST tax percentage).
- Numbers followed by `%` were never rejected.
- The actual total `₹1,180.20` was read by WinOCR as `u, 180.20` / `u,180.20` due to a Rupee sign misread, and was not recognized by regex.

### 4. Database Verification: Was a ₹2.50 Transaction Auto-Created?
- **YES.** Database inspection revealed an auto-created ledger transaction:
  - `id`: `107e546d-a3b0-4cd9-89b3-4df3e60d29de`
  - `amount`: `2.5`
  - `category`: `Food`
  - `transactionDate`: `2025-09-09T18:30:00.000Z`
  - `source`: `ocr`
- Document status was set to `COMPLETED` with confidence `1.0` because `confidence >= 0.85`, `amount > 0` and date existed, bypassing all human review.

### 5. Date Shift (Off by One Day: 09-09-2025 instead of 10-09-2025)
- Date extracted was `2025-09-10`.
- In `normalization.py`, `normalize_transaction` converted `2025-09-10` to `datetime(2025, 9, 10, 0, 0, 0)`, which serialised as `2025-09-10 00:00:00` or `2025-09-10T00:00:00`.
- In browser/Node running in IST (UTC+5:30), `new Date("2025-09-10T00:00:00").toISOString()` converts to UTC, shifting back 5.5 hours to `2025-09-09T18:30:00Z`.
- Slicing `0..10` yields `2025-09-09`.

### 6. Merchant / Description Leaking Address
- `extract_merchant_regex` took the first non-empty line without stopping at address markers (`12, Park Street`, `Bengaluru, Karnataka - 560001`).
- Because WinOCR had flattened lines into a single line, the entire header and address were lumped into the description.

### 7. Line Item Parser Failures
- `parse_line_items` parsed **0 items**.
- Root causes:
  1. The regex pattern excluded parentheses `(` `)`, dropping `Iced Latte (Regular)`.
  2. Numbers with thousand separators like `1,124.00` were not matched by `\d+(?:\.\d+)?`.
  3. Single-line flattened text prevented line-by-line parsing.
