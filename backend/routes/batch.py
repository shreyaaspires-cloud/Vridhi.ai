"""Batch prediction route — CSV upload with intelligent mapping, row validation, and vectorized scoring."""
from __future__ import annotations

import csv
import io
import math
from typing import Any

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from backend.model.model_service import MODEL_FEATURES, NUMERIC_FEATURES, VALID_SECTORS
from backend.services.prediction_service import predict_batch
from backend.utils.portfolio_store import append_business

router = APIRouter()

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

# Standard model feature list
MODEL_REQUIRED_COLUMNS = MODEL_FEATURES

# Alternate column name aliases for semantic mapping
COLUMN_ALIASES: dict[str, list[str]] = {
    "income": [
        "annual_income",
        "annual_revenue",
        "annual_revenue_inr",
        "revenue",
        "turnover",
        "yearly_income",
        "sales",
    ],
    "loan_amount": [
        "requested_amount",
        "loan_amt",
        "requested_loan_amount",
        "borrow_amount",
        "applied_amount",
        "existing_debt_inr",
        "debt_amount",
    ],
    "gst_compliance_rate": [
        "gst_compliance",
        "gst_rate",
        "gst_score",
        "tax_compliance",
        "gst_percentage",
    ],
    "monthly_upi_volume": [
        "upi_volume",
        "monthly_upi",
        "upi_transactions",
        "digital_transactions",
        "monthly_digital_volume",
    ],
    "utility_delay_days": [
        "utility_delays",
        "delay_days",
        "utility_payment_delay",
        "late_payments_last_12_months",
        "payment_delays",
    ],
    "vendor_trust_score": [
        "vendor_trust",
        "vendor_score",
        "trust_score",
        "supplier_trust",
        "supplier_rating",
    ],
    "sector_type": [
        "sector",
        "industry",
        "business_sector",
        "industry_type",
        "category",
    ],
    "afhi_score": [
        "afhi",
        "financial_health_index",
        "health_index",
        "financial_health_score",
        "alternative_financial_health_index",
    ],
}

SECTOR_MAPPING: dict[str, str] = {
    "manufacturing": "Manufacturing",
    "manufacture": "Manufacturing",
    "production": "Manufacturing",
    "textiles": "Manufacturing",
    "chemicals": "Manufacturing",
    "plastics": "Manufacturing",
    "steel": "Manufacturing",
    "construction": "Manufacturing",
    "engineering": "Manufacturing",
    "food products": "Manufacturing",
    "retail": "Retail",
    "traders": "Retail",
    "trading": "Retail",
    "trading co": "Retail",
    "wholesale": "Retail",
    "shop": "Retail",
    "ecommerce": "Retail",
    "services": "Services",
    "service": "Services",
    "information technology": "Services",
    "infotech": "Services",
    "technology": "Services",
    "it": "Services",
    "logistics": "Services",
    "pharma": "Services",
    "healthcare": "Services",
    "hospitality": "Services",
    "consulting": "Services",
    "finance": "Services",
    "agriculture": "Manufacturing",
    "agro tech": "Manufacturing",
}


def _normalize_col(col_name: str) -> str:
    """Normalize column header: lowercase, stripped, and replace hyphens/spaces with underscore."""
    return str(col_name).strip().lower().replace("-", "_").replace(" ", "_")


def _find_mapped_column(norm_cols: dict[str, str], target_feature: str) -> str | None:
    """Check if target_feature or any of its aliases exist in the uploaded columns."""
    if target_feature in norm_cols:
        return norm_cols[target_feature]
    for alias in COLUMN_ALIASES.get(target_feature, []):
        if alias in norm_cols:
            return norm_cols[alias]
    return None


