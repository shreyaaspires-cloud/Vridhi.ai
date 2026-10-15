import { useState } from "react";
import { api } from "../lib/api";
import { useAssessment } from "../context/AssessmentContext";
import toast from "react-hot-toast";

const SECTORS = ["Manufacturing", "Retail", "Services"];
const REGIONS = ["North", "South", "East", "West", "Central"];
const SIZES = ["Micro", "Small", "Medium"];
const GENDERS = ["Male", "Female", "Unspecified"];

const DEFAULTS = {
  business_name: "",
  income: 5000000,
  loan_amount: 1500000,
  gst_compliance_rate: 85,
  monthly_upi_volume: 200000,
  utility_delay_days: 5,
  vendor_trust_score: 75,
  sector_type: "Manufacturing",
  afhi_score: 70,
  owner_gender: "Male",
  region: "South",
  business_size: "Small",
  years_in_operation: 8,
  employee_count: 25,
  revenue_history: [400000, 420000, 410000, 450000, 470000, 460000, 480000, 490000, 475000, 500000, 510000, 520000],
};

const inputClass =
  "dark-input";

function Field({ label, children, hint, modelInput }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#94A8C2] mb-1.5">
        {label}
        {modelInput && (
          <span className="ml-2 text-xs text-[#168BFF] bg-[#168BFF]/10 border border-[#168BFF]/20 px-1.5 py-0.5 rounded">
            MODEL INPUT
          </span>
        )}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-[#4A6080]">{hint}</p>}
    </div>
  );
}

