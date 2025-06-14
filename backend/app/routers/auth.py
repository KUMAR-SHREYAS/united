from datetime import timedelta

from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session

from ..auth.utils import create_access_token, get_password_hash, verify_password
from ..database import get_db
from ..schemas import Token, UserCreate, UserLogin, UserCredentialSchema
from ..models import UserCredential
from ..config import settings # Import settings for ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

# Custom OPTIONS handler for /register to ensure CORS preflight success
@router.options("/register")
async def register_options():
    return {"message": "OK"}


@router.post("/register", response_model=UserCredentialSchema, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if username or email already exists
    if db.query(UserCredential).filter(UserCredential.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered.")
    if db.query(UserCredential).filter(UserCredential.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    # Count existing users
    user_count = db.query(UserCredential).count()

    # Promote the first user to admin with approved status
    role = "admin" if user_count == 0 else "user"
    user_status = "approved" if user_count == 0 else "pending"

    hashed_password = get_password_hash(user.password)

    db_user = UserCredential(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=role,
        status=user_status
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user



@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), 
    db: Session = Depends(get_db)
):
    user = db.query(UserCredential).filter(UserCredential.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if user.status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account pending approval by an administrator."
        )
    if user.status == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been rejected."
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "email": user.email, "role": user.role, "status": user.status}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"} 