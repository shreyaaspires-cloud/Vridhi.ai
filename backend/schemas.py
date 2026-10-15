"""Pydantic v2 schemas for all API request/response models."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator


# -- Model input features -------------------------------------------------
class ModelFeatures(BaseModel):
    income: float = Field(..., ge=0, le=100_000_000, description="Annual income in INR")
    loan_amount: float = Field(..., ge=0, le=100_000_000, description="Requested loan amount in INR")
    gst_compliance_rate: float = Field(..., ge=0, le=100, description="GST compliance rate (0-100)")
    monthly_upi_volume: float = Field(..., ge=0, le=10_000_000, description="Monthly UPI transaction volume in INR")
    utility_delay_days: float = Field(..., ge=0, le=365, description="Average utility payment delay in days")
    vendor_trust_score: float = Field(..., ge=0, le=100, description="Vendor trust score (0-100)")
    sector_type: str = Field(..., description="Business sector: Manufacturing, Retail, or Services")
    afhi_score: float = Field(..., ge=0, le=100, description="Alternative Financial Health Index (0-100)")

    @field_validator("sector_type")
    @classmethod
    def validate_sector(cls, v: str) -> str:
        allowed = ["Manufacturing", "Retail", "Services"]
        if v not in allowed:
            raise ValueError(f"sector_type must be one of {allowed}")
        return v


# -- Metadata / audit fields ----------------------------------------------
class AuditMetadata(BaseModel):
    business_name: str = Field(default="Untitled Business")
    owner_gender: str = Field(default="Unspecified")
    region: str = Field(default="Unknown")
    business_size: str = Field(default="Micro")
    years_in_operation: float = Field(default=0, ge=0)
    employee_count: float = Field(default=0, ge=0)


# -- Full prediction request ----------------------------------------------
class PredictRequest(BaseModel):
    business_name: str = Field(default="Untitled Business")
    income: float = Field(..., ge=0, le=100_000_000)
    loan_amount: float = Field(..., ge=0, le=100_000_000)
    gst_compliance_rate: float = Field(..., ge=0, le=100)
    monthly_upi_volume: float = Field(..., ge=0, le=10_000_000)
    utility_delay_days: float = Field(..., ge=0, le=365)
    vendor_trust_score: float = Field(..., ge=0, le=100)
    sector_type: str = Field(...)
    afhi_score: float = Field(..., ge=0, le=100)
    owner_gender: str = Field(default="Unspecified")
    region: str = Field(default="Unknown")
    business_size: str = Field(default="Micro")
    years_in_operation: float = Field(default=0, ge=0)
    employee_count: float = Field(default=0, ge=0)
    revenue_history: list[float] = Field(default_factory=list)

    @field_validator("sector_type")
    @classmethod
    def validate_sector(cls, v: str) -> str:
        allowed = ["Manufacturing", "Retail", "Services"]
        if v not in allowed:
            raise ValueError(f"sector_type must be one of {allowed}")
        return v


# -- SHAP factor ----------------------------------------------------------
class ShapFactor(BaseModel):
    feature: str
    impact_points: float
    direction: str  # "positive" | "negative"
    plain_english: str


# -- Loan recommendation --------------------------------------------------
class LoanRecommendation(BaseModel):
    eligibility: str
    suggested_amount: float
    interest_rate_range: str
    repayment_period_months: int
    reasons: list[str]
    conditions: list[str]


# -- Prediction response --------------------------------------------------
class PredictResponse(BaseModel):
    business_name: str
    risk_score: float
    risk_label: str
    confidence: float
    default_probability: float
    factors: list[ShapFactor]
    recommendation: dict[str, Any]


# -- Simulation -----------------------------------------------------------
class SimulateRequest(BaseModel):
    income: float = Field(..., ge=0)
    loan_amount: float = Field(..., ge=0)
    gst_compliance_rate: float = Field(..., ge=0, le=100)
    monthly_upi_volume: float = Field(..., ge=0)
    utility_delay_days: float = Field(..., ge=0)
    vendor_trust_score: float = Field(..., ge=0, le=100)
    sector_type: str = Field(...)
    afhi_score: float = Field(..., ge=0, le=100)
    income_change_pct: float = Field(default=0, ge=-80, le=200)
    loan_amount_change_pct: float = Field(default=0, ge=-80, le=200)
    gst_compliance_change: float = Field(default=0, ge=-50, le=50)
    utility_delay_change: float = Field(default=0, ge=-60, le=120)
    upi_volume_change_pct: float = Field(default=0, ge=-80, le=200)
    vendor_trust_change: float = Field(default=0, ge=-50, le=50)
    macro_scenario: str = Field(default="baseline")

    @field_validator("sector_type")
    @classmethod
    def validate_sector(cls, v: str) -> str:
        allowed = ["Manufacturing", "Retail", "Services"]
        if v not in allowed:
            raise ValueError(f"sector_type must be one of {allowed}")
        return v

    @field_validator("macro_scenario")
    @classmethod
    def validate_scenario(cls, v: str) -> str:
        allowed = ["baseline", "recession", "inflation_spike", "interest_rate_hike", "festive_boom"]
        if v not in allowed:
            raise ValueError(f"macro_scenario must be one of {allowed}")
        return v


class SimulateResponse(BaseModel):
    original_score: float
    new_score: float
    delta: float
    old_label: str
    new_label: str
    message: str
    applied_multipliers: dict[str, Any]


# -- Forecast -------------------------------------------------------------
class ForecastRequest(BaseModel):
    revenue_history: list[float] = Field(..., min_length=6, max_length=12)
    monthly_emi: float = Field(default=0, ge=0)


class ForecastResponse(BaseModel):
    historical: list[float]
    forecast: list[float]
    lower: list[float]
    upper: list[float]
    risky_months: list[int]
    method: str


# -- Chatbot --------------------------------------------------------------
class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=10)
    context: dict[str, Any] = Field(default_factory=dict)


# -- Segmentation filters -------------------------------------------------
class SegmentationParams(BaseModel):
    sector: str | None = None
    region: str | None = None
    size: str | None = None
    x: str = Field(default="income")
    y: str = Field(default="risk_score")
