"""Train a synthetic imbalanced-learn pipeline matching the TRD v2 architecture.

Produces vridhi_multidataset_model.pkl containing:
  ColumnTransformer (RobustScaler on numerics + OneHotEncoder on sector_type)
  -> SMOTE -> XGBClassifier

The pipeline accepts EXACTLY 8 raw features:
  income, loan_amount, gst_compliance_rate, monthly_upi_volume,
  utility_delay_days, vendor_trust_score, sector_type, afhi_score

This script is used ONCE during project setup to create the supplied model
artifact. It is NOT run at request time and must NOT be used to retrain or
replace an already-supplied model.
"""
from __future__ import annotations

import os

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, RobustScaler
from xgboost import XGBClassifier

RNG = 42
NUMERIC = [
    "income",
    "loan_amount",
    "gst_compliance_rate",
    "monthly_upi_volume",
    "utility_delay_days",
    "vendor_trust_score",
    "afhi_score",
]
CATEGORICAL = ["sector_type"]
FEATURES = NUMERIC + CATEGORICAL
SECTORS = ["Manufacturing", "Retail", "Services"]


def _synthetic_dataset(n: int = 4000, seed: int = RNG) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    sector = rng.choice(SECTORS, size=n, p=[0.4, 0.35, 0.25])
    income = rng.normal(2_500_000, 1_200_000, n).clip(150_000, 20_000_000)
    loan_amount = rng.normal(1_000_000, 600_000, n).clip(50_000, 15_000_000)
    gst_compliance_rate = rng.normal(82, 18, n).clip(0, 100)
    monthly_upi_volume = rng.normal(120_000, 70_000, n).clip(0, 800_000)
    utility_delay_days = rng.gamma(2, 4, n).clip(0, 60)
    vendor_trust_score = rng.normal(72, 16, n).clip(0, 100)
    afhi_score = rng.normal(68, 18, n).clip(0, 100)

    # Sector adjustments
    sector_mult = np.where(sector == "Manufacturing", 1.05,
                  np.where(sector == "Retail", 0.95, 1.0))

    # Health score drives default probability (higher = safer)
    health = (
        0.32 * (income / 20_000_000)
        + 0.24 * (gst_compliance_rate / 100)
        + 0.20 * (monthly_upi_volume / 800_000)
        + 0.14 * (vendor_trust_score / 100)
        + 0.12 * (afhi_score / 100)
        - 0.22 * (loan_amount / 15_000_000)
        - 0.18 * (utility_delay_days / 60)
    ) * sector_mult
    health = health + rng.normal(0, 0.01, n)
    prob_default = 1.0 / (1.0 + np.exp((health - 0.42) * 14.0))
    prob_default = prob_default.clip(0.01, 0.97)
    default = (rng.random(n) < prob_default).astype(int)

    df = pd.DataFrame({
        "income": income.round(2),
        "loan_amount": loan_amount.round(2),
        "gst_compliance_rate": gst_compliance_rate.round(2),
        "monthly_upi_volume": monthly_upi_volume.round(2),
        "utility_delay_days": utility_delay_days.round(2),
        "vendor_trust_score": vendor_trust_score.round(2),
        "sector_type": sector,
        "afhi_score": afhi_score.round(2),
        "default": default,
    })
    return df


def build_pipeline() -> ImbPipeline:
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", RobustScaler(), NUMERIC),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL),
        ],
        remainder="drop",
    )
    clf = XGBClassifier(
        n_estimators=400,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=RNG,
        n_jobs=1,
        verbosity=0,
    )
    return ImbPipeline([
        ("preprocessor", preprocessor),
        ("smote", SMOTE(random_state=RNG, k_neighbors=5)),
        ("classifier", clf),
    ])


def main(out_path: str | None = None) -> str:
    if out_path is None:
        out_path = os.path.join(os.path.dirname(__file__), "vridhi_multidataset_model.pkl")
    df = _synthetic_dataset()
    X = df[FEATURES]
    y = df["default"]
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=RNG, stratify=y)
    pipe = build_pipeline()
    pipe.fit(X_tr, y_tr)
    acc = pipe.score(X_te, y_te)
    print(f"Model trained. Test accuracy: {acc:.4f}")
    print(f"Default class balance (train): {y_tr.mean():.3f}")
    # Quick sanity: strong vs weak sample
    strong = pd.DataFrame([{
        "income": 9_000_000, "loan_amount": 400_000, "gst_compliance_rate": 98,
        "monthly_upi_volume": 450_000, "utility_delay_days": 0,
        "vendor_trust_score": 95, "sector_type": "Manufacturing", "afhi_score": 92,
    }])
    weak = pd.DataFrame([{
        "income": 300_000, "loan_amount": 5_000_000, "gst_compliance_rate": 35,
        "monthly_upi_volume": 5_000, "utility_delay_days": 45,
        "vendor_trust_score": 25, "sector_type": "Retail", "afhi_score": 28,
    }])
    p_strong = pipe.predict_proba(strong)[0]
    p_weak = pipe.predict_proba(weak)[0]
    print(f"Strong sample proba: {p_strong}")
    print(f"Weak sample proba:   {p_weak}")
    joblib.dump(pipe, out_path)
    print(f"Saved model to {out_path}")
    return out_path


if __name__ == "__main__":
    main()
