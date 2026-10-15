"use client";

import { useState, useCallback } from "react";
import { api } from "../../lib/api";
import { Upload, FileText, Download, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import RiskBadge from "../../components/RiskBadge";

const RISK_COLORS = { LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#ef4444" };

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

export default function BatchPage() {
  const [file,     setFile]     = useState(null);
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f) => {
    setFile(f);
    setResult(null);
    setError(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    const r = await api.predictBatch(file);
    setLoading(false);
    if (r.error) {
      setError(r.error);
    } else if (r.data) {
      const processed = r.data.processed_rows ?? r.data.total ?? 0;
      if (processed === 0) {
        const firstErr = r.data.errors?.[0]?.error || "Zero applications could be processed from this file.";
        setError(`No valid applications found: ${firstErr}`);
      }
      setResult(r.data);
    }
  };

  const handleDownloadSample = async () => {
    const blob = await api.downloadSampleCsv();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vridhi_msme_batch_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadResults = () => {
    if (!result || !result.results) return;
    const rows = [["business_name", "risk_score", "risk_label", "confidence", "default_probability"]];
    result.results.forEach((r) => {
      rows.push([r.business_name, r.risk_score, r.risk_label, r.confidence, r.default_probability]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "batch_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const pieData = result && result.processed_rows > 0
    ? [
        { name: "LOW",    value: result.LOW,    color: RISK_COLORS.LOW },
        { name: "MEDIUM", value: result.MEDIUM, color: RISK_COLORS.MEDIUM },
        { name: "HIGH",   value: result.HIGH,   color: RISK_COLORS.HIGH },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold text-[#EFF7FF]"
          style={{ fontFamily: "'Space Grotesk', Inter, system-ui, sans-serif" }}
        >
          Batch Portfolio Scoring
        </h1>
        <p className="text-sm text-[#94A8C2] mt-1">
          Upload a CSV to score multiple MSMEs at once (max 5 MB)
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className="rounded-xl border-2 border-dashed p-12 text-center transition-base"
        style={{
          borderColor: dragOver ? "#168BFF" : "rgba(22,139,255,0.2)",
          background:  dragOver
            ? "rgba(22,139,255,0.06)"
            : "rgba(11,20,37,0.5)",
        }}
      >
        <Upload
          className="w-10 h-10 mx-auto mb-4"
          style={{ color: dragOver ? "#168BFF" : "rgba(22,139,255,0.3)" }}
        />
        <p className="text-[#EFF7FF] font-medium mb-2">Drag and drop a CSV file here</p>
        <p className="text-sm text-[#4A6080] mb-4">or</p>
        <label
          className="inline-block px-5 py-2.5 rounded-lg font-medium text-white text-sm cursor-pointer transition-base"
          style={{
            background: "linear-gradient(135deg, #168BFF 0%, #0E6CD4 100%)",
            boxShadow:  "0 4px 16px rgba(22,139,255,0.25)",
          }}
        >
          Choose File
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />
        </label>
        {file && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#94A8C2]">
            <FileText className="w-4 h-4 text-[#168BFF]" />
            <span className="font-medium text-[#EFF7FF]">{file.name}</span>
            <span className="text-[#4A6080]">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-white text-sm disabled:opacity-50 transition-base"
          style={{
            background: "linear-gradient(135deg, #168BFF 0%, #0E6CD4 100%)",
            boxShadow:  "0 4px 16px rgba(22,139,255,0.25)",
          }}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Scoring…</>
          ) : (
            "Score Portfolio"
          )}
        </button>
        <button
          onClick={handleDownloadSample}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-[#94A8C2] text-sm transition-base"
          style={{
            border: "1px solid rgba(22,139,255,0.18)",
            background: "rgba(11,20,37,0.5)",
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(22,139,255,0.4)"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(22,139,255,0.18)"}
        >
          <Download className="w-4 h-4" /> Download Template
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 flex items-start gap-2 text-sm text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Assessment Notice</p>
            <p className="text-xs text-red-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {result && result.errors && result.errors.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 text-xs text-amber-300 space-y-1">
          <p className="font-semibold">Notice: {result.failed_rows} rows had formatting or value errors</p>
          <div className="max-h-24 overflow-y-auto space-y-0.5 text-[11px] text-[#CBD5E1]">
            {result.errors.slice(0, 5).map((e, idx) => (
              <p key={idx}>Row {e.row_number}: {e.error}</p>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (result.processed_rows > 0 || (result.results && result.results.length > 0)) && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              ["Processed", result.processed_rows ?? result.total, "text-[#EFF7FF]"],
              ["LOW Risk",  result.LOW,                            "text-emerald-400"],
              ["MEDIUM Risk", result.MEDIUM,                       "text-amber-400"],
              ["HIGH Risk", result.HIGH,                           "text-red-400"],
              ["Avg Score", result.average_score,                  "text-[#EFF7FF]"],
            ].map(([label, val, cls]) => (
              <div key={label} className="glass-panel rounded-xl p-5">
                <p className="text-xs text-[#4A6080] uppercase tracking-wide">{label}</p>
                <p className={`text-2xl font-bold mt-1 ${cls}`}>{val}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[#94A8C2] mb-4">Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "#94A8C2" }}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_DARK.tooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-panel rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[#94A8C2] mb-4">Score Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { name: "LOW",    count: result.LOW },
                  { name: "MEDIUM", count: result.MEDIUM },
                  { name: "HIGH",   count: result.HIGH },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_DARK.grid} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: CHART_DARK.tick }} axisLine={{ stroke: CHART_DARK.grid }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: CHART_DARK.tick }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={CHART_DARK.tooltip} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    <Cell fill={RISK_COLORS.LOW} />
                    <Cell fill={RISK_COLORS.MEDIUM} />
                    <Cell fill={RISK_COLORS.HIGH} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Results Table */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: "1px solid rgba(22,139,255,0.1)" }}
            >
              <h3 className="text-sm font-semibold text-[#EFF7FF]">Individual Results</h3>
              <button
                onClick={handleDownloadResults}
                className="text-sm text-[#168BFF] font-medium hover:text-[#55D9FF] flex items-center gap-1 transition-base"
              >
                <Download className="w-4 h-4" /> Download CSV
              </button>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead
                  className="sticky top-0"
                  style={{ background: "#0B1425" }}
                >
                  <tr
                    className="text-xs text-[#4A6080] uppercase"
                    style={{ borderBottom: "1px solid #1a2540" }}
                  >
                    <th className="text-left py-2 px-4">#</th>
                    <th className="text-left py-2 px-4">Business</th>
                    <th className="text-right py-2 px-4">Score</th>
                    <th className="text-center py-2 px-4">Risk</th>
                    <th className="text-right py-2 px-4">Confidence</th>
                    <th className="text-right py-2 px-4">P(default)</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((r) => (
                    <tr
                      key={r.index}
                      className="transition-base"
                      style={{ borderBottom: "1px solid #1a2540" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(22,139,255,0.04)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <td className="py-2 px-4 text-[#4A6080]">{r.index + 1}</td>
                      <td className="py-2 px-4 font-medium text-[#EFF7FF]">{r.business_name}</td>
                      <td className="text-right py-2 px-4 font-semibold text-[#EFF7FF]">{r.risk_score}</td>
                      <td className="text-center py-2 px-4"><RiskBadge label={r.risk_label} size="sm" /></td>
                      <td className="text-right py-2 px-4 text-[#94A8C2]">{(r.confidence * 100).toFixed(1)}%</td>
                      <td className="text-right py-2 px-4 text-[#94A8C2]">{(r.default_probability * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
