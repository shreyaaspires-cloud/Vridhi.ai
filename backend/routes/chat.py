"""Chatbot routes — Groq-powered Vridhi Assistant (non-streaming + SSE streaming)."""
from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from backend.schemas import ChatRequest
from backend.services.chatbot_service import chat, chat_stream

router = APIRouter()


@router.post("/api/chat")
def chat_route(req: ChatRequest):
    try:
        result = chat(req.message, [m.model_dump() for m in req.history], req.context)
        if result.get("error") and not result.get("reply"):
            return {"error": result["error"], "reply": None}
        return {"reply": result.get("reply"), "model": result.get("model"), "error": result.get("error")}
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "Chatbot error", "message": str(exc)[:300]},
        )


@router.post("/api/chat/stream")
def chat_stream_route(req: ChatRequest):
    def generate():
        try:
            yield from chat_stream(
                req.message,
                [m.model_dump() for m in req.history],
                req.context,
            )
        except Exception as exc:
            yield f'data: {json.dumps({"error": f"Stream error: {str(exc)[:200]}"})}\n\n'
    return StreamingResponse(generate(), media_type="text/event-stream")
