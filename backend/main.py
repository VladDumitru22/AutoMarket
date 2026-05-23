from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from db.session import Base, engine
import models  # noqa: F401 — registers all ORM models with Base

from routers import auth, listings, offers, conversations, favorites, reports, admin

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(listings.router)
app.include_router(offers.router)
app.include_router(conversations.router)
app.include_router(favorites.router)
app.include_router(reports.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"status": "AutoMarket is running", "project": settings.PROJECT_NAME}
