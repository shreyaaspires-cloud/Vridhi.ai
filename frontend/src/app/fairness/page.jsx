"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Scale, AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";

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
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-muted)]">
        <div className="w-8 h-8 border-2 border-[var(--brand-emerald)]/20 border-t-[var(--brand-emerald)] rounded-full animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/25 text-red-500 rounded-xl p-6 text-sm">
        {error}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6 pb-16">
      <div>
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-[var(--brand-emerald)]" />
          <h1
            className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] font-display"
          >
            Fairness &amp; Bias Analysis
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Audit-level analysis of credit decisions across demographic groups
        </p>
      </div>

      {/* Important note */}
      <div
        className="glass-panel rounded-xl p-4 flex items-start gap-3 border border-[var(--border-default)]"
      >
        <Info className="w-5 h-5 text-[var(--brand-emerald)] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[var(--text-secondary)]">
          Fairness attributes (owner gender, region, sector type) are used for audit and analysis
          only and are <strong className="text-[var(--text-primary)]">not model input features</strong>. The ML
          model uses 8 financial/alternative-data features exclusively.
        </p>
      </div>

      {/* Portfolio summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel rounded-xl p-5">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Portfolio Average Score</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 font-display">{data.portfolio_avg_score}</p>
        </div>
        <div className="glass-panel rounded-xl p-5">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Portfolio Approval Rate</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 font-display">{data.portfolio_approval_rate}%</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Threshold: score ≥ {data.approval_threshold}</p>
        </div>
      </div>

      {/* Per-attribute analyses */}
      {(data.analyses || []).map((analysis) => (
        <div key={analysis.attribute} className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-[var(--text-primary)] capitalize">
              {analysis.attribute.replace(/_/g, " ")} Analysis
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 size={13} />
              <span>Compliant</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analysis.groups || []}
                margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="group" stroke="var(--chart-text)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--chart-text)" fontSize={12} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--chart-tooltip-bg)",
                    border: "1px solid var(--chart-tooltip-border)",
                    borderRadius: "8px",
                    color: "var(--chart-tooltip-text)",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="approval_rate" fill="var(--brand-emerald)" radius={[6, 6, 0, 0]} name="Approval Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
