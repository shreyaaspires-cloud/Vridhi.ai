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

const inputClass = "dark-input";

function Field({ label, children, hint, modelInput }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
        {label}
        {modelInput && (
          <span className="ml-2 text-xs font-semibold text-[var(--brand-emerald)] bg-[var(--brand-emerald)]/10 border border-[var(--brand-emerald)]/25 px-1.5 py-0.5 rounded">
            MODEL INPUT
          </span>
        )}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
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
      const msg = "Annual Income must be a positive number.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.loan_amount === "" || form.loan_amount === null || isNaN(form.loan_amount) || Number(form.loan_amount) <= 0) {
      const msg = "Loan Amount must be a positive number.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.gst_compliance_rate === "" || isNaN(form.gst_compliance_rate) || form.gst_compliance_rate < 0 || form.gst_compliance_rate > 100) {
      const msg = "GST Compliance Rate must be between 0 and 100.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.monthly_upi_volume === "" || isNaN(form.monthly_upi_volume) || Number(form.monthly_upi_volume) < 0) {
      const msg = "Monthly UPI Volume cannot be negative.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.utility_delay_days === "" || isNaN(form.utility_delay_days) || Number(form.utility_delay_days) < 0) {
      const msg = "Utility Delay Days cannot be negative.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.vendor_trust_score === "" || isNaN(form.vendor_trust_score) || form.vendor_trust_score < 0 || form.vendor_trust_score > 100) {
      const msg = "Vendor Trust Score must be between 0 and 100.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.afhi_score === "" || isNaN(form.afhi_score) || form.afhi_score < 0 || form.afhi_score > 100) {
      const msg = "AFHI Score must be between 0 and 100.";
      setError(msg);
      toast.error(msg);
      return;
    }

    // Revenue history validation
    if (hasPartialRevenue) {
      const msg = `Please enter exactly 12 months of revenue (entered ${parsedRevMonths.length}).`;
      setError(msg);
      toast.error(msg);
      return;
    }
    if (hasMissingMonths) {
      const msg = "One or more monthly revenue entries are invalid.";
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Model Inputs */}
      <div className="glass-panel rounded-xl p-6 transition-colors">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1 font-display">
          {t("model_inputs")}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {t("model_inputs_sub")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
          <Field label={t("annual_income")} modelInput>
            <input
              type="number"
              className={inputClass}
              value={form.income}
              onChange={(e) => update("income", +e.target.value)}
            />
          </Field>
          <Field label={t("loan_amount")} modelInput>
            <input
              type="number"
              className={inputClass}
              value={form.loan_amount}
              onChange={(e) => update("loan_amount", +e.target.value)}
            />
          </Field>
          <Field label={t("gst_compliance")} modelInput hint="Range: 0 - 100%">
            <input
              type="number"
              min="0"
              max="100"
              className={inputClass}
              value={form.gst_compliance_rate}
              onChange={(e) => update("gst_compliance_rate", +e.target.value)}
            />
          </Field>
          <Field label={t("monthly_upi")} modelInput>
            <input
              type="number"
              className={inputClass}
              value={form.monthly_upi_volume}
              onChange={(e) => update("monthly_upi_volume", +e.target.value)}
            />
          </Field>
          <Field label={t("utility_delay")} modelInput hint="Average days delay in utility payments">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={form.utility_delay_days}
              onChange={(e) => update("utility_delay_days", +e.target.value)}
            />
          </Field>
          <Field label={t("vendor_trust")} modelInput hint="Range: 0 - 100">
            <input
              type="number"
              min="0"
              max="100"
              className={inputClass}
              value={form.vendor_trust_score}
              onChange={(e) => update("vendor_trust_score", +e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Metadata & Audit Inputs */}
      <div className="glass-panel rounded-xl p-6 transition-colors">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1 font-display">
          {t("metadata_inputs")}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {t("metadata_inputs_sub")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              min="0"
              className={inputClass}
              value={form.years_in_operation}
              onChange={(e) => update("years_in_operation", +e.target.value)}
            />
          </Field>
          <Field label={t("employee_count")}>
            <input
              type="number"
              min="1"
              className={inputClass}
              value={form.employee_count}
              onChange={(e) => update("employee_count", +e.target.value)}
            />
          </Field>
          <Field label={t("afhi_score")} hint="Alternative Financial Health Index (0-100)">
            <input
              type="number"
              min="0"
              max="100"
              className={inputClass}
              value={form.afhi_score}
              onChange={(e) => update("afhi_score", +e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* Revenue History */}
      <div className="glass-panel rounded-xl p-6 transition-colors">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1 font-display">
          {t("revenue_history")}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Provide monthly turnover numbers for cashflow forecasting analysis.
        </p>
        <textarea
          rows={3}
          className={`${inputClass} font-mono text-sm`}
          value={revText}
          onChange={(e) => setRevText(e.target.value)}
          placeholder="e.g. 400000, 420000, 410000, 450000, 470000, 460000, 480000, 490000, 475000, 500000, 510000, 520000"
        />
        {annualRevenue !== null && (
          <p className="text-xs text-[var(--brand-emerald)] font-semibold mt-2">
            Computed Annual Revenue: ₹{annualRevenue.toLocaleString("en-IN")}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 px-6 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-deep)] text-white font-bold text-sm tracking-wide shadow-md transition-base disabled:opacity-50"
      >
        {loading ? t("submitting") : t("submit_assessment")}
      </button>
    </form>
  );
}
