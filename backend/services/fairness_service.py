"""Fairness and bias analysis service.

Analyzes portfolio metadata (owner_gender, region, sector_type) for bias.
These attributes are AUDIT METADATA and are NOT used by the ML model.
"""
from __future__ import annotations

import pandas as pd

APPROVAL_THRESHOLD = 55
BIAS_DEVIATION_THRESHOLD = 15  # percentage points
FOUR_FIFTHS_THRESHOLD = 0.8


def _group_analysis(df: pd.DataFrame, col: str, portfolio_avg: float, portfolio_approval: float) -> dict:
    groups = df.groupby(col).agg(
        count=("risk_score", "size"),
        avg_score=("risk_score", "mean"),
        approval_rate=("approved", "mean"),
    ).reset_index()

    items = []
    max_approval = 0
    for _, row in groups.iterrows():
        approval = float(row["approval_rate"]) * 100
        avg = float(row["avg_score"])
        deviation = avg - portfolio_avg
        if approval > max_approval:
            max_approval = approval
        items.append({
            "group": str(row[col]),
            "count": int(row["count"]),
            "approval_rate": round(approval, 1),
            "average_score": round(avg, 1),
            "deviation": round(deviation, 1),
        })

    # Disparate impact ratio = group approval / max group approval
    for item in items:
        if max_approval > 0:
            item["disparate_impact_ratio"] = round(item["approval_rate"] / max_approval, 3)
        else:
            item["disparate_impact_ratio"] = 1.0
        item["four_fifths_pass"] = item["disparate_impact_ratio"] >= FOUR_FIFTHS_THRESHOLD
        item["bias_alert"] = abs(item["deviation"]) > BIAS_DEVIATION_THRESHOLD

    return {
        "attribute": col,
        "groups": items,
        "note": "This attribute is an audit metadata field and is NOT used as a model input feature.",
    }


def analyze_fairness(df: pd.DataFrame) -> dict:
    """Compute fairness analytics across gender, region, and sector."""
    if df.empty:
        return {
            "portfolio_avg_score": 0,
            "portfolio_approval_rate": 0,
            "analyses": [],
            "note": "No portfolio data available. Run some predictions or load mock data first.",
        }

    portfolio_avg = float(df["risk_score"].mean())
    portfolio_approval = float((df["risk_score"] >= APPROVAL_THRESHOLD).mean()) * 100

    analyses = []
    for col in ["owner_gender", "region", "sector_type"]:
        if col in df.columns:
            analyses.append(_group_analysis(df, col, portfolio_avg, portfolio_approval))

    return {
        "portfolio_avg_score": round(portfolio_avg, 1),
        "portfolio_approval_rate": round(portfolio_approval, 1),
        "approval_threshold": APPROVAL_THRESHOLD,
        "bias_deviation_threshold": BIAS_DEVIATION_THRESHOLD,
        "four_fifths_threshold": FOUR_FIFTHS_THRESHOLD,
        "analyses": analyses,
        "note": "Fairness attributes (owner_gender, region, sector_type) are used for audit and analysis only and are not model input features.",
    }
