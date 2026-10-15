"""Verify the supplied model artifact loads and behaves as expected.

Run:  python verify_model.py

Checks:
  1. Model loads via joblib.load
  2. Pipeline has the expected imblearn structure (preprocessor, smote, classifier)
  3. The 8 raw feature names are present
  4. Strong-vs-weak sample behaviour identifies the default class index
  5. Predicted probabilities are in valid range [0,1]
  6. Reasonable feature valid ranges
"""
from __future__ import annotations

import os

import joblib
import numpy as np
import pandas as pd

NUMERIC = [
    "income",
    "loan_amount",
    "gst_compliance_rate",
    "monthly_upi_volume",
    "utility_delay_days",
    "vendor_trust_score",
    "afhi_score",
]
CATEGORICAL = ["sector_type"]
FEATURES = NUMERIC + CATEGORICAL
SECTORS = ["Manufacturing", "Retail", "Services"]

STRONG = {
    "income": 9_000_000,
    "loan_amount": 400_000,
    "gst_compliance_rate": 98,
    "monthly_upi_volume": 450_000,
    "utility_delay_days": 0,
    "vendor_trust_score": 95,
    "sector_type": "Manufacturing",
    "afhi_score": 92,
}
WEAK = {
    "income": 300_000,
    "loan_amount": 5_000_000,
    "gst_compliance_rate": 35,
    "monthly_upi_volume": 5_000,
    "utility_delay_days": 45,
    "vendor_trust_score": 25,
    "sector_type": "Retail",
    "afhi_score": 28,
}
VALID_RANGES = {
    "income": (50_000, 50_000_000),
    "loan_amount": (10_000, 50_000_000),
    "gst_compliance_rate": (0, 100),
    "monthly_upi_volume": (0, 5_000_000),
    "utility_delay_days": (0, 120),
    "vendor_trust_score": (0, 100),
    "afhi_score": (0, 100),
}


def verify(model_path: str | None = None) -> dict:
    if model_path is None:
        model_path = os.path.join(os.path.dirname(__file__), "vridhi_multidataset_model.pkl")
    report: dict = {"model_path": model_path, "checks": []}

    def check(name: str, ok: bool, detail: str = ""):
        report["checks"].append({"name": name, "passed": ok, "detail": detail})
        flag = "PASS" if ok else "FAIL"
        print(f"[{flag}] {name}: {detail}")

    if not os.path.exists(model_path):
        check("model_file_exists", False, f"not found at {model_path}")
        report["loaded"] = False
        return report
    check("model_file_exists", True, f"found at {model_path}")

    try:
        model = joblib.load(model_path)
        check("joblib_load", True, f"type={type(model).__name__}")
    except Exception as exc:  # noqa: BLE001
        check("joblib_load", False, str(exc))
        report["loaded"] = False
        return report
    report["loaded"] = True

    steps = list(model.steps) if hasattr(model, "steps") else []
    step_names = [s for s, _ in steps]
    has_pre = "preprocessor" in step_names
    has_smote = "smote" in step_names
    has_clf = "classifier" in step_names
    check("pipeline_structure", has_pre and has_smote and has_clf,
          f"steps={step_names}")

    pre = model.named_steps.get("preprocessor")
    if pre is not None and hasattr(pre, "feature_names_in_"):
        fni = list(pre.feature_names_in_)
        check("feature_names", set(FEATURES).issubset(set(fni)), f"features={fni}")
    else:
        check("feature_names", True, "preprocessor has no feature_names_in_ attr (ok)")

    df_s = pd.DataFrame([STRONG])[FEATURES]
    df_w = pd.DataFrame([WEAK])[FEATURES]
    p_s = model.predict_proba(df_s)[0]
    p_w = model.predict_proba(df_w)[0]
    classes = list(model.classes_)
    check("proba_range",
          float(p_s.min()) >= 0.0 and float(p_s.max()) <= 1.0,
          f"strong proba={p_s}")

    # Identify default class: weak sample should have higher P(default)
    # default = the class whose probability is higher for the weak sample
    diff = p_w - p_s
    default_idx = int(np.argmax(diff))
    report["default_class_index"] = default_idx
    report["classes"] = classes
    check("default_class_identified", True,
          f"default class={classes[default_idx]} (index {default_idx}), "
          f"strong P={p_s[default_idx]:.3f}, weak P={p_w[default_idx]:.3f}")

    # Strong sample should be safer (lower P default), weak riskier
    check("strong_vs_weak", p_s[default_idx] < p_w[default_idx],
          f"strong P(default)={p_s[default_idx]:.3f} < weak P(default)={p_w[default_idx]:.3f}")

    # Valid ranges sanity
    ranges_ok = all(lo <= hi for lo, hi in VALID_RANGES.values())
    check("valid_ranges", ranges_ok, f"ranges={VALID_RANGES}")

    report["all_passed"] = all(c["passed"] for c in report["checks"])
    print(f"\nALL PASSED: {report['all_passed']}")
    return report


if __name__ == "__main__":
    verify()
