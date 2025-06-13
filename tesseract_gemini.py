# # %%
# %pip install -q -U google-generativeai


# # %%
# %pip install -q pytesseract opencv-python-headless numpy scikit-learn matplotlib


# %%
import pytesseract
pytesseract.pytesseract.tesseract_cmd = "C:/Program Files/Tesseract-OCR/tesseract.exe"


# %%
img = "D:/UPS/backend/mistralai_nb/images_used/L6_aug27.jpg"
text = pytesseract.image_to_string(img)
print(text)


# %%
import google.generativeai as genai
import json
import re

# %%
GOOGLE_API_KEY = 'AIzaSyDcnDisZI_Q5JUOtMGRUNeRz419F3d7F8E'

# %%
def clean_address_text(text):
    text = text.upper()
    patterns_to_remove = [
        r'\bLBS\s+\d+\s+OF\s+\d+\b', r'\bDWT:\s*\d+(?:,\d+)*\b',
        r'\bSHP#:\s*[A-Z0-9\s]+\b', r'\bSHP\s+WT:\s*[0-9.]+\s*KG\b',
        r'\bSHP\s+DWT:\s*\d+\s*KG\b', r'\bTRACKING\s*#:\s*[A-Z0-9\s]+\b',
        r'\bDATE:\s*\d+\s*[A-Z]+\s*\d+\b', r'\d+\s*KG\s*LOY\s*\d+\b',
        r'\bGBR\s+\d+\s*-\d+\b', r'\bIMT\b', r'\bUPS\s+STANDARD\b',
        r'\bEN\.\s*\n', r'^\s*CONSIGNOR\b.*$', r'^\s*SHIP\s+TO:\s*\d*\b.*$',
        r'[\r\n]{2,}', r'\s{2,}', r'^\s*[\W_]+\s*$', r'^-+\s*$', r'\|\s*',
    ]
    for pattern in patterns_to_remove:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.MULTILINE)
    cleaned_lines = [line.strip() for line in text.split('\n') if line.strip()]
    return '\n'.join(cleaned_lines).strip()

def get_image_bytes(image_path):

    with open(image_path, 'rb') as f:
        return f.read()



# %%

def parse_and_validate_full_output(llm_output_text):

    try:
        # Find the JSON object boundaries in the LLM's response
        json_start = llm_output_text.find('{')
        json_end = llm_output_text.rfind('}')

        # If valid JSON boundaries aren't found, print an error and return None
        if json_start == -1 or json_end == -1 or json_end < json_start:
            print(f"Error: Could not find valid JSON object boundaries in LLM response.")
            print(f"Raw LLM response (problematic): {llm_output_text}")
            return None

        # Extract the JSON string and parse it
        extracted_json_str_cleaned = llm_output_text[json_start : json_end + 1]
        data = json.loads(extracted_json_str_cleaned)

        # Ensure all expected top-level keys are present, defaulting to None or False
        data.setdefault("document_type", "OTHER")
        data.setdefault("is_ups_label", False)
        data.setdefault("origin_address", None)
        data.setdefault("destination_address", None)
        data.setdefault("tracking_number", None)
        data.setdefault("message", None)

        def validate_and_flatten_address(address_data):

            if address_data is None:
                return None

            # Define all required address keys and set defaults if missing
            required_keys = ["name", "phone_number", "street_address", "city", "state", "zipcode", "country"]
            for key in required_keys:
                address_data.setdefault(key, None)

            # Flatten street_address: replace newlines with ', ' and clean up spaces/commas
            if address_data.get("street_address") and isinstance(address_data["street_address"], str):
                address_data["street_address"] = address_data["street_address"].replace('\n', ', ').strip()
                # Replace multiple commas/spaces that might result from flattening
                address_data["street_address"] = re.sub(r',(\s*,)+', ',', address_data["street_address"])
                address_data["street_address"] = re.sub(r'\s{2,}', ' ', address_data["street_address"]).strip()

            return address_data

        # Only validate and flatten addresses if it's a detected UPS shipping label
        if data["is_ups_label"] and data["document_type"] == "SHIPPING_LABEL":
            data["destination_address"] = validate_and_flatten_address(data["destination_address"])
            data["origin_address"] = validate_and_flatten_address(data["origin_address"])

        return data

    except json.JSONDecodeError as e:
        # Handle errors specifically related to JSON parsing
        print(f"Error decoding JSON from LLM: {e}")
        print(f"LLM raw output (problematic): {llm_output_text}")
        return None
    except Exception as e:
        # Catch any other unexpected errors during parsing
        print(f"An unexpected error occurred during parsing: {e}")
        print(f"LLM raw output (problematic): {llm_output_text}")
        return None

