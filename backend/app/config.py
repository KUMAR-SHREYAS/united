from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Pydantic v2 config: load from .env and ignore unknown env vars
    model_config = SettingsConfigDict(env_file=".env", extra='ignore')
    TESSERACT_PATH: str
    GOOGLE_API_KEY: str
    GEMINI_MODEL: str = "gemini-1.5-flash"
    OCR_CLEAN_PATTERNS: list[str] = [
        r'\bLBS\s+\d+\s+OF\s+\d+\b',
        r'\bDWT:\s*\d+(?:,\d+)*\b',
        r'\bSHP#:\s*[A-Z0-9\s]+\b',
        r'\bSHP\s+WT:\s*[0-9.]+\s*KG\b',
        r'\bSHP\s+DWT:\s*\d+\s*KG\b',
        r'\bTRACKING\s*#:\s*[A-Z0-9\s]+\b',
        r'\bDATE:\s*\d+\s*[A-Z]+\s*\d+\b',
        r'\d+\s*KG\s*LOY\s*\d+\b',
        r'\bGBR\s+\d+\s*-\d+\b',
        r'\bIMT\b',
        r'\bUPS\s+STANDARD\b',
        r'\bEN\.\s*\n',
        r'^\s*CONSIGNOR\b.*$',
        r'^\s*SHIP\s+TO:\s*\d*\b.*$',
        r'[\r\n]{2,}',
        r'\s{2,}',
        r'^\s*[\W_]+\s*$',
        r'^-+\s*$',
        r'\|\s*',
    ]
    PROMPT_TEMPLATE: str = """
Analyze the provided image.

First, determine if the image is primarily a shipping label. This should be a boolean value (true/false).
If it is not a shipping label, the `is_shipping_label` field should be `false` and the `message` field should provide a brief explanation (e.g., "Document is not a shipping label").

If it IS a shipping label, extract the **Origin Address**, **Destination Address**, and the **Tracking Number**. The `is_shipping_label` field should be `true`.

For each address (Origin and Destination), extract the following fields:
- `name`: The name of the person or organization.
- `phone_number`: The phone number, including country code if present.
- `street_address`: The building number, street name, apartment/suite number, and any P.O. Box information.
- `city`: The city name.
- `state`: The state or province abbreviation (for US/CANADA) or full name for other countries, if applicable.
- `zipcode`: The postal code or ZIP code.
- `country`: The country name. **This field must NOT be null.**

Important rules for `country` field:
1.  If the country is explicitly mentioned in the text (e.g., "USA", "UNITED KINGDOM", "CANADA"), use that.
2.  If a 5-digit numeric `zipcode` (e.g., "90210") is found, the country is almost certainly "USA".
3.  If an alphanumeric `zipcode` in the format `A1A 1A1` (Letter-Digit-Letter Space Digit-Letter-Digit, e.g., "M6G 1L5") is found, the country is "CANADA".
4.  If an alphanumeric `zipcode` in the format `AA1 1AA`, `A1A 1AA`, `A1 1AA` (e.g., "NW1 6XE") is found, the country is "UNITED KINGDOM".
5.  If a common US state abbreviation (e.g., CA, NY, IL, TX, FL) is detected in the `state` field, and no other country inference is possible, assume the country is "USA".
6.  If none of the above rules apply and the country is still not found, set it to "UNKNOWN".

General rules for extraction and formatting:
1.  Output the extracted information strictly as a JSON object. The object MUST start with `{{` and end with `}}`.
2.  The JSON object MUST contain the top-level keys: `"document_type"`, `"is_shipping_label"`, `"message"`, `"origin_address"`, `"destination_address"`, and `"tracking_number"`.
3.  Set `"document_type"` to "SHIPPING_LABEL" if it is a label, otherwise "OTHER".
4.  If an address (origin or destination) is not found, set its corresponding value to `null`.
5.  If the tracking number is not found, set `"tracking_number"` to `null`.
6.  For fields within each address (other than `country`), if a field is not found in the input text, set its value to `null`.
7.  All extracted text **MUST BE IN UPPERCASE**.
8.  **Normalize common address abbreviations:** Expand "ST." to "STREET", "AVE." to "AVENUE", "APT." to "APARTMENT", "STE." to "SUITE", "PO BOX" to "P.O. BOX".
9.  **Street Address Formatting:** The `street_address` field MUST be a single line. Replace any internal newlines or multiple spaces with a comma and a single space (e.g., "123 MAIN ST.\nAPT B" becomes "123 MAIN ST., APT B").
10. **Correct minor OCR typographical errors:** Carefully read the text and correct minor typographical errors that appear to be OCR-related if the corrected word makes sense in the context of an address (e.g., "WAIN STREET" should be corrected to "MAIN STREET"). Prioritize semantic correctness and common address patterns over literal interpretation of obvious OCR mistakes.
11. Ensure the extracted information is plausible and internally consistent for an address.
12. Do not include any extra punctuation in phone numbers beyond standard parentheses or hyphens as commonly formatted.

JSON Output:
"""
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # (Removed legacy Config class to avoid conflict with model_config in v2)

settings = Settings() 