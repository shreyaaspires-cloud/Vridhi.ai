"""Forecast route — cash-flow forecasting."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.schemas import ForecastRequest
from backend.services.forecast_service import forecast_cashflow

router = APIRouter()


@router.post("/api/forecast")
def forecast_route(req: ForecastRequest):
    try:
        return forecast_cashflow(req.revenue_history, req.monthly_emi)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid input", "message": str(exc)[:300]},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "Forecast failed", "message": str(exc)[:300]},
        )
