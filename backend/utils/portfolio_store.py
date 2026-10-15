"""In-memory portfolio store for scored businesses.

Loaded once at startup from scored_portfolio.csv if available.
New predictions are appended at runtime.
"""
from __future__ import annotations

import os
import threading

import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
SCORED_PATH = os.path.join(DATA_DIR, "scored_portfolio.csv")

_lock = threading.Lock()
_store: pd.DataFrame | None = None


def load_portfolio() -> pd.DataFrame:
    """Load the scored portfolio CSV into memory."""
    global _store
    if os.path.exists(SCORED_PATH):
        df = pd.read_csv(SCORED_PATH)
        _store = df
        return df
    _store = pd.DataFrame()
    return _store


def get_portfolio() -> pd.DataFrame:
    """Return the current portfolio DataFrame."""
    global _store
    if _store is None:
        return load_portfolio()
    return _store


def append_business(business_data: dict, prediction: dict) -> None:
    """Append a scored business to the in-memory portfolio."""
    global _store
    with _lock:
        row = {
            "business_name": business_data.get("business_name", "Untitled"),
            "income": business_data.get("income", 0),
            "loan_amount": business_data.get("loan_amount", 0),
            "gst_compliance_rate": business_data.get("gst_compliance_rate", 0),
            "monthly_upi_volume": business_data.get("monthly_upi_volume", 0),
            "utility_delay_days": business_data.get("utility_delay_days", 0),
            "vendor_trust_score": business_data.get("vendor_trust_score", 0),
            "sector_type": business_data.get("sector_type", "Services"),
            "afhi_score": business_data.get("afhi_score", 0),
            "owner_gender": business_data.get("owner_gender", "Unspecified"),
            "region": business_data.get("region", "Unknown"),
            "business_size": business_data.get("business_size", "Micro"),
            "years_in_operation": business_data.get("years_in_operation", 0),
            "employee_count": business_data.get("employee_count", 0),
            "risk_score": prediction.get("risk_score", 0),
            "risk_label": prediction.get("risk_label", "Unknown"),
            "approved": 1 if prediction.get("risk_score", 0) >= 55 else 0,
        }
        new_row = pd.DataFrame([row])
        if _store is None or _store.empty:
            _store = new_row
        else:
            _store = pd.concat([_store, new_row], ignore_index=True)
        try:
            os.makedirs(DATA_DIR, exist_ok=True)
            _store.to_csv(SCORED_PATH, index=False)
        except Exception as err:
            print(f"[portfolio_store] Failed to save portfolio CSV: {err}")


def is_loaded() -> bool:
    return _store is not None
