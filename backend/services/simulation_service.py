"""Scenario simulation service.

Applies documented multipliers to relevant features based on macro
scenarios, clamps values to valid ranges, and returns before/after scores.
"""
from __future__ import annotations

import pandas as pd

from backend.model.model_service import VALID_RANGES, get_model_service
from backend.services.prediction_service import predict_business

# Macro scenario multipliers applied to feature deltas
MACRO_MULTIPLIERS = {
    "baseline": {
        "income_mult": 1.0,
        "upi_mult": 1.0,
        "gst_adjust": 0,
        "utility_adjust": 0,
        "vendor_adjust": 0,
        "loan_mult": 1.0,
    },
    "recession": {
        "income_mult": 0.85,
        "upi_mult": 0.75,
        "gst_adjust": -8,
        "utility_adjust": 8,
        "vendor_adjust": -10,
        "loan_mult": 1.1,
    },
    "inflation_spike": {
        "income_mult": 1.05,
        "upi_mult": 1.10,
        "gst_adjust": -5,
        "utility_adjust": 5,
        "vendor_adjust": -5,
        "loan_mult": 1.15,
    },
    "interest_rate_hike": {
        "income_mult": 0.95,
        "upi_mult": 0.90,
        "gst_adjust": -3,
        "utility_adjust": 4,
        "vendor_adjust": -3,
        "loan_mult": 1.20,
    },
    "festive_boom": {
        "income_mult": 1.20,
        "upi_mult": 1.35,
        "gst_adjust": 5,
        "utility_adjust": -3,
        "vendor_adjust": 8,
        "loan_mult": 0.95,
    },
}


def _clamp(value: float, feature: str) -> float:
    lo, hi = VALID_RANGES.get(feature, (0, float("inf")))
    return max(lo, min(hi, value))


def _label(score: float) -> str:
    if score >= 70:
        return "LOW"
    elif score >= 40:
        return "MEDIUM"
    return "HIGH"


def simulate(data: dict) -> dict:
    """Run a scenario simulation and return before/after scores."""
    svc = get_model_service()
    original = svc.predict_single(data)
    original_score = original["risk_score"]

    macro = MACRO_MULTIPLIERS.get(data["macro_scenario"], MACRO_MULTIPLIERS["baseline"])

    # Apply user-specified percentage/absolute changes first
    new_income = data["income"] * (1 + data["income_change_pct"] / 100)
    new_loan = data["loan_amount"] * (1 + data["loan_amount_change_pct"] / 100)
    new_gst = data["gst_compliance_rate"] + data["gst_compliance_change"]
    new_utility = data["utility_delay_days"] + data["utility_delay_change"]
    new_upi = data["monthly_upi_volume"] * (1 + data["upi_volume_change_pct"] / 100)
    new_vendor = data["vendor_trust_score"] + data["vendor_trust_change"]

    # Then apply macro multipliers on top
    new_income = new_income * macro["income_mult"]
    new_upi = new_upi * macro["upi_mult"]
    new_gst = new_gst + macro["gst_adjust"]
    new_utility = new_utility + macro["utility_adjust"]
    new_vendor = new_vendor + macro["vendor_adjust"]
    new_loan = new_loan * macro["loan_mult"]

    # Clamp to valid ranges
    new_income = _clamp(new_income, "income")
    new_loan = _clamp(new_loan, "loan_amount")
    new_gst = _clamp(new_gst, "gst_compliance_rate")
    new_utility = _clamp(new_utility, "utility_delay_days")
    new_upi = _clamp(new_upi, "monthly_upi_volume")
    new_vendor = _clamp(new_vendor, "vendor_trust_score")

    new_data = {
        **data,
        "income": new_income,
        "loan_amount": new_loan,
        "gst_compliance_rate": new_gst,
        "utility_delay_days": new_utility,
        "monthly_upi_volume": new_upi,
        "vendor_trust_score": new_vendor,
    }

    new_result = svc.predict_single(new_data)
    new_score = new_result["risk_score"]
    delta = round(new_score - original_score, 1)
    old_label = _label(original_score)
    new_label = _label(new_score)

    # Human-readable message
    scenario_name = data["macro_scenario"].replace("_", " ").title()
    if delta > 0:
        direction = f"improves by {delta:.1f} points"
    elif delta < 0:
        direction = f"decreases by {abs(delta):.1f} points"
    else:
        direction = "remains unchanged"

    if data["macro_scenario"] == "baseline":
        msg = (f"Under baseline conditions with your specified changes, "
               f"the credit score {direction} (from {original_score:.1f} to {new_score:.1f}).")
    else:
        msg = (f"Under the {scenario_name} scenario with your specified changes, "
               f"the credit score {direction} (from {original_score:.1f} to {new_score:.1f}).")

    if old_label != new_label:
        msg += f" Risk classification shifts from {old_label} to {new_label}."

    applied = {
        "income": round(new_income, 2),
        "loan_amount": round(new_loan, 2),
        "gst_compliance_rate": round(new_gst, 2),
        "utility_delay_days": round(new_utility, 2),
        "monthly_upi_volume": round(new_upi, 2),
        "vendor_trust_score": round(new_vendor, 2),
        "macro_scenario": data["macro_scenario"],
    }

    return {
        "original_score": original_score,
        "new_score": new_score,
        "delta": delta,
        "old_label": old_label,
        "new_label": new_label,
        "message": msg,
        "applied_multipliers": applied,
    }
