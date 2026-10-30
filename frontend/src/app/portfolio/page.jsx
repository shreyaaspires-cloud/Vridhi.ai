"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Users, TrendingUp, CheckCircle2, AlertTriangle, Download } from "lucide-react";
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

  const scatterData = (data.points || []).map((p) => ({
    x: p.x, y: p.y, label: p.risk_label,
    business: p.business, sector: p.sector, region: p.region,
  }));

  const selectClass = "dark-input";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-[#EFF7FF]"
            style={{ fontFamily: "'Space Grotesk', Inter, system-ui, sans-serif" }}
          >
            {t("portfolio_title")}
          </h1>
          <p className="text-sm text-[#94A8C2] mt-1">{t("portfolio_sub")}</p>
        </div>

        {/* Change 5: Download Full Portfolio Report Button in Portfolio Section */}
        <button
          onClick={handleDownloadPortfolioReport}
          disabled={isExporting || (data.points || []).length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#168BFF] hover:bg-[#1278e0] text-white font-semibold text-sm transition-base shadow-lg shadow-[#168BFF]/20 border border-[#168BFF]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download size={16} />
          {isExporting ? t("downloading_portfolio_pdf") : t("download_portfolio_pdf")}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title={t("total_businesses")} value={data.total}             icon={Users}         color="blue" />
        <KpiCard title={t("avg_score")}        value={data.average_score}     icon={TrendingUp}    color="slate" />
        <KpiCard title={t("low_risk")}         value={data.LOW}               icon={CheckCircle2}  color="emerald" />
        <KpiCard title={t("high_risk")}        value={data.HIGH}              icon={AlertTriangle} color="red" />
        <KpiCard title={t("approval_rate")}    value={`${data.approval_rate}%`} icon={CheckCircle2} color="emerald" />
      </div>

      {/* Filters */}
      <div className="glass-panel rounded-xl p-4 flex flex-wrap gap-3 items-end">
        {[
          { key: "sector", label: t("filter_sector"), opts: data.available_sectors || [] },
          { key: "region", label: t("filter_region"), opts: data.available_regions || [] },
          { key: "size",   label: t("filter_size"),   opts: data.available_sizes   || [] },
        ].map(({ key, label, opts }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-[#4A6080] mb-1">{label}</label>
            <select
              className={selectClass}
              style={{ width: "auto", minWidth: 100 }}
              value={filters[key]}
              onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
            >
              <option value="all">{t("all")}</option>
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-[#4A6080] mb-1">{t("filter_x")}</label>
          <select
            className={selectClass}
            style={{ width: "auto", minWidth: 110 }}
            value={filters.x}
            onChange={(e) => setFilters({ ...filters, x: e.target.value })}
          >
            {(data.x_options || ["income"]).map((o) => (
              <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#4A6080] mb-1">{t("filter_y")}</label>
          <select
            className={selectClass}
            style={{ width: "auto", minWidth: 110 }}
            value={filters.y}
            onChange={(e) => setFilters({ ...filters, y: e.target.value })}
          >
            {(data.y_options || ["risk_score"]).map((o) => (
              <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scatter Plot */}
      <div className="glass-panel rounded-xl p-6">
        <h3 className="text-sm font-semibold text-[#94A8C2] mb-4">
          {filters.x.replace(/_/g, " ")} vs {filters.y.replace(/_/g, " ")}
        </h3>
        {scatterData.length === 0 ? (
          <p className="text-center text-[#4A6080] py-12">{t("no_portfolio_data")}</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_DARK.grid} />
              <XAxis
                type="number" dataKey="x" name={filters.x}
                tick={{ fontSize: 11, fill: CHART_DARK.tick }}
                axisLine={{ stroke: CHART_DARK.grid }} tickLine={false}
                tickFormatter={(v) => v >= 100000 ? `${(v / 100000).toFixed(0)}L` : v.toFixed(0)}
              />
              <YAxis
                type="number" dataKey="y" name={filters.y}
                tick={{ fontSize: 11, fill: CHART_DARK.tick }}
                axisLine={false} tickLine={false}
              />
              <ZAxis range={[60, 60]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: CHART_DARK.grid }}
                contentStyle={CHART_DARK.tooltip}
                formatter={(value, name) => [Number(value).toLocaleString("en-IN"), name]}
                labelFormatter={(_, payload) =>
                  payload && payload[0]?.payload ? payload[0].payload.business : ""
                }
              />
              <Legend
                wrapperStyle={{ color: "#94A8C2", fontSize: 12 }}
              />
              {["LOW", "MEDIUM", "HIGH"].map((label) => (
                <Scatter
                  key={label}
                  name={label}
                  data={scatterData.filter((d) => d.label === label)}
                  fill={RISK_COLORS[label]}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Risk Distribution Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["LOW", "MEDIUM", "HIGH"].map((label) => {
          const count = label === "LOW" ? data.LOW : label === "MEDIUM" ? data.MEDIUM : data.HIGH;
          const pct = data.total > 0 ? ((count / data.total) * 100).toFixed(1) : 0;
          return (
            <div key={label} className="glass-panel rounded-xl p-5 card-hover">
              <div className="flex items-center justify-between">
                <RiskBadge label={label} />
                <span className="text-2xl font-bold text-[#EFF7FF]">{count}</span>
              </div>
              <div className="mt-3 w-full rounded-full h-1.5" style={{ background: "#1a2540" }}>
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: RISK_COLORS[label] }}
                />
              </div>
              <p className="text-xs text-[#4A6080] mt-2">{pct}{t("pct_of_portfolio")}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