# %%
import google.generativeai as genai
import json
from PIL import Image
import io
import re

genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

def get_image_bytes(image_path):
    with open(image_path, 'rb') as f:
        return f.read()

def parse_and_validate_full_output(llm_output_text):
    try:
        json_start = llm_output_text.find('{')
        json_end = llm_output_text.rfind('}')
        if json_start == -1 or json_end == -1 or json_end < json_start:
            print(f"Error: Could not find valid JSON object boundaries in LLM response.")
            print(f"Raw LLM response (problematic): {llm_output_text}")
            return None

        extracted_json_str_cleaned = llm_output_text[json_start : json_end + 1]
        data = json.loads(extracted_json_str_cleaned)

        if "destination_address" not in data:
            data["destination_address"] = None
        if "origin_address" not in data:
            data["origin_address"] = None
        if "tracking_number" not in data:
            data["tracking_number"] = None

        def validate_and_flatten_address(address_data):
            if address_data is None:
                return None
            required_keys = ["name", "phone_number", "street_address", "city", "state", "zipcode", "country"]
            for key in required_keys:
                if key not in address_data:
                    address_data[key] = None

            if address_data.get("street_address") and isinstance(address_data["street_address"], str):
                address_data["street_address"] = address_data["street_address"].replace('\n', ', ').strip()
                address_data["street_address"] = re.sub(r',(\s*,)+', ',', address_data["street_address"]) # Fix multiple commas
                address_data["street_address"] = re.sub(r'\s{2,}', ' ', address_data["street_address"]).strip() # Fix multiple spaces

            return address_data

        data["destination_address"] = validate_and_flatten_address(data["destination_address"])
        data["origin_address"] = validate_and_flatten_address(data["origin_address"])

        return data
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from LLM: {e}")
        print(f"LLM raw output (problematic): {llm_output_text}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred during parsing: {e}")
        print(f"LLM raw output (problematic): {llm_output_text}")
        return None

image_path = 'D:/UPS/backend/mistralai_nb/images_used/L6_aug27.jpg'


