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


def _score_ocr_quality(text: str) -> int:
    if not text:
        return 0
    score = len(text)
    lower = text.lower()
    for kw in ["total", "subtotal", "date", "bill", "amount", "qty", "rate", "tax", "gst", "upi"]:
        if kw in lower:
            score += 40
    import re
    decimals = len(re.findall(r"\b\d+\.\d{2}\b", text))
    score += decimals * 25
    return score


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

                # Ensure image is in RGBA mode for Windows OCR
                target_img = img.convert("RGBA") if img.mode != "RGBA" else img

                # Run in worker thread to prevent conflict with running asyncio event loops in FastAPI
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    res = executor.submit(winocr.recognize_pil_sync, target_img).result(timeout=15)

                words = []
                for line in res.get("lines", []):
                    for w in line.get("words", []):
                        if w.get("text") and w.get("bounding_rect"):
                            words.append(w)

                if words:
                    words.sort(key=lambda w: (w["bounding_rect"]["y"], w["bounding_rect"]["x"]))
                    clustered_lines = []
                    for w in words:
                        wy = w["bounding_rect"]["y"]
                        wh = w["bounding_rect"]["height"]
                        placed = False
                        for cl in clustered_lines:
                            if abs(wy - cl["y"]) < max(wh, cl["h"]) * 0.5:
                                cl["words"].append(w)
                                cl["y"] = (cl["y"] * (len(cl["words"]) - 1) + wy) / len(cl["words"])
                                placed = True
                                break
                        if not placed:
                            clustered_lines.append({"y": wy, "h": wh, "words": [w]})

                    clustered_lines.sort(key=lambda cl: cl["y"])
                    lines_text = []
                    for cl in clustered_lines:
                        cl["words"].sort(key=lambda w: w["bounding_rect"]["x"])
                        lines_text.append(" ".join(w["text"] for w in cl["words"]))
                    text = "\n".join(lines_text).strip()
                elif "lines" in res and res["lines"]:
                    text = "\n".join(l["text"] for l in res["lines"] if l.get("text")).strip()
                else:
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
            return ""

        if not os.path.isfile(image_path):
            logger.error(f"[OCR] File does not exist: {image_path}")
            return ""

        logger.info(f"[OCR] Processing file: {image_path}")

        try:
            candidates = []

            # 1. Raw image
            try:
                raw_img = Image.open(image_path)
                raw_text = self.extract_text_from_pil(raw_img)
                if raw_text:
                    candidates.append((raw_text, _score_ocr_quality(raw_text)))
            except Exception as err:
                logger.debug(f"[OCR] Raw image extraction failed: {err}")

            # 2. Preprocessed variants
            try:
                enhanced_img, thresh_img = preprocess_image_for_ocr(image_path)
                if enhanced_img:
                    enhanced_text = self.extract_text_from_pil(enhanced_img)
                    if enhanced_text:
                        candidates.append((enhanced_text, _score_ocr_quality(enhanced_text)))

                if thresh_img:
                    thresh_text = self.extract_text_from_pil(thresh_img)
                    if thresh_text:
                        candidates.append((thresh_text, _score_ocr_quality(thresh_text)))
            except Exception as err:
                logger.debug(f"[OCR] Preprocessed extraction failed: {err}")

            if candidates:
                best_text = max(candidates, key=lambda c: c[1])[0]
                return best_text.strip()

            logger.warning(f"[OCR] No text recognized from image: {image_path}")
            return ""
        except Exception as exc:
            logger.error(f"[OCR] Error during extraction: {exc}", exc_info=True)
            return ""

    def normalize_data(self, raw_data: dict) -> dict:
        return {"normalized_text": raw_data.get("raw_text", "").strip()}

    def health_check(self) -> bool:
        """Returns True if any valid OCR engine is available."""
        return self._winocr_available or self._pytesseract_available
