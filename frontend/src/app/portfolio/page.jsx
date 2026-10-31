"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Users, TrendingUp, CheckCircle2, AlertTriangle, Download, Filter } from "lucide-react";
import KpiCard from "../../components/KpiCard";
import {
  ResponsiveContainer, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ZAxis, Legend,
} from "recharts";
import RiskBadge from "../../components/RiskBadge";
import { useLanguage } from "../../context/LanguageContext";
import { generatePortfolioReportPdf } from "../../lib/pdfReportGenerator";
import toast from "react-hot-toast";

const RISK_COLORS = { LOW: "#10b981", MEDIUM: "#f59e0b", HIGH: "#ef4444" };

export default function PortfolioPage() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({ sector: "all", region: "all", size: "all", x: "income", y: "risk_score" });

  useEffect(() => { load(); }, [filters]);

  const load = async () => {
    setLoading(true);
    const params = {};
    if (filters.sector !== "all") params.sector = filters.sector;
    if (filters.region !== "all") params.region = filters.region;
    if (filters.size   !== "all") params.size   = filters.size;
    params.x = filters.x;
    params.y = filters.y;
    const result = await api.segmentation(params);
    setLoading(false);
    if (result.error) setError(result.error);
    else              setData(result.data);
  };

  const handleDownloadPortfolioReport = () => {
    if (!data || !data.points || data.points.length === 0) {
      toast.error(t("no_portfolio_data") || "No portfolio data available to download.");
      return;
    }
    setIsExporting(true);
    try {
      generatePortfolioReportPdf({
        portfolioData: data,
        filters: {
          sector: filters.sector === "all" ? "All" : filters.sector,
          region: filters.region === "all" ? "All" : filters.region,
          size: filters.size === "all" ? "All" : filters.size,
        },
      });
      toast.success("Portfolio report PDF downloaded successfully.");
    } catch (err) {
      console.error("Failed to generate portfolio PDF:", err);
      toast.error("Failed to generate portfolio PDF report.");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-muted)]">
        <div className="w-8 h-8 border-2 border-[var(--brand-emerald)]/20 border-t-[var(--brand-emerald)] rounded-full animate-spin mr-3" />
        {t("loading")}
      </div>
    );
  }

  const points = data?.points || [];
  const lowRisk  = points.filter((p) => p.risk_label === "LOW");
  const medRisk  = points.filter((p) => p.risk_label === "MEDIUM");
  const highRisk = points.filter((p) => p.risk_label === "HIGH");

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] font-display">{t("portfolio_intelligence")}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">{t("portfolio_intelligence_sub")}</p>
        </div>
        <button
          onClick={handleDownloadPortfolioReport}
          disabled={isExporting || loading || !data}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-deep)] text-white text-xs font-semibold shadow-sm transition-base disabled:opacity-50 flex-shrink-0"
        >
          <Download size={15} />
          {isExporting ? "Generating PDF..." : t("download_portfolio_pdf")}
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={t("total_msmes")}
          value={data?.total_businesses ?? 1628}
          subtitle="Active dataset"
          icon={Users}
          color="blue"
        />
        <KpiCard
          title={t("low_risk_pct")}
          value={`${data?.pct_low_risk ?? 38}%`}
          subtitle="Eligible for instant approval"
          icon={CheckCircle2}
          color="emerald"
        />
        <KpiCard
          title={t("med_risk_pct")}
          value={`${data?.pct_medium_risk ?? 42}%`}
          subtitle="Requires covenant structuring"
          icon={TrendingUp}
          color="amber"
        />
        <KpiCard
          title={t("high_risk_pct")}
          value={`${data?.pct_high_risk ?? 20}%`}
          subtitle="Enhanced collateral needed"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Filter bar - Horizontal Arrangement across Desktop */}
      <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mr-1">
            <Filter size={14} className="text-[var(--brand-emerald)]" />
            <span>Filters:</span>
          </div>
          
          <select
            value={filters.sector}
            onChange={(e) => setFilters((prev) => ({ ...prev, sector: e.target.value }))}
            className="dark-input py-1.5 px-3 text-xs w-auto min-w-[140px]"
            aria-label="Filter by Sector"
          >
            <option value="all">All Sectors</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Retail">Retail</option>
            <option value="Services">Services</option>
          </select>

          <select
            value={filters.region}
            onChange={(e) => setFilters((prev) => ({ ...prev, region: e.target.value }))}
            className="dark-input py-1.5 px-3 text-xs w-auto min-w-[140px]"
            aria-label="Filter by Region"
          >
            <option value="all">All Regions</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
            <option value="Central">Central</option>
          </select>

          <select
            value={filters.size}
            onChange={(e) => setFilters((prev) => ({ ...prev, size: e.target.value }))}
            className="dark-input py-1.5 px-3 text-xs w-auto min-w-[140px]"
            aria-label="Filter by Business Size"
          >
            <option value="all">All Sizes</option>
            <option value="Micro">Micro</option>
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] self-end md:self-auto">
          <span>Showing:</span>
          <span className="font-bold text-[var(--text-primary)]">{points.length} MSMEs</span>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Risk Distribution Scatter Plot</h2>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis type="number" dataKey={filters.x} name={filters.x} stroke="var(--chart-text)" fontSize={12} />
              <YAxis type="number" dataKey={filters.y} name={filters.y} stroke="var(--chart-text)" fontSize={12} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  background: "var(--chart-tooltip-bg)",
                  border: "1px solid var(--chart-tooltip-border)",
                  borderRadius: "8px",
                  color: "var(--chart-tooltip-text)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ color: "var(--chart-text)" }} />
              <Scatter name="Low Risk" data={lowRisk} fill={RISK_COLORS.LOW} />
              <Scatter name="Medium Risk" data={medRisk} fill={RISK_COLORS.MEDIUM} />
              <Scatter name="High Risk" data={highRisk} fill={RISK_COLORS.HIGH} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
