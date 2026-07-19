from fastapi import APIRouter

from app.api.v1.endpoints.crowd import router as crowd_router

router = APIRouter()

# All endpoints are in crowd.py — single source of truth for API routes
# Prefix /api/v1 is applied in main.py via app.include_router(api_router, prefix="/api/v1")
router.include_router(crowd_router)