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

export default function BatchPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
      { name: "LOW", value: result.LOW, color: RISK_COLORS.LOW },
      { name: "MEDIUM", value: result.MEDIUM, color: RISK_COLORS.MEDIUM },
      { name: "HIGH", value: result.HIGH, color: RISK_COLORS.HIGH },
    ]
    : [];

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1
          className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] font-display"
        >
          Batch Portfolio Scoring
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Upload a CSV to score multiple MSMEs simultaneously (max 5 MB)
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className="rounded-2xl border-2 border-dashed p-10 md:p-14 text-center transition-base"
        style={{
          borderColor: dragOver ? "var(--brand-emerald)" : "var(--border-default)",
          background: dragOver
            ? "var(--surface-secondary)"
            : "var(--surface-card)",
        }}
      >
        <Upload
          className="w-12 h-12 mx-auto mb-4"
          style={{ color: dragOver ? "var(--brand-emerald)" : "var(--brand-emerald)" }}
        />
        <p className="text-[var(--text-primary)] font-semibold mb-1 text-base">Drag and drop a CSV file here</p>
        <p className="text-sm text-[var(--text-muted)] mb-5">or click browse to select from your device</p>
        <label
          className="inline-block px-6 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer transition-base bg-[var(--brand-primary)] hover:bg-[var(--brand-deep)] shadow-sm"
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
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)] text-sm text-[var(--text-primary)]">
            <FileText className="w-4 h-4 text-[var(--brand-emerald)]" />
            <span className="font-semibold">{file.name}</span>
            <span className="text-[var(--text-muted)]">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-base bg-[var(--brand-primary)] hover:bg-[var(--brand-deep)] shadow-sm"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Scoring Portfolio..." : "Score Portfolio"}
        </button>
        <button
          onClick={handleDownloadSample}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-base bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)] text-[var(--text-primary)]"
        >
          <Download className="w-4 h-4 text-[var(--brand-emerald)]" />
          Download Sample Template (.CSV)
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl p-4 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 rounded-xl">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Total Scored</span>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1 font-display">{totalRecords}</p>
            </div>
            <div className="glass-panel p-5 rounded-xl">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">Low Risk</span>
              <p className="text-2xl font-bold text-emerald-500 mt-1 font-display">{result.LOW || 0}</p>
            </div>
            <div className="glass-panel p-5 rounded-xl">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">High Risk</span>
              <p className="text-2xl font-bold text-red-500 mt-1 font-display">{result.HIGH || 0}</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Scored Applications</h2>
              <button
                onClick={handleDownloadResults}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-deep)] text-white text-xs font-semibold shadow-sm transition-base"
              >
                <Download size={14} /> Export Results (.CSV)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase text-[var(--text-muted)] border-b border-[var(--border-default)]">
                  <tr>
                    <th className="py-3 px-4">Business Name</th>
                    <th className="py-3 px-4">Score</th>
                    <th className="py-3 px-4">Risk Tier</th>
                    <th className="py-3 px-4">Default Probability</th>
                    <th className="py-3 px-4">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-default)]">
                  {currentRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">{r.business_name}</td>
                      <td className="py-3 px-4 font-bold text-[var(--text-primary)] font-display">{r.risk_score}</td>
                      <td className="py-3 px-4"><RiskBadge label={r.risk_label} size="sm" /></td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">{(r.default_probability * 100).toFixed(1)}%</td>
                      <td className="py-3 px-4 text-xs font-medium text-[var(--text-secondary)]">{r.recommendation?.eligibility || "Standard Review"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-default)]">
                <span className="text-xs text-[var(--text-muted)]">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-primary)] disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-primary)] disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
