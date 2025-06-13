# main.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from backend.routers import auth
from backend.routers import user
from backend.routers import image_processing
from backend.database import engine, Base
from backend.models import UserCredential


# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key") # TODO: Change this to a strong secret key
print(f"DEBUG: SECRET_KEY used: {SECRET_KEY}")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


app = FastAPI(debug=True)

# Load environment variables from .env file
load_dotenv()

origins = [
    "http://localhost:5174",
    "https://ed45-152-58-159-246.ngrok-free.app",# frontend url
    "http://127.0.0.1:5174", # Explicitly add 127.0.0.1 for frontend
    "http://localhost:3000", # Add frontend development server origin
    # Add more origins here if needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], # Explicitly list methods
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(auth.router, prefix="/auth")
app.include_router(image_processing.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 