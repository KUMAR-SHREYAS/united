from fastapi import FastAPI, UploadFile, HTTPException, Depends
from sqlalchemy.orm import Session
import datetime
import json # Import json for dumps
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware

from .ocr import do_ocr
from .prompt_builder import build_cursor_prompt
from .ai_client import call_ai, extract_structured
from .database import get_db, create_db_and_tables
from .models import ImageProcessedData, ShippingExtraction # Removed DBAddress, DBShippingExtraction

# Import the new routers
from .routers import auth
from .routers import user
from .routers import image_processing

app = FastAPI()

# Add CORS middleware
origins = [
    "http://localhost",
    "http://localhost:3000", # Allow your frontend origin
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Include the new routers
app.include_router(auth.router, prefix="/auth")
app.include_router(user.router)
app.include_router(image_processing.router)

@app.post("/extract")
async def extract(file: UploadFile, db: Session = Depends(get_db)):
    start_time = datetime.datetime.now()
    
    try:
        img_bytes = await file.read()
        
        # OCR Processing
        ocr_text = do_ocr(img_bytes)
        
        # AI Prompting and Extraction
        prompt = build_cursor_prompt(ocr_text)
        ai_raw = call_ai(prompt, img_bytes)
        result: ShippingExtraction = extract_structured(ai_raw)

        # Prepare data for ImageProcessedData
        document_type_val = result.document_type if result.document_type else "UNKNOWN"
        is_shipping_label_val = result.is_shipping_label if result.is_shipping_label is not None else False
        tracking_number_val = result.tracking_number
        message_val = result.message
        extracted_info_val = result.model_dump(mode='json') # Store full AI output
        origin_address_json_val = result.origin_address.model_dump(mode='json') if result.origin_address else None
        destination_address_json_val = result.destination_address.model_dump(mode='json') if result.destination_address else None

        # Save all relevant data to ImageProcessedData table
        new_record = ImageProcessedData(
            filename=file.filename,
            upload_timestamp=start_time,
            upload_status="successful",
            extract_status="successful" if is_shipping_label_val else "skipped",
            document_type=document_type_val,
            is_shipping_label=is_shipping_label_val,
            tracking_number=tracking_number_val,
            message=message_val,
            origin_address_json=origin_address_json_val,
            destination_address_json=destination_address_json_val,
            # For original fields in ImageProcessedData, you might map them from AI output or leave null
            # For simplicity, I'm leaving them as None if not explicitly mapped from the new AI output structure.
            address=result.destination_address.street_address if result.destination_address else None, 
            name=result.destination_address.name if result.destination_address else None,
            city=result.destination_address.city if result.destination_address else None,
            pincode=result.destination_address.zipcode if result.destination_address else None,
            country=result.destination_address.country if result.destination_address else None,
            extracted_info=extracted_info_val # Full raw extracted info if needed for debugging
        )

        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        return result.dict()
    except Exception as e:
        db.rollback() # Rollback changes in case of error
        error_message = str(e)
        print(f"Error during extraction for {file.filename}: {error_message}")

        # Log failed attempt in ImageProcessedData
        failed_record = ImageProcessedData(
            filename=file.filename,
            upload_timestamp=start_time,
            upload_status="failed",
            extract_status="failed",
            document_type="UNKNOWN",
            is_shipping_label=False,
            message=f"Processing failed: {error_message}",
            extracted_info={"error": error_message}
        )
        db.add(failed_record)
        db.commit()
        
        raise HTTPException(status_code=500, detail=f"Processing failed: {error_message}") 