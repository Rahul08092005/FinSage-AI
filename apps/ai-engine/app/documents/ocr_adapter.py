from app.adapters.base_adapter import BaseIntegrationAdapter


class OCRAdapter(BaseIntegrationAdapter):
    """Wraps Tesseract locally. Swappable for Google Vision / AWS Textract
    in Phase 5 without touching any calling code."""

    def fetch_data(self, user_id: str, params: dict) -> dict:
        image_path = params.get("image_path")
        return {"raw_text": self.extract_text(image_path)}

    def extract_text(self, image_path: str | None) -> str:
        if not image_path:
            return "[mock OCR output — no image supplied] Sample receipt: Total INR 450.00"
        try:
            import pytesseract
            from PIL import Image

            return pytesseract.image_to_string(Image.open(image_path))
        except Exception as exc:  # tesseract not installed on this machine, etc.
            return f"[OCR fallback — tesseract unavailable: {exc}]"

    def normalize_data(self, raw_data: dict) -> dict:
        # Phase 3: parse merchant/amount/date out of raw_text with regex.
        return {"normalized_text": raw_data.get("raw_text", "").strip()}

    def health_check(self) -> bool:
        try:
            import pytesseract  # noqa: F401

            return True
        except ImportError:
            return False
