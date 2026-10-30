import { useState, useMemo } from "react";
import { api } from "../lib/api";
import { useAssessment } from "../context/AssessmentContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";
import { Info } from "lucide-react";

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

/** Parse the revenue text into an array of valid floats, returning null for missing/invalid entries */
function parseRevenue(text) {
  if (!text || !text.trim()) return [];
  return text
    .split(",")
    .map((v) => {
      const trimmed = v.trim();
      if (trimmed === "" || trimmed === "-") return null;
      const n = parseFloat(trimmed);
      return isNaN(n) ? null : n;
    });
}

/** Compute annual revenue only when all 12 months are present and valid */
function computeAnnualRevenue(parsedMonths) {
  if (!parsedMonths || parsedMonths.length < 12) return null;
  if (parsedMonths.some((v) => v === null || v < 0)) return null;
  const sum = parsedMonths.reduce((acc, v) => acc + v, 0);
  return Math.round(sum);
}

export default function AssessmentForm() {
  const { submitPrediction, setLastFormPayload, setLoading, setError, loading, error } =
    useAssessment();
  const { t } = useLanguage();
  const [form, setForm] = useState(DEFAULTS);
  const [revText, setRevText] = useState(
    DEFAULTS.revenue_history.join(", ")
  );

  const parsedRevMonths = useMemo(() => parseRevenue(revText), [revText]);
  const annualRevenue = useMemo(() => computeAnnualRevenue(parsedRevMonths), [parsedRevMonths]);
  const hasPartialRevenue = parsedRevMonths.length > 0 && parsedRevMonths.length < 12;
  const hasMissingMonths = parsedRevMonths.length === 12 && parsedRevMonths.some((v) => v === null);

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
      if (setLastFormPayload) {
        setLastFormPayload(payload);
      }
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
          {t("model_inputs")}
        </h2>
        <p className="text-sm text-[#4A6080] mb-5">
          {t("model_inputs_sub")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label={t("business_name")} modelInput={false}>
            <input
              className={inputClass}
              value={form.business_name}
              onChange={(e) => update("business_name", e.target.value)}
              placeholder="e.g. Sri Balaji Enterprises"
            />
          </Field>
          <Field label={t("sector_type")} modelInput>
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
          <Field label={t("annual_income")} modelInput hint="Annual business income">
            <input
              type="number"
              className={inputClass}
              value={form.income}
              onChange={(e) => update("income", +e.target.value)}
              step={100000}
              min={0}
            />
          </Field>
          <Field label={t("loan_amount")} modelInput hint="Requested loan amount">
            <input
              type="number"
              className={inputClass}
              value={form.loan_amount}
              onChange={(e) => update("loan_amount", +e.target.value)}
              step={50000}
              min={0}
            />
          </Field>
          <Field label={t("gst_compliance")} modelInput hint="0–100">
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
          <Field label={t("monthly_upi")} modelInput hint="Monthly UPI transaction volume">
            <input
              type="number"
              className={inputClass}
              value={form.monthly_upi_volume}
              onChange={(e) => update("monthly_upi_volume", +e.target.value)}
              step={10000}
              min={0}
            />
          </Field>
          <Field label={t("utility_delay")} modelInput hint="Average delay in utility bill payments">
            <input
              type="number"
              className={inputClass}
              value={form.utility_delay_days}
              onChange={(e) => update("utility_delay_days", +e.target.value)}
              step={1}
              min={0}
            />
          </Field>
          <Field label={t("vendor_trust")} modelInput hint="0–100">
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
          <Field label={t("afhi_score")} modelInput hint="Alternative Financial Health Index (0–100)">
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
          {t("metadata_inputs")}
        </h2>
        <p className="text-sm text-[#4A6080] mb-5">
          {t("metadata_inputs_sub")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label={t("owner_gender")}>
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
          <Field label={t("region")}>
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
          <Field label={t("business_size")}>
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
          <Field label={t("years_operation")}>
            <input
              type="number"
              className={inputClass}
              value={form.years_in_operation}
              onChange={(e) => update("years_in_operation", +e.target.value)}
              min={0}
            />
          </Field>
          <Field label={t("employee_count")}>
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
          {/* Revenue History Section with clear disclaimer */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <label className="block text-sm font-medium text-[#94A8C2]">
                {t("revenue_history")}
                <span className="ml-2 text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">
                  NOT A SCORE INPUT
                </span>
              </label>
            </div>

            {/* Important distinction banner */}
            <div
              className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg text-xs"
              style={{
                background: "rgba(22,139,255,0.06)",
                border: "1px solid rgba(22,139,255,0.18)",
              }}
              role="note"
              aria-label="Revenue history purpose"
            >
              <Info className="w-4 h-4 text-[#168BFF] flex-shrink-0 mt-0.5" />
              <p className="text-[#94A8C2] leading-relaxed">
                <span className="font-semibold text-[#EFF7FF]">Revenue history is used for cash-flow forecasting only.</span>{" "}
                It does not directly affect your credit score.{" "}
                <span className="text-[#EFF7FF] font-medium">Annual Income</span> (in Model Inputs above) is a separate field used by the XGBoost credit-risk model.
              </p>
            </div>

            <textarea
              className={inputClass + " h-20 resize-none"}
              value={revText}
              onChange={(e) => setRevText(e.target.value)}
              placeholder="Enter 12 monthly values: e.g. 400000, 420000, 410000, 450000, 470000, 460000, 480000, 490000, 475000, 500000, 510000, 520000"
              aria-describedby="revenue-hint"
            />
            <p id="revenue-hint" className="text-xs text-[#4A6080]">
              {t("revenue_hint")}
            </p>

            {/* Annual Revenue Derived Display */}
            {parsedRevMonths.length > 0 && (
              <div
                className="rounded-lg px-3.5 py-2.5 text-xs"
                style={{
                  background: annualRevenue !== null
                    ? "rgba(16,185,129,0.06)"
                    : "rgba(245,158,11,0.06)",
                  border: annualRevenue !== null
                    ? "1px solid rgba(16,185,129,0.2)"
                    : "1px solid rgba(245,158,11,0.2)",
                }}
              >
                {annualRevenue !== null ? (
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[#94A8C2]">Calculated Annual Revenue: </span>
                      <span className="font-bold text-emerald-400">
                        ₹{annualRevenue.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[#4A6080] ml-2">
                        (Sum of 12 monthly values)
                      </span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
                    >
                      FOR FORECASTING ONLY
                    </span>
                  </div>
                ) : hasMissingMonths ? (
                  <p className="text-amber-400">
                    ⚠ Some months have invalid or missing values — annual revenue cannot be calculated.
                  </p>
                ) : hasPartialRevenue ? (
                  <p className="text-amber-400">
                    {parsedRevMonths.filter(v => v !== null).length} of 12 months entered — provide all 12 to see annual revenue.
                  </p>
                ) : null}
              </div>
            )}
          </div>
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
            {t("submitting")}
          </>
        ) : (
          t("submit_assessment")
        )}
      </button>
    </form>
  );
}
