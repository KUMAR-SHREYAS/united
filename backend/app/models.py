from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# SQLAlchemy imports for ORM models
from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, JSON, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# Pydantic Models (for request/response validation)
class Address(BaseModel):
    name: Optional[str]
    phone_number: Optional[str]
    street_address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    zipcode: Optional[str]
    country: str
    
    class Config:
        orm_mode = True # Enable ORM mode for Pydantic

class ShippingExtraction(BaseModel):
    document_type: str
    is_shipping_label: Optional[bool]
    origin_address: Optional[Address]
    destination_address: Optional[Address]
    tracking_number: Optional[str]
    message: Optional[str]

    class Config:
        orm_mode = True # Enable ORM mode for Pydantic

# SQLAlchemy ORM Models (for database persistence)
Base = declarative_base()

# User Model
class UserCredential(Base):
    __tablename__ = "user_credentials"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    role = Column(Enum('admin', 'user', name='user_role'), default='user')
    status = Column(Enum('pending', 'approved', 'rejected', name='user_status'), default='pending')

# Image Processed Data Model (now includes AI extracted fields)
class ImageProcessedData(Base):
    __tablename__ = "image_processed_data"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    upload_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    upload_status = Column(String(50), default="pending") # e.g., "successful", "failed"
    extract_status = Column(String(50), default="pending") # e.g., "successful", "failed"

    # Fields from AI Extraction Result (ShippingExtraction)
    document_type = Column(String(255), nullable=True) # Changed to nullable=True as not all docs are labels
    is_shipping_label = Column(Boolean, nullable=True) # Changed to nullable=True
    tracking_number = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    
    # Store addresses as JSON directly in this table
    origin_address_json = Column(JSON, nullable=True) # Stores dict of address
    destination_address_json = Column(JSON, nullable=True) # Stores dict of address

    # Original fields that were for unstructured info, now potentially redundant or for fallback
    address = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)
    city = Column(String(255), nullable=True)
    number = Column(String(50), nullable=True)
    pincode = Column(String(20), nullable=True)
    country = Column(String(255), nullable=True)
    extracted_info = Column(JSON, nullable=True) # This can store the raw LLM output or specific extracted_info as before 