try:
    img_bytes = get_image_bytes(image_path)
    img_part = {
        'mime_type': 'image/jpeg',
        'data': img_bytes
    }

    full_extraction_prompt = f"""
Analyze the provided image.

First, determine if the image is primarily a shipping label.
If it is not a shipping label, respond ONLY with "NOT A SHIPPING LABEL".

If it IS a shipping label, extract the **Origin Address**, **Destination Address**, and the **Tracking Number**.

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
2.  The JSON object MUST contain three top-level keys: `"document_type"`, `"origin_address"`, `"destination_address"`, and `"tracking_number"`.
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

    generation_config = {
        "temperature": 0.0,
        "top_p": 1,
        "top_k": 1,
    }

    response = model.generate_content([full_extraction_prompt, img_part], generation_config=generation_config)

    extracted_json_str = response.text.strip() if hasattr(response, 'text') and response.text else ""

    if extracted_json_str.upper() == "NOT A SHIPPING LABEL":
        print("Detected Document Type: NOT A SHIPPING LABEL. Skipping address and tracking extraction.")
    else:
        parsed_data = parse_and_validate_full_output(extracted_json_str)

        if parsed_data:
            print("--- Extracted Information (JSON Output) ---")
            print(json.dumps(parsed_data, indent=2))
        else:
            print("Failed to extract and parse information.")

except FileNotFoundError:
    print(f"Error: Image file not found at {image_path}. Please update the 'image_path' variable.")
except Exception as e:
    print(f"An error occurred during the API call: {e}")
    if 'response' in locals():
        if hasattr(response, 'prompt_feedback'): print(f"Prompt feedback: {response.prompt_feedback}")
        if hasattr(response, 'candidates') and response.candidates: print(f"Candidate safety ratings: {response.candidates[0].safety_ratings}")
        print("Raw LLM response (if available):")
        print(response.text if hasattr(response, 'text') else "No response text.")



# %% [markdown]
# ## DESTINATION

# %%
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')


cleaned_destination_text = clean_address_text(text)
# print(f"Original Text:\n{text}\n")
# print(f"Cleaned Text:\n{text}\n")


dest_example_input_text = "SHIP TO:\nJOSEPHINE MARIS\n147852369\n58 KNIGHTSBRIDGE\nLONDON SW1X7JT\nUNITED KINGDOM"
dest_example_output_json = {"name": "JOSEPHINE MARIS", "phone_number": "147852369", "street_address": "58 KNIGHTSBRIDGE", "city": "LONDON", "state": None, "zipcode": "SW1X7JT", "country": "UNITED KINGDOM"}


prompt_destination = f"""
You are an intelligent and highly accurate address extraction system. Your task is to extract the **Ship To Address** components from the provided text. Focus only on the destination address, which is typically found after "SHIP TO:" or as the primary address if only one is present.

Here are the fields you need to extract for the destination address:
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
2.  If a field is not found in the input text, set its value to `null`.
3.  All extracted text **MUST BE IN UPPERCASE**.
4.  **Normalize common address abbreviations:** Expand "ST." to "STREET", "AVE." to "AVENUE", "APT." to "APARTMENT", "STE." to "SUITE", "PO BOX" to "P.O. BOX".
5.  **Correct minor OCR typographical errors:** Carefully read the text and correct minor typographical errors that appear to be OCR-related if the corrected word makes sense in the context of an address (e.g., "WAIN STREET" should be corrected to "MAIN STREET"). Prioritize semantic correctness and common address patterns over literal interpretation of obvious OCR mistakes.
6.  Ensure the extracted information is plausible and internally consistent for an address.
7.  Do not include any extra punctuation in phone numbers beyond standard parentheses or hyphens as commonly formatted.

Here is an example to guide you:

Example Input:
{json.dumps(dest_example_input_text, indent=2)}
Example Output:
{json.dumps(dest_example_output_json, indent=2)}

Now, extract the information from the following address text:

Address Text:
{text}

