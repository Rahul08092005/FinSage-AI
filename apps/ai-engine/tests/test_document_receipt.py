"""Unit and regression tests for receipt / document processing fix.

Tests run offline without network or external OCR dependencies.
Compatible with both pytest and python -m unittest.
"""
import os
import sys
import re
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.documents.extractor import (
    extract_amount_regex,
    extract_amount_with_reconciliation,
    extract_date_regex,
    extract_merchant_regex,
    extract_payment_mode_regex,
    extract_financial_data_deterministic,
)
from app.documents.receipt_parser import parse_line_items
from app.documents.confidence import score_extraction
from app.documents.pipeline import process_document
from app.documents.ocr_adapter import OCRAdapter

# ---------------------------------------------------------------------------
# Offline OCR Text Fixtures
# ---------------------------------------------------------------------------

CLEAN_OCR_FIXTURE = """Bean & Bite
GOOD FOOD BRIGHTER DAYS
12, Park Street
Bengaluru, Karnataka - 560001
Ph: +91 80 4567 8900
Bill No : BB25498
Date : 10 Sep 2025
Time : 01:26 PM
Cashier : Ayesha
Table No : 5
Dine In
Item Qty Rate Amount
Margherita Pizza 1 299.00 299.00
Iced Latte (Regular) 2 149.00 298.00
Classic Burger 1 249.00 249.00
French Fries 1 149.00 149.00
Chocolate Brownie 1 129.00 129.00
Subtotal 1,124.00
CGST (2.5%) 28.10
SGST (2.5%) 28.10
Total ₹1,180.20
Payment Mode : UPI
UPI ID : radhika@okicici
Amount Paid : ₹1,180.20
Good Food Brings
People Together
Thank you for dining with us!
Visit Again
"""

RUPEE_MISREAD_FIXTURE = """Bean & Bite
12, Park Street
Bengaluru, Karnataka - 560001
Bill No : BB25498
Date : 10 Sep 2025
Time : 01:26 PM
Item Qty Rate Amount
Margherita Pizza 1 299.00 299.00
Iced Latte (Regular) 2 149.00 298.00
Classic Burger 1 249.00 249.00
French Fries 1 149.00 149.00
Chocolate Brownie 1 129.00 129.00
Subtotal 1,124.00
CGST (2.5%) 28.10
SGST (2.5%) 28.10
Total Z1,180.20
Payment Mode : UPI
UPI ID : radhika@okicici
Amount Paid : ?1,180.20
"""

MERGED_HEADER_FIXTURE = """Bean Bite 12, Park Street Bengaluru, Karnataka - 560001
Bill No : BB25498
Date : 10 Sep 2025
Margherita Pizza 1 299.00 299.00
Iced Latte (Regular) 2 149.00 298.00
Classic Burger 1 249.00 249.00
French Fries 1 149.00 149.00
Chocolate Brownie 1 129.00 129.00
Subtotal 1,124.00
CGST (2.5%) 28.10
SGST (2.5%) 28.10
Total ₹1,180.20
Payment Mode : UPI
UPI ID : radhika@okicici
Amount Paid : ₹1,180.20
"""

COLUMN_SPLIT_FIXTURE = """Bean & Bite
12, Park Street
Bengaluru, Karnataka - 560001
Date : 10 Sep 2025
Item Qty Rate Amount
Margherita Pizza 1 299.00 299.00
Iced Latte (Regular) 2 149.00 298.00
Classic Burger 1 249.00 249.00
French Fries 1 149.00 149.00
Chocolate Brownie 1 129.00 129.00
Subtotal
CGST (2.5%)
SGST (2.5%)
Total
1,124.00
28.10
28.10
₹1,180.20
Payment Mode : UPI
UPI ID : radhika@okicici
Amount Paid : 1,180.20
"""

TAX_RATE_DECOY_FIXTURE = """Bean & Bite
10 Sep 2025
Subtotal CGST (2.5%)
Total
450.00
"""

REAL_RECEIPT_IMAGE = os.path.join(os.path.dirname(__file__), "fixtures", "reciept.jpeg")


