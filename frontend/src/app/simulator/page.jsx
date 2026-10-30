"use client";

import { useState } from "react";
import { api } from "../../lib/api";
import { useLanguage } from "../../context/LanguageContext";
import { SlidersHorizontal, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import RiskBadge from "../../components/RiskBadge";

const SCENARIOS = [
  { value: "baseline",          label: "Baseline" },
  { value: "recession",         label: "Recession" },
  { value: "inflation_spike",   label: "Inflation Spike" },
  { value: "interest_rate_hike",label: "Interest Rate Hike" },
  { value: "festive_boom",      label: "Festive Boom" },
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
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-[#168BFF]" />
          <h1
            className="text-2xl font-bold text-[#EFF7FF]"
            style={{ fontFamily: "'Space Grotesk', Inter, system-ui, sans-serif" }}
          >
            {t("simulator_title")}
          </h1>
        </div>
        <p className="text-sm text-[#94A8C2] mt-1">
          {t("simulator_sub")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="glass-panel rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-[#94A8C2]">Business Parameters</h3>

          {[
            { key: "income_change_pct",      label: t("income_change"),       unit: "%",    min: -80,  max: 200, step: 5  },
            { key: "loan_amount_change_pct", label: t("loan_change"),         unit: "%",    min: -80,  max: 200, step: 5  },
            { key: "gst_compliance_change",  label: t("gst_change"),          unit: "",   min: -50,  max: 50,  step: 1  },
            { key: "utility_delay_change",   label: t("utility_change"),      unit: " days", min: -60, max: 120, step: 1 },
            { key: "upi_volume_change_pct",  label: t("upi_change"),          unit: "%",    min: -80,  max: 200, step: 5  },
            { key: "vendor_trust_change",    label: t("vendor_change"),       unit: "",     min: -50,  max: 50,  step: 1  },
          ].map(({ key, label, unit, min, max, step }) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-[#94A8C2]">{label}</label>
                <span className="text-sm text-[#168BFF] font-semibold tabular-nums">
                  {form[key] > 0 ? "+" : ""}{form[key]}{unit}
                </span>
              </div>
              <input
                type="range"
                className="w-full"
                min={min}
                max={max}
                step={step}
                value={form[key]}
                onChange={(e) => update(key, +e.target.value)}
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-[#94A8C2] mb-1.5">
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
            className="w-full font-semibold py-3 rounded-lg text-white disabled:opacity-50 transition-base"
            style={{
              background: "linear-gradient(135deg, #168BFF 0%, #0E6CD4 100%)",
              boxShadow: "0 4px 16px rgba(22,139,255,0.25)",
            }}
          >
            {loading ? t("simulating") : t("run_simulation")}
          </button>
          {error && (
            <div className="bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result ? (
            <>
              <div className="glass-panel rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#94A8C2] mb-5">{t("simulation_results")}</h3>

                {/* Score transition display with animated arrow */}
                <div className="flex items-center justify-center gap-4 mb-6 flex-wrap">
                  {/* Previous Score */}
                  <div className="text-center">
                    <p className="text-xs text-[#4A6080] uppercase tracking-wider mb-1">{t("before")}</p>
                    <div className="text-4xl font-bold text-[#94A8C2]">{result.original_score}</div>
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
                    <p className="text-xs text-[#4A6080] uppercase tracking-wider mb-1">{t("after")}</p>
                    <div
                      className="text-4xl font-bold tabular-nums"
                      style={{ color: result.delta >= 0 ? "#10b981" : "#ef4444" }}
                    >
                      {result.original_score} → {result.new_score}
                    </div>
                    <div className="mt-2"><RiskBadge label={result.new_label} size="sm" /></div>
                  </div>
                </div>

                {/* Score change summary row */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  {result.delta > 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  ) : result.delta < 0 ? (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  ) : (
                    <span className="w-5 h-5 text-[#4A6080] text-center font-bold">—</span>
                  )}
                  <span className={`text-base font-semibold ${
                    result.delta > 0 ? "text-emerald-400" : result.delta < 0 ? "text-red-400" : "text-[#94A8C2]"
                  }`}>
                    Score change:{" "}
                    {result.delta > 0 ? "+" : ""}{result.delta != null ? result.delta : "0"} points
                  </span>
                </div>

                {/* Risk tier shift callout */}
                {result.old_label !== result.new_label && (
                  <div
                    className="flex items-center justify-center gap-2 mb-4 px-4 py-2.5 rounded-lg text-xs font-medium"
                    style={{
                      background: "rgba(22,139,255,0.08)",
                      border: "1px solid rgba(22,139,255,0.2)",
                    }}
                  >
                    <span className="text-[#94A8C2]">Risk tier shift:</span>
                    <RiskBadge label={result.old_label} size="sm" />
                    <ArrowRight className="w-3 h-3 text-[#168BFF]" />
                    <RiskBadge label={result.new_label} size="sm" />
                  </div>
                )}

                {/* No change callout */}
                {result.delta === 0 && (
                  <div className="flex items-center justify-center mb-4 text-xs text-[#94A8C2]">
                    No change in credit score under these conditions.
                  </div>
                )}

                <div className="glass-panel-deep rounded-lg p-4">
                  <p className="text-sm text-[#94A8C2]">{result.message}</p>
                </div>
              </div>

              <div className="glass-panel rounded-xl p-6">
                <h3 className="text-sm font-semibold text-[#94A8C2] mb-3">{t("applied_values")}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(result.applied_multipliers || {}).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between py-1.5 border-b border-[#1a2540]"
                    >
                      <span className="text-[#4A6080]">{k.replace(/_/g, " ")}</span>
                      <span className="font-medium text-[#EFF7FF]">
                        {typeof v === "number"
                          ? v.toLocaleString("en-IN", { maximumFractionDigits: 0 })
                          : v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-panel rounded-xl p-12 text-center">
              <SlidersHorizontal className="w-10 h-10 text-[#168BFF]/25 mx-auto mb-3" />
              <p className="text-[#4A6080] text-sm">
                Adjust the sliders and run a simulation to see results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
