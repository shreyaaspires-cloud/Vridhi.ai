"use client";

import { useAssessment } from "../../context/AssessmentContext";
import { api } from "../../lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, TrendingUp, Target, AlertTriangle,
  FileText, CheckCircle2, Info, LineChart as LineChartIcon,
} from "lucide-react";
import KpiCard from "../../components/KpiCard";
import ScoreGauge from "../../components/ScoreGauge";
import RiskBadge from "../../components/RiskBadge";
import ExplainabilityChart from "../../components/ExplainabilityChart";
import Chatbot from "../../components/Chatbot";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { formatCurrency } from "../../lib/utils";

const CHART_DARK = {
  grid: "#1a2540",
  tick: "#94A8C2",
  tooltip: {
    borderRadius: 8,
    border: "1px solid rgba(22,139,255,0.18)",
    background: "#0C1C35",
    color: "#EFF7FF",
    fontSize: 12,
  },
};

const appTabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/simulator", label: "Simulator" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/fairness", label: "Fairness" },
  { href: "/batch", label: "Batch Upload" },
];

export default function DashboardPage() {
  const { prediction, chatContext } = useAssessment();
  const [forecast, setForecast] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    if (prediction && chatContext) {
      const ctx = chatContext;
      if (ctx.revenue_history && ctx.revenue_history.length >= 6) {
        api
          .forecast({ revenue_history: ctx.revenue_history, monthly_emi: 0 })
          .then((r) => { if (!r.error) setForecast(r.data); });
      }
    }
  }, [prediction]);

  const rec = prediction?.recommendation || {};
  const factors = prediction?.factors || [];

  const forecastData = forecast
    ? [
        ...forecast.historical.map((v, i) => ({ month: `M${i + 1}`, type: "Historical", value: v })),
        ...forecast.forecast.map((v, i) => ({
          month: `F${i + 1}`,
          type: "Forecast",
          value: v,
          lower: forecast.lower[i],
          upper: forecast.upper[i],
        })),
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Persistent App Tab Bar */}
      <div className="glass-panel rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto">
        {appTabs.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-base whitespace-nowrap ${
                isActive
                  ? "bg-[#168BFF]/20 text-[#EFF7FF] border border-[#168BFF]/35 shadow-sm"
                  : "text-[#94A8C2] hover:text-[#EFF7FF] hover:bg-white/5"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {!prediction ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div
            className="glass-panel rounded-2xl p-10 flex flex-col items-center"
            style={{ maxWidth: 460 }}
          >
            <Target className="w-12 h-12 text-[#168BFF]/50 mb-4" />
            <h2 className="text-xl font-semibold text-[#EFF7FF]">No assessment yet</h2>
            <p className="text-[#94A8C2] mt-2 text-sm leading-relaxed">
              Fill in the business assessment form on the home page to generate a credit risk score.
            </p>
            <Link
              href="/#assessment"
              className="mt-6 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#168BFF] hover:bg-[#168BFF]/85 text-white text-sm font-medium transition-base shadow-lg shadow-[#168BFF]/20"
            >
              Go to Assessment →
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1
                className="text-2xl font-bold text-[#EFF7FF]"
                style={{ fontFamily: "'Space Grotesk', Inter, system-ui, sans-serif" }}
              >
                Risk Dashboard
              </h1>
              <p className="text-sm text-[#94A8C2] mt-1">{prediction.business_name}</p>
            </div>
            <RiskBadge label={prediction.risk_label} size="lg" />
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Credit Risk Score"   value={prediction.risk_score}                                          subtitle="out of 100"        icon={Shield}        color="blue" />
            <KpiCard
              title="Risk Label"
              value={prediction.risk_label}
              subtitle={prediction.risk_label === "LOW" ? "Low risk profile" : prediction.risk_label === "MEDIUM" ? "Moderate risk" : "High risk"}
              icon={AlertTriangle}
              color={prediction.risk_label === "LOW" ? "emerald" : prediction.risk_label === "MEDIUM" ? "amber" : "red"}
            />
            <KpiCard title="Confidence"          value={`${(prediction.confidence * 100).toFixed(1)}%`}                subtitle="Model confidence"  icon={Target}        color="slate" />
            <KpiCard title="Default Probability" value={`${(prediction.default_probability * 100).toFixed(1)}%`}       subtitle="P(default)"        icon={TrendingUp}    color="red" />
          </div>

          {/* Score Gauge + Explainability */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ScoreGauge score={prediction.risk_score} label={prediction.risk_label} />
            </div>
            <div className="lg:col-span-2">
              <ExplainabilityChart factors={factors} />
            </div>
          </div>

          {/* Loan Recommendation */}
          <div className="glass-panel rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-[#168BFF]" />
              <h3 className="text-sm font-semibold text-[#EFF7FF]">Loan Recommendation</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              {[
                ["Eligibility",       rec.eligibility || "N/A"],
                ["Suggested Amount",  rec.suggested_amount ? formatCurrency(rec.suggested_amount) : "N/A"],
                ["Interest Rate Range", rec.interest_rate_range || "N/A"],
                ["Repayment Period",  rec.repayment_period_months ? `${rec.repayment_period_months} months` : "N/A"],
              ].map(([label, val]) => (
                <div key={label} className="glass-panel-deep rounded-lg p-4">
                  <p className="text-xs text-[#4A6080] uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-semibold text-[#EFF7FF] mt-1">{val}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-[#4A6080] uppercase mb-2">Reasons</p>
                <ul className="space-y-1.5">
                  {(rec.reasons || []).map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#94A8C2]">
                      <Info className="w-4 h-4 text-[#168BFF] flex-shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#4A6080] uppercase mb-2">Conditions</p>
                <ul className="space-y-1.5">
                  {(rec.conditions || []).map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#94A8C2]">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {rec.disclaimer && (
              <p className="mt-4 text-xs text-[#4A6080] italic">{rec.disclaimer}</p>
            )}
          </div>

          {/* Cash Flow Forecast */}
          {forecast && forecastData.length > 0 && (
            <div className="glass-panel rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <LineChartIcon className="w-5 h-5 text-[#168BFF]" />
                <h3 className="text-sm font-semibold text-[#EFF7FF]">6-Month Cash Flow Forecast</h3>
                <span className="text-xs text-[#4A6080] ml-auto">{forecast.method}</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={forecastData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#168BFF" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#168BFF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_DARK.grid} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART_DARK.tick }} axisLine={{ stroke: CHART_DARK.grid }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: CHART_DARK.tick }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => v >= 100000 ? `${(v / 100000).toFixed(0)}L` : v.toFixed(0)}
                  />
                  <Tooltip
                    contentStyle={CHART_DARK.tooltip}
                    formatter={(v) => [formatCurrency(v), ""]}
                  />
                  <Area type="monotone" dataKey="value" stroke="#168BFF" fill="url(#histGrad)" strokeWidth={2} name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
              {forecast.risky_months && forecast.risky_months.length > 0 && (
                <div className="mt-3 bg-red-500/10 border border-red-500/25 rounded-lg p-3 text-sm text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Risky months detected: {forecast.risky_months.map((m) => `Month ${m + 1}`).join(", ")}
                </div>
              )}
            </div>
          )}

          {/* AI Assistant */}
          <Chatbot context={chatContext} />
        </>
      )}
    </div>
  );
}
