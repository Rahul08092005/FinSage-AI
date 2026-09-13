"""Image preprocessor for document OCR.

Handles:
  - Safe loading for JPG, JPEG, PNG, WEBP
  - EXIF orientation correction
  - Resolution upscaling for low-res receipts
  - Contrast enhancement via CLAHE
  - Denoising via bilateral filtering
  - Binarization / thresholding for optimal OCR text recognition
"""
import logging
from typing import Optional, Tuple
import numpy as np
from PIL import Image, ImageOps

try:
    import cv2
    _OPENCV_AVAILABLE = True
except ImportError:
    _OPENCV_AVAILABLE = False

logger = logging.getLogger("finsage.ocr.preprocessor")


def load_and_orient_image(image_path: str) -> Image.Image:
    """Load image from disk and apply EXIF orientation correction."""
    img = Image.open(image_path)
    # Correct orientation if EXIF metadata specifies rotation
    try:
        img = ImageOps.exif_transpose(img)
    except Exception as exc:
        logger.debug(f"EXIF transpose skipped: {exc}")
    
    # Ensure RGB mode (handles RGBA, Palette, Greyscale, CMYK)
    if img.mode != "RGB":
        img = img.convert("RGB")
    return img


def preprocess_image_for_ocr(image_path: str) -> Tuple[Image.Image, Optional[Image.Image]]:
    """Preprocess image for OCR.
    
    Returns:
        (enhanced_image, thresholded_image)
        Both are PIL Image objects ready for OCR engines.
    """
    base_img = load_and_orient_image(image_path)
    w, h = base_img.size

    # Upscale low-resolution images (receipts with small fonts)
    if min(w, h) < 1000:
        scale_factor = max(1.5, min(2.5, 1600.0 / max(w, h, 1)))
        new_w = int(w * scale_factor)
        new_h = int(h * scale_factor)
        base_img = base_img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    if not _OPENCV_AVAILABLE:
        # Fallback without OpenCV: Pillow auto-contrast
        try:
            enhanced = ImageOps.autocontrast(base_img, cutoff=2)
            return enhanced, None
        except Exception:
            return base_img, None

    # OpenCV preprocessing pipeline
    try:
        np_img = np.array(base_img)
        # Convert RGB to BGR for OpenCV
        bgr = cv2.cvtColor(np_img, cv2.COLOR_RGB2BGR)

        # Grayscale
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

        # Light bilateral denoising (preserves text edges while removing sensor noise)
        denoised = cv2.bilateralFilter(gray, d=7, sigmaColor=50, sigmaSpace=50)

        # Contrast Limited Adaptive Histogram Equalization (CLAHE)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        contrast = clahe.apply(denoised)

        # Otsu thresholding for a clean binarized black-and-white copy
        _, thresh = cv2.threshold(contrast, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        enhanced_pil = Image.fromarray(contrast)
        thresh_pil = Image.fromarray(thresh)

        return enhanced_pil, thresh_pil
    except Exception as exc:
        logger.warning(f"OpenCV preprocessing error ({exc}), returning base image")
        return base_img, None