def _calculate_derived_afhi(row: pd.Series) -> float | None:
    """
    If AFHI is missing but traditional financial ratios exist (from financial statements),
    compute an objectively calibrated AFHI score (0-100).
    """
    factors = []
    # Current ratio: 1.2 - 2.0 is healthy
    if "current_ratio" in row and pd.notna(row["current_ratio"]):
        try:
            cr = float(row["current_ratio"])
            cr_score = min(max((cr / 2.0) * 100, 0), 100)
            factors.append(cr_score)
        except (ValueError, TypeError):
            pass

    # Profit margin: 0.05 - 0.20 is healthy
    if "profit_margin" in row and pd.notna(row["profit_margin"]):
        try:
            pm = float(row["profit_margin"])
            pm_score = min(max((pm / 0.20) * 100, 0), 100)
            factors.append(pm_score)
        except (ValueError, TypeError):
            pass

    # Debt to equity: <= 1.5 is healthy
    if "debt_to_equity_ratio" in row and pd.notna(row["debt_to_equity_ratio"]):
        try:
            de = float(row["debt_to_equity_ratio"])
            de_score = min(max((1.0 - (de / 3.0)) * 100, 0), 100)
            factors.append(de_score)
        except (ValueError, TypeError):
            pass

    # Positive operating cash flow
    if "annual_operating_cashflow_inr" in row and pd.notna(row["annual_operating_cashflow_inr"]):
        try:
            cf = float(row["annual_operating_cashflow_inr"])
            cf_score = 75.0 if cf > 0 else 30.0
            factors.append(cf_score)
        except (ValueError, TypeError):
            pass

    if len(factors) >= 2:
        return round(sum(factors) / len(factors), 2)
    return None


@router.post("/api/predict/batch")
async def predict_batch_route(file: UploadFile = File(...)):
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail={"error": "File too large", "message": "CSV file must be 5 MB or less."},
        )

    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail={"error": "Invalid file type", "message": "Please upload a valid .csv file."},
        )

    try:
        raw_df = pd.read_csv(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail={"error": "CSV parse error", "message": f"Could not parse CSV: {str(exc)[:200]}"},
        )

    if raw_df.empty:
        raise HTTPException(
            status_code=400,
            detail={"error": "Empty CSV", "message": "The uploaded CSV contains no records."},
        )

    total_rows = len(raw_df)

    # Build normalized mapping from normalized column name -> original column name
    norm_to_orig = {_normalize_col(col): col for col in raw_df.columns}

    # Find business_name column
    business_name_col = None
    for b_alias in ["business_name", "business", "company_name", "enterprise_name", "company", "msme_name", "name"]:
        if b_alias in norm_to_orig:
            business_name_col = norm_to_orig[b_alias]
            break

    # Determine column mapping for each of the 8 model features
    col_mapping: dict[str, str | None] = {}
    for feat in MODEL_REQUIRED_COLUMNS:
        col_mapping[feat] = _find_mapped_column(norm_to_orig, feat)

    # Check unmapped columns
    unmapped = [feat for feat, mapped in col_mapping.items() if mapped is None]

    # Special handling: if AFHI is unmapped but financial ratios exist, we can derive it
    can_derive_afhi = ("afhi_score" in unmapped) and any(
        c in norm_to_orig for c in ["current_ratio", "profit_margin", "annual_operating_cashflow_inr", "debt_to_equity_ratio"]
    )
    if can_derive_afhi and "afhi_score" in unmapped:
        unmapped.remove("afhi_score")

    if unmapped:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Missing required columns",
                "missing": unmapped,
                "message": (
                    f"CSV is missing required fields: {', '.join(unmapped)}. "
                    f"Please download the template or include corresponding columns."
                ),
            },
        )

    valid_rows: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []

    # Validate each row individually without silently discarding
    for idx, row in raw_df.iterrows():
        row_num = int(idx) + 1
        biz_name = str(row[business_name_col]) if business_name_col and pd.notna(row[business_name_col]) else f"Application #{row_num}"
        row_errors = []
        cleaned_row: dict[str, Any] = {"business_name": biz_name}

        # 1. Numeric features
        for num_feat in NUMERIC_FEATURES:
            source_col = col_mapping.get(num_feat)
            if source_col is None:
                if num_feat == "afhi_score" and can_derive_afhi:
                    derived = _calculate_derived_afhi(row)
                    if derived is not None:
                        cleaned_row["afhi_score"] = derived
                        continue
                row_errors.append(f"Missing value for {num_feat}")
                continue

            val = row[source_col]
            if pd.isna(val) or val == "":
                # Fallback check for derived AFHI if value is empty
                if num_feat == "afhi_score" and can_derive_afhi:
                    derived = _calculate_derived_afhi(row)
                    if derived is not None:
                        cleaned_row["afhi_score"] = derived
                        continue
                row_errors.append(f"Field '{num_feat}' is empty")
                continue

            try:
                # Clean currency strings like "$10,000" or "10,000"
                if isinstance(val, str):
                    val = val.replace(",", "").replace("₹", "").replace("$", "").strip()
                num_val = float(val)
                if math.isnan(num_val) or math.isinf(num_val):
                    row_errors.append(f"Field '{num_feat}' has invalid numeric value")
                    continue
                cleaned_row[num_feat] = num_val
            except (ValueError, TypeError):
                row_errors.append(f"Field '{num_feat}' cannot be parsed as a number: {val}")

        # 2. Sector type feature
        sector_col = col_mapping.get("sector_type")
        if sector_col and pd.notna(row[sector_col]):
            sec_str = str(row[sector_col]).strip().lower()
            mapped_sector = SECTOR_MAPPING.get(sec_str)
            if not mapped_sector:
                # Try partial match
                for key, target in SECTOR_MAPPING.items():
                    if key in sec_str:
                        mapped_sector = target
                        break
            if not mapped_sector:
                row_errors.append(
                    f"Invalid sector_type '{row[sector_col]}'. Must be Manufacturing, Retail, or Services"
                )
            else:
                cleaned_row["sector_type"] = mapped_sector
        else:
            row_errors.append("Field 'sector_type' is missing")

        # 3. Preserve metadata if present
        for meta in ["region", "owner_gender", "business_size", "years_in_operation", "employee_count"]:
            if meta in norm_to_orig and pd.notna(row[norm_to_orig[meta]]):
                cleaned_row[meta] = row[norm_to_orig[meta]]

        if row_errors:
            errors.append({
                "row_number": row_num,
                "business_name": biz_name,
                "error": "; ".join(row_errors),
            })
        else:
            cleaned_row["_original_row_num"] = row_num
            valid_rows.append(cleaned_row)

    if not valid_rows:
        return {
            "total_rows": total_rows,
            "processed_rows": 0,
            "failed_rows": len(errors),
            "total": 0,
            "total_processed": 0,
            "LOW": 0,
            "MEDIUM": 0,
            "HIGH": 0,
            "average_score": 0.0,
            "results": [],
            "errors": errors,
        }

    # Vectorized scoring of all valid rows
    model_input_df = pd.DataFrame(valid_rows)
    batch_out = predict_batch(model_input_df)

    processed_count = len(batch_out["results"])

    # Update in-memory portfolio store so newly assessed businesses immediately appear in analytics
    for biz_dict, res_item in zip(valid_rows, batch_out["results"]):
        try:
            append_business(biz_dict, res_item)
        except Exception as store_err:
            print(f"[batch] Portfolio store append error: {store_err}")

    return {
        "total_rows": total_rows,
        "processed_rows": processed_count,
        "failed_rows": len(errors),
        "total": processed_count,
        "total_processed": processed_count,
        "LOW": batch_out["LOW"],
        "MEDIUM": batch_out["MEDIUM"],
        "HIGH": batch_out["HIGH"],
        "average_score": batch_out["average_score"],
        "results": batch_out["results"],
        "errors": errors,
    }


