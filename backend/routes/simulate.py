"""Simulation route — scenario-based economic simulations."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.schemas import SimulateRequest
from backend.services.simulation_service import simulate

router = APIRouter()


@router.post("/api/simulate")
def simulate_route(req: SimulateRequest):
    try:
        data = req.model_dump()
        return simulate(data)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid input", "message": str(exc)[:300]},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "Simulation failed", "message": str(exc)[:300]},
        )
