from __future__ import annotations
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from .core.config import settings
from .db.init_db import init_db
from .db.session import SessionLocal
from .services.seed import seed_if_empty
from .routers import auth, marketplace, orders, waste, logistics, admin, misc, webhooks

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(title="TRI-MATSYA API", version="1.0.0", lifespan=lifespan, docs_url="/docs", redoc_url="/redoc")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(misc.router)
app.include_router(auth.router)
app.include_router(marketplace.router)
app.include_router(orders.router)
app.include_router(waste.router)
app.include_router(logistics.router)
app.include_router(admin.router)
app.include_router(webhooks.router)

# Serve uploads and static frontend (existing SPA)
uploads_dir = PUBLIC / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
if PUBLIC.exists():
    app.mount("/images", StaticFiles(directory=str(PUBLIC / "images")), name="images")
    app.mount("/css", StaticFiles(directory=str(PUBLIC / "css")), name="css")
    app.mount("/js", StaticFiles(directory=str(PUBLIC / "js")), name="js")
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


@app.get("/")
def index():
    index_file = PUBLIC / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "TRI-MATSYA API running. Frontend not found."}


@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    # Let API 404s be handled by routers; serve SPA for non-api routes
    if full_path.startswith("api/") or full_path.startswith("auth/") or full_path.startswith("webhooks/") or full_path.startswith("docs") or full_path.startswith("redoc") or full_path.startswith("openapi.json"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    index_file = PUBLIC / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Not found")
