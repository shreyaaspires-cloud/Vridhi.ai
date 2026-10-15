"""Generate realistic mock data for ~300 Indian MSMEs.

Produces:
  msme_mock.csv   — raw business data with 8 model features + metadata + 12-month revenue
  scored_portfolio.csv — the above plus risk_score, risk_label, approved (from the REAL model)

Usage:
  python generate_mock_data.py
"""
from __future__ import annotations

import os

import numpy as np
import pandas as pd

from backend.model.model_service import get_model_service

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
MOCK_PATH = os.path.join(DATA_DIR, "msme_mock.csv")
SCORED_PATH = os.path.join(DATA_DIR, "scored_portfolio.csv")

SECTORS = ["Manufacturing", "Retail", "Services"]
REGIONS = ["North", "South", "East", "West", "Central"]
SIZES = ["Micro", "Small", "Medium"]
GENDERS = ["Male", "Female"]

BUSINESS_PREFIXES = [
    "Sri", "Shree", "Mahalaxmi", "Ganesh", "Bharat", "Anand", "Sai",
    "Balaji", "Krishna", "Shakti", "New", "Royal", "Sunrise", "Apex",
    "Prime", "Global", "Unity", "Pioneer", "Excel", "Vijay",
]
BUSINESS_SUFFIXES = [
    "Enterprises", "Industries", "Traders", "Exports", "Trading Co",
    "Manufacturing Co", "Associates", "Textiles", "Food Products",
    "Agro Tech", "Steel Works", "Plastics", "Electronics", "Pharma",
    "Handlooms", "Infotech", "Logistics", "Constructions", "Foods",
    "Chemicals",
]


def generate_businesses(n: int = 300, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    sector = rng.choice(SECTORS, size=n, p=[0.35, 0.40, 0.25])
    region = rng.choice(REGIONS, size=n)
    size = rng.choice(SIZES, size=n, p=[0.55, 0.35, 0.10])
    owner_gender = rng.choice(GENDERS, size=n, p=[0.72, 0.28])

    # Size-based income scaling
    size_mult = np.where(size == "Micro", 0.5,
                np.where(size == "Small", 1.0, 2.5))
    income = (rng.lognormal(14.3, 0.5, n) * size_mult).clip(150_000, 20_000_000)

    loan_amount = (income * rng.uniform(0.08, 0.5, n)).clip(50_000, 15_000_000)
    gst_compliance_rate = rng.normal(85, 15, n).clip(0, 100)
    monthly_upi_volume = (income * rng.uniform(0.03, 0.18, n) / 12).clip(0, 800_000)
    utility_delay_days = rng.gamma(1.5, 3, n).clip(0, 50)
    vendor_trust_score = rng.normal(78, 14, n).clip(0, 100)
    afhi_score = rng.normal(72, 15, n).clip(0, 100)

    years_in_operation = rng.integers(1, 30, n)
    employee_count = (income / 200_000 * rng.uniform(0.5, 3, n)).clip(1, 500).astype(int)

    # Revenue history (12 months) — roughly correlated with income with seasonality
    base_monthly = income / 12
    rev_cols = {}
    for m in range(1, 13):
        seasonal = 1 + 0.15 * np.sin(2 * np.pi * m / 12 + rng.uniform(0, 1))
        noise = rng.normal(1, 0.15, n)
        rev = (base_monthly * seasonal * noise).clip(5000, 5_000_000)
        rev_cols[f"rev_m{m}"] = rev.round(2)

    business_names = []
    for i in range(n):
        pfx = rng.choice(BUSINESS_PREFIXES)
        sfx = rng.choice(BUSINESS_SUFFIXES)
        business_names.append(f"{pfx} {sfx} {i+1:03d}")

    df = pd.DataFrame({
        "business_name": business_names,
        "income": income.round(2),
        "loan_amount": loan_amount.round(2),
        "gst_compliance_rate": gst_compliance_rate.round(2),
        "monthly_upi_volume": monthly_upi_volume.round(2),
        "utility_delay_days": utility_delay_days.round(2),
        "vendor_trust_score": vendor_trust_score.round(2),
        "sector_type": sector,
        "afhi_score": afhi_score.round(2),
        "owner_gender": owner_gender,
        "region": region,
        "business_size": size,
        "years_in_operation": years_in_operation,
        "employee_count": employee_count,
        **rev_cols,
    })
    return df


def score_portfolio(df: pd.DataFrame) -> pd.DataFrame:
    svc = get_model_service()
    results = svc.predict_batch(df)
    scored = df.copy()
    scored["risk_score"] = [r["risk_score"] for r in results]
    scored["risk_label"] = [r["risk_label"] for r in results]
    scored["approved"] = (scored["risk_score"] >= 55).astype(int)
    return scored


def main() -> None:
    print("Generating mock MSME data...")
    df = generate_businesses(n=300)
    df.to_csv(MOCK_PATH, index=False)
    print(f"Saved {len(df)} businesses to {MOCK_PATH}")

    print("Scoring portfolio with real model...")
    scored = score_portfolio(df)
    scored.to_csv(SCORED_PATH, index=False)
    print(f"Saved scored portfolio to {SCORED_PATH}")

    print("\nPortfolio summary:")
    print(f"  Total: {len(scored)}")
    print(f"  LOW: {(scored.risk_label == 'LOW').sum()}")
    print(f"  MEDIUM: {(scored.risk_label == 'MEDIUM').sum()}")
    print(f"  HIGH: {(scored.risk_label == 'HIGH').sum()}")
    print(f"  Avg score: {scored.risk_score.mean():.1f}")
    print(f"  Approval rate: {scored.approved.mean():.1%}")


if __name__ == "__main__":
    main()
