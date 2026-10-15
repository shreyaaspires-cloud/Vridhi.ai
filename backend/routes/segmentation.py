"""Segmentation route — portfolio scatter plot data."""
from __future__ import annotations

from fastapi import APIRouter, Query

from backend.services.segmentation_service import get_segmentation
from backend.utils.portfolio_store import get_portfolio

router = APIRouter()


@router.get("/api/segmentation")
def segmentation(
    sector: str | None = Query(None),
    region: str | None = Query(None),
    size: str | None = Query(None),
    x: str = Query("income"),
    y: str = Query("risk_score"),
):
    df = get_portfolio()
    if df.empty:
        return {
            "total": 0,
            "average_score": 0,
            "LOW": 0,
            "MEDIUM": 0,
            "HIGH": 0,
            "approval_rate": 0,
            "points": [],
            "filters": {"sector": sector or "all", "region": region or "all", "size": size or "all", "x": x, "y": y},
            "available_sectors": [],
            "available_regions": [],
            "available_sizes": [],
            "x_options": ["income", "risk_score", "loan_amount", "gst_compliance_rate", "afhi_score"],
            "y_options": ["risk_score", "income", "loan_amount", "gst_compliance_rate", "afhi_score"],
            "message": "No portfolio data yet. Run predictions or load mock data.",
        }
    return get_segmentation(df, {
        "sector": sector,
        "region": region,
        "size": size,
        "x": x,
        "y": y,
    })
