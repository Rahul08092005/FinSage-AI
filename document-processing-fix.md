# Task: Test and Fix Receipt / Document Processing (OCR -> Extraction -> Review Voucher)

## Summary

Uploading the receipt `reciept.jpeg` (Bean & Bite, Bengaluru) produces wrong data in the **Review Extracted Transactions** voucher, and the UI still shows **100% CONFIDENCE**.

Test image: place it at `apps/ai-engine/tests/fixtures/reciept.jpeg` (copy of the uploaded file).

### Ground truth (read from the receipt image)

| Field | Correct value |
|---|---|
| Merchant | `Bean & Bite` (logo is stylised, so `Bean Bite` / `Bean and Bite` is acceptable) |
| Address (NOT part of merchant/description) | 12, Park Street, Bengaluru, Karnataka - 560001 |
| Bill No | BB25498 |
| Date | **10 Sep 2025** -> `2025-09-10` |
| Time | 01:26 PM |
| Items | Margherita Pizza 1x299.00 = 299.00; Iced Latte (Regular) 2x149.00 = 298.00; Classic Burger 1x249.00 = 249.00; French Fries 1x149.00 = 149.00; Chocolate Brownie 1x129.00 = 129.00 |
| Subtotal | 1,124.00 |
| CGST (2.5%) / SGST (2.5%) | 28.10 / 28.10 |
| **Total / Amount Paid** | **1,180.20** (check: 1,124.00 + 28.10 + 28.10 = 1,180.20) |
| Payment mode / details | UPI / `radhika@okicici` |
| Category | Food (dine-in restaurant/cafe) |

### What the UI actually showed (screenshot)

| Field | Shown | Expected | Verdict |
|---|---|---|---|
| Date | `09-09-2025` | `10-09-2025` | WRONG (off by one day) |
| Description | `Bean Bite 12 Park Street Bengaluru Karna…` | `Bean & Bite` | WRONG (address merged in, `&` lost) |
| Amount | `2.5` (Total shows ₹2.50) | `1180.20` | WRONG (this equals the GST rate `2.5%`) |
| Category | Food | Food | OK |
| Confidence | 100% | should be low / flagged for review | WRONG |

---

## STRICT RULES (read first)

1. **Fix only the document-processing path.** Do not refactor, restyle, rename, or touch unrelated features (Quick Add, SMS parsing, dashboard, budgets, goals, advisor agents, charts, auth).
2. **Do not change the response contract** of `POST /internal/documents/process`: `{ transactions: [...], confidence: float, ocr_text: str, error: str|None }`. The BFF worker depends on this exact shape. Adding optional fields to a transaction row is fine; removing or renaming fields is not.
3. Do not change the Prisma schema or migrations.
4. Keep OCR engine support as is (WinOCR primary, Tesseract fallback). Do not add new paid services or heavy dependencies. Small pure-Python helpers are fine.
5. **Diagnose first (Step 0), fix second.** Do not guess; show evidence from the real receipt for every fix.
6. Add tests only as **new files**. Keep each fix minimal and list every file touched.
7. Follow the existing code style and naming. If something is ambiguous, choose the option that changes the least existing behaviour.

---

## Code analysis (verified by reading the repo)

Pipeline: `OCRAdapter.extract_text` (`documents/ocr_adapter.py`) -> `extract_financial_data` (`documents/extractor.py`, Groq JSON first, regex fallback) -> `parse_line_items` (`documents/receipt_parser.py`) -> `score_extraction` (`documents/confidence.py`) -> `process_document` (`documents/pipeline.py`) -> BFF `document.worker.ts` -> web `DocumentReviewModal.tsx`.

### Bug A: Date shifts back one day (CONFIRMED by code reading, high certainty)

- `normalize_transaction` (`analytics/normalization.py`) turns the date into a `datetime`, which FastAPI serialises as a **timezone-less** string like `2025-09-10T00:00:00`.
- `DocumentReviewModal.tsx` (initial rows, around line 62) does `new Date(r.date).toISOString().slice(0, 10)`.
- JavaScript parses a timezone-less datetime string as **local time**, then `toISOString()` converts to **UTC**. In India (UTC+5:30), `2025-09-10T00:00:00` becomes `2025-09-09T18:30:00Z`, so the form shows `09-09-2025`. Exactly the screenshot.
- Same class of bug in `bff-server/src/workers/document.worker.ts`: `new Date(firstTx.date)` for the auto-created transaction is parsed in the server's timezone.

### Bug B: Amount = 2.5 (the wrong number is the GST rate; exact mechanism UNVERIFIED, must be confirmed in Step 0)

