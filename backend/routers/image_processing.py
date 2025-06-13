from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os
import subprocess
import shutil
import json # Import json for parsing

from backend.database import get_db
from backend.models import ImageProcessedData
from backend.schemas import UploadRecordResponse, PaginatedUploadRecords

router = APIRouter()

UPLOAD_DIRECTORY = "./uploads"
OUTPUT_DIRECTORY = "./backend/mistralai_nb"

# Ensure upload and output directories exist
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
os.makedirs(OUTPUT_DIRECTORY, exist_ok=True)

@router.post("/upload-images-batch/")
async def upload_images_batch(files: list[UploadFile] = File(...), db: Session = Depends(get_db)):
    results = []

    for file in files:
        file_result = {
            "filename": file.filename,
            "upload_status": "failed",
            "extract_status": "failed",
            "extracted_info": None,
            "error": None
        }
        extracted_data = None
        upload_record_data = {
            "filename": file.filename,
            "upload_status": "pending",
            "extract_status": "pending",
            "tracking_id": None,
            "address": None,
            "name": None,
            "city": None,
            "number": None,
            "pincode": None,
            "country": None,
            "extracted_info": None
        }

        file_location = os.path.join(UPLOAD_DIRECTORY, file.filename)
        output_file_path = ""

        try:
            # Save the uploaded file
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            file_result["upload_status"] = "successful"
            upload_record_data["upload_status"] = "successful"

            # Prepare for image processing
            output_filename = f"{os.path.splitext(file.filename)[0]}_extracted.txt"
            notebook_path = os.path.join(OUTPUT_DIRECTORY, "notebook.py")
            output_file_path = os.path.join(OUTPUT_DIRECTORY, output_filename)

            # Run notebook.py as a subprocess
            process = subprocess.run(
                ["python", notebook_path, file_location, output_filename],
                capture_output=True, text=True, check=True
            )
            print(f"notebook.py stdout for {file.filename}:", process.stdout)
            print(f"notebook.py stderr for {file.filename}:", process.stderr)

            if os.path.exists(output_file_path):
                with open(output_file_path, 'r') as f_out:
                    try:
                        extracted_data = json.load(f_out)
                    except json.JSONDecodeError:
                        f_out.seek(0)
                        extracted_data = {}
                        for line in f_out:
                            if ':' in line:
                                key, value = line.split(':', 1)
                                extracted_data[key.strip()] = value.strip()
                
                file_result["extract_status"] = "successful"
                file_result["extracted_info"] = extracted_data
                upload_record_data["extract_status"] = "successful"
                upload_record_data["extracted_info"] = extracted_data

                if extracted_data:
                    upload_record_data["tracking_id"] = extracted_data.get("Tracking ID")
                    upload_record_data["address"] = extracted_data.get("Address")
                    upload_record_data["name"] = extracted_data.get("Name")
                    upload_record_data["city"] = extracted_data.get("City")
                    upload_record_data["number"] = extracted_data.get("Number")
                    upload_record_data["pincode"] = extracted_data.get("Pincode")
                    upload_record_data["country"] = extracted_data.get("Country")
            else:
                raise HTTPException(status_code=500, detail="Failed to generate output file")

        except subprocess.CalledProcessError as e:
            error_msg = f"Error processing {file.filename}: {e.stderr}"
            file_result["error"] = error_msg
            print(error_msg)
        except Exception as e:
            error_msg = f"General error for {file.filename}: {e}"
            file_result["error"] = error_msg
            print(error_msg)
        finally:
            # Clean up files regardless of success or failure
            if os.path.exists(file_location): os.remove(file_location)
            if os.path.exists(output_file_path): os.remove(output_file_path)

            # Save record to database
            new_record = ImageProcessedData(**upload_record_data)
            db.add(new_record)
            db.commit()
            db.refresh(new_record)

        results.append(file_result)
    
    return JSONResponse(content=results)

@router.post("/upload-image/")
async def upload_image_single(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # This now simply calls the batch function with a single file
    batch_results = await upload_images_batch(files=[file], db=db)
    return batch_results.body # Return the content directly, as it's a single item in the list

@router.get("/upload-records/", response_model=PaginatedUploadRecords)
async def get_upload_records(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    name: str = Query(None),
    city: str = Query(None),
    number: str = Query(None),
    pincode: str = Query(None),
    country: str = Query(None),
    tracking_id: str = Query(None)
):
    query = db.query(ImageProcessedData)

    if name: query = query.filter(ImageProcessedData.name.ilike(f"%{name}%"))
    if city: query = query.filter(ImageProcessedData.city.ilike(f"%{city}%"))
    if number: query = query.filter(ImageProcessedData.number.ilike(f"%{number}%"))
    if pincode: query = query.filter(ImageProcessedData.pincode.ilike(f"%{pincode}%"))
    if country: query = query.filter(ImageProcessedData.country.ilike(f"%{country}%"))
    if tracking_id: query = query.filter(ImageProcessedData.tracking_id.ilike(f"%{tracking_id}%"))

    total_records = query.count()
    records = query.offset((page - 1) * size).limit(size).all()

    return PaginatedUploadRecords(
        total=total_records,
        page=page,
        size=size,
        items=[UploadRecordResponse.from_orm(record) for record in records]
    ) 