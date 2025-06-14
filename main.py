from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
from pydantic import BaseModel
import json
import os
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, status
from sqlalchemy.orm import Session

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
    role = Column(String, default="user")
    status = Column(String, default="pending")

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

# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key") # TODO: Change this to a strong secret key
print(f"DEBUG: SECRET_KEY used: {SECRET_KEY}")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Pydantic Models for Auth
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    role: Optional[str] = "user" # Default role
    status: Optional[str] = "pending" # Default status

class UserInDB(User):
    hashed_password: str

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

# Password Hashing Utilities
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# JWT Token Utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user(db, username: str):
    return db.query(UserCredential).filter(UserCredential.username == username).first()

async def authenticate_user(db, username: str, password: str):
    user = await get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    print(f"DEBUG: get_current_user called with token: {token[:30]}...")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"DEBUG: JWT payload decoded: {payload}")
        username: str = payload.get("sub")
        if username is None:
            print("DEBUG: Username is None in payload")
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError as e:
        print(f"DEBUG: JWTError during decoding: {e}")
        raise credentials_exception
    user = await get_user(db, username=token_data.username)
    if user is None:
        print(f"DEBUG: User not found for username: {token_data.username}")
        raise credentials_exception
    print(f"DEBUG: Successfully retrieved user: {user.username}")
    return User(username=user.username, email=user.email, role=user.role, status=user.status)

# Endpoints

# This endpoint is for auth/register
@app.post("/auth/register/")
async def register_user(user: UserCreate):
    db = next(get_db())
    # In a real application, you would hash the password here
    hashed_password = get_password_hash(user.password)
    db_user = UserCredential(username=user.username, email=user.email, hashed_password=hashed_password, role="user", status="pending")
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

@app.post("/token", response_model=Token)
async def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "email": user.email, "role": user.role, "status": user.status},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/")
async def read_root():
    return {"message": "Welcome to the UPS Database API"} 