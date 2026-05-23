import os
from sqlalchemy import create_engine
from dotenv import load_dotenv

import os
import urllib.parse
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

user = os.getenv("user")
password = os.getenv("password")
server = os.getenv("server")
database = os.getenv("database")

quoted_password = urllib.parse.quote_plus(password)

db_url = f"mssql+pyodbc://{user}:{quoted_password}@{server}:1433/{database}?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes"

if not db_url:
    print("Eroare: DATABASE_URL nu a fost găsit în fișierul .env")
else:
    engine = create_engine(db_url)
    try:
        with engine.connect() as connection:
            print("Conexiune reușită la Azure SQL!")
    except Exception as e:
        print(f"Eroare la conectare: {e}")
