"""Prediction route — single business scoring."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.schemas import PredictRequest, PredictResponse
from backend.services.prediction_service import predict_business
from backend.utils.portfolio_store import append_business

router = APIRouter()


@router.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        data = req.model_dump()
        result = predict_business(data)
        # Append to portfolio store
        append_business(data, result)
        return result
    except ValueError as exc:
        field = "unknown"
        msg = str(exc)
        if "sector_type" in msg:
            field = "sector_type"
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid field", "field": field, "message": msg},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "Prediction failed", "message": str(exc)[:300]},
        )
