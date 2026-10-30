"""Document verification route for Vridhi.ai (Feature 4).

Accepts multipart form uploads (file + document_type + optional submitted_data JSON).
Validates file format, size, document type.
Invokes verification_service pipeline.
"""
from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from backend.services.verification_service import (
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES,
    verify_document,
)

router = APIRouter()

ALLOWED_DOC_TYPES = {
    "bank_statement",
    "gst_return",
    "financial_statement",
    "itr_acknowledgement",
    "udyam_certificate",
}


@router.post("/api/verify")
@router.post("/api/verify-document")
async def verify_document_endpoint(
    file: UploadFile = File(...),
    document_type: str = Form(...),
    submitted_data: str = Form("{}"),
):
    """
    Verify uploaded document against submitted assessment data.
    """
    doc_type_clean = document_type.strip().lower()
    if doc_type_clean not in ALLOWED_DOC_TYPES:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid document_type",
                "allowed": sorted(list(ALLOWED_DOC_TYPES)),
            },
        )

    # Validate file extension
    filename = file.filename or "uploaded_file"
    ext = ("." + filename.rsplit(".", 1)[-1].lower()) if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Unsupported file format",
                "message": f"Allowed file types: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
            },
        )

    # Check content type if supplied
    content_type = (file.content_type or "").lower()
    if content_type and content_type not in ALLOWED_MIME_TYPES and content_type != "application/octet-stream":
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Unsupported MIME type",
                "message": f"Detected {content_type}. Expected PDF or image (PNG/JPEG).",
            },
        )

    # Read content safely
    try:
        content = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail={"error": "Failed to read uploaded file", "message": str(exc)[:200]},
        )

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "File too large",
                "message": f"Maximum allowed file size is 10 MB. Received {len(content) / (1024*1024):.2f} MB.",
            },
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=400,
            detail={"error": "Empty file", "message": "Uploaded file is empty."},
        )

    # Parse submitted_data JSON
    parsed_submitted_data: dict[str, Any] = {}
    if submitted_data:
        try:
            parsed_submitted_data = json.loads(submitted_data)
            if not isinstance(parsed_submitted_data, dict):
                parsed_submitted_data = {}
        except Exception:
            parsed_submitted_data = {}

    try:
        result = verify_document(
            content=content,
            filename=filename,
            document_type=doc_type_clean,
            submitted_data=parsed_submitted_data,
        )
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "Verification processing failed", "message": str(exc)[:300]},
        )