import jwt
from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from backend.database import get_db
from backend.schemas import TokenData, UserCredentialSchema
from backend.models import UserCredential

from backend.auth.utils import (
    SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, 
    pwd_context, verify_password, get_password_hash, 
    create_access_token, decode_access_token
)

# to get a string like this run:
# openssl rand -hex 32
# SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7" # Removed duplicate
# ALGORITHM = "HS256" # Removed duplicate
# ACCESS_TOKEN_EXPIRE_MINUTES = 30 # Removed duplicate

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto") # Removed duplicate
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter()

# def verify_password(plain_password, hashed_password): # Removed duplicate
#     return pwd_context.verify(plain_password, hashed_password)


# def get_password_hash(password): # Removed duplicate
#     return pwd_context.hash(password)


def get_user(db: Session, username: str):
    db_user = db.query(UserCredential).filter(UserCredential.username == username).first()
    return db_user


def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


# def create_access_token(data: dict, expires_delta: timedelta | None = None): # Removed duplicate
#     to_encode = data.copy()
#     if expires_delta:
#         expire = datetime.now(timezone.utc) + expires_delta
#     else:
#         expire = datetime.now(timezone.utc) + timedelta(minutes=15)
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#     return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token) # Using imported decode_access_token
    if payload is None:
        raise credentials_exception
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    token_data = TokenData(username=username)

    user = db.query(UserCredential).filter(UserCredential.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: UserCredential = Depends(get_current_user)):
    if current_user.status != "approved":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account not approved")
    return current_user


async def get_current_admin_user(current_user: UserCredential = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not an admin user")
    return current_user 