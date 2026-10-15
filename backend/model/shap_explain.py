"""SHAP explainability for the XGBoost classifier step of the pipeline.

Pipeline: ColumnTransformer -> SMOTE -> XGBClassifier
We extract the preprocessor and classifier, transform the input, then run
SHAP TreeExplainer on the classifier only (not the whole pipeline).

One-hot sector_type contributions are combined back into a single
`sector_type` feature. Contributions are converted to score-point impacts
and oriented so positive = raises credit score, negative = lowers it.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
import shap

from .model_service import MODEL_FEATURES, get_model_service

_PLAIN_ENGLISH = {
    "income": "Higher income strengthens repayment capacity",
    "loan_amount": "Larger loan amounts increase repayment burden",
    "gst_compliance_rate": "Consistent GST compliance signals operational discipline",
    "monthly_upi_volume": "Strong UPI transaction volume indicates active business",
    "utility_delay_days": "Utility payment delays suggest cash-flow stress",
    "vendor_trust_score": "High vendor trust reflects reliable business relationships",
    "afhi_score": "The Alternative Financial Health Index reflects overall stability",
    "sector_type": "Sector-specific risk characteristics affect creditworthiness",
}


def _get_transformed_feature_names(preprocessor) -> list[str]:
    """Get feature names after the ColumnTransformer."""
    try:
        return list(preprocessor.get_feature_names_out())
    except Exception:
        # Fallback: build names manually
        names = []
        for name, trans, cols in preprocessor.transformers_:
            if trans == "drop" or cols is None:
                continue
            if hasattr(trans, "get_feature_names_out"):
                try:
                    out = list(trans.get_feature_names_out(cols))
                except Exception:
                    out = list(cols)
            else:
                out = list(cols)
            names.extend(out)
        return names


def _combine_sector_contributions(
    feature_names: list[str], shap_values_row: np.ndarray
) -> dict[str, float]:
    """Combine one-hot sector_type contributions into a single sector_type key."""
    contributions: dict[str, float] = {}
    for fname, val in zip(feature_names, shap_values_row):
        clean = fname
        if "__" in fname:
            clean = fname.split("__")[-1]
        if clean.startswith("sector_type_") or clean.startswith("sector_type"):
            key = "sector_type"
            contributions[key] = contributions.get(key, 0.0) + float(val)
        else:
            contributions[clean] = contributions.get(clean, 0.0) + float(val)
    return contributions


def _convert_to_points(
    contributions: dict[str, float], raw_shap_scale: float
) -> dict[str, float]:
    """Convert SHAP log-odds contributions to approximate score-point impacts."""
    return {k: v * raw_shap_scale for k, v in contributions.items()}


def _plain_english(feature: str, direction: str, points: float) -> str:
    base = _PLAIN_ENGLISH.get(feature, f"{feature} affects credit risk")
    verb = "added" if direction == "positive" else "reduced"
    pts = f"{abs(points):.0f}"
    if feature == "utility_delay_days":
        return f"Your utility payment delays {verb} {pts} points"
    if feature == "loan_amount":
        return f"Your loan amount {verb} {pts} points"
    if feature == "sector_type":
        return f"Your business sector {verb} {pts} points"
    if feature == "income":
        return f"Your income {verb} {pts} points to your credit score"
    return f"{base} — {verb} {pts} points"


def explain_single(data: dict, top_n: int = 5) -> list[dict]:
    """Generate SHAP top-N factors for a single business prediction.

    Returns list of {feature, impact_points, direction, plain_english}
    oriented so positive = raises credit score.
    """
    svc = get_model_service()
    preprocessor = svc.preprocessor
    classifier = svc.classifier
    default_idx = svc.default_idx

    df = pd.DataFrame([data])[MODEL_FEATURES]
    X_transformed = preprocessor.transform(df)
    if hasattr(X_transformed, "toarray"):
        X_transformed = X_transformed.toarray()

    feature_names = _get_transformed_feature_names(preprocessor)

    explainer = shap.TreeExplainer(classifier)
    shap_values = explainer.shap_values(X_transformed, check_additivity=False)
    # For binary XGBoost, shap_values may be a 2D array or a list
    if isinstance(shap_values, list):
        sv_row = shap_values[default_idx][0]
    elif shap_values.ndim == 3:
        sv_row = shap_values[0, :, default_idx]
    else:
        sv_row = shap_values[0]

    # For binary classification, SHAP values are in log-odds space.
    # The default class is index `default_idx`. A positive SHAP value for
    # the default class increases P(default), which LOWERS the credit score.
    # We want positive = raises credit score, so we negate.
    oriented = -sv_row if default_idx == 1 else sv_row
    # If default_idx is 1, negate (positive shap for default = bad)
    # If default_idx is 0, keep as is (positive shap for default = bad, but
    #   the credit score is 1-P(default) so we still want -shap)
    oriented = -sv_row  # always negate since positive shap => more default

    contributions = _combine_sector_contributions(feature_names, oriented)

    # Scale: approximate points. SHAP log-odds * ~10 gives rough point scale.
    raw_scale = 10.0
    points_map = _convert_to_points(contributions, raw_scale)

    ranked = sorted(points_map.items(), key=lambda kv: abs(kv[1]), reverse=True)
    top = ranked[:top_n]
    results = []
    for feat, pts in top:
        pts_r = round(float(pts), 1)
        direction = "positive" if pts_r >= 0 else "negative"
        results.append({
            "feature": feat,
            "impact_points": pts_r,
            "direction": direction,
            "plain_english": _plain_english(feat, direction, pts_r),
        })
    return results
