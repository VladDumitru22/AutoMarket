import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from core.ws_manager import set_main_loop
from db.session import Base, engine
import models  # noqa: F401 — registers all ORM models with Base

from routers import auth, listings, offers, conversations, favorites, reports, admin
from routers import notifications, upload, ws

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
app.include_router(notifications.router)
app.include_router(upload.router)
app.include_router(ws.router)


@app.on_event("startup")
async def on_startup():
    set_main_loop(asyncio.get_running_loop())


@app.get("/")
def root():
    return {"status": "AutoMarket is running", "project": settings.PROJECT_NAME}