JSON Output:
"""


# %%


# %%
generation_config = {
    "temperature": 0.0,
    "top_p": 1,
    "top_k": 1,
}

try:
    response = model.generate_content(
        prompt_destination,
        generation_config=generation_config
    )

    extracted_json_str = response.text if hasattr(response, 'text') and response.text else ""

    if not extracted_json_str.strip():
        print("LLM returned an empty or whitespace-only response for destination address.")
        if hasattr(response, 'prompt_feedback'): print(f"Prompt feedback: {response.prompt_feedback}")
        if hasattr(response, 'candidates') and response.candidates: print(f"Candidate safety ratings: {response.candidates[0].safety_ratings}")
        destination_address = None
    # else:
        # destination_address = parse_and_validate_address_outpu(extracted_json_str)

    if destination_address:
        print("--- Extracted Destination Address (JSON Output) ---")
        print(json.dumps(destination_address, indent=2))
    else:
        print("Failed to extract and parse destination address information.")

except Exception as e:
    print(f"An error occurred during the API call for destination address: {e}")
    if 'response' in locals():
        if hasattr(response, 'prompt_feedback'): print(f"Prompt feedback: {response.prompt_feedback}")
        if hasattr(response, 'candidates') and response.candidates: print(f"Candidate safety ratings: {response.candidates[0].safety_ratings}")
        print("Raw LLM response (if available):")
        print(response.text if hasattr(response, 'text') else "No response text.")

# %% [markdown]
# ## ORIGIN

# %%
cleaned_origin_text = clean_address_text(text)
print(f"Cleaned Text:\n{cleaned_origin_text}\n")

origin_example_input_text = "DOE JOHN\n212-982-2500\nSAMPLE C\nP.O. BOX 1 QUEENS\n75003 PARIS\nFRANCE"
origin_example_output_json = {
    "name": "DOE JOHN",
    "phone_number": "212-982-2500",
    "street_address": "SAMPLE C P.O. BOX 1 QUEENS",
    "city": "PARIS",
    "state": None,
    "zipcode": "75003",
    "country": "FRANCE"
}


prompt_origin = f"""
You are an intelligent and highly accurate address extraction system. Your task is to extract the **Origin Address** components from the provided text. Focus only on the origin address, which is typically found before "SHIP TO:" or as the primary address if no "SHIP TO:" is present.

Here are the fields you need to extract for the origin address:
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
2.  If a field is not found in the input text, set its value to `null`.
3.  All extracted text **MUST BE IN UPPERCASE**.
4.  **Normalize common address abbreviations:** Expand "ST." to "STREET", "AVE." to "AVENUE", "APT." to "APARTMENT", "STE." to "SUITE", "PO BOX" to "P.O. BOX".
5.  **Correct minor OCR typographical errors:** Carefully read the text and correct minor typographical errors that appear to be OCR-related if the corrected word makes sense in the context of an address (e.g., "WAIN STREET" should be corrected to "MAIN STREET"). Prioritize semantic correctness and common address patterns over literal interpretation of obvious OCR mistakes.
6.  Ensure the extracted information is plausible and internally consistent for an address.
7.  Do not include any extra punctuation in phone numbers beyond standard parentheses or hyphens as commonly formatted.

Here is an example to guide you:

Example Input:
{json.dumps(origin_example_input_text, indent=2)}
Example Output:
{json.dumps(origin_example_output_json, indent=2)}

Now, extract the information from the following address text:

Address Text:
{cleaned_origin_text}

JSON Output:
"""



# %%
generation_config = {
    "temperature": 0.0,
    "top_p": 1,
    "top_k": 1,
}

try:
    response = model.generate_content(
        prompt_origin,
        generation_config=generation_config
    )

    extracted_json_str = response.text if hasattr(response, 'text') and response.text else ""

    if not extracted_json_str.strip():
        print("LLM returned an empty or whitespace-only response for origin address.")
        if hasattr(response, 'prompt_feedback'): print(f"Prompt feedback: {response.prompt_feedback}")
        if hasattr(response, 'candidates') and response.candidates: print(f"Candidate safety ratings: {response.candidates[0].safety_ratings}")
        origin_address = None
    # else:
        # origin_address = parse_and_validate_address_outpu(extracted_json_str)

    if origin_address:
        print("--- Extracted Origin Address (JSON Output) ---")
        print(json.dumps(origin_address, indent=2))
    else:
        print("Failed to extract and parse origin address information.")

except Exception as e:
    print(f"An error occurred during the API call for origin address: {e}")
    if 'response' in locals():
        if hasattr(response, 'prompt_feedback'): print(f"Prompt feedback: {response.prompt_feedback}")
        if hasattr(response, 'candidates') and response.candidates: print(f"Candidate safety ratings: {response.candidates[0].safety_ratings}")
        print("Raw LLM response (if available):")
        print(response.text if hasattr(response, 'text') else "No response text.")


# %%



