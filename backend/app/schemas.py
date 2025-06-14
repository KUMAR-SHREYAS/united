from pydantic import BaseModel, Field, validator, EmailStr
from datetime import datetime
from typing import Optional, List


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

    @validator('email')
    def validate_email_domain(cls, v):
        if not v.endswith('@ups.com'):
            raise ValueError('Email must end with @ups.com')
        return v

    @validator('password')
    def validate_password_complexity(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c in '!@#$%^&*(),.?":{}|<>' for c in v):
            raise ValueError('Password must contain at least one special character')
        return v

class UserResponse(BaseModel):
    username: str
    email: str | None = None

class UserCredentialInDB(UserResponse):
    hashed_password: str


# Pydantic Schemas for the new ImageProcessedData model
class UploadRecordBase(BaseModel):
    filename: str
    upload_status: Optional[str] = "pending"
    extract_status: Optional[str] = "pending"
    
    # Fields from AI Extraction Result (ShippingExtraction)
    document_type: Optional[str] = None
    is_shipping_label: Optional[bool] = None
    tracking_number: Optional[str] = None
    message: Optional[str] = None
    origin_address_json: Optional[dict] = None  # To store dict of address
    destination_address_json: Optional[dict] = None  # To store dict of address

    # Original fields that were for unstructured info (might be redundant if AI output is preferred)
    address: Optional[str] = None
    name: Optional[str] = None
    city: Optional[str] = None
    number: Optional[str] = None
    pincode: Optional[str] = None
    country: Optional[str] = None
    extracted_info: Optional[dict] = None # This can store the raw LLM output or specific extracted_info as before


class UploadRecordCreate(UploadRecordBase):
    pass

class UploadRecordResponse(UploadRecordBase):
    id: int
    upload_timestamp: datetime

    class Config:
        from_attributes = True # Allow ORM to Pydantic mapping

# PaginatedUploadRecords now uses UploadRecordResponse
class PaginatedUploadRecords(BaseModel):
    total: int
    page: int
    size: int
    items: List[UploadRecordResponse]

class UserLogin(BaseModel):
    username: str
    password: str

class UserCredentialSchema(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: str
    status: str

    class Config:
        from_attributes = True

class UserCreateAdmin(UserCreate):
    role: str = "user"
    status: str = "pending" 