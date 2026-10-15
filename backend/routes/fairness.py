"""Fairness route — bias analysis across audit metadata attributes."""
from __future__ import annotations

from fastapi import APIRouter

from backend.services.fairness_service import analyze_fairness
from backend.utils.portfolio_store import get_portfolio

router = APIRouter()


@router.get("/api/fairness")
def fairness():
    df = get_portfolio()
    return analyze_fairness(df)
