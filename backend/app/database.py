from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from .config import settings
from .models import Base, UserCredential, ImageProcessedData # Removed DBAddress, DBShippingExtraction

# MySQL connection string format: "mysql+pymysql://user:password@host:port/dbname"
# Ensure your .env file has DATABASE_URL set correctly
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_db_and_tables():
    Base.metadata.create_all(engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 