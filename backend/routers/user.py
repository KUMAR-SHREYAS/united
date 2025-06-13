from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
# import imghdr # Removed imghdr
import os
from PIL import Image # Import Pillow
from sqlalchemy.orm import Session
from typing import List

from backend.auth.auth_handler import get_current_active_user, get_current_admin_user
from backend.database import get_db
from backend.schemas import UserCredentialSchema, UserCreate, UserCreateAdmin
from backend.models import UserCredential
from backend.auth.utils import get_password_hash

router = APIRouter()

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png"}

def is_valid_image(file_path):
    try:
        # Attempt to open the image with Pillow
        img = Image.open(file_path)
        img.verify() # Verify if it's an image
        # Check if the format is one of the allowed types
        if img.format.lower() in ["jpeg", "png"]:
            return True
        else:
            return False
    except (IOError, SyntaxError) as e:
        # File is not an image or is corrupted
        print(f"Image validation failed: {e}")
        return False
    except Exception as e:
        # Catch any other unexpected errors during validation
        print(f"An unexpected error occurred during image validation: {e}")
        return False

@router.get("/users/me/", response_model=UserCredentialSchema)
async def read_users_me(current_user: UserCredentialSchema = Depends(get_current_active_user)):
    return current_user

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), current_user: UserCredentialSchema = Depends(get_current_active_user)):
    # Ensure the 'uploads' directory exists
    uploads_dir = "uploads"
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)

    # Step 1: Check file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file extension. Only .jpg, .jpeg, .png are allowed.")

    # Step 2: Check MIME type (provided by the client)
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file MIME type. Only image/jpeg and image/png are allowed.")

    # Save temporarily to disk for magic byte validation
    temp_path = os.path.join(uploads_dir, f"temp_{file.filename}")
    try:
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Step 3: Check actual file content (magic bytes) using Pillow
        if not is_valid_image(temp_path):
            os.remove(temp_path) # Delete suspicious file
            raise HTTPException(status_code=400, detail="File is not a valid image. Content check failed.")

        # All checks pass, move to permanent storage
        final_path = os.path.join(uploads_dir, file.filename)
        # Handle potential filename conflicts (e.g., if a file with the same name already exists)
        if os.path.exists(final_path):
            name, _ = os.path.splitext(file.filename)
            final_path = os.path.join(uploads_dir, f"{name}_copy{ext}") # Simple conflict resolution
        
        os.rename(temp_path, final_path)

    except Exception as e:
        # Clean up temporary file if an error occurs during processing
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=f"File upload failed: {e}")

    return JSONResponse(content={
        "message": "Image uploaded successfully.",
        "filename": file.filename,
        "path": final_path
    })

# Admin Only Endpoints

@router.get("/users/", response_model=List[UserCredentialSchema])
async def get_all_users(db: Session = Depends(get_db), current_user: UserCredentialSchema = Depends(get_current_admin_user)):
    users = db.query(UserCredential).all()
    return users

@router.post("/users/", response_model=UserCredentialSchema, status_code=status.HTTP_201_CREATED)
async def create_user_by_admin(user: UserCreateAdmin, db: Session = Depends(get_db), current_user: UserCredentialSchema = Depends(get_current_admin_user)):
    db_user = db.query(UserCredential).filter(UserCredential.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered.")
    db_user = db.query(UserCredential).filter(UserCredential.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    hashed_password = get_password_hash(user.password)
    db_user = UserCredential(username=user.username, email=user.email, hashed_password=hashed_password, role=user.role, status=user.status)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/users/approve/{user_id}", response_model=UserCredentialSchema)
async def approve_user(user_id: int, db: Session = Depends(get_db), current_user: UserCredentialSchema = Depends(get_current_admin_user)):
    user = db.query(UserCredential).filter(UserCredential.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.status == "approved":
        raise HTTPException(status_code=400, detail="User already approved.")
    user.status = "approved"
    db.commit()
    db.refresh(user)
    return user

@router.put("/users/reject/{user_id}", response_model=UserCredentialSchema)
async def reject_user(user_id: int, db: Session = Depends(get_db), current_user: UserCredentialSchema = Depends(get_current_admin_user)):
    user = db.query(UserCredential).filter(UserCredential.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.status == "rejected":
        raise HTTPException(status_code=400, detail="User already rejected.")
    user.status = "rejected"
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: Session = Depends(get_db), current_user: UserCredentialSchema = Depends(get_current_admin_user)):
    user = db.query(UserCredential).filter(UserCredential.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    db.delete(user)
    db.commit()
    return

@router.delete("/users/me/", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_user(db: Session = Depends(get_db), current_user: UserCredentialSchema = Depends(get_current_active_user)):
    user_to_delete = db.query(UserCredential).filter(UserCredential.id == current_user.id).first()
    if not user_to_delete:
        # This case should ideally not be reached if current_user is valid
        raise HTTPException(status_code=404, detail="User not found.")
    db.delete(user_to_delete)
    db.commit()
    return 