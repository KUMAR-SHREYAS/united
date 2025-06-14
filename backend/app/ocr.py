import re
from pytesseract import image_to_string
from PIL import Image
import io
from .config import settings

def clean_text(text: str) -> str:
    for pat in settings.OCR_CLEAN_PATTERNS:
        text = re.sub(pat, "", text, flags=re.IGNORECASE | re.MULTILINE)
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    return "\n".join(lines)

def do_ocr(image_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(image_bytes))
    image_to_string.tesseract_cmd = settings.TESSERACT_PATH
    return clean_text(image_to_string(img)) 