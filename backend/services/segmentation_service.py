"""Risk segmentation service for portfolio visualization."""
from __future__ import annotations

import pandas as pd

from backend.model.model_service import VALID_RANGES


def get_segmentation(df: pd.DataFrame, filters: dict) -> dict:
    """Return filtered portfolio data with coordinates for scatter plotting."""
    filtered = df.copy()

    if filters.get("sector") and filters.get("sector") != "all":
        filtered = filtered[filtered["sector_type"] == filters["sector"]]
    if filters.get("region") and filters.get("region") != "all":
        filtered = filtered[filtered["region"] == filters["region"]]
    if filters.get("size") and filters.get("size") != "all":
        filtered = filtered[filtered["business_size"] == filters["size"]]

    x_field = filters.get("x", "income")
    y_field = filters.get("y", "risk_score")

    points = []
    for _, row in filtered.iterrows():
        points.append({
            "business": str(row.get("business_name", "Unknown")),
            "x": float(row.get(x_field, 0)),
            "y": float(row.get(y_field, 0)),
            "x_field": x_field,
            "y_field": y_field,
            "income": float(row.get("income", 0)),
            "risk_score": float(row.get("risk_score", 0)),
            "risk_label": str(row.get("risk_label", "Unknown")),
            "sector": str(row.get("sector_type", "Unknown")),
            "region": str(row.get("region", "Unknown")),
            "size": str(row.get("business_size", "Unknown")),
        })

    total = len(filtered)
    low = int((filtered["risk_label"] == "LOW").sum()) if total else 0
    medium = int((filtered["risk_label"] == "MEDIUM").sum()) if total else 0
    high = int((filtered["risk_label"] == "HIGH").sum()) if total else 0
    avg = float(filtered["risk_score"].mean()) if total else 0
    approved = int((filtered["risk_score"] >= 55).sum()) if total else 0
    approval_rate = round(approved / total * 100, 1) if total else 0

    available_sectors = sorted(df["sector_type"].unique().tolist()) if not df.empty else []
    available_regions = sorted(df["region"].unique().tolist()) if not df.empty else []
    available_sizes = sorted(df["business_size"].unique().tolist()) if not df.empty else []

    return {
        "total": total,
        "average_score": round(avg, 1),
        "LOW": low,
        "MEDIUM": medium,
        "HIGH": high,
        "approval_rate": approval_rate,
        "points": points,
        "filters": {
            "sector": filters.get("sector", "all"),
            "region": filters.get("region", "all"),
            "size": filters.get("size", "all"),
            "x": x_field,
            "y": y_field,
        },
        "available_sectors": available_sectors,
        "available_regions": available_regions,
        "available_sizes": available_sizes,
        "x_options": ["income", "risk_score", "loan_amount", "gst_compliance_rate", "afhi_score"],
        "y_options": ["risk_score", "income", "loan_amount", "gst_compliance_rate", "afhi_score"],
    }
