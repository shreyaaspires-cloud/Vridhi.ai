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
      <div className="flex items-center justify-center min-h-64 text-[#94A8C2]">
        <div className="w-8 h-8 border-2 border-[#168BFF]/20 border-t-[#168BFF] rounded-full animate-spin mr-3" />
        {t("loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      {/* ── SECTION 1: HERO BANNER ────────────────────────────────────────── */}
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
              {t("lender_badge")}
            </span>
          </div>
          <h1
            className="text-3xl md:text-5xl font-bold text-[#EFF7FF] leading-tight"
            style={{ fontFamily: "'Space Grotesk', Inter, system-ui, sans-serif" }}
          >
            {t("lender_hero_title")}
          </h1>
          <p className="text-[#94A8C2] text-base md:text-lg leading-relaxed">
            {t("lender_hero_sub")}
          </p>
        </div>
      </section>

      {/* ── SECTION 2: PORTFOLIO KPI STRIP ──────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title={t("total_assessed")}
          value={data?.total_count ?? data?.total ?? 0}
          subtitle={t("msme_apps")}
          icon={Users}
          color="blue"
        />
        <KpiCard
          title={t("low_risk")}
          value={data?.risk_counts?.LOW ?? data?.LOW ?? 0}
          subtitle={t("low_risk_sub")}
          icon={Shield}
          color="emerald"
        />
        <KpiCard
          title={t("medium_risk")}
          value={data?.risk_counts?.MEDIUM ?? data?.MEDIUM ?? 0}
          subtitle={t("medium_risk_sub")}
          icon={AlertTriangle}
          color="amber"
        />
        <KpiCard
          title={t("high_risk")}
          value={data?.risk_counts?.HIGH ?? data?.HIGH ?? 0}
          subtitle={t("high_risk_sub")}
          icon={AlertTriangle}
          color="red"
        />
      </section>

      {/* ── SECTION 3: BATCH ASSESSMENT REDIRECT ────────────────────────────── */}
      <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <Upload className="w-6 h-6 text-[#168BFF]" />
          <h2 className="text-xl font-bold text-[#EFF7FF]">{t("batch_title")}</h2>
        </div>
        <p className="text-sm text-[#94A8C2]">
          {t("batch_desc")}
        </p>
        <Link
          href="/batch"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#168BFF] hover:bg-[#1278e0] text-white text-sm font-semibold transition-colors"
        >
          <Upload size={16} /> {t("go_to_batch")}
        </Link>
      </section>

      {/* ── SECTION 4: FAIRNESS & BIAS REPORT ──────────────────────────────── */}
      <section id="fairness" className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Scale className="w-6 h-6 text-[#168BFF]" />
          <div>
            <h2 className="text-2xl font-bold text-[#EFF7FF]">{t("regulatory_fairness")}</h2>
            <p className="text-xs text-[#94A8C2] mt-0.5">
              {t("fairness_sub")}
            </p>
          </div>
        </div>

        {/* Bias Alert Banner */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-amber-300">{t("rbi_compliance_title")}</p>
            <p className="text-[#94A8C2]">
              {t("rbi_compliance_desc")}
            </p>
          </div>
        </div>

        {/* Fairness Approval Rate Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#070910] p-4 rounded-xl border border-white/5 space-y-2">
            <h3 className="text-xs font-semibold text-[#EFF7FF]">{t("approval_by_region")}</h3>
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
            <h3 className="text-xs font-semibold text-[#EFF7FF]">{t("approval_by_gender")}</h3>
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

      {/* ── SECTION 5: INDIVIDUAL BUSINESS LOOKUP ──────────────────────────── */}
      <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
        <h2 className="text-2xl font-bold text-[#EFF7FF]">{t("lookup_title")}</h2>
        <form onSubmit={handleSearch} className="flex gap-2 max-w-lg">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("lookup_placeholder")}
            className="flex-1 bg-[#070910] border border-[#168BFF]/30 text-[#EFF7FF] placeholder-[#94A8C2] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#168BFF]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#168BFF] hover:bg-[#1278e0] text-white text-sm font-medium transition-base flex items-center gap-2"
          >
            <Search size={16} /> {t("search")}
          </button>
        </form>

        {searchDone && (
          <div className="pt-2 space-y-4">
            {searchedBusiness ? (
              <>
                <div className="p-5 rounded-xl bg-[#0C1C35] border border-[#168BFF]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-[#EFF7FF] text-base">{searchedBusiness.name}</h3>
                    <p className="text-xs text-[#94A8C2] mt-1">
                      {t("filter_sector")}: {searchedBusiness.sector} | {t("filter_region")}: {searchedBusiness.region} | {t("filter_size")}: {searchedBusiness.size}
                    </p>
                    <p className="text-sm font-bold text-[#EFF7FF] mt-2">
                      {t("score_label")}: {searchedBusiness.score} / 100
                    </p>
                  </div>
                  <RiskBadge label={searchedBusiness.risk_label} size="lg" />
                </div>

                {/* Lender Underwriting Notes for this Borrower */}
                <LenderNotesPanel
                  businessName={searchedBusiness.name}
                  scoreHistoryId={searchedBusiness.id}
                />
              </>
            ) : (
              <div className="p-4 rounded-xl bg-[#070910] border border-white/10 text-xs text-[#94A8C2]">
                {t("no_record_found")}
              </div>
            )}
          </div>
        )}
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
