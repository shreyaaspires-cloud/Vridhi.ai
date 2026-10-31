"use client";

import { useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import { SlidersHorizontal, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import RiskBadge from "../../components/RiskBadge";

const SCENARIOS = [
  { value: "baseline", label: "Baseline" },
  { value: "recession", label: "Recession" },
  { value: "inflation_spike", label: "Inflation Spike" },
  { value: "interest_rate_hike", label: "Interest Rate Hike" },
  { value: "festive_boom", label: "Festive Boom" },
];

const DEFAULTS = {
  income: 5000000,
  loan_amount: 1500000,
  gst_compliance_rate: 85,
  monthly_upi_volume: 200000,
  utility_delay_days: 5,
  vendor_trust_score: 75,
  sector_type: "Manufacturing",
  afhi_score: 70,
  income_change_pct: 0,
  loan_amount_change_pct: 0,
  gst_compliance_change: 0,
  utility_delay_change: 0,
  upi_volume_change_pct: 0,
  vendor_trust_change: 0,
  macro_scenario: "baseline",
};

export default function SimulatorPage() {
  const { t } = useLanguage();
  const [form, setForm] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (key, val) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    const r = await api.simulate(form);
    setLoading(false);
    if (r.error) setError(r.error);
    else setResult(r.data);
  };

  return (
    <div className="space-y-6 pb-16">
      <div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-[var(--brand-emerald)]" />
          <h1
            className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] font-display"
          >
            {t("simulator_title")}
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {t("simulator_sub")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="glass-panel rounded-2xl p-6 space-y-5 transition-colors">
          <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Business Parameters</h3>

          {[
            { key: "income_change_pct", label: t("income_change"), unit: "%", min: -80, max: 200, step: 5 },
            { key: "loan_amount_change_pct", label: t("loan_change"), unit: "%", min: -80, max: 200, step: 5 },
            { key: "gst_compliance_change", label: t("gst_change"), unit: "", min: -50, max: 50, step: 1 },
            { key: "utility_delay_change", label: t("utility_change"), unit: " days", min: -60, max: 120, step: 1 },
            { key: "upi_volume_change_pct", label: t("upi_change"), unit: "%", min: -80, max: 200, step: 5 },
            { key: "vendor_trust_change", label: t("vendor_change"), unit: "", min: -50, max: 50, step: 1 },
          ].map(({ key, label, unit, min, max, step }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
                <span className="text-sm text-[var(--brand-emerald)] font-bold tabular-nums">
                  {form[key] > 0 ? "+" : ""}{form[key]}{unit}
                </span>
              </div>
              <input
                type="range"
                className="w-full accent-[var(--brand-emerald)] cursor-pointer"
                min={min}
                max={max}
                step={step}
                value={form[key]}
                onChange={(e) => update(key, +e.target.value)}
              />
            </div>
          ))}

          <div className="pt-2">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              {t("macro_scenario")}
            </label>
            <select
              className="dark-input"
              value={form.macro_scenario}
              onChange={(e) => update("macro_scenario", e.target.value)}
            >
              {SCENARIOS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="w-full font-bold py-3.5 rounded-xl text-white disabled:opacity-50 transition-base bg-[var(--brand-primary)] hover:bg-[var(--brand-deep)] shadow-md"
          >
            {loading ? t("simulating") : t("run_simulation")}
          </button>
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-500 rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              <div className="glass-panel rounded-2xl p-6 transition-colors">
                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-5">{t("simulation_results")}</h3>

                {/* Score transition display */}
                <div className="flex items-center justify-center gap-6 mb-6 flex-wrap p-5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)]">
                  {/* Previous Score */}
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{t("before")}</p>
                    <div className="text-4xl font-bold text-[var(--text-secondary)] font-display">{result.original_score}</div>
                    <div className="mt-2"><RiskBadge label={result.old_label} size="sm" /></div>
                  </div>

                  {/* Animated Arrow + Delta */}
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="flex items-center gap-1"
                      style={{ animation: "pulse 1.5s ease-in-out infinite" }}
                    >
                      <span className="text-2xl" style={{ color: result.delta >= 0 ? "#10b981" : "#ef4444" }}>
                        {result.delta >= 0 ? "↗" : "↘"}
                      </span>
                    </div>
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: result.delta >= 0 ? "#10b981" : "#ef4444" }}
                    >
                      {result.delta > 0 ? "+" : ""}{result.delta} pts
                    </span>
                  </div>

                  {/* New Score */}
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{t("after")}</p>
                    <div
                      className="text-4xl font-bold tabular-nums font-display"
                      style={{ color: result.delta >= 0 ? "#10b981" : "#ef4444" }}
                    >
                      {result.new_score}
                    </div>
                    <div className="mt-2"><RiskBadge label={result.new_label} size="sm" /></div>
                  </div>
                </div>

                {/* Score change summary row */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  {result.delta > 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  ) : result.delta < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  ) : (
                    <span className="w-5 h-5 text-[var(--text-muted)] text-center font-bold">—</span>
                  )}
                  <span className={`text-base font-semibold ${result.delta > 0 ? "text-emerald-500" : result.delta < 0 ? "text-red-500" : "text-[var(--text-secondary)]"}`}>
                    Score change: {result.delta > 0 ? "+" : ""}{result.delta != null ? result.delta : "0"} points
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-panel rounded-2xl p-12 text-center text-[var(--text-muted)] flex flex-col items-center justify-center min-h-[380px]">
              <SlidersHorizontal className="w-12 h-12 text-[var(--brand-emerald)]/40 mb-3" />
              <p className="font-semibold text-[var(--text-primary)]">No simulation run yet</p>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
                Adjust the sliders on the left and click "Simulate Credit Score" to test your resilience under different scenarios.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
