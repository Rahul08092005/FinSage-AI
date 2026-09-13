"""OCR Adapter for document and receipt text extraction.

Provides multi-engine OCR extraction with:
  1. Windows Native Media OCR (winocr) - high accuracy, fast, local
  2. Tesseract OCR (pytesseract) - fallback if installed
  3. Preprocessed image feed (contrast enhancement, binarization)
"""
import logging
import os
from typing import Optional
from PIL import Image

from app.adapters.base_adapter import BaseIntegrationAdapter
from app.documents.preprocessor import preprocess_image_for_ocr

logger = logging.getLogger("finsage.ocr.adapter")


class OCRAdapter(BaseIntegrationAdapter):
    """Wraps Windows Native Media OCR and Tesseract locally."""

    def __init__(self):
        self._winocr_available = False
        try:
            import winocr
            self._winocr_available = True
        except ImportError:
            self._winocr_available = False

        self._pytesseract_available = False
        try:
            import pytesseract
            self._pytesseract_available = True
        except ImportError:
            self._pytesseract_available = False

    def fetch_data(self, user_id: str, params: dict) -> dict:
        image_path = params.get("image_path")
        return {"raw_text": self.extract_text(image_path)}

    def extract_text_from_pil(self, img: Image.Image) -> str:
        """Run OCR directly on a PIL Image object."""
        # 1. Try Windows native OCR first
        if self._winocr_available:
            try:
                import concurrent.futures
                import winocr

                # Run in worker thread to prevent conflict with running asyncio event loops in FastAPI
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    res = executor.submit(winocr.recognize_pil_sync, img).result(timeout=15)
                text = (res.get("text") or "").strip()
                if text:
                    logger.info(f"[OCR] WinOCR extracted {len(text)} chars")
                    return text
            except Exception as exc:
                logger.warning(f"[OCR] WinOCR failed: {exc}")

        # 2. Try pytesseract as fallback
        if self._pytesseract_available:
            try:
                import pytesseract
                text = pytesseract.image_to_string(img).strip()
                if text:
                    logger.info(f"[OCR] Tesseract extracted {len(text)} chars")
                    return text
            except Exception as exc:
                logger.debug(f"[OCR] Pytesseract failed: {exc}")

        return ""

    def extract_text(self, image_path: Optional[str]) -> str:
        """Extract text from an image path with automatic preprocessing."""
        if not image_path:
            return "[mock OCR output — no image supplied] Sample receipt: Total INR 450.00"

        if not os.path.isfile(image_path):
            logger.error(f"[OCR] File does not exist: {image_path}")
            return ""

        logger.info(f"[OCR] Processing file: {image_path}")

        try:
            enhanced_img, thresh_img = preprocess_image_for_ocr(image_path)

            # Try OCR on enhanced image first
            text = self.extract_text_from_pil(enhanced_img)

            # If enhanced image yielded very sparse text, try thresholded image
            if len(text.strip()) < 15 and thresh_img is not None:
                logger.info("[OCR] Low character count from enhanced image, trying thresholded image...")
                thresh_text = self.extract_text_from_pil(thresh_img)
                if len(thresh_text.strip()) > len(text.strip()):
                    text = thresh_text

            if text.strip():
                return text.strip()

            logger.warning(f"[OCR] No text recognized from image: {image_path}")
            return ""
        except Exception as exc:
            logger.error(f"[OCR] Error during extraction: {exc}", exc_info=True)
            return f"[OCR error: {exc}]"

    def normalize_data(self, raw_data: dict) -> dict:
        return {"normalized_text": raw_data.get("raw_text", "").strip()}

    def health_check(self) -> bool:
        """Returns True if any valid OCR engine is available."""
        return self._winocr_available or self._pytesseract_available