export default function AssessmentForm() {
  const { submitPrediction, setLoading, setError, loading, error } =
    useAssessment();
  const [form, setForm] = useState(DEFAULTS);
  const [revText, setRevText] = useState(
    DEFAULTS.revenue_history.join(", ")
  );

  const update = (key, val) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation check - Form must not go ahead before all fields are checked
    if (!form.business_name || form.business_name.trim() === "") {
      const msg = "Please enter a valid Business Name.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.income === "" || form.income === null || isNaN(form.income) || Number(form.income) <= 0) {
      const msg = "Please enter a valid Annual Income (> 0).";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.loan_amount === "" || form.loan_amount === null || isNaN(form.loan_amount) || Number(form.loan_amount) <= 0) {
      const msg = "Please enter a valid Requested Loan Amount (> 0).";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.gst_compliance_rate === "" || form.gst_compliance_rate === null || isNaN(form.gst_compliance_rate)) {
      const msg = "Please enter a valid GST Compliance Rate (0-100%).";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.monthly_upi_volume === "" || form.monthly_upi_volume === null || isNaN(form.monthly_upi_volume)) {
      const msg = "Please enter a valid Monthly UPI Volume.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.utility_delay_days === "" || form.utility_delay_days === null || isNaN(form.utility_delay_days)) {
      const msg = "Please enter Utility Delay Days.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.vendor_trust_score === "" || form.vendor_trust_score === null || isNaN(form.vendor_trust_score)) {
      const msg = "Please enter Vendor Trust Score (0-100).";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.afhi_score === "" || form.afhi_score === null || isNaN(form.afhi_score)) {
      const msg = "Please enter AFHI Score (0-100).";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    let revHistory = [];
    try {
      revHistory = revText
        .split(",")
        .map((v) => parseFloat(v.trim()))
        .filter((v) => !isNaN(v));
    } catch {
      revHistory = [];
    }

    const payload = { ...form, revenue_history: revHistory };
    const result = await api.predict(payload);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      submitPrediction(result.data, payload);
      toast.success("Assessment complete! Credit score generated.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Model Inputs */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-base font-semibold text-[#EFF7FF] mb-0.5">
          Model Inputs
        </h2>
        <p className="text-sm text-[#4A6080] mb-5">
          These 8 features are used by the XGBoost model for credit-risk prediction.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Business Name" modelInput={false}>
            <input
              className={inputClass}
              value={form.business_name}
              onChange={(e) => update("business_name", e.target.value)}
              placeholder="e.g. Sri Balaji Enterprises"
            />
          </Field>
          <Field label="Sector Type" modelInput>
            <select
              className={inputClass}
              value={form.sector_type}
              onChange={(e) => update("sector_type", e.target.value)}
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Annual Income (INR)" modelInput hint="Annual business income">
            <input
              type="number"
              className={inputClass}
              value={form.income}
              onChange={(e) => update("income", +e.target.value)}
              step={100000}
              min={0}
            />
          </Field>
          <Field label="Loan Amount (INR)" modelInput hint="Requested loan amount">
            <input
              type="number"
              className={inputClass}
              value={form.loan_amount}
              onChange={(e) => update("loan_amount", +e.target.value)}
              step={50000}
              min={0}
            />
          </Field>
          <Field label="GST Compliance Rate (%)" modelInput hint="0–100">
            <input
              type="number"
              className={inputClass}
              value={form.gst_compliance_rate}
              onChange={(e) => update("gst_compliance_rate", +e.target.value)}
              step={1}
              min={0}
              max={100}
            />
          </Field>
          <Field label="Monthly UPI Volume (INR)" modelInput hint="Monthly UPI transaction volume">
            <input
              type="number"
              className={inputClass}
              value={form.monthly_upi_volume}
              onChange={(e) => update("monthly_upi_volume", +e.target.value)}
              step={10000}
              min={0}
            />
          </Field>
          <Field label="Utility Delay Days" modelInput hint="Average delay in utility bill payments">
            <input
              type="number"
              className={inputClass}
              value={form.utility_delay_days}
              onChange={(e) => update("utility_delay_days", +e.target.value)}
              step={1}
              min={0}
            />
          </Field>
          <Field label="Vendor Trust Score" modelInput hint="0–100">
            <input
              type="number"
              className={inputClass}
              value={form.vendor_trust_score}
              onChange={(e) => update("vendor_trust_score", +e.target.value)}
              step={1}
              min={0}
              max={100}
            />
          </Field>
          <Field label="AFHI Score" modelInput hint="Alternative Financial Health Index (0–100)">
            <input
              type="number"
              className={inputClass}
              value={form.afhi_score}
              onChange={(e) => update("afhi_score", +e.target.value)}
              step={1}
              min={0}
              max={100}
            />
          </Field>
        </div>
      </div>

      {/* Metadata / Audit Inputs */}
      <div className="glass-panel rounded-xl p-6">
        <h2 className="text-base font-semibold text-[#EFF7FF] mb-0.5">
          Metadata &amp; Audit Inputs
        </h2>
        <p className="text-sm text-[#4A6080] mb-5">
          These fields are used for display, segmentation, fairness analysis, and forecasting — NOT as model inputs.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Owner Gender">
            <select
              className={inputClass}
              value={form.owner_gender}
              onChange={(e) => update("owner_gender", e.target.value)}
            >
              {GENDERS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Region">
            <select
              className={inputClass}
              value={form.region}
              onChange={(e) => update("region", e.target.value)}
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Business Size">
            <select
              className={inputClass}
              value={form.business_size}
              onChange={(e) => update("business_size", e.target.value)}
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Years in Operation">
            <input
              type="number"
              className={inputClass}
              value={form.years_in_operation}
              onChange={(e) => update("years_in_operation", +e.target.value)}
              min={0}
            />
          </Field>
          <Field label="Employee Count">
            <input
              type="number"
              className={inputClass}
              value={form.employee_count}
              onChange={(e) => update("employee_count", +e.target.value)}
              min={0}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Field
            label="Revenue History (last 6–12 months, comma-separated)"
            hint="Used for cash-flow forecasting"
          >
            <textarea
              className={inputClass + " h-20 resize-none"}
              value={revText}
              onChange={(e) => setRevText(e.target.value)}
              placeholder="e.g. 400000, 420000, 410000, 450000, 470000, 460000"
            />
          </Field>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full font-semibold py-3.5 rounded-xl transition-base flex items-center justify-center gap-2 text-white disabled:opacity-50"
        style={{
          background: "linear-gradient(135deg, #168BFF 0%, #0E6CD4 100%)",
          boxShadow: "0 4px 20px rgba(22,139,255,0.25)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 28px rgba(22,139,255,0.45)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(22,139,255,0.25)";
        }}
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Analyzing...
          </>
        ) : (
          "Assess Credit Risk"
        )}
      </button>
    </form>
  );
}
