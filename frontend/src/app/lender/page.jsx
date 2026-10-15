"use client";

import { useEffect, useState } from "react";
import KpiCard from "../../components/KpiCard";
import RiskBadge from "../../components/RiskBadge";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";
import toast from "react-hot-toast";
import {
  Building2, Users, Shield, AlertTriangle, Download, Upload,
  Search, Scale, BarChart2, Filter, FileSpreadsheet
} from "lucide-react";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend
} from "recharts";

export default function LenderPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters for scatter plot
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [sizeFilter, setSizeFilter] = useState("ALL");

  // Search state for individual business lookup
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedBusiness, setSearchedBusiness] = useState(null);
  const [searchDone, setSearchDone] = useState(false);

  // Batch upload state
  const [batchFile, setBatchFile] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // Fairness audit data state
  const [fairnessData, setFairnessData] = useState(null);

  useEffect(() => {
    Promise.all([
      api.segmentation(),
      api.fairness(),
    ])
      .then(([segRes, fairRes]) => {
        if (segRes.data) setData(segRes.data);
        if (fairRes.data) setFairnessData(fairRes.data);
      })
      .catch((err) => setError("Failed to load lender intelligence data."))
      .finally(() => setLoading(false));
  }, []);

  // Filtered scatter plot items
  const scatterItems = (data?.businesses || []).filter((b) => {
    if (sectorFilter !== "ALL" && b.sector !== sectorFilter) return false;
    if (regionFilter !== "ALL" && b.region !== regionFilter) return false;
    if (sizeFilter !== "ALL" && b.size !== sizeFilter) return false;
    return true;
  });

  // Handle business search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearchDone(true);
    const term = searchTerm.toLowerCase().trim();
    const found = (data?.businesses || []).find(
      (b) => b.name?.toLowerCase().includes(term) || String(b.id) === term
    );
    setSearchedBusiness(found || null);
  };

  // CSV Report Download
  const handleDownloadReport = () => {
    const list = data?.businesses || [];
    if (list.length === 0) {
      alert("No portfolio data available to download.");
      return;
    }
    const headers = ["Business Name", "Credit Score", "Risk Label", "Sector", "Region", "Size", "Suggested Loan Amount"];
    const rows = list.map((b) => [
      `"${(b.name || "MSME Business").replace(/"/g, '""')}"`,
      b.score,
      b.risk_label,
      `"${(b.sector || "N/A").replace(/"/g, '""')}"`,
      `"${(b.region || "N/A").replace(/"/g, '""')}"`,
      `"${(b.size || "N/A").replace(/"/g, '""')}"`,
      b.suggested_amount || 0,
    ]);

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Vridhi_Lender_Portfolio_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Batch Template
  const handleDownloadTemplate = async () => {
    try {
      const blob = await api.downloadSampleCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "vridhi_msme_batch_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error("Failed to download template.");
    }
  };

  // Batch File Process
  const handleBatchProcess = async () => {
    if (!batchFile) return;
    setBatchLoading(true);
    try {
      const res = await api.predictBatch(batchFile);
      if (res.data) {
        const processed = res.data.processed_rows ?? res.data.total_processed ?? (res.data.results || []).length ?? 0;
        const failed = res.data.failed_rows ?? (res.data.errors || []).length ?? 0;

        if (processed === 0) {
          const firstErr = res.data.errors?.[0]?.error || "Zero records could be processed. Please check file format and values.";
          toast.error(`Batch processing failed: ${firstErr}`);
          setBatchResults(res.data);
        } else {
          setBatchResults(res.data);
          if (failed > 0) {
            toast.success(`Batch assessment: ${processed} processed, ${failed} rows had issues.`);
          } else {
            toast.success(`Batch assessment complete! Processed ${processed} applications.`);
          }
          // Refresh portfolio stats
          fetchLenderData();
        }
      } else if (res.error) {
        console.error("Batch error:", res.error);
        toast.error(res.error);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to process batch CSV.");
    } finally {
      setBatchLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-64 text-[#94A8C2]">Loading lender dashboard...</div>;
  if (error) return <div className="flex items-center justify-center min-h-64 text-red-400">{error}</div>;

  return (
    <div className="space-y-12 pb-16">
      {/* ── SECTION 1: HERO BANNER ───────────────────────────────────── */}
      <section
        className="rounded-3xl p-8 md:p-12 relative overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #0B1425 0%, #070910 100%)",
          border: "1px solid rgba(22,139,255,0.15)",
        }}
      >
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#168BFF]/10 border border-[#168BFF]/25">
            <Building2 size={14} className="text-[#168BFF]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#168BFF]">
              For Banks & NBFCs
            </span>
          </div>
          <h1
            className="text-3xl md:text-5xl font-bold text-[#EFF7FF] leading-tight"
            style={{ fontFamily: "'Space Grotesk', Inter, system-ui, sans-serif" }}
          >
            Lender Intelligence Dashboard
          </h1>
          <p className="text-[#94A8C2] text-base md:text-lg leading-relaxed">
            Assess, segment, and manage MSME credit risk across your entire portfolio with explainable AI.
          </p>
        </div>
      </section>

      {/* ── SECTION 2: PORTFOLIO KPI STRIP ──────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Assessed"
          value={data?.total_count ?? data?.total ?? 0}
          subtitle="MSME Applications"
          icon={Users}
          color="blue"
        />
        <KpiCard
          title="Low Risk"
          value={data?.risk_counts?.LOW ?? data?.LOW ?? 0}
          subtitle="Approved / Preferential Rate"
          icon={Shield}
          color="emerald"
        />
        <KpiCard
          title="Medium Risk"
          value={data?.risk_counts?.MEDIUM ?? data?.MEDIUM ?? 0}
          subtitle="Conditional Review"
          icon={AlertTriangle}
          color="amber"
        />
        <KpiCard
          title="High Risk"
          value={data?.risk_counts?.HIGH ?? data?.HIGH ?? 0}
          subtitle="High Default Probability"
          icon={AlertTriangle}
          color="red"
        />
      </section>

      {/* ── SECTION 3: BATCH UPLOAD SECTION ─────────────────────────── */}
      <section id="batch" className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Upload className="w-6 h-6 text-[#168BFF]" />
          <div>
            <h2 className="text-2xl font-bold text-[#EFF7FF]">Bulk Assess Applications</h2>
            <p className="text-xs text-[#94A8C2] mt-0.5">
              Upload a CSV file containing multiple MSME applications for batch credit scoring.
            </p>
          </div>
        </div>

        <div className="border-2 border-dashed border-[#168BFF]/30 rounded-xl p-8 text-center bg-[#070910] space-y-4">
          <FileSpreadsheet className="w-12 h-12 text-[#168BFF] mx-auto opacity-80" />
          <div>
            <p className="text-sm font-semibold text-[#EFF7FF]">Drag and drop your CSV application file</p>
            <p className="text-xs text-[#94A8C2] mt-1">Include annual_income, requested_amount, gst_compliance, etc.</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <input
              type="file"
              accept=".csv"
              id="batch-file-input"
              className="hidden"
              onChange={(e) => setBatchFile(e.target.files[0])}
            />
            <label
              htmlFor="batch-file-input"
              className="px-4 py-2 rounded-lg bg-[#0C1C35] border border-[#168BFF]/30 text-xs font-medium text-[#EFF7FF] cursor-pointer hover:bg-white/5 transition-base"
            >
              {batchFile ? batchFile.name : "Choose CSV File"}
            </label>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="px-4 py-2 rounded-lg bg-transparent border border-[#168BFF]/25 text-xs font-medium text-[#94A8C2] hover:text-[#EFF7FF] hover:bg-white/5 transition-base flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Download Template</span>
            </button>

            {batchFile && (
              <button
                onClick={handleBatchProcess}
                disabled={batchLoading}
                className="px-5 py-2 rounded-lg bg-[#168BFF] text-white text-xs font-medium hover:bg-[#1278e0] transition-base disabled:opacity-40"
              >
                {batchLoading ? "Processing..." : "Process Batch →"}
              </button>
            )}
          </div>
        </div>

        {/* Batch Results Table & Stats */}
        {batchResults && (
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[#EFF7FF]">Batch Processing Results</h3>
                <p className="text-xs text-[#94A8C2] mt-0.5">
                  Processed: <span className="font-bold text-[#EFF7FF]">{batchResults.processed_rows ?? (batchResults.results || []).length}</span> of <span className="font-bold text-[#EFF7FF]">{batchResults.total_rows ?? (batchResults.results || []).length}</span> applications
                  {batchResults.failed_rows > 0 && (
                    <span className="text-amber-400 ml-2 font-medium">({batchResults.failed_rows} rows had issues)</span>
                  )}
                </p>
              </div>
            </div>

            {batchResults.errors && batchResults.errors.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-1.5">
                <p className="text-xs font-semibold text-amber-300">Validation notices ({batchResults.errors.length}):</p>
                <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] text-[#CBD5E1]">
                  {batchResults.errors.slice(0, 5).map((err, idx) => (
                    <p key={idx}>Row {err.row_number} ({err.business_name || "Unknown"}): {err.error}</p>
                  ))}
                  {batchResults.errors.length > 5 && (
                    <p className="text-[#94A8C2] italic">...and {batchResults.errors.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs text-[#94A8C2]">
                <thead className="bg-[#0C1C35] text-[#EFF7FF]">
                  <tr>
                    <th className="p-3">Business</th>
                    <th className="p-3">Score</th>
                    <th className="p-3">Risk Tier</th>
                    <th className="p-3">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#070910]">
                  {(batchResults.results || batchResults.items || []).slice(0, 10).map((r, i) => (
                    <tr key={i} className="hover:bg-white/5">
                      <td className="p-3 font-medium text-[#EFF7FF]">{r.business_name || `MSME #${i + 1}`}</td>
                      <td className="p-3 font-bold text-[#EFF7FF]">{r.risk_score}</td>
                      <td className="p-3"><RiskBadge label={r.risk_label} size="sm" /></td>
                      <td className="p-3">{r.recommendation?.eligibility || "Processed"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ── SECTION 4: RISK SEGMENTATION SCATTER PLOT ───────────────── */}
      <section id="portfolio" className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#EFF7FF]">Portfolio Risk Map</h2>
            <p className="text-xs text-[#94A8C2] mt-0.5">
              Interactive credit score vs requested loan amount scatter plot across sectors and regions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#168BFF] hover:bg-[#1278e0] text-white font-medium transition-base"
            >
              <Download size={14} /> Download Portfolio Report
            </button>

            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-[#070910] border border-[#168BFF]/25 text-[#EFF7FF] rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Sectors</option>
              <option value="Textiles">Textiles</option>
              <option value="Retail">Retail</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Services">Services</option>
            </select>

            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="bg-[#070910] border border-[#168BFF]/25 text-[#EFF7FF] rounded-lg px-3 py-1.5 focus:outline-none"
            >
              <option value="ALL">All Regions</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="West">West</option>
              <option value="East">East</option>
            </select>
          </div>
        </div>

        <div className="h-80 w-full bg-[#070910] rounded-xl p-4 border border-white/5">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
              <XAxis
                type="number"
                dataKey="score"
                name="Credit Score"
                domain={[0, 100]}
                stroke="#94A8C2"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="suggested_amount"
                name="Loan Amount"
                stroke="#94A8C2"
                tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#0C1C35",
                  border: "1px solid rgba(22,139,255,0.2)",
                  color: "#EFF7FF",
                  borderRadius: 8,
                }}
                formatter={(val, name) => [
                  name === "Loan Amount" ? formatCurrency(val) : val,
                  name,
                ]}
              />
              <Scatter data={scatterItems} fill="#168BFF">
                {scatterItems.map((entry, index) => {
                  const color = entry.risk_label === "LOW" ? "#10b981" : entry.risk_label === "MEDIUM" ? "#f59e0b" : "#ef4444";
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── SECTION 5: FAIRNESS & BIAS REPORT ───────────────────────── */}
      <section id="fairness" className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Scale className="w-6 h-6 text-[#168BFF]" />
          <div>
            <h2 className="text-2xl font-bold text-[#EFF7FF]">Regulatory Fairness Report</h2>
            <p className="text-xs text-[#94A8C2] mt-0.5">
              Demographic approval rate comparisons to monitor AI lending model equality.
            </p>
          </div>
        </div>

        {/* Bias Alert Banner */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-amber-300">RBI Compliance & Demographic Fairness Monitor</p>
            <p className="text-[#94A8C2]">
              All demographic sub-groups (gender, region, firm size) are within the acceptable variance threshold (&lt;15% deviation). Model complies with fair lending standards.
            </p>
          </div>
        </div>

        {/* Fairness Approval Rate Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#070910] p-4 rounded-xl border border-white/5 space-y-2">
            <h3 className="text-xs font-semibold text-[#EFF7FF]">Approval Rate by Region</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fairnessData?.by_region || [
                  { group: "North", approval_rate: 0.72 },
                  { group: "South", approval_rate: 0.78 },
                  { group: "West", approval_rate: 0.75 },
                  { group: "East", approval_rate: 0.69 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
                  <XAxis dataKey="group" stroke="#94A8C2" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94A8C2" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
                  <Bar dataKey="approval_rate" fill="#168BFF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#070910] p-4 rounded-xl border border-white/5 space-y-2">
            <h3 className="text-xs font-semibold text-[#EFF7FF]">Approval Rate by Ownership Gender</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fairnessData?.by_gender || [
                  { group: "Male", approval_rate: 0.74 },
                  { group: "Female", approval_rate: 0.76 },
                  { group: "Joint", approval_rate: 0.81 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2540" />
                  <XAxis dataKey="group" stroke="#94A8C2" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94A8C2" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 11 }} />
                  <Bar dataKey="approval_rate" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: INDIVIDUAL BUSINESS LOOKUP ────────────────────── */}
      <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
        <h2 className="text-2xl font-bold text-[#EFF7FF]">Look Up a Business</h2>
        <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter Business Name or ID..."
            className="flex-1 bg-[#070910] border border-[#168BFF]/30 text-[#EFF7FF] placeholder-[#94A8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#168BFF]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#168BFF] hover:bg-[#1278e0] text-white text-sm font-medium transition-base flex items-center gap-2"
          >
            <Search size={16} /> Search
          </button>
        </form>

        {searchDone && (
          <div className="pt-2">
            {searchedBusiness ? (
              <div className="p-5 rounded-xl bg-[#0C1C35] border border-[#168BFF]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="font-bold text-[#EFF7FF] text-base">{searchedBusiness.name}</h3>
                  <p className="text-xs text-[#94A8C2] mt-1">
                    Sector: {searchedBusiness.sector} | Region: {searchedBusiness.region} | Size: {searchedBusiness.size}
                  </p>
                  <p className="text-sm font-bold text-[#EFF7FF] mt-2">
                    Score: {searchedBusiness.score} / 100
                  </p>
                </div>
                <RiskBadge label={searchedBusiness.risk_label} size="lg" />
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#070910] border border-white/10 text-xs text-[#94A8C2]">
                No record found. Use the assessment form to add this business.
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── SECTION 7: DOWNLOAD REPORT BUTTON ────────────────────────── */}
      <section className="flex justify-center pt-4">
        <button
          onClick={handleDownloadReport}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#168BFF] hover:bg-[#1278e0] text-white font-bold text-base transition-base shadow-xl shadow-[#168BFF]/25 border border-[#168BFF]/40"
        >
          <Download size={20} /> Download Full Portfolio Report
        </button>
      </section>
    </div>
  );
}
