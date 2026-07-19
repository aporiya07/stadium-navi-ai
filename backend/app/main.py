"""
Main Application Entry Point

This module initializes the FastAPI application, sets up CORS middleware,
configures the application lifecycle (e.g. starting the crowd simulator),
and mounts the main API routers for the Stadium Copilot backend.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.v1.endpoints import router as api_router
from app.services.crowd_simulator import crowd_simulator


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"Starting {settings.APP_NAME} on {settings.HOST}:{settings.PORT}")
    
    # Start crowd simulator
    import asyncio
    sim_task = asyncio.create_task(crowd_simulator.run(interval=settings.CROWD_UPDATE_INTERVAL))
    
    yield
    
    # Shutdown
    crowd_simulator.stop()
    sim_task.cancel()
    try:
        await sim_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="FIFA World Cup 2026 - Smart Stadium Copilot for Levi's Stadium",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """
    Root endpoint serving basic venue metadata and service discovery links.
    """
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "venue": "Levi's Stadium (FIFA World Cup 2026)",
        "status": "operational",
        "docs": "/docs",
        "websocket": "/api/v1/ws/live"
    }


@app.get("/health")
async def health():
    """
    Health check endpoint returning system status and connected services.
    """
    return {
        "status": "healthy",
        "services": {
            "api": "up",
            "crowd_simulator": "running" if crowd_simulator.running else "stopped",
            "gemini": "configured" if settings.GEMINI_API_KEY else "not_configured"
        }
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )