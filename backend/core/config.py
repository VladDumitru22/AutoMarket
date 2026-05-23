import os
import urllib.parse
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "AutoMarket"
    
    DB_USER: str = os.getenv("user")
    DB_PASS: str = os.getenv("password")
    DB_SERVER: str = os.getenv("server")
    DB_NAME: str = os.getenv("database")
    
    QUOTED_PASS: str = urllib.parse.quote_plus(DB_PASS) if DB_PASS else ""
    DATABASE_URL: str = f"mssql+pyodbc://{DB_USER}:{QUOTED_PASS}@{DB_SERVER}:1433/{DB_NAME}?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"

    SECRET_KEY: str = os.getenv("SECRET_KEY", "secret_key_default")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")

settings = Settings()