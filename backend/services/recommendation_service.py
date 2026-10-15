"""Loan recommendation engine — rule-based, demo-oriented.

Recommendations are based on the credit risk score and are explicitly
NOT real bank approvals.
"""
from __future__ import annotations


def generate_recommendation(risk_score: float, risk_label: str, data: dict) -> dict:
    """Generate a loan recommendation based on risk score."""
    income = data.get("income", 0)
    loan_amount = data.get("loan_amount", 0)
    sector = data.get("sector_type", "Services")

    reasons = []
    conditions = []

    if risk_label == "LOW":
        eligibility = "Eligible — Strong Profile"
        suggested = min(loan_amount * 1.5, income * 0.6)
        interest = "9.5% – 11.5% p.a."
        repayment = 60
        reasons.append("Strong credit score indicates low default risk")
        reasons.append("Healthy alternative-data signals support repayment capacity")
        conditions.append("Standard KYC and business verification required")
        conditions.append("GST returns for last 12 months as supporting evidence")
    elif risk_label == "MEDIUM":
        eligibility = "Conditionally Eligible"
        suggested = min(loan_amount * 1.0, income * 0.4)
        interest = "12% – 15% p.a."
        repayment = 36
        reasons.append("Moderate credit score — some risk factors identified")
        reasons.append("Eligible with additional safeguards and monitoring")
        conditions.append("Collateral or guarantor may be required")
        conditions.append("Quarterly cash-flow review recommended")
        conditions.append("Consider improving GST compliance before application")
    else:
        eligibility = "Not Eligible — High Risk"
        suggested = 0
        interest = "N/A"
        repayment = 0
        reasons.append("Credit score below approval threshold")
        reasons.append("Significant risk factors detected in alternative data")
        conditions.append("Recommend 3–6 month credit improvement plan")
        conditions.append("Re-apply after improving GST compliance and reducing utility delays")
        conditions.append("Consider secured loan products or co-applicant")

    if sector == "Manufacturing":
        conditions.append("Factory license and pollution control certificate required")
    elif sector == "Retail":
        conditions.append("Shop establishment certificate required")
    else:
        conditions.append("Service tax registration proof required")

    return {
        "eligibility": eligibility,
        "suggested_amount": round(suggested, 2),
        "interest_rate_range": interest,
        "repayment_period_months": repayment,
        "reasons": reasons,
        "conditions": conditions,
        "disclaimer": "This is a demo rule-based recommendation, not an actual bank approval.",
    }
