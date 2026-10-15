"""Model service: load the imblearn pipeline once, identify the default class,
and expose prediction helpers.

Loaded ONCE at application startup via the lifespan context.
"""
from __future__ import annotations

import os
from functools import lru_cache
from typing import Sequence

import joblib
import numpy as np
import pandas as pd

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, "vridhi_multidataset_model.pkl")

NUMERIC_FEATURES = [
    "income",
    "loan_amount",
    "gst_compliance_rate",
    "monthly_upi_volume",
    "utility_delay_days",
    "vendor_trust_score",
    "afhi_score",
]
CATEGORICAL_FEATURES = ["sector_type"]
MODEL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
VALID_SECTORS = ["Manufacturing", "Retail", "Services"]

VALID_RANGES = {
    "income": (10_000, 100_000_000),
    "loan_amount": (1_000, 100_000_000),
    "gst_compliance_rate": (0, 100),
    "monthly_upi_volume": (0, 10_000_000),
    "utility_delay_days": (0, 365),
    "vendor_trust_score": (0, 100),
    "afhi_score": (0, 100),
}

# Strong (credit-healthy) and weak (credit-risky) samples used to
# auto-detect which class index corresponds to "default".
STRONG_SAMPLE = {
    "income": 9_000_000,
    "loan_amount": 400_000,
    "gst_compliance_rate": 98,
    "monthly_upi_volume": 450_000,
    "utility_delay_days": 0,
    "vendor_trust_score": 95,
    "sector_type": "Manufacturing",
    "afhi_score": 92,
}
WEAK_SAMPLE = {
    "income": 300_000,
    "loan_amount": 5_000_000,
    "gst_compliance_rate": 35,
    "monthly_upi_volume": 5_000,
    "utility_delay_days": 45,
    "vendor_trust_score": 25,
    "sector_type": "Retail",
    "afhi_score": 28,
}


def _identify_default_index(model, classes: Sequence) -> int:
    """Identify which class index corresponds to 'default'.

    A credit-healthy (strong) sample should have a LOWER P(default) than a
    credit-risky (weak) sample. The default class is the one whose
    probability is higher for the weak sample and lower for the strong
    sample.
    """
    df_s = pd.DataFrame([STRONG_SAMPLE])[MODEL_FEATURES]
    df_w = pd.DataFrame([WEAK_SAMPLE])[MODEL_FEATURES]
    p_s = model.predict_proba(df_s)[0]
    p_w = model.predict_proba(df_w)[0]
    # The default class should have higher proba for weak than strong
    diff = p_w - p_s
    default_idx = int(np.argmax(diff))
    # Sanity: the difference must be meaningful (>0.1)
    if diff[default_idx] < 0.1:
        # Fallback: assume class 1 is default for binary classifiers
        if len(classes) == 2 and 1 in classes:
            default_idx = list(classes).index(1)
    return default_idx


class ModelService:
    """Wraps the loaded imblearn pipeline and exposes prediction helpers."""

    def __init__(self, model_path: str = MODEL_PATH):
        self.model_path = model_path
        self.model = joblib.load(model_path)
        self.classes_ = list(self.model.classes_)
        self.default_idx = _identify_default_index(self.model, self.classes_)
        self.preprocessor = self.model.named_steps["preprocessor"]
        self.classifier = self.model.named_steps["classifier"]

    # -- core prediction -------------------------------------------------
    def predict_proba(self, df: pd.DataFrame) -> np.ndarray:
        """Return predict_proba for the given DataFrame of raw features."""
        X = df[MODEL_FEATURES].copy()
        return self.model.predict_proba(X)

    def default_probability(self, df: pd.DataFrame) -> np.ndarray:
        """Return P(default) for each row."""
        proba = self.predict_proba(df)
        return proba[:, self.default_idx]

    def predict_single(self, data: dict) -> dict:
        """Predict for a single business. Returns raw prediction components."""
        df = pd.DataFrame([data])[MODEL_FEATURES]
        proba = self.predict_proba(df)[0]
        p_default = float(proba[self.default_idx])
        p_nondefault = 1.0 - p_default
        risk_score = round(p_nondefault * 100, 1)
        if risk_score >= 70:
            label = "LOW"
        elif risk_score >= 40:
            label = "MEDIUM"
        else:
            label = "HIGH"
        confidence = float(max(proba))
        return {
            "risk_score": risk_score,
            "risk_label": label,
            "confidence": round(confidence, 4),
            "default_probability": round(p_default, 4),
            "classes": [int(c) for c in self.classes_],
            "default_class_index": int(self.default_idx),
            "probabilities": [float(p) for p in proba],
        }

    def predict_batch(self, df: pd.DataFrame) -> list[dict]:
        """Vectorized batch prediction. Single predict_proba call."""
        proba = self.predict_proba(df)
        p_def = proba[:, self.default_idx]
        p_nondef = 1.0 - p_def
        scores = np.round(p_nondef * 100, 1)
        out = []
        for i in range(len(df)):
            s = float(scores[i])
            if s >= 70:
                label = "LOW"
            elif s >= 40:
                label = "MEDIUM"
            else:
                label = "HIGH"
            out.append({
                "risk_score": s,
                "risk_label": label,
                "confidence": round(float(max(proba[i])), 4),
                "default_probability": round(float(p_def[i]), 4),
            })
        return out


@lru_cache(maxsize=1)
def get_model_service() -> ModelService:
    """Singleton model service loaded once per process."""
    return ModelService(MODEL_PATH)