Suspects in `extractor.py`:
- `_TOTAL_AMOUNT_REGEX` has no word boundary, so `total` also matches inside `Subtotal`, and the `\s*` before the number can span a **newline**, so a label at the end of one OCR line can pick up a number from the next line.
- Numbers followed by `%` (like `2.5%` in `CGST (2.5%)`) are never rejected.
- There is **no arithmetic validation** (subtotal + taxes = total) and no cross-check against the line-item sum, even though the Groq prompt asks the LLM to do that.
- If WinOCR emits the `Total` label and its value in separate lines/columns, the regex can pair the wrong ones.
- If the Rupee sign is misread (`₹1,180.20` -> `Z1,180.20`, `21,180.20`, `?1,180.20`), the regex path has no correction logic (only the Groq prompt mentions it).
- It is also possible that Groq itself returned 2.5. Check whether the Groq path or the regex path produced the result.

### Bug C: Description contains the address (likely)

- `extract_merchant_regex` returns the first cleaned line among the first 6 lines. If OCR returns the logo + address on one line, or Groq returns a long description, the address ends up in `description`. Commas are stripped by the regex (`[^\w\s&'-]`), which matches the screenshot text `Bean Bite 12 Park Street Bengaluru Karna…`.
- `&` is missing, probably an OCR result on the handwritten-style logo. Do not invent it; just don't let the rest of the line leak in.
- The modal uses `r.description ?? r.merchant`, so any long description wins over the clean merchant.

### Bug D: Confidence is meaningless (CONFIRMED)

- Deterministic path: `0.5 + 0.25 (amount > 0) + 0.15 (date) + 0.10 (merchant)` = **1.0** whenever fields are merely *present*, even if the amount is wrong. `score_extraction` then keeps it high.
- In `document.worker.ts`, `isConfident = confidence >= 0.85 && hasValidAmount && hasValidDate` sets status `COMPLETED` and **auto-creates a ledger transaction** with no human review. With this receipt, a wrong ₹2.50 may have been auto-posted. Verify in the DB/logs.
- Confidence must reflect **consistency**, e.g. does the amount reconcile with subtotal + taxes or with the line-item sum.

### Bug E: Line item parser misses/garbles items (CONFIRMED by regex inspection)

In `receipt_parser.py`:
- The item-name character class `[A-Za-z0-9\s\-\.\'\&\/]` excludes `(` `)`, so `Iced Latte (Regular)   2   149.00   298.00` is **not parsed**.
- Number patterns use `\d+(?:\.\d+)?` and do not support thousands separators (`1,124.00`).
- Expected 5 items, current code probably returns 4. Confirm in Step 0.

### Other issues (lower priority)

- `OCRAdapter.extract_text` returns the string `"[OCR error: ...]"` on exception, and `parse_receipt` treats it as real OCR text. Error strings must not flow into extraction.
- `extract_text` with no image returns a fake mock receipt string (`Total INR 450.00`). Make sure that can never be reached from the upload path.
- Preprocessing applies global Otsu thresholding / CLAHE, which can hurt a crumpled, shadowed photo. Do not change blindly; **measure** in Step 0 whether raw vs enhanced vs thresholded gives the best text, then decide.
- Category taxonomies are inconsistent: extractor allows `Food, Transport, Shopping, Bills, Entertainment, Healthcare, Other`; the review modal's `CATEGORIES` list has no `Healthcare` (a Healthcare result silently becomes `Other`); the rest of the app uses `Food & Dining, Groceries, ...`. Report this in Step 0. Fix only what is needed to avoid silent data loss in the review modal; do **not** redesign taxonomies.

---

## Step 0: Diagnostics (do this before changing any code)

Create a new script `apps/ai-engine/tests/diagnose_receipt.py` (not part of the app) that runs the fixture receipt and prints each stage clearly:

1. Raw OCR text for each of: raw image, enhanced image, thresholded image (call `OCRAdapter.extract_text_from_pil` on each). Print the engine used and character count.
2. Output of `extract_amount_regex`, `extract_date_regex`, `extract_merchant_regex`, `extract_payment_mode_regex` on the best OCR text.
3. Output of `extract_financial_data_groq` (or "skipped: no GROQ_API_KEY / failed") so we know **which path produced the final result**.
4. Output of `parse_line_items` and the sum of `line_total`.
5. Full output of `process_document(path, "receipt")` including `confidence`.
6. What `document.worker.ts` would decide (`COMPLETED` vs `NEEDS_REVIEW`, auto-create or not).

Save the findings in `apps/ai-engine/tests/DIAGNOSIS.md` (short): which OCR variant is best, which extraction path ran, the exact mechanism behind amount `2.5`, and whether a ₹2.50 transaction was auto-created. **Update the "UNVERIFIED" items above with the real cause before fixing.**

