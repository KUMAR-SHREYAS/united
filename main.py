from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from pydantic import BaseModel
import json
import os
from fastapi.middleware.cors import CORSMiddleware

# Database connection details
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_PORT = os.getenv("MYSQL_PORT")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DB = os.getenv("MYSQL_DB")

# SQLAlchemy setup
DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define SQLAlchemy Models based on test.db schemas
class UserCredential(Base):
    __tablename__ = "user_credentials"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

class ImageProcessedData(Base):
    __tablename__ = "image_processed_data"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    upload_timestamp = Column(DateTime, default=datetime.now)
    upload_status = Column(String)
    extract_status = Column(String)
    tracking_id = Column(String)
    address = Column(String)
    name = Column(String)
    city = Column(String)
    number = Column(String)
    pincode = Column(String)
    country = Column(String)
    extracted_info = Column(JSON)

# Create tables
Base.metadata.create_all(bind=engine)

# Pydantic models for request body validation
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UploadRecordCreate(BaseModel):
    filename: str
    upload_status: str
    extract_status: str
    tracking_id: str
    address: str
    name: str
    city: str
    number: str
    pincode: str
    country: str
    extracted_info: dict

app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://ed45-152-58-159-246.ngrok-free.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"]
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Endpoints

# This endpoint is for auth/register
@app.post("/auth/register/")
async def register_user(user: UserCreate):
    db = next(get_db())
    # In a real application, you would hash the password here
    hashed_password = user.password # Placeholder: hash this in production!
    db_user = UserCredential(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": "User registered successfully", "user_id": db_user.id}

# This endpoint is for upload-records
@app.post("/upload-records/")
async def create_upload_record(record: UploadRecordCreate):
    db = next(get_db())
    # Ensure extracted_info is a valid JSON string if the column expects TEXT/VARCHAR for JSON
    # For MySQL JSON type, a Python dict should work directly
    db_record = ImageProcessedData(
        filename=record.filename,
        upload_status=record.upload_status,
        extract_status=record.extract_status,
        tracking_id=record.tracking_id,
        address=record.address,
        name=record.name,
        city=record.city,
        number=record.number,
        pincode=record.pincode,
        country=record.country,
        extracted_info=record.extracted_info
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return {"message": "Upload record created successfully", "record_id": db_record.id}

@app.get("/")
async def read_root():
    return {"message": "Welcome to the UPS Database API"} 