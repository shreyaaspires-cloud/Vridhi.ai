"use client";

import { useState, useCallback, useMemo } from "react";
import { api } from "../../lib/api";
import {
  Upload, FileText, Download, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Layers
} from "lucide-react";
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
  const [file,        setFile]        = useState(null);
  const [result,      setResult]      = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [dragOver,    setDragOver]    = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize,    setPageSize]    = useState(10);

  const handleFile = useCallback((f) => {
    setFile(f);
    setResult(null);
    setError(null);
    setCurrentPage(1);
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
      // Reset pagination on successful new batch
      setCurrentPage(1);
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
    const rows = [["business_name", "risk_score", "risk_label", "confidence", "default_probability", "recommendation"]];
    result.results.forEach((r) => {
      rows.push([
        `"${(r.business_name || "").replace(/"/g, '""')}"`,
        r.risk_score,
        r.risk_label,
        r.confidence,
        r.default_probability,
        `"${(r.recommendation?.eligibility || "Processed").replace(/"/g, '""')}"`,
      ]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "batch_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Pagination calculations
  const allResults = useMemo(() => result?.results || [], [result]);
  const totalRecords = allResults.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  // Current page records slice
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const currentRecords = useMemo(() => {
    return allResults.slice(startIndex, endIndex);
  }, [allResults, startIndex, endIndex]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const pieData = result && (result.processed_rows > 0 || totalRecords > 0)
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

      {/* Failed Applications Validation Errors Section */}
      {result && result.errors && result.errors.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4 text-xs text-amber-300 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold flex items-center gap-1.5">
              <AlertTriangle size={15} /> Failed Applications ({result.failed_rows} of {result.total_rows} rows had issues)
            </span>
            <span className="text-[11px] text-[#94A8C2]">Excluded from scoring results</span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] text-[#CBD5E1] bg-[#070910]/60 p-2.5 rounded-lg border border-white/5">
            {result.errors.map((e, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 font-mono font-medium">Row {e.row_number}:</span>
                <span>{e.business_name ? `[${e.business_name}] ` : ""}{e.error}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results & Summary */}
      {result && totalRecords > 0 && (
        <>
          {/* Summary KPIs (Total, Scored, Failed, LOW, MEDIUM, HIGH, Avg) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {[
              ["Uploaded",     result.total_rows ?? totalRecords,                 "text-[#EFF7FF]"],
              ["Scored",       result.processed_rows ?? totalRecords,             "text-[#55D9FF]"],
              ["Failed",       result.failed_rows ?? 0,                           result.failed_rows > 0 ? "text-amber-400" : "text-[#94A8C2]"],
              ["LOW Risk",     result.LOW,                                        "text-emerald-400"],
              ["MEDIUM Risk",  result.MEDIUM,                                     "text-amber-400"],
              ["HIGH Risk",    result.HIGH,                                       "text-red-400"],
              ["Avg Score",    result.average_score,                              "text-[#EFF7FF]"],
            ].map(([label, val, cls]) => (
              <div key={label} className="glass-panel rounded-xl p-4">
                <p className="text-[10px] text-[#4A6080] uppercase tracking-wider font-semibold">{label}</p>
                <p className={`text-xl font-bold mt-1 ${cls}`}>{val}</p>
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

          {/* Results Table with Complete Pagination */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <div
              className="flex flex-wrap items-center justify-between p-4 gap-3"
              style={{ borderBottom: "1px solid rgba(22,139,255,0.1)" }}
            >
              <div>
                <h3 className="text-sm font-semibold text-[#EFF7FF]">Individual Results</h3>
                <p className="text-xs text-[#94A8C2] mt-0.5">
                  Showing {totalRecords === 0 ? 0 : startIndex + 1}–{endIndex} of {totalRecords} scored applications
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Page Size Selector */}
                <div className="flex items-center gap-2 text-xs text-[#94A8C2]">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="bg-[#0C1C35] border border-[#168BFF]/30 text-[#EFF7FF] rounded-lg px-2.5 py-1 text-xs outline-none focus:border-[#168BFF]"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                  </select>
                </div>

                <button
                  onClick={handleDownloadResults}
                  className="text-xs text-[#168BFF] font-medium hover:text-[#55D9FF] flex items-center gap-1 transition-base px-3 py-1.5 rounded-lg border border-[#168BFF]/25 hover:bg-[#168BFF]/10"
                >
                  <Download className="w-3.5 h-3.5" /> Download CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead
                  className="sticky top-0"
                  style={{ background: "#0B1425" }}
                >
                  <tr
                    className="text-xs text-[#4A6080] uppercase"
                    style={{ borderBottom: "1px solid #1a2540" }}
                  >
                    <th className="text-left py-2.5 px-4">#</th>
                    <th className="text-left py-2.5 px-4">Business</th>
                    <th className="text-right py-2.5 px-4">Score</th>
                    <th className="text-center py-2.5 px-4">Risk Tier</th>
                    <th className="text-right py-2.5 px-4">Confidence</th>
                    <th className="text-right py-2.5 px-4">P(default)</th>
                    <th className="text-left py-2.5 px-4">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map((r, rowIdx) => {
                    const absIndex = startIndex + rowIdx;
                    return (
                      <tr
                        key={absIndex}
                        className="transition-base"
                        style={{ borderBottom: "1px solid #1a2540" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(22,139,255,0.04)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <td className="py-2.5 px-4 text-[#4A6080] font-mono text-xs">{absIndex + 1}</td>
                        <td className="py-2.5 px-4 font-medium text-[#EFF7FF]">{r.business_name}</td>
                        <td className="text-right py-2.5 px-4 font-bold text-[#EFF7FF]">{r.risk_score}</td>
                        <td className="text-center py-2.5 px-4"><RiskBadge label={r.risk_label} size="sm" /></td>
                        <td className="text-right py-2.5 px-4 text-[#94A8C2]">{(r.confidence * 100).toFixed(1)}%</td>
                        <td className="text-right py-2.5 px-4 text-[#94A8C2]">{(r.default_probability * 100).toFixed(1)}%</td>
                        <td className="py-2.5 px-4 text-xs text-[#94A8C2]">{r.recommendation?.eligibility || "Standard Review"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Bar */}
            {totalPages > 1 && (
              <div
                className="flex flex-wrap items-center justify-between p-4 gap-3 bg-[#0B1425]/60"
                style={{ borderTop: "1px solid rgba(22,139,255,0.1)" }}
              >
                <div className="text-xs text-[#94A8C2]">
                  Showing <span className="font-semibold text-[#EFF7FF]">{startIndex + 1}–{endIndex}</span> of <span className="font-semibold text-[#EFF7FF]">{totalRecords}</span> scored applications
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#94A8C2] hover:text-[#EFF7FF] border border-white/10 hover:border-[#168BFF]/40 disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-[#94A8C2] transition-base bg-[#0C1C35]"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    const isActive = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-base ${
                          isActive
                            ? "bg-[#168BFF] text-white shadow-sm shadow-[#168BFF]/40 border border-[#168BFF]"
                            : "bg-[#0C1C35] text-[#94A8C2] hover:text-[#EFF7FF] hover:bg-white/5 border border-white/10"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#94A8C2] hover:text-[#EFF7FF] border border-white/10 hover:border-[#168BFF]/40 disabled:opacity-30 disabled:hover:border-white/10 disabled:hover:text-[#94A8C2] transition-base bg-[#0C1C35]"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

