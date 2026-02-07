"""
ClaimGuard AI - FastAPI Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import get_settings
from .database import init_db
from .routers import claims, admin

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - startup and shutdown events."""
    # Startup
    print("🚀 Starting ClaimGuard AI...")
    await init_db()
    print("✅ Database initialized")
    yield
    # Shutdown
    print("👋 Shutting down ClaimGuard AI...")


app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered insurance claims platform - Approve legitimate claims in under 60 seconds",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(claims.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    """Root endpoint - API status."""
    return {
        "message": "ClaimGuard AI System Operational",
        "status": "active",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "services": {
            "database": "connected",
            "gemini": "ready",
            "storage": "ready"
        }
    }
