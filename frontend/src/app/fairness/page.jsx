"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Scale, AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";

const CHART_DARK = {
  grid:    "#1a2540",
  tick:    "#94A8C2",
  tooltip: {
    borderRadius: 8,
    border: "1px solid rgba(22,139,255,0.18)",
    background: "#0C1C35",
    color: "#EFF7FF",
    fontSize: 12,
  },
};

export default function FairnessPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const r = await api.fairness();
    setLoading(false);
    if (r.error) setError(r.error);
    else         setData(r.data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#168BFF]/20 border-t-[#168BFF] rounded-full animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl p-6 text-sm">
        {error}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-[#168BFF]" />
          <h1
            className="text-2xl font-bold text-[#EFF7FF]"
            style={{ fontFamily: "'Space Grotesk', Inter, system-ui, sans-serif" }}
          >
            Fairness &amp; Bias Analysis
          </h1>
        </div>
        <p className="text-sm text-[#94A8C2] mt-1">
          Audit-level analysis of credit decisions across demographic groups
        </p>
      </div>

      {/* Important note */}
      <div
        className="glass-panel rounded-xl p-4 flex items-start gap-3"
        style={{ borderColor: "rgba(22,139,255,0.18)" }}
      >
        <Info className="w-5 h-5 text-[#168BFF] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#94A8C2]">
          Fairness attributes (owner gender, region, sector type) are used for audit and analysis
          only and are <strong className="text-[#EFF7FF]">not model input features</strong>. The ML
          model uses 8 financial/alternative-data features exclusively.
        </p>
      </div>

      {/* Portfolio summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel rounded-xl p-5">
          <p className="text-xs text-[#4A6080] uppercase tracking-wide">Portfolio Average Score</p>
          <p className="text-2xl font-bold text-[#EFF7FF] mt-1">{data.portfolio_avg_score}</p>
        </div>
        <div className="glass-panel rounded-xl p-5">
          <p className="text-xs text-[#4A6080] uppercase tracking-wide">Portfolio Approval Rate</p>
          <p className="text-2xl font-bold text-[#EFF7FF] mt-1">{data.portfolio_approval_rate}%</p>
          <p className="text-xs text-[#4A6080] mt-1">Threshold: score ≥ {data.approval_threshold}</p>
        </div>
      </div>

      {/* Per-attribute analyses */}
      {(data.analyses || []).map((analysis) => (
        <div key={analysis.attribute} className="glass-panel rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#EFF7FF] capitalize">
              {analysis.attribute.replace(/_/g, " ")} Analysis
            </h3>
            <span className="text-xs text-[#4A6080]">{analysis.note}</span>
          </div>

          {/* Approval rate chart */}
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analysis.groups} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_DARK.grid} />
              <XAxis
                dataKey="group"
                tick={{ fontSize: 11, fill: CHART_DARK.tick }}
                axisLine={{ stroke: CHART_DARK.grid }} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: CHART_DARK.tick }}
                axisLine={false} tickLine={false}
                unit="%"
              />
              <Tooltip
                contentStyle={CHART_DARK.tooltip}
                formatter={(v, name) => [
                  `${v}${name === "approval_rate" ? "%" : ""}`,
                  name.replace(/_/g, " "),
                ]}
              />
              <Bar dataKey="approval_rate" radius={[4, 4, 0, 0]} name="Approval Rate">
                {analysis.groups.map((g, i) => (
                  <Cell key={i} fill={g.bias_alert ? "#ef4444" : "#168BFF"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Group table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-xs text-[#4A6080] uppercase"
                  style={{ borderBottom: "1px solid #1a2540" }}
                >
                  {["Group", "Count", "Avg Score", "Approval %", "Deviation", "DI Ratio", "4/5 Rule", "Bias Alert"].map((h) => (
                    <th
                      key={h}
                      className={`py-2 px-2 ${h === "Group" ? "text-left" : h === "4/5 Rule" || h === "Bias Alert" ? "text-center" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.groups.map((g) => (
                  <tr
                    key={g.group}
                    className="transition-base"
                    style={{ borderBottom: "1px solid #1a2540" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(22,139,255,0.04)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td className="py-2 px-2 font-medium text-[#EFF7FF]">{g.group}</td>
                    <td className="text-right py-2 px-2 text-[#94A8C2]">{g.count}</td>
                    <td className="text-right py-2 px-2 text-[#94A8C2]">{g.average_score}</td>
                    <td className="text-right py-2 px-2 text-[#94A8C2]">{g.approval_rate}%</td>
                    <td
                      className={`text-right py-2 px-2 font-medium ${
                        Math.abs(g.deviation) > 15 ? "text-red-400" : "text-[#94A8C2]"
                      }`}
                    >
                      {g.deviation > 0 ? "+" : ""}{g.deviation}
                    </td>
                    <td className="text-right py-2 px-2 text-[#94A8C2]">{g.disparate_impact_ratio}</td>
                    <td className="text-center py-2 px-2">
                      {g.four_fifths_pass ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-2 px-2">
                      {g.bias_alert ? (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Alert
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-400">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="glass-panel-deep rounded-xl p-4 text-xs text-[#4A6080] space-y-1">
        <p>
          <strong className="text-[#94A8C2]">Disparate Impact Ratio</strong> = group approval rate /
          highest group approval rate. Below 0.8 fails the four-fifths rule.
        </p>
        <p>
          <strong className="text-[#94A8C2]">Deviation</strong> = group average score - portfolio
          average score. Bias alert triggered when deviation exceeds 15 points.
        </p>
      </div>
    </div>
  );
}
