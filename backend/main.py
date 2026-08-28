from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from src.config import ALLOWED_ORIGINS
from src.db import init_db
from src.controllers.leads_controller import router as leads_router
from src.controllers.auth_controller import router as auth_router
from src.controllers.admin_controller import router as admin_router
from src.controllers.resources_controller import router as admin_resources_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="Quiz Funnel API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads_router, prefix="/api/leads", tags=["leads"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
app.include_router(admin_resources_router, prefix="/api/admin/resources", tags=["admin-resources"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "quiz-funnel"}
