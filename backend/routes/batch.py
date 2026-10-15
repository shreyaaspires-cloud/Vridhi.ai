"""Batch prediction route — CSV upload with vectorized scoring."""
from __future__ import annotations

import io

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.model.model_service import MODEL_FEATURES
from backend.services.prediction_service import predict_batch

router = APIRouter()

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
REQUIRED_COLUMNS = MODEL_FEATURES  # the 8 model features


@router.post("/api/predict/batch")
async def predict_batch_route(file: UploadFile = File(...)):
    # Validate file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail={"error": "File too large", "message": "CSV file must be 5 MB or less."},
        )

    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid file type", "message": "Please upload a .csv file."},
        )

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail={"error": "CSV parse error", "message": str(exc)[:200]},
        )

    if df.empty:
        raise HTTPException(
            status_code=400,
            detail={"error": "Empty CSV", "message": "The uploaded CSV contains no rows."},
        )

    # Validate required columns
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Missing required columns",
                "missing": missing,
                "message": f"CSV is missing required model columns: {', '.join(missing)}",
            },
        )

    try:
        result = predict_batch(df)
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "Batch prediction failed", "message": str(exc)[:300]},
        )


@router.get("/api/sample-csv")
def sample_csv():
    """Generate a downloadable CSV template with required columns and sample rows."""
    import csv
    from fastapi.responses import StreamingResponse

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=REQUIRED_COLUMNS)
    writer.writeheader()
    writer.writerow({
        "income": 5000000,
        "loan_amount": 1500000,
        "gst_compliance_rate": 85,
        "monthly_upi_volume": 200000,
        "utility_delay_days": 5,
        "vendor_trust_score": 75,
        "sector_type": "Manufacturing",
        "afhi_score": 70,
    })
    writer.writerow({
        "income": 1200000,
        "loan_amount": 800000,
        "gst_compliance_rate": 60,
        "monthly_upi_volume": 50000,
        "utility_delay_days": 15,
        "vendor_trust_score": 55,
        "sector_type": "Retail",
        "afhi_score": 50,
    })
    writer.writerow({
        "income": 3000000,
        "loan_amount": 2000000,
        "gst_compliance_rate": 90,
        "monthly_upi_volume": 180000,
        "utility_delay_days": 2,
        "vendor_trust_score": 85,
        "sector_type": "Services",
        "afhi_score": 80,
    })
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vridhi_sample_template.csv"},
    )