@router.get("/api/sample-csv")
def sample_csv():
    """Generate a downloadable CSV template directly matching expected schema and column aliases."""
    template_columns = [
        "business_name",
        "income",
        "loan_amount",
        "gst_compliance_rate",
        "monthly_upi_volume",
        "utility_delay_days",
        "vendor_trust_score",
        "sector_type",
        "afhi_score",
        "region",
        "owner_gender",
        "business_size",
    ]

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=template_columns)
    writer.writeheader()
    writer.writerow({
        "business_name": "Apex Engineering Solutions",
        "income": 4500000,
        "loan_amount": 1200000,
        "gst_compliance_rate": 92.5,
        "monthly_upi_volume": 180000,
        "utility_delay_days": 3,
        "vendor_trust_score": 85,
        "sector_type": "Manufacturing",
        "afhi_score": 78,
        "region": "West",
        "owner_gender": "Male",
        "business_size": "Small",
    })
    writer.writerow({
        "business_name": "Mahalaxmi Retail Mart",
        "income": 1800000,
        "loan_amount": 500000,
        "gst_compliance_rate": 88.0,
        "monthly_upi_volume": 95000,
        "utility_delay_days": 6,
        "vendor_trust_score": 72,
        "sector_type": "Retail",
        "afhi_score": 65,
        "region": "South",
        "owner_gender": "Female",
        "business_size": "Micro",
    })
    writer.writerow({
        "business_name": "Sunrise Tech Services",
        "income": 6200000,
        "loan_amount": 2000000,
        "gst_compliance_rate": 96.0,
        "monthly_upi_volume": 320000,
        "utility_delay_days": 1,
        "vendor_trust_score": 90,
        "sector_type": "Services",
        "afhi_score": 84,
        "region": "North",
        "owner_gender": "Male",
        "business_size": "Medium",
    })

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vridhi_msme_batch_template.csv"},
    )

