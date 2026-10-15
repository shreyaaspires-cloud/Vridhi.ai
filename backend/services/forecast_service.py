"""Cash-flow forecasting service.

Uses statsmodels ExponentialSmoothing where appropriate, with a numpy
polyfit fallback for short/constant series.
"""
from __future__ import annotations

import numpy as np

FORECAST_HORIZON = 6


def _exponential_smoothing_forecast(history: list[float]) -> tuple[list[float], list[float], list[float], str]:
    """Forecast using ExponentialSmoothing. Returns (forecast, lower, upper, method)."""
    from statsmodels.tsa.holtwinters import ExponentialSmoothing

    h = np.array(history, dtype=float)
    model = ExponentialSmoothing(
        h, trend="add", seasonal=None, initialization_method="estimated"
    )
    fitted = model.fit()
    fc = fitted.forecast(FORECAST_HORIZON)
    forecast = fc.tolist()

    # Confidence bands from residual std
    resid = np.array(fitted.fittedvalues) - h
    resid = resid[np.isfinite(resid)]
    sigma = float(np.std(resid)) if len(resid) > 1 else float(np.std(h)) * 0.1
    if sigma == 0:
        sigma = float(np.std(h)) * 0.05 + 1.0
    lower = [f - 1.96 * sigma for f in forecast]
    upper = [f + 1.96 * sigma for f in forecast]
    return forecast, lower, upper, "ExponentialSmoothing (Holt linear)"


def _polyfit_forecast(history: list[float]) -> tuple[list[float], list[float], list[float], str]:
    """Fallback: numpy polyfit (linear trend extrapolation)."""
    h = np.array(history, dtype=float)
    n = len(h)
    x = np.arange(n)
    coeffs = np.polyfit(x, h, 1)  # linear
    future_x = np.arange(n, n + FORECAST_HORIZON)
    forecast = np.polyval(coeffs, future_x)
    resid = h - np.polyval(coeffs, x)
    sigma = float(np.std(resid))
    if sigma == 0:
        sigma = float(np.std(h)) * 0.05 + 1.0
    lower = (forecast - 1.96 * sigma).tolist()
    upper = (forecast + 1.96 * sigma).tolist()
    return forecast.tolist(), lower, upper, "numpy polyfit (linear fallback)"


def forecast_cashflow(revenue_history: list[float], monthly_emi: float = 0) -> dict:
    """Generate a 6-month cash-flow forecast with confidence bands and risky months."""
    h = [float(v) for v in revenue_history]
    if len(h) < 3:
        return {
            "historical": h,
            "forecast": [],
            "lower": [],
            "upper": [],
            "risky_months": [],
            "method": "insufficient data",
        }

    # Check for constant series (polyfit fallback)
    if np.std(h) < 1e-6:
        forecast, lower, upper, method = _polyfit_forecast(h)
    else:
        try:
            forecast, lower, upper, method = _exponential_smoothing_forecast(h)
        except Exception:
            forecast, lower, upper, method = _polyfit_forecast(h)

    # Clip negative forecasts to 0
    forecast = [max(0, f) for f in forecast]
    lower = [max(0, f) for f in lower]
    upper = [max(0, f) for f in upper]

    # Risky month logic
    trailing_avg = float(np.mean(h[-3:])) if len(h) >= 3 else float(np.mean(h))
    risky_months = []
    for i, f in enumerate(forecast):
        is_risky = False
        if monthly_emi > 0 and f < monthly_emi:
            is_risky = True
        if trailing_avg > 0 and f < 0.7 * trailing_avg:
            is_risky = True
        if is_risky:
            risky_months.append(i)

    return {
        "historical": h,
        "forecast": [round(f, 2) for f in forecast],
        "lower": [round(f, 2) for f in lower],
        "upper": [round(f, 2) for f in upper],
        "risky_months": risky_months,
        "method": method,
        "trailing_average": round(trailing_avg, 2),
        "monthly_emi": monthly_emi,
    }
