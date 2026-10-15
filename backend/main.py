"""Vridhi.ai — FastAPI application entry point.

Architecture (TRD v2):
  - XGBoost imbalanced-learn pipeline (joblib-loaded, NOT pickle)
  - SHAP TreeExplainer on the classifier step only
  - statsmodels ExponentialSmoothing forecasting
  - Groq SDK chatbot with SSE streaming
  - Pydantic v2 schemas
  - Model loaded ONCE at startup via lifespan
"""
from __future__ import annotations

import os
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


load_dotenv(Path(__file__).resolve().parent / ".env")

from backend.model.model_service import get_model_service  # noqa: E402
from backend.routes import (  # noqa: E402
    batch,
    chat,
    fairness,
    forecast,
    health,
    predict,
    segmentation,
    simulate,
)
from backend.utils.portfolio_store import load_portfolio  # noqa: E402

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://localhost:3002,"
    "http://localhost:3005,http://localhost:5173,"
    "https://vridhi-ai.vercel.app,https://*.vercel.app"
).split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model, SHAP, and portfolio once at startup."""
    print("[Vridhi] Loading model...")
    svc = get_model_service()
    print(f"[Vridhi] Model loaded. Default class index: {svc.default_idx}, classes: {svc.classes_}")
    print("[Vridhi] Loading portfolio...")
    df = load_portfolio()
    print(f"[Vridhi] Portfolio loaded: {len(df)} businesses")
    yield
    print("[Vridhi] Shutting down...")


app = FastAPI(
    title="Vridhi.ai — Predictive Credit Risk Analytics",
    description="MSME credit-risk analytics platform with explainable AI, forecasting, and fairness analysis.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.getenv("ENV", "dev") == "dev" else [o.strip() for o in CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": str(exc)[:300]},
    )


# Register routers
app.include_router(health.router)
app.include_router(predict.router)
app.include_router(batch.router)
app.include_router(segmentation.router)
app.include_router(fairness.router)
app.include_router(simulate.router)
app.include_router(forecast.router)
app.include_router(chat.router)


@app.get("/")
def root():
    return {
        "name": "Vridhi.ai — Predictive Credit Risk Analytics Platform",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }
