"""Prediction service: orchestrates model prediction, SHAP, and recommendation."""
from __future__ import annotations

import pandas as pd

from backend.model.model_service import MODEL_FEATURES, get_model_service
from backend.model.shap_explain import explain_single
from backend.services.recommendation_service import generate_recommendation


def predict_business(data: dict) -> dict:
    """Full prediction pipeline for a single business."""
    svc = get_model_service()
    raw = svc.predict_single(data)
    factors = explain_single(data, top_n=5)
    recommendation = generate_recommendation(
        raw["risk_score"], raw["risk_label"], data
    )
    return {
        "business_name": data.get("business_name", "Untitled Business"),
        "risk_score": raw["risk_score"],
        "risk_label": raw["risk_label"],
        "confidence": raw["confidence"],
        "default_probability": raw["default_probability"],
        "factors": factors,
        "recommendation": recommendation,
    }


def predict_batch(df: pd.DataFrame) -> dict:
    """Vectorized batch prediction. Single predict_proba call."""
    svc = get_model_service()
    results = svc.predict_batch(df)
    scores = [r["risk_score"] for r in results]
    labels = [r["risk_label"] for r in results]

    total = len(results)
    low = sum(1 for l in labels if l == "LOW")
    medium = sum(1 for l in labels if l == "MEDIUM")
    high = sum(1 for l in labels if l == "HIGH")
    avg = sum(scores) / total if total else 0

    individual = []
    for i, (r, row) in enumerate(zip(results, df.itertuples(index=False))):
        individual.append({
            "index": i,
            "business_name": getattr(row, "business_name", f"Row {i+1}") if "business_name" in df.columns else f"Row {i+1}",
            "risk_score": r["risk_score"],
            "risk_label": r["risk_label"],
            "confidence": r["confidence"],
            "default_probability": r["default_probability"],
        })

    return {
        "total": total,
        "LOW": low,
        "MEDIUM": medium,
        "HIGH": high,
        "average_score": round(avg, 1),
        "results": individual,
    }
