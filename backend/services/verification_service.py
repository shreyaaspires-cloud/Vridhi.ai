"""Document verification service for Vridhi.ai.

Responsibilities:
1. File validation (type, size, extension)
2. Text extraction (pdfplumber for PDFs, pytesseract for images if available)
3. Structured field extraction via Groq LLM (text-only, not raw doc)
4. Indian currency normalization
5. Field-level comparison with configurable tolerances
6. Verification status and score calculation
7. Robust error handling

IMPORTANT: LLM output is treated as untrusted and validated before use.
No raw document content is logged. No secrets are exposed in error messages.
"""
from __future__ import annotations

import io
import json
import os
import re
from typing import Any

# Groq for structured extraction
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama3-8b-8192")

# File constraints
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
}

# Comparison tolerances (configurable)
COMPARISON_CONFIG = {
    "annual_revenue": {"tolerance_pct": 15.0},
    "gst_compliance_rate": {"tolerance_abs": 10.0},
    "monthly_upi_volume": {"tolerance_pct": 20.0},
    "business_size": {"exact": True},
    "sector_type": {"exact": True},
}

STATUS_CONSISTENT = "consistent"
STATUS_MISMATCH = "mismatch"
STATUS_UNVERIFIABLE = "unverifiable"
STATUS_NEEDS_REVIEW = "needs_review"

OVERALL_PENDING = "PENDING"
OVERALL_IN_PROGRESS = "IN_PROGRESS"
OVERALL_VERIFIED = "VERIFIED"
OVERALL_PARTIALLY_VERIFIED = "PARTIALLY_VERIFIED"
OVERALL_NEEDS_REVIEW = "NEEDS_REVIEW"
OVERALL_REJECTED = "REJECTED"
OVERALL_FAILED = "FAILED"
OVERALL_COULD_NOT_VERIFY = "COULD_NOT_VERIFY"

DISCLAIMER = (
    "Automated document and data consistency checks are indicative only. "
    "They do not independently establish document authenticity, verify legal "
    "compliance, or constitute a credit-scoring or lending decision."
)


# ---------------------------------------------------------------------------
# Text Extraction
# ---------------------------------------------------------------------------

def _extract_text_from_pdf(content: bytes) -> str:
    """Extract text from a PDF using pdfplumber."""
    try:
        import pdfplumber
    except ImportError:
        raise RuntimeError(
            "pdfplumber is not installed. Add it to requirements.txt: pip install pdfplumber"
        )
    text_parts = []
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages[:10]:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
    except Exception as exc:
        raise RuntimeError(f"PDF text extraction failed: {str(exc)[:200]}")
    return "\n".join(text_parts)


def _extract_text_from_image(content: bytes) -> str:
    """Extract text from an image using pytesseract if available."""
    try:
        import pytesseract
        from PIL import Image
    except ImportError:
        return ""
    try:
        img = Image.open(io.BytesIO(content))
        return pytesseract.image_to_string(img, lang="eng")
    except Exception as exc:
        raise RuntimeError(f"OCR text extraction failed: {str(exc)[:200]}")


def extract_text(content: bytes, filename: str) -> str:
    """Dispatch text extraction based on file extension."""
    ext = os.path.splitext(filename.lower())[1]
    if ext == ".pdf":
        return _extract_text_from_pdf(content)
    elif ext in (".png", ".jpg", ".jpeg"):
        return _extract_text_from_image(content)
    raise ValueError(f"Unsupported file extension: {ext}")


# ---------------------------------------------------------------------------
# LLM-based Field Extraction
# ---------------------------------------------------------------------------

