import json
from typing import Optional
from .models import ShippingExtraction
from .config import settings
import google.generativeai as genai

genai.configure(api_key=settings.GOOGLE_API_KEY)

def call_ai(prompt: str, image_bytes: bytes) -> dict:
    img_part = {
        'mime_type': 'image/jpeg',
        'data': image_bytes
    }

    model_instance = genai.GenerativeModel(settings.GEMINI_MODEL)
    resp = model_instance.generate_content([prompt, img_part])

    if not (hasattr(resp, 'text') and resp.text):
        raise RuntimeError(f"AI response did not contain text. Full response: {resp}")

    try:
        json_start = resp.text.find('{')
        json_end = resp.text.rfind('}')

        if json_start == -1 or json_end == -1 or json_end < json_start:
            raise ValueError("No valid JSON object found in AI response.")

        extracted_json_str = resp.text[json_start : json_end + 1]
        data = json.loads(extracted_json_str)
        return data
    except (json.JSONDecodeError, ValueError) as e:
        raise RuntimeError(f"Failed to parse JSON from AI response: {e}. Raw AI text: {resp.text}")

def extract_structured(data: dict) -> ShippingExtraction:
    return ShippingExtraction.parse_obj(data) 