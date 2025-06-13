# models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, Enum
from sqlalchemy.sql import func
from backend.base import Base


class UserCredential(Base):
    __tablename__ = "user_credentials"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(100), nullable=False)
    role = Column(Enum('admin', 'user', name='user_role'), default='user')
    status = Column(Enum('pending', 'approved', 'rejected', name='user_status'), default='pending')

class ImageProcessedData(Base):
    __tablename__ = "image_processed_data"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    upload_timestamp = Column(DateTime(timezone=True), server_default=func.now())
    upload_status = Column(String(50), default="pending") # e.g., "successful", "failed"
    extract_status = Column(String(50), default="pending") # e.g., "successful", "failed"
    tracking_id = Column(String(255), index=True, nullable=True)
    address = Column(String(255), nullable=True)
    name = Column(String(255), nullable=True)
    city = Column(String(255), nullable=True)
    number = Column(String(50), nullable=True)
    pincode = Column(String(20), nullable=True)
    country = Column(String(255), nullable=True)
    extracted_info = Column(JSON, nullable=True) # To store the full extracted JSON data 