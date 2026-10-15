"""Health check route."""
from __future__ import annotations

from fastapi import APIRouter

from backend.model.model_service import get_model_service
from backend.utils.portfolio_store import is_loaded

router = APIRouter()


@router.get("/api/health")
def health():
    try:
        get_model_service()
        model_loaded = True
    except Exception:
        model_loaded = False
    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "portfolio_loaded": is_loaded(),
    }
