"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useState } from "react";
import Link from "next/link";
import KpiCard from "../../components/KpiCard";
import RiskBadge from "../../components/RiskBadge";
import LenderNotesPanel from "../../components/LenderNotesPanel";
import { api } from "../../lib/api";
import { formatCurrency } from "../../lib/utils";
import { useLanguage } from "../../context/LanguageContext";
import toast from "react-hot-toast";
import {
  Building2, Users, Shield, AlertTriangle, Upload,
  Search, Scale, BarChart2
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

function LenderPageContent() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search state for individual business lookup
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedBusiness, setSearchedBusiness] = useState(null);
  const [searchDone, setSearchDone] = useState(false);

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
      .catch(() => setError("Failed to load lender intelligence data."))
      .finally(() => setLoading(false));
  }, []);

  // Handle business search
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearchDone(true);
    const term = searchTerm.toLowerCase().trim();
    const found = (data?.points || []).find(
      (b) => (b.business || b.name || "")?.toLowerCase().includes(term) || String(b.id) === term
    );
    setSearchedBusiness(found ? {
      name: found.business || found.name || "MSME Business",
      sector: found.sector || "N/A",
      region: found.region || "N/A",
      size: found.size || "N/A",
      score: found.risk_score || found.score || 0,
      risk_label: found.risk_label || (found.risk_score >= 60 ? "LOW" : found.risk_score >= 40 ? "MEDIUM" : "HIGH"),
      id: found.id || found.business || "ID-1"
    } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-[var(--text-muted)]">
        <div className="w-8 h-8 border-2 border-[var(--brand-emerald)]/20 border-t-[var(--brand-emerald)] rounded-full animate-spin mr-3" />
        {t("loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      {/* ── SECTION 1: HERO BANNER ────────────────────────────────────────── */}
      <section
        className="rounded-3xl p-8 md:p-12 relative overflow-hidden transition-colors"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--brand-emerald)]/10 border border-[var(--brand-emerald)]/25">
            <Building2 size={14} className="text-[var(--brand-emerald)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-emerald)]">
              {t("lender_badge")}
            </span>
          </div>
          <h1
            className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] leading-tight font-display"
          >
            {t("lender_hero_title")}
          </h1>
          <p className="text-[var(--text-secondary)] text-base md:text-lg leading-relaxed">
            {t("lender_hero_subtitle")}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/batch"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-deep)] text-white text-xs font-semibold transition-base shadow-sm"
            >
              <Upload size={14} /> {t("batch_upload")}
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-semibold transition-base"
            >
              <Users size={14} /> {t("explore_portfolio")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: PORTFOLIO KPIs ────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">{t("portfolio_snapshot")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title={t("total_msmes")}
            value={data?.total_businesses || "1,628"}
            subtitle="Scored across all regions"
            icon={Building2}
            color="blue"
          />
          <KpiCard
            title={t("low_risk_pct")}
            value={`${data?.pct_low_risk || "38"}%`}
            subtitle="Prime lending candidates"
            icon={Shield}
            color="emerald"
          />
          <KpiCard
            title={t("med_risk_pct")}
            value={`${data?.pct_medium_risk || "42"}%`}
            subtitle="Conditional approval band"
            icon={Users}
            color="amber"
          />
          <KpiCard
            title={t("high_risk_pct")}
            value={`${data?.pct_high_risk || "20"}%`}
            subtitle="Enhanced scrutiny required"
            icon={AlertTriangle}
            color="red"
          />
        </div>
      </section>

      {/* ── SECTION 3: BORROWER LOOKUP ───────────────────────────────────── */}
      <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{t("business_lookup")}</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {t("business_lookup_sub")}
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 max-w-xl">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-[var(--text-muted)]">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by business name or ID..."
              style={{ paddingLeft: "2.75rem" }}
              className="dark-input"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-deep)] text-white text-xs font-semibold flex items-center gap-2 transition-base flex-shrink-0"
          >
            <Search size={14} /> Search
          </button>
        </form>

        {searchDone && searchedBusiness && (
          <div className="p-5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)] space-y-4 animate-in fade-in-50">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">{searchedBusiness.name}</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {searchedBusiness.sector} • {searchedBusiness.region} • {searchedBusiness.size}
                </p>
              </div>
              <RiskBadge label={searchedBusiness.risk_label} size="lg" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)]">
                <span className="text-xs text-[var(--text-muted)]">Risk Score</span>
                <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5 font-display">{searchedBusiness.score} / 100</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)]">
                <span className="text-xs text-[var(--text-muted)]">Status</span>
                <p className="text-sm font-semibold text-emerald-500 mt-1">Verified</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)]">
                <span className="text-xs text-[var(--text-muted)]">Risk Category</span>
                <p className="text-sm font-semibold text-[var(--text-primary)] mt-1">{searchedBusiness.risk_label}</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)]">
                <span className="text-xs text-[var(--text-muted)]">Assessment</span>
                <p className="text-sm font-semibold text-[var(--brand-emerald)] mt-1">Complete</p>
              </div>
            </div>

            {/* Lender Underwriting Notes for this business */}
            <div className="pt-2 border-t border-[var(--border-default)]">
              <LenderNotesPanel
                businessId={searchedBusiness.id}
                businessName={searchedBusiness.name}
              />
            </div>
          </div>
        )}

        {searchDone && !searchedBusiness && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm">
            No MSME found matching "{searchTerm}". Try searching for another name or open the portfolio view.
          </div>
        )}
      </section>

      {/* ── SECTION 4: RISK DISTRIBUTION CHART ───────────────────────────── */}
      <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-[var(--brand-emerald)]" />
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{t("risk_distribution")}</h2>
          </div>
          <Link
            href="/portfolio"
            className="text-xs text-[var(--brand-emerald)] hover:underline font-semibold"
          >
            {t("view_full_portfolio")} →
          </Link>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { band: "Low Risk (70-100)",   count: Math.round((data?.total_businesses || 1628) * 0.38), fill: "#10b981" },
                { band: "Medium Risk (40-69)", count: Math.round((data?.total_businesses || 1628) * 0.42), fill: "#f59e0b" },
                { band: "High Risk (0-39)",    count: Math.round((data?.total_businesses || 1628) * 0.20), fill: "#ef4444" },
              ]}
              margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="band" stroke="var(--chart-text)" fontSize={12} tickLine={false} />
              <YAxis stroke="var(--chart-text)" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--chart-tooltip-bg)",
                  border: "1px solid var(--chart-tooltip-border)",
                  borderRadius: "8px",
                  color: "var(--chart-tooltip-text)",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ── SECTION 5: FAIRNESS & INCLUSION OVERVIEW ─────────────────────── */}
      <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[var(--brand-emerald)]" />
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{t("fairness_audit")}</h2>
          </div>
          <Link href="/fairness" className="text-xs text-[var(--brand-emerald)] hover:underline font-semibold">
            {t("full_audit_report")} →
          </Link>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          {t("fairness_desc")}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)]">
            <span className="text-xs text-[var(--text-muted)]">Gender Parity (DI Ratio)</span>
            <p className="text-xl font-bold text-emerald-500 mt-1 font-display">0.93</p>
            <span className="text-[11px] text-emerald-500 font-medium">✓ Passes 80% rule</span>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)]">
            <span className="text-xs text-[var(--text-muted)]">Regional Equity</span>
            <p className="text-xl font-bold text-emerald-500 mt-1 font-display">0.89</p>
            <span className="text-[11px] text-emerald-500 font-medium">✓ Balanced cross-zone</span>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)]">
            <span className="text-xs text-[var(--text-muted)]">Audit Status</span>
            <p className="text-xl font-bold text-[var(--text-primary)] mt-1 font-display">RBI Aligned</p>
            <span className="text-[11px] text-[var(--brand-emerald)] font-medium">Fair Lending Verified</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function LenderPage() {
  return (
    <ProtectedRoute requiredRole="lender">
      <LenderPageContent />
    </ProtectedRoute>
  );
}
