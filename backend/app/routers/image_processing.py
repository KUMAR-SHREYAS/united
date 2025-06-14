from fastapi import APIRouter, File, UploadFile, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os
import subprocess
import shutil
import json
from typing import List
from sqlalchemy import desc

from ..database import get_db
from ..models import ImageProcessedData
from ..schemas import UploadRecordResponse, PaginatedUploadRecords

router = APIRouter()

UPLOAD_DIRECTORY = "./uploads"
OUTPUT_DIRECTORY = "./backend/mistralai_nb"

# Ensure upload and output directories exist
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)
os.makedirs(OUTPUT_DIRECTORY, exist_ok=True)

@router.post("/upload-images-batch/")
async def upload_images_batch(files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    responses = []
    for file in files:
        try:
            contents = await file.read()
            # Save the file temporarily or process directly
            # For now, let's just create a record in DB, actual processing happens via /extract
            new_record = ImageProcessedData(filename=file.filename, upload_status="uploaded")
            db.add(new_record)
            db.commit()
            db.refresh(new_record)
            responses.append({"filename": file.filename, "status": "success", "id": new_record.id})
        except Exception as e:
            responses.append({"filename": file.filename, "status": f"failed: {str(e)}"})
    return responses

@router.post("/upload-image-single/")
async def upload_image_single(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        contents = await file.read()
        new_record = ImageProcessedData(filename=file.filename, upload_status="uploaded")
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return {"filename": file.filename, "status": "success", "id": new_record.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

@router.get("/upload-records/", response_model=PaginatedUploadRecords)
async def get_upload_records(
    db: Session = Depends(get_db),
    page: int = 1,
    size: int = 10
):
    offset = (page - 1) * size
    
    # Fetch directly from ImageProcessedData
    total_records = db.query(ImageProcessedData).count()
    records = db.query(ImageProcessedData).order_by(desc(ImageProcessedData.upload_timestamp)).offset(offset).limit(size).all()

    # Convert ImageProcessedData objects to UploadRecordResponse schema
    # The Pydantic model UploadRecordResponse should now match ImageProcessedData fields
    items = [
        UploadRecordResponse.from_orm(record) for record in records
    ]

    return {"total": total_records, "page": page, "size": size, "items": items} 