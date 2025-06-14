# # main.py
# import uvicorn
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from dotenv import load_dotenv
# import os

# # Import the new FastAPI application from backend.app.main
# from backend.app.main import app as new_app

# # Load environment variables from .env file
# load_dotenv()

# origins = [
#     "http://localhost:5174",
#     "https://ed45-152-58-159-246.ngrok-free.app",# frontend url
#     "http://127.0.0.1:5174", # Explicitly add 127.0.0.1 for frontend
#     "http://localhost:3000", # Add frontend development server origin
#     # Add more origins here if needed
# ]

# new_app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], # Explicitly list methods
#     allow_headers=["*"],
# )

# if __name__ == "__main__":
#     uvicorn.run(new_app, host="0.0.0.0", port=8000) 