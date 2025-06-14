from .config import settings

def build_cursor_prompt(ocr_text: str) -> str:
    return settings.PROMPT_TEMPLATE.format(image_chunk=ocr_text) 