---

## Fix plan

### P0: Correctness

**1. Date handling (frontend + worker).**
- In `DocumentReviewModal.tsx`, if the value matches `^\d{4}-\d{2}-\d{2}`, use the first 10 characters directly. No `new Date(...).toISOString()` round trip. For other formats, build the string from **local** date components, not UTC.
- In `document.worker.ts`, parse date-only values consistently with how the app stores manually entered transactions (check `transactions.controller.ts` for the convention and match it). Add a comment explaining why.
- In the AI engine, for OCR rows emit the date as a plain `YYYY-MM-DD` string. Only change this for `source="ocr"`; do not change CSV/SMS/other flows.

**2. Amount extraction with reconciliation (`extractor.py`).**
- Collect **candidate totals** from labelled lines: `Total`, `Grand Total`, `Net Payable`, `Amount Paid`, `Amount Payable`, `Bill Total`. Use word boundaries so `Subtotal` is not treated as `Total`. Do not let a label pair with a number on a different line unless the OCR layout clearly demands it (keep it to the same line first).
- Reject any number immediately followed by `%`, and numbers on tax-rate lines like `(2.5%)`.
- Parse Indian/standard thousands separators (`1,180.20`, `1,00,000.00`).
- **Reconcile:** if `Subtotal` and taxes (`CGST/SGST/IGST/GST/Service charge`) are found, expected = subtotal + taxes - discount. Prefer the candidate that matches expected within ±0.50. Also compare with the sum of parsed line items (+ taxes).
- **OCR Rupee misread:** if a candidate looks like `Z1,180.20` / `21,180.20` / `?1,180.20` / `Q1,180.20` and stripping the first character makes it reconcile with the expected total, use the corrected value.
- If nothing reconciles, still return the best-labelled candidate but mark the row as low confidence (see P1).
- If Groq returns an amount, validate it against the same reconciliation. If Groq's amount fails and the regex amount reconciles, prefer the regex amount.

**3. Merchant / description cleanup.**
- Merchant = the first line(s) that look like a business name, **stopping** at the first line containing address/contact markers (digits followed by a street word, `Street|St|Road|Rd|Nagar|Cross|Main`, pincode `\d{6}`, `Ph|Tel|Phone|GSTIN|CIN`, commas followed by city/state names, `+91`).
- If OCR merged name and address into one line, cut at the first address marker.
- `description` should be the merchant name (or merchant + short item summary). Never include the address. The worker already appends payment mode.
- Keep `&` if OCR produced it. Do not fabricate it.

**4. Line item parser (`receipt_parser.py`).**
- Allow parentheses in item names (`Iced Latte (Regular)`).
- Allow thousands separators in numbers.
- Do not parse tax/summary lines (`CGST (2.5%) 28.10`, `Subtotal 1,124.00`, `Total`) as items. Treat `subtotal` and any line containing `%` as skip lines.
- Expected result for the fixture: exactly the 5 items in the ground truth, with correct qty/unit/total.

### P1: Honest confidence and safe auto-posting

**5. Confidence must reflect consistency (`confidence.py` / extractor).**
- Keep the score in 0.0 to 1.0. Raise it only if the amount reconciles (with subtotal+taxes or line items). Cap at about 0.6 if the amount could not be verified, the date is missing, or the merchant looks like an address. Do not let "fields present" alone reach 0.85+.
- The score for the fixture receipt after the fixes should be >= 0.85; for the pre-fix wrong output (amount 2.5 not reconciling with 1,124 subtotal) it should be < 0.85.

**6. Worker auto-post guard (`document.worker.ts`).**
- Keep the current threshold behaviour, but additionally route to `NEEDS_REVIEW` when the amount is not reconciled (use a new optional field such as `amount_verified: false` on the row, or the lowered confidence from step 5). Do not break existing flows when the field is absent (treat absent as "unknown", no extra blocking).

### P2: Robustness (only if Step 0 evidence supports it)

7. If the best OCR text comes from the raw image rather than the enhanced/thresholded one on this receipt, run the OCR variants and choose the best by a simple quality score (e.g. number of recognised keywords like `total`, `date`, amount-looking tokens, minus junk-character ratio). Do not remove existing variants.
8. Make `OCRAdapter.extract_text` return an empty string / raise on OCR errors instead of returning `"[OCR error: ...]"`, and make `parse_receipt` handle it as "unreadable". Make sure the mock text path is unreachable from the upload endpoint.
9. Review-modal `CATEGORIES`: add `Healthcare` so valid extractor categories are not silently turned into `Other`. Nothing else about categories changes.

