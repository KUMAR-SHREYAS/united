# -*- coding: utf-8 -*-

import os
import re
import base64
from mistralai import Mistral
import sys
import mimetypes # Import mimetypes

# Initialize Mistral client with API key
API_KEY = 'WRBAeJ7igGEzgcEFRBKKezTrKyNCiUcH'
client = Mistral(api_key=API_KEY)

# === Encode image ===
def encode_image(image_location):
    mime_type, _ = mimetypes.guess_type(image_location)
    if mime_type is None:
        # Default to a common image type if guessing fails
        mime_type = "application/octet-stream"
    with open(image_location, 'rb') as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
    return encoded_string, mime_type

# === Extract name, phone, address, tracking number ===
def extract_details(ocr_text):
    normalized_text = re.sub(r"[*#]+", "", ocr_text)
    normalized_text = re.sub(r"(SHIP[\s_]*TO)[:\-]", "SHIP TO", normalized_text, flags=re.IGNORECASE)

    ship_to_match = re.search(
        r"SHIP TO\s*(.*?)(?=\n(?:UPS|TRACKING|1Z|TILLING|COD|BILLING|REFERENCE|\Z))",
        normalized_text, re.IGNORECASE | re.DOTALL
    )
    ship_to_block = ship_to_match.group(1).strip() if ship_to_match else "Not found"
    ship_to_lines = [line.strip() for line in ship_to_block.splitlines() if line.strip()]

    name = ship_to_lines[0] if len(ship_to_lines) > 0 else "Not found"
    phone = ship_to_lines[1] if len(ship_to_lines) > 1 else "Not found"
    address = ", ".join(ship_to_lines[2:]) if len(ship_to_lines) > 2 else "Not found"

    tracking_match = re.search(r"\b1Z[\s\dA-Z]{10,}\b", normalized_text, re.IGNORECASE)
    tracking_number = tracking_match.group(0).replace(" ", "").upper() if tracking_match else "Not found"

    return name, phone, address, tracking_number

# === Process a single image ===
def process_single_image(image_path):
        base64image, mime_type = encode_image(image_path)

        ocr_response = client.ocr.process(
            model="mistral-ocr-latest",
            document={
                "type": "image_url",
                "image_url": f"data:{mime_type};base64,{base64image}"
            }
        )

        ocr_text = ocr_response.pages[0].markdown
        name, phone, address, tracking_number = extract_details(ocr_text)

        return {
            "Name": name,
            "Phone": phone,
            "Address": address,
            "Tracking Number": tracking_number
        }

# === Write extracted data to file ===
def write_extracted_data_to_file(data, output_filename):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(current_dir, output_filename)
    with open(output_path, 'w') as f:
        for key, value in data.items():
            f.write(f"{key}: {value}\n")
    print(f"Extracted data written to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python notebook.py <image_path> <output_filename>")
        sys.exit(1)

    image_path = sys.argv[1]
    output_filename = sys.argv[2]

    if not os.path.exists(image_path):
        print(f"Error: Image file not found at {image_path}")
        sys.exit(1)

    extracted_data = process_single_image(image_path)
    write_extracted_data_to_file(extracted_data, output_filename)


# import os
# import re
# import base64
# import requests
# from mistralai import Mistral
# import mimetypes

# API_KEY = 'WRBAeJ7igGEzgcEFRBKKezTrKyNCiUcH'  # Replace with your real key
# client = Mistral(api_key=API_KEY)

# # === Extract name, phone, address, tracking number ===
# def extract_details(ocr_text):
#     normalized_text = re.sub(r"[*#]+", "", ocr_text)
#     normalized_text = re.sub(r"(SHIP[\s_]*TO)[:\-]", "SHIP TO", normalized_text, flags=re.IGNORECASE)

#     ship_to_match = re.search(
#         r"SHIP TO\s*(.*?)(?=\n(?:UPS|TRACKING|1Z|TILLING|COD|BILLING|REFERENCE|\Z))",
#         normalized_text, re.IGNORECASE | re.DOTALL
#     )
#     ship_to_block = ship_to_match.group(1).strip() if ship_to_match else "Not found"
#     ship_to_lines = [line.strip() for line in ship_to_block.splitlines() if line.strip()]

#     name = ship_to_lines[0] if len(ship_to_lines) > 0 else "Not found"
#     phone = ship_to_lines[1] if len(ship_to_lines) > 1 else "Not found"
#     address = ", ".join(ship_to_lines[2:]) if len(ship_to_lines) > 2 else "Not found"

#     tracking_match = re.search(r"\b1Z[\s\dA-Z]{10,}\b", normalized_text, re.IGNORECASE)
#     tracking_number = tracking_match.group(0).replace(" ", "").upper() if tracking_match else "Not found"

#     return name, phone, address, tracking_number

# # === Upload file temporarily (to file.io or any free API) ===
# def upload_temp_image(image_path):
#     with open(image_path, 'rb') as f:
#         response = requests.post('https://file.io', files={'file': f})
#         if response.status_code == 200:
#             return response.json()['link']
#         else:
#             raise Exception("File upload failed.")

# # === OCR pipeline ===
# def process_image(image_path):
#     try:
#         image_url = upload_temp_image(image_path)
#         print(f"Uploaded to: {image_url}")

#         ocr_response = client.ocr.process(
#             model="mistral-ocr-latest",
#             document={
#                 "type": "document_url",
#                 "document_url": image_url
#             }
#         )
#         ocr_text = ocr_response.pages[0].markdown
#         return extract_details(ocr_text)

#     except Exception as e:
#         raise RuntimeError(f"❌ Error processing image: {e}")
