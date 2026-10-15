"""Groq-powered chatbot service for the Vridhi Assistant.

The assistant is a credit-risk explainer that uses ONLY supplied application
context. It never invents scores or financial figures.
"""
from __future__ import annotations

import json
import os
from typing import Any

from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-8b-8192")
MAX_HISTORY = 10

SYSTEM_IDENTITY = """You are Vridhi Assistant, an AI credit-risk explainer for an MSME predictive credit-risk analytics platform called Vridhi.ai.

Your target users are bank officers, NBFC analysts, MSME owners, and regulators.

CORE RULES:
1. Use ONLY the application context provided to you. Never invent scores, probabilities, or financial figures.
2. Never promise or guarantee loan approval. Recommendations are demo-oriented and rule-based.
3. Explain risk factors, SHAP factors, scenario simulations, cash-flow forecasts, and fairness results clearly.
4. Provide actionable, practical suggestions for improving credit scores.
5. Politely redirect questions unrelated to credit risk, MSME lending, or this platform.
6. Be concise, professional, and helpful. Use plain language suitable for non-technical users.
7. When explaining SHAP factors, relate them to the specific business context provided.
8. Always clarify that fairness attributes (gender, region, sector) are audit metadata and NOT model inputs.
"""


def _build_context_prompt(context: dict[str, Any]) -> str:
    """Build the context injection string for the system prompt."""
    if not context:
        return "No specific business context is currently available. Answer generally about credit risk concepts."

    parts = ["CURRENT APPLICATION CONTEXT (use only this data, do not invent figures):"]

    if context.get("business_name"):
        parts.append(f"- Business: {context['business_name']}")
    if context.get("risk_score") is not None:
        parts.append(f"- Credit Risk Score: {context['risk_score']}/100")
    if context.get("risk_label"):
        parts.append(f"- Risk Label: {context['risk_label']}")
    if context.get("confidence") is not None:
        parts.append(f"- Model Confidence: {context['confidence']}")
    if context.get("default_probability") is not None:
        parts.append(f"- Default Probability: {context['default_probability']}")
    if context.get("factors"):
        parts.append("- Top Risk Factors:")
        for f in context["factors"][:5]:
            parts.append(f"  * {f.get('feature','?')}: {f.get('impact_points',0)} pts ({f.get('direction','?')}) — {f.get('plain_english','')}")
    if context.get("recommendation"):
        rec = context["recommendation"]
        parts.append(f"- Loan Recommendation: {rec.get('eligibility','?')}")
        if rec.get("suggested_amount"):
            parts.append(f"  Suggested Amount: ₹{rec['suggested_amount']:,.0f}")
        if rec.get("interest_rate_range"):
            parts.append(f"  Interest Rate: {rec['interest_rate_range']}")
    if context.get("simulation"):
        sim = context["simulation"]
        parts.append(f"- Simulation Result: {sim.get('message','')}")
    if context.get("fairness"):
        parts.append(f"- Fairness Summary: {context['fairness']}")
    if context.get("forecast"):
        parts.append(f"- Forecast: {context['forecast']}")

    return "\n".join(parts)


def _get_client() -> Groq | None:
    api_key = os.getenv("GROQ_API_KEY", "") or GROQ_API_KEY
    if not api_key:
        return None
    return Groq(api_key=api_key)


def chat(message: str, history: list[dict], context: dict) -> dict:
    """Non-streaming chat. Returns the assistant's reply."""
    client = _get_client()
    key_present = bool(os.getenv("GROQ_API_KEY", "") or GROQ_API_KEY)
    model_name = os.getenv("GROQ_MODEL", GROQ_MODEL)
    print(f"[Groq] Key present: {key_present}, Model: {model_name}")
    if client is None:
        return {
            "error": "Groq API key is not configured. Set GROQ_API_KEY in the backend environment.",
            "reply": None,
        }

    context_prompt = _build_context_prompt(context)
    messages = [
        {"role": "system", "content": SYSTEM_IDENTITY + "\n\n" + context_prompt},
    ]
    # Keep only last MAX_HISTORY turns
    for h in history[-MAX_HISTORY:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    try:
        resp = client.chat.completions.create(
            model=model_name,
            messages=messages,
            max_tokens=1024,
            temperature=0.4,
        )
        reply = resp.choices[0].message.content
        return {"reply": reply, "model": model_name}
    except Exception as exc:
        print(f"[Groq] Exception in chat(): {exc}")
        msg = str(exc).lower()
        if "rate_limit" in msg or "rate limit" in msg:
            return {"error": "The AI service rate limit was reached. Please try again in a moment."}
        if "timeout" in msg:
            return {"error": "The AI service timed out. Please try again."}
        if "invalid_api_key" in msg or "unauthorized" in msg:
            return {"error": "The Groq API key appears to be invalid. Please check the backend configuration."}
        return {"error": f"The AI service encountered an error: {str(exc)[:200]}"}


def chat_stream(message: str, history: list[dict], context: dict):
    """Streaming chat generator yielding SSE-formatted text chunks."""
    client = _get_client()
    key_present = bool(os.getenv("GROQ_API_KEY", "") or GROQ_API_KEY)
    model_name = os.getenv("GROQ_MODEL", GROQ_MODEL)
    print(f"[Groq] Key present: {key_present}, Model: {model_name}")
    if client is None:
        yield 'data: {"error": "Groq API key is not configured. Set GROQ_API_KEY in the backend environment."}\n\n'
        return

    context_prompt = _build_context_prompt(context)
    messages = [
        {"role": "system", "content": SYSTEM_IDENTITY + "\n\n" + context_prompt},
    ]
    for h in history[-MAX_HISTORY:]:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    try:
        stream = client.chat.completions.create(
            model=model_name,
            messages=messages,
            max_tokens=1024,
            temperature=0.4,
            stream=True,
        )
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                content = chunk.choices[0].delta.content
                payload = json.dumps({"content": content})
                yield f"data: {payload}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as exc:
        msg = str(exc).lower()
        if "rate_limit" in msg or "rate limit" in msg:
            err = "The AI service rate limit was reached. Please try again in a moment."
        elif "timeout" in msg:
            err = "The AI service timed out. Please try again."
        elif "invalid_api_key" in msg or "unauthorized" in msg:
            err = "The Groq API key appears to be invalid. Please check the backend configuration."
        else:
            err = f"The AI service encountered an error: {str(exc)[:200]}"
        yield f"data: {json.dumps({'error': err})}\n\n"