_EXTRACTION_SYSTEM_PROMPT = """You are a financial document data extraction assistant for Indian MSME documents.
Extract financial fields from the provided document text and return ONLY a valid JSON object.

Rules:
- Return ONLY raw JSON, no markdown, no explanation.
- Use null for fields not clearly present in the document.
- All monetary values must be in full INR rupees (not lakhs unless specified).
- If a value is in lakhs, multiply by 100000 before returning.
- If a value is in crores, multiply by 10000000 before returning.
- If a value is ambiguous or unclear, return null.
- Do not invent or estimate values.
- gst_compliance_rate must be a number 0-100 (percentage, not decimal).
- business_size must be exactly "Micro", "Small", or "Medium" if determinable.
- sector_type must be exactly "Manufacturing", "Retail", or "Services" if determinable.

Return this exact JSON structure:
{
  "annual_turnover": <number or null>,
  "reporting_period": <string like "FY 2023-24" or null>,
  "gst_compliance_rate": <number 0-100 or null>,
  "monthly_avg_bank_credits": <number or null>,
  "monthly_upi_volume": <number or null>,
  "business_size": <"Micro"|"Small"|"Medium" or null>,
  "sector_type": <"Manufacturing"|"Retail"|"Services" or null>
}"""


def _call_groq_extraction(text: str, document_type: str) -> dict:
    """Call Groq LLM to extract structured fields from document text."""
    api_key = os.getenv("GROQ_API_KEY", "") or GROQ_API_KEY
    if not api_key:
        return {}

    client = Groq(api_key=api_key)
    truncated = text[:6000]
    user_prompt = (
        f"Document type: {document_type}\n\nDocument text:\n{truncated}\n\nExtract the financial fields."
    )

    try:
        resp = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": _EXTRACTION_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=512,
            temperature=0.0,
        )
        raw = resp.choices[0].message.content or ""
        raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("`").strip()
        return json.loads(raw)
    except json.JSONDecodeError:
        print("[verify] LLM returned invalid JSON, ignoring extraction")
        return {}
    except Exception as exc:
        print(f"[verify] LLM extraction error: {type(exc).__name__}")
        return {}


def _validate_extracted(raw: dict) -> dict:
    """Validate and sanitize LLM-returned extraction. Returns clean dict."""
    validated = {}

    if raw.get("annual_turnover") is not None:
        try:
            v = float(raw["annual_turnover"])
            if 0 < v < 1e12:
                validated["annual_turnover"] = round(v, 2)
        except (ValueError, TypeError):
            pass

    if isinstance(raw.get("reporting_period"), str):
        validated["reporting_period"] = raw["reporting_period"][:50]

    if raw.get("gst_compliance_rate") is not None:
        try:
            v = float(raw["gst_compliance_rate"])
            if 0 <= v <= 100:
                validated["gst_compliance_rate"] = round(v, 2)
        except (ValueError, TypeError):
            pass

    if raw.get("monthly_avg_bank_credits") is not None:
        try:
            v = float(raw["monthly_avg_bank_credits"])
            if 0 <= v < 1e10:
                validated["monthly_avg_bank_credits"] = round(v, 2)
        except (ValueError, TypeError):
            pass

    if raw.get("monthly_upi_volume") is not None:
        try:
            v = float(raw["monthly_upi_volume"])
            if 0 <= v < 1e10:
                validated["monthly_upi_volume"] = round(v, 2)
        except (ValueError, TypeError):
            pass

    if raw.get("business_size") in ("Micro", "Small", "Medium"):
        validated["business_size"] = raw["business_size"]

    if raw.get("sector_type") in ("Manufacturing", "Retail", "Services"):
        validated["sector_type"] = raw["sector_type"]

    return validated


# ---------------------------------------------------------------------------
# Indian Currency Normalization
# ---------------------------------------------------------------------------