class TestDocumentReceiptProcessing(unittest.TestCase):
    def _assert_fixture_data(self, fixture_text: str):
        data = extract_financial_data_deterministic(fixture_text)

        # 1. Amount: must be exactly 1180.20 (never 2.5, never 1124.0, never 21180.20)
        self.assertEqual(data["amount"], 1180.20, f"Expected 1180.20, got {data['amount']}")
        self.assertTrue(data.get("amount_verified"))

        # 2. Date: ISO format YYYY-MM-DD
        self.assertEqual(data["date"], "2025-09-10")

        # 3. Merchant / Description: matches Bean (&|and)? Bite without address leakage
        merchant = data["merchant"]
        self.assertIsNotNone(merchant)
        self.assertTrue(bool(re.match(r"^Bean\s*(&|and)?\s*Bite$", merchant, re.IGNORECASE)))
        for bad_token in ["Street", "Bengaluru", "Karnataka", "560001"]:
            self.assertNotIn(bad_token, merchant)
            self.assertNotIn(bad_token, data["description"])

        # 4. Payment Mode & Details
        self.assertEqual(data["payment_mode"], "UPI")
        self.assertEqual(data["payment_details"], "radhika@okicici")

        # 5. Category
        self.assertEqual(data["category"], "Food")

        # 6. Confidence: high (>= 0.85) when amount reconciles
        conf = score_extraction(data)
        self.assertGreaterEqual(conf, 0.85)

    def test_clean_ocr_fixture(self):
        self._assert_fixture_data(CLEAN_OCR_FIXTURE)

    def test_rupee_misread_fixture(self):
        self._assert_fixture_data(RUPEE_MISREAD_FIXTURE)

    def test_merged_header_fixture(self):
        self._assert_fixture_data(MERGED_HEADER_FIXTURE)

    def test_column_split_fixture(self):
        self._assert_fixture_data(COLUMN_SPLIT_FIXTURE)

    def test_line_items_parser(self):
        """Assert parse_line_items extracts exactly 5 items and reconciles."""
        items = parse_line_items(CLEAN_OCR_FIXTURE)
        self.assertEqual(len(items), 5, f"Expected 5 line items, got {len(items)}")

        # Check Iced Latte (Regular) handles parentheses and qty 2
        latte = next((it for it in items if "latte" in (it.get("item_name") or it.get("name") or "").lower()), None)
        self.assertIsNotNone(latte)
        self.assertIn("iced latte (regular)", (latte.get("item_name") or latte.get("name")).lower())
        self.assertIn(latte.get("quantity") or latte.get("qty"), (2,))
        self.assertEqual(latte.get("unit_price"), 149.00)
        self.assertEqual(latte.get("line_total") or latte.get("total"), 298.00)

        # Total sum equals 1124.00
        total_sum = sum(it.get("line_total", 0) for it in items)
        self.assertEqual(total_sum, 1124.00)

        # No tax or total summary rows included in line items
        for it in items:
            name_lower = (it.get("item_name") or it.get("name") or "").lower()
            self.assertNotIn("subtotal", name_lower)
            self.assertNotIn("total", name_lower)
            self.assertNotIn("cgst", name_lower)
            self.assertNotIn("sgst", name_lower)

    def test_tax_rate_decoy_rejection(self):
        """Assert percentage rate numbers (e.g. 2.5%) are never chosen as total."""
        amt, _ = extract_amount_with_reconciliation(TAX_RATE_DECOY_FIXTURE)
        self.assertEqual(amt, 450.00, f"Expected 450.00, got {amt}")

    def test_confidence_scoring_unverified_cap(self):
        """Assert score_extraction returns < 0.85 when amount does not reconcile (e.g. 2.5 vs 1124)."""
        bad_data = {
            "amount": 2.50,
            "amount_verified": False,
            "date": "2025-09-10",
            "merchant": "Bean & Bite",
            "category": "Food",
            "description": "Bean & Bite",
        }
        score = score_extraction(bad_data)
        self.assertLess(score, 0.85, f"Unverified amount should have score < 0.85, got {score}")
        self.assertLessEqual(score, 0.60)

    def test_regression_simple_receipt(self):
        """Assert simple receipt without taxes still extracts accurately."""
        simple_text = """Coffee House
Date: 15/08/2025
Cappuccino 150.00
Croissant 120.00
Total: 270.00
"""
        amt, _ = extract_amount_with_reconciliation(simple_text)
        self.assertEqual(amt, 270.00)
        self.assertEqual(extract_date_regex(simple_text), "2025-08-15")
        self.assertEqual(extract_merchant_regex(simple_text), "Coffee House")

    def test_date_plain_string_in_pipeline(self):
        """Assert process_document outputs date as plain YYYY-MM-DD string without timezone."""
        if not os.path.exists(REAL_RECEIPT_IMAGE):
            self.skipTest("Fixture image not found")

        adapter = OCRAdapter()
        if not adapter.health_check():
            self.skipTest("No OCR engine available on this machine")

        result = process_document(REAL_RECEIPT_IMAGE, "receipt")
        self.assertIsNone(result["error"])
        txs = result.get("transactions", [])
        self.assertGreater(len(txs), 0)
        first = txs[0]
        self.assertEqual(first["date"], "2025-09-10")
        self.assertNotIn("T", str(first["date"]))  # Plain date string, no local/UTC timezone shift
        self.assertEqual(first["amount"], 1180.20)
        self.assertTrue(first["amount_verified"])
        self.assertGreaterEqual(result["confidence"], 0.85)


if __name__ == "__main__":
    unittest.main()