---

## Tests to add (new files only)

Create `apps/ai-engine/tests/test_document_receipt.py` (pytest). Tests must run **offline** (no Groq key, no WinOCR) by feeding OCR **text** fixtures into the extractor/parsers. One extra test may run the real image and is skipped if no OCR engine is available (`OCRAdapter().health_check()` is False).

OCR text fixtures to include (put them as constants in the test file):

1. **Clean OCR** of the receipt (all lines in order, `₹` read correctly).
2. **Rupee misread:** `Total Z1,180.20` and `Amount Paid : ?1,180.20`.
3. **Merged header:** `Bean Bite 12, Park Street Bengaluru, Karnataka - 560001` as a single first line.
4. **Column-split OCR:** labels (`Subtotal`, `CGST (2.5%)`, `SGST (2.5%)`, `Total`) on separate lines from their values (`1,124.00`, `28.10`, `28.10`, `₹1,180.20`).
5. **Tax-rate decoy:** a text where `2.5` appears right after a label, to make sure `%` numbers are never chosen.

Assertions for the receipt fixtures (clean, misread, merged header, column-split):
- `amount == 1180.20` (never `2.5`, never `1124.0`, never `21180.20`)
- `date == "2025-09-10"`
- merchant/description matches `^Bean\s*(&|and)?\s*Bite$` (case-insensitive) and does **not** contain `Street`, `Bengaluru`, `Karnataka`, or `560001`
- `payment_mode == "UPI"` and `payment_details == "radhika@okicici"`
- `category == "Food"`
- `parse_line_items` returns exactly 5 items, including `Iced Latte (Regular)` with qty 2, unit 149.00, total 298.00; sum of totals = 1124.00; no tax/total rows
- confidence >= 0.85 for the correct output, and a unit test showing `score_extraction` returns < 0.85 for `{amount: 2.5, subtotal 1124.00 context}`

Extra tests:
- Date pipeline: `process_document` output for the fixture contains `date == "2025-09-10"` as a plain string (no `T00:00:00`) for OCR rows.
- Frontend date helper (if a pure helper function is extracted, or a small unit test with Jest/Vitest only if the project already has that setup; otherwise document a manual check): `"2025-09-10T00:00:00"` and `"2025-09-10"` both display as `10-09-2025` when the machine timezone is `Asia/Kolkata`.
- Regression guards: a simple receipt like `Total 450.00` and an existing-format receipt still produce the same values as before.
- Run the existing test files and confirm nothing regresses: `pytest tests -q`.

Optional: `process_document` end-to-end test with the real image, asserting the same fields, skipped if OCR is unavailable.

---

## Acceptance criteria

1. For `reciept.jpeg` the review voucher shows: date `10-09-2025`, description `Bean & Bite` (or `Bean Bite`), category `Food`, amount `1180.20`, total voucher debit `₹1,180.20`.
2. Confidence is high only because the amount reconciled (1,124.00 + 28.10 + 28.10). A wrong amount never shows as 100%.
3. A non-reconciled amount sends the document to `NEEDS_REVIEW` instead of auto-creating a ledger transaction.
4. Date stays correct when the user's browser/server timezone is Asia/Kolkata and also when it is UTC or America/Los_Angeles.
5. All new tests pass offline; existing tests have no new failures.
6. The diff touches only: `documents/extractor.py`, `documents/receipt_parser.py`, `documents/confidence.py`, `documents/ocr_adapter.py` / `pipeline.py` (only if needed), `analytics/normalization.py` (OCR date only, only if needed), `DocumentReviewModal.tsx`, `document.worker.ts`, plus new test/diagnostic files.
7. `/internal/documents/process` response shape is unchanged (new fields are optional additions only).

---

## Out of scope

- No changes to the Quick Add form, SMS parsing, category keyword features, dashboard, budgets, goals, advisor/agents.
- No new OCR vendors, no cloud OCR, no model/provider changes.
- No taxonomy redesign, no database schema changes.
- No UI redesign of the review voucher (only data correctness fixes).
- Do not hardcode values for this specific receipt; fixes must be general.

---

## Deliverables

1. `apps/ai-engine/tests/diagnose_receipt.py` and `apps/ai-engine/tests/DIAGNOSIS.md` (evidence per stage, root cause of the `2.5` amount, whether a bad transaction was auto-posted).
2. Minimal diffs for the fixes above, grouped by bug (A to E).
3. `apps/ai-engine/tests/test_document_receipt.py` with the cases above.
4. A short summary: what was wrong, what changed, which files were touched, test results (before vs after).