def _parse_inr(value: Any) -> float | None:
    """Parse INR value from various formats. Returns None if unparseable."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        v = float(value)
        return v if 0 <= v < 1e12 else None
    s = str(value).strip()
    s = re.sub(r"[,\s]", "", s)
    s = s.replace("\u20b9", "")  # rupee symbol
    lakh_match = re.match(r"^([\d.]+)\s*[Ll](?:akh)?s?$", s)
    if lakh_match:
        try:
            return float(lakh_match.group(1)) * 100_000
        except ValueError:
            return None
    crore_match = re.match(r"^([\d.]+)\s*[Cc]r(?:ore)?s?$", s)
    if crore_match:
        try:
            return float(crore_match.group(1)) * 10_000_000
        except ValueError:
            return None
    try:
        return float(s)
    except ValueError:
        return None


# ---------------------------------------------------------------------------
# Field Comparison Logic
# ---------------------------------------------------------------------------

def _compare_numeric_pct(submitted: float, extracted: float, tolerance_pct: float) -> dict:
    if submitted == 0 and extracted == 0:
        return {"status": STATUS_CONSISTENT, "deviation_pct": 0.0}
    if submitted == 0:
        return {"status": STATUS_NEEDS_REVIEW, "note": "Submitted value is zero; cannot compute percentage deviation."}
    dev = abs(submitted - extracted) / abs(submitted) * 100
    return {
        "status": STATUS_CONSISTENT if dev <= tolerance_pct else STATUS_MISMATCH,
        "deviation_pct": round(dev, 2),
    }


def _compare_numeric_abs(submitted: float, extracted: float, tolerance_abs: float) -> dict:
    dev = abs(submitted - extracted)
    return {
        "status": STATUS_CONSISTENT if dev <= tolerance_abs else STATUS_MISMATCH,
        "deviation_abs": round(dev, 2),
    }


def _compare_categorical(submitted: str, extracted: str) -> dict:
    if submitted.strip().lower() == extracted.strip().lower():
        return {"status": STATUS_CONSISTENT}
    return {"status": STATUS_MISMATCH, "note": f"'{submitted}' vs '{extracted}'"}


def compare_fields(submitted_data: dict, extracted: dict, document_type: str) -> dict:
    """
    Compare submitted user fields against extracted document fields.
    Only compares semantically equivalent, properly normalized fields.
    NOTE: The model's 'income' field is NOT compared against annual_turnover
    without an explicit, safe mapping established by the application data model.
    """
    comparison = {}

    # 1. Annual revenue vs annual turnover
    submitted_rev = _parse_inr(submitted_data.get("annual_revenue"))
    extracted_turnover = extracted.get("annual_turnover")
    if submitted_rev is not None and extracted_turnover is not None:
        result = _compare_numeric_pct(
            submitted_rev, extracted_turnover,
            COMPARISON_CONFIG["annual_revenue"]["tolerance_pct"]
        )
        comparison["annual_revenue"] = {
            "submitted": submitted_rev,
            "extracted": extracted_turnover,
            **result,
        }
    elif extracted_turnover is not None:
        comparison["annual_revenue"] = {
            "submitted": None,
            "extracted": extracted_turnover,
            "status": STATUS_UNVERIFIABLE,
            "note": "Annual revenue not provided by user.",
        }

    # 2. GST compliance rate
    submitted_gst = _parse_inr(submitted_data.get("gst_compliance_rate"))
    extracted_gst = extracted.get("gst_compliance_rate")
    if submitted_gst is not None and extracted_gst is not None:
        comparison["gst_compliance_rate"] = {
            "submitted": submitted_gst,
            "extracted": extracted_gst,
            **_compare_numeric_abs(submitted_gst, extracted_gst, COMPARISON_CONFIG["gst_compliance_rate"]["tolerance_abs"]),
        }
    elif extracted_gst is not None:
        comparison["gst_compliance_rate"] = {
            "submitted": None,
            "extracted": extracted_gst,
            "status": STATUS_UNVERIFIABLE,
        }

    # 3. Monthly UPI volume
    submitted_upi = _parse_inr(submitted_data.get("monthly_upi_volume"))
    extracted_upi = extracted.get("monthly_upi_volume")
    if submitted_upi is not None and extracted_upi is not None:
        comparison["monthly_upi_volume"] = {
            "submitted": submitted_upi,
            "extracted": extracted_upi,
            **_compare_numeric_pct(submitted_upi, extracted_upi, COMPARISON_CONFIG["monthly_upi_volume"]["tolerance_pct"]),
        }
    elif extracted_upi is not None:
        comparison["monthly_upi_volume"] = {
            "submitted": None,
            "extracted": extracted_upi,
            "status": STATUS_UNVERIFIABLE,
        }

    # 4. Business size
    submitted_size = submitted_data.get("business_size")
    extracted_size = extracted.get("business_size")
    if submitted_size and extracted_size:
        comparison["business_size"] = {
            "submitted": submitted_size,
            "extracted": extracted_size,
            **_compare_categorical(submitted_size, extracted_size),
        }

    # 5. Sector type
    submitted_sector = submitted_data.get("sector_type")
    extracted_sector = extracted.get("sector_type")
    if submitted_sector and extracted_sector:
        comparison["sector_type"] = {
            "submitted": submitted_sector,
            "extracted": extracted_sector,
            **_compare_categorical(submitted_sector, extracted_sector),
        }

    return comparison


# ---------------------------------------------------------------------------
# Verification Status and Score
# ---------------------------------------------------------------------------

def compute_verification_status(comparison: dict) -> tuple[str, float | None, list[str]]:
    """
    Returns (overall_status, verification_score_or_none, flags).
    Score = (consistent comparable / total comparable) * 100.
    Fields that are UNVERIFIABLE are excluded from denominator.
    """
    flags = []
    comparable = [f for f, v in comparison.items() if v.get("status") in (STATUS_CONSISTENT, STATUS_MISMATCH)]
    consistent = [f for f, v in comparison.items() if v.get("status") == STATUS_CONSISTENT]
    needs_review_fields = [f for f, v in comparison.items() if v.get("status") == STATUS_NEEDS_REVIEW]
    mismatches = [f for f, v in comparison.items() if v.get("status") == STATUS_MISMATCH]

    for f in mismatches:
        flags.append(f"{f.replace('_', ' ').title()} value requires review — submitted vs extracted values differ beyond tolerance.")
    for f in needs_review_fields:
        flags.append(f"{f.replace('_', ' ').title()} comparison is ambiguous and requires human review.")

    n_comparable = len(comparable)
    if n_comparable == 0:
        return OVERALL_COULD_NOT_VERIFY, None, flags + ["Insufficient comparable fields extracted from document."]

    score = round(len(consistent) / n_comparable * 100, 1)

    if mismatches and not consistent:
        overall = OVERALL_NEEDS_REVIEW
    elif mismatches:
        overall = OVERALL_PARTIALLY_VERIFIED if len(consistent) >= len(mismatches) else OVERALL_NEEDS_REVIEW
    elif needs_review_fields:
        overall = OVERALL_NEEDS_REVIEW
    else:
        overall = OVERALL_VERIFIED

    return overall, score, flags


# ---------------------------------------------------------------------------
# Main Verification Pipeline
# ---------------------------------------------------------------------------

def verify_document(
    content: bytes,
    filename: str,
    document_type: str,
    submitted_data: dict,
) -> dict:
    """
    Full document verification pipeline.
    Returns a structured result dict ready for the API response.
    """
    try:
        text = extract_text(content, filename)
    except RuntimeError as exc:
        return {
            "document_type": document_type,
            "status": OVERALL_FAILED,
            "verification_score": None,
            "comparison": {},
            "flags": ["Text extraction failed — document may be corrupted or unreadable."],
            "disclaimer": DISCLAIMER,
            "error": str(exc)[:300],
        }

    if not text or len(text.strip()) < 30:
        return {
            "document_type": document_type,
            "status": OVERALL_COULD_NOT_VERIFY,
            "verification_score": None,
            "comparison": {},
            "flags": ["The document appears to contain insufficient readable text for automated extraction."],
            "disclaimer": DISCLAIMER,
        }

    raw_extracted = _call_groq_extraction(text, document_type)
    extracted = _validate_extracted(raw_extracted)
    comparison = compare_fields(submitted_data, extracted, document_type)
    overall_status, score, flags = compute_verification_status(comparison)

    return {
        "document_type": document_type,
        "status": overall_status,
        "verification_score": score,
        "extracted_fields": {k: v for k, v in extracted.items()},
        "reporting_period": extracted.get("reporting_period"),
        "comparison": comparison,
        "flags": flags,
        "disclaimer": DISCLAIMER,
    }