"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import { useAssessment } from "../../context/AssessmentContext";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import AssessmentForm from "../../components/AssessmentForm";
import DocumentVerification from "../../components/DocumentVerification";
import ScoreGauge from "../../components/ScoreGauge";
import RiskBadge from "../../components/RiskBadge";
import Chatbot from "../../components/Chatbot";
import { formatCurrency } from "../../lib/utils";
import { api } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import { generateBorrowerCreditReportPdf } from "../../lib/pdfReportGenerator";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles, Shield, Lightbulb, SlidersHorizontal,
  FileText, ArrowDown, TrendingUp, AlertTriangle, CheckCircle2,
  Download, Clock, Trash2, Bell, ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from "recharts";
import toast from "react-hot-toast";

const STORAGE_KEY = "vridhi_history";
// Minimum score change (in points) that triggers a user notification
const NOTIFICATION_THRESHOLD = 0.5;


function BorrowerPageContent() {
  const { prediction, formData, lastFormPayload, chatContext, setPrediction } = useAssessment();
  const { user } = useAuth();
  const { t } = useLanguage();
  const resultsRef = useRef(null);

  // Score history — persisted in Supabase; local array shown in UI
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  // Score-change notification shown after a new assessment
  const [scoreNotification, setScoreNotification] = useState(null); // { prev, curr, delta }
  // Track the last notified prediction id to prevent re-notify on re-render
  const lastNotifiedId = useRef(null);

  // ── Load score history from Supabase (Feature 8) ────────────────────
  const loadHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("score_history")
        .select("id, business_name, risk_score, risk_label, assessed_at")
        .eq("user_id", user.id)
        .order("assessed_at", { ascending: false })
        .limit(5);

      if (!error && data) {
        setHistory(
          data.map((r) => ({
            id: r.id,
            business_name: r.business_name,
            risk_score: r.risk_score,
            risk_label: r.risk_label,
            date: new Date(r.assessed_at).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            }),
          }))
        );
      }
    } catch (e) {
      // Graceful degradation: show local fallback
      console.error("Score history load error:", e);
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── Persist new assessment to Supabase + trigger notification (Features 6, 8) ──
  useEffect(() => {
    if (!prediction || !prediction.business_name || !user) return;
    // Prevent duplicate notification on re-render
    const predId = prediction.id || `${prediction.business_name}_${prediction.risk_score}`;
    if (lastNotifiedId.current === predId) return;
    lastNotifiedId.current = predId;

    const saveAndNotify = async () => {
      // Find previous score for notification
      const prevScore = history.length > 0 ? history[0].risk_score : null;
      const currScore = prediction.risk_score;

      // Persist to Supabase
      try {
        await supabase.from("score_history").insert({
          user_id: user.id,
          business_name: prediction.business_name,
          risk_score: currScore,
          risk_label: prediction.risk_label,
        });
        // Reload history so the list is fresh
        loadHistory();
      } catch (e) {
        console.error("Score history save error:", e);
      }

      // Feature 6: Notify borrower if score has changed significantly
      if (prevScore !== null) {
        const delta = currScore - prevScore;
        if (Math.abs(delta) >= NOTIFICATION_THRESHOLD) {
          const notificationData = { prev: prevScore, curr: currScore, delta };
          setScoreNotification(notificationData);
          if (delta > 0) {
            toast.success(`Score improved by ${delta.toFixed(1)} points! (Now: ${currScore.toFixed(1)})`, {
              icon: "📈",
              duration: 5000,
            });
          } else {
            toast(`Score dropped by ${Math.abs(delta).toFixed(1)} points. Check improvement tips below.`, {
              icon: "⚠️",
              duration: 5000,
            });
          }
        }
      }
    };

    saveAndNotify();
  }, [prediction, user, history, loadHistory]);

  // Clear score history
  const handleClearHistory = async () => {
    if (!user) return;
    try {
      await supabase.from("score_history").delete().eq("user_id", user.id);
      setHistory([]);
      toast.success("Score history cleared.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to clear history.");
    }
  };

  // Download Credit Report as PDF (Change 1)
  const handleDownloadAssessmentReport = () => {
    if (!prediction) {
      toast.error("No assessment data available to download.");
      return;
    }
    try {
      generateBorrowerCreditReportPdf(prediction);
      toast.success("Credit report PDF downloaded successfully.");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF credit report.");
    }
  };

  // Scenario Simulator local state (copied logic from simulator page)
  const [simValues, setSimValues] = useState({
    gst_compliance: 85,
    monthly_upi_volume: 350000,
    requested_amount: 1500000,
    monthly_revenue: 600000,
    bank_balance: 120000,
    years_in_business: 4,
    vendor_trust_score: 85,
    loan_tenure_months: 24,
  });
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Update simulator defaults when prediction changes
  useEffect(() => {
    if (chatContext) {
      setSimValues((prev) => ({
        ...prev,
        gst_compliance: chatContext.gst_compliance_rate ?? prev.gst_compliance,
        monthly_upi_volume: chatContext.monthly_upi_volume ?? prev.monthly_upi_volume,
        requested_amount: chatContext.loan_amount ?? prev.requested_amount,
        monthly_revenue: chatContext.income 
          ? Math.round(chatContext.income / 12) 
          : prev.monthly_revenue,
        vendor_trust_score: chatContext.vendor_trust_score ?? prev.vendor_trust_score,
      }));
    }
  }, [chatContext]);

  // Scroll to results when prediction is updated
  useEffect(() => {
    if (prediction && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [prediction]);

  // Run simulation prediction
  const handleSimulate = async (newVals) => {
    setSimLoading(true);
    try {
      const payload = {
        business_name: prediction?.business_name || "MSME Borrower",
        income: (newVals.monthly_revenue || 600000) * 12,
        loan_amount: newVals.requested_amount,
        gst_compliance_rate: newVals.gst_compliance,
        monthly_upi_volume: newVals.monthly_upi_volume,
        vendor_trust_score: newVals.vendor_trust_score,
        sector_type: prediction?.sector_type || "Services",
        afhi_score: prediction?.afhi_score || 70,
        utility_delay_days: 5,
        loan_tenure_months: newVals.loan_tenure_months,
      };
      const res = await api.predict(payload);
      if (res.data) setSimResult(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSimLoading(false);
    }
  };

  const handleSliderChange = (key, val) => {
    const updated = { ...simValues, [key]: val };
    setSimValues(updated);
    handleSimulate(updated);
  };

  const currentScore = simResult ? simResult.risk_score : (prediction ? prediction.risk_score : null);
  const currentLabel = simResult ? simResult.risk_label : (prediction ? prediction.risk_label : null);

  const rec = prediction?.recommendation || {};
  const factors = prediction?.factors || [];

  // Sort factors for SHAP chart
  const topFactors = [...factors]
    .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
    .slice(0, 5);

  return (
    <div className="space-y-12 pb-16">
      {/* ── SECTION 1: HERO BANNER ───────────────────────────────────── */}
      <section
        className="rounded-3xl p-8 md:p-12 relative overflow-hidden transition-colors"
        style={{
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
        }}
      >
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--brand-emerald)]/10 border border-[var(--brand-emerald)]/25">
            <Sparkles size={14} className="text-[var(--brand-emerald)]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-emerald)]">
              {t("powered_by")}
            </span>
          </div>
          <h1
            className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] leading-tight font-display"
          >
            {t("hero_title")}
          </h1>
          <p className="text-[var(--text-secondary)] text-base md:text-lg leading-relaxed">
            {t("hero_subtitle")}
          </p>
        </div>
      </section>

      {/* ── SCORE CHANGE NOTIFICATION (FEATURE 6) ────────────────────── */}
      {scoreNotification && (
        <section
          className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
          style={{
            background: scoreNotification.delta > 0
              ? "rgba(16,185,129,0.08)"
              : "rgba(239,68,68,0.08)",
            border: scoreNotification.delta > 0
              ? "1px solid rgba(16,185,129,0.3)"
              : "1px solid rgba(239,68,68,0.3)",
          }}
          role="alert"
        >
          <div className="flex items-center gap-3">
            <Bell className={`w-5 h-5 flex-shrink-0 ${scoreNotification.delta > 0 ? "text-emerald-500" : "text-red-500"}`} />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {scoreNotification.delta > 0
                  ? t("score_change_improved")
                  : t("score_change_decreased")}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t("score_changed_from")}{" "}
                <span className="font-bold text-[var(--text-primary)]">{Number(scoreNotification.prev).toFixed(1)}</span>
                {" "}{t("score_changed_to")}{" "}
                <span className={`font-bold ${scoreNotification.delta > 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {Number(scoreNotification.curr).toFixed(1)}
                </span>
                {" "}
                <span className={`font-semibold ${scoreNotification.delta > 0 ? "text-emerald-500" : "text-red-500"}`}>
                  ({scoreNotification.delta > 0 ? "+" : ""}{Number(scoreNotification.delta).toFixed(1)} points)
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setScoreNotification(null)}
            className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-base flex-shrink-0"
            aria-label="Dismiss notification"
          >
            Dismiss
          </button>
        </section>
      )}

      {/* ── PREVIOUS ASSESSMENTS ──────────────────────────────────────── */}
      {history.length > 0 && (
        <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--brand-emerald)]" />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{t("previous_assessments")}</h2>
            </div>
            <button
              onClick={handleClearHistory}
              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition-base"
            >
              <Trash2 size={13} /> {t("clear_history")}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-[var(--text-primary)] text-sm truncate">{item.business_name}</h3>
                    <RiskBadge label={item.risk_label} size="sm" />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{item.date}</p>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--border-default)] pt-2">
                  <span className="text-xs text-[var(--text-muted)]">Score</span>
                  <span className="text-base font-bold text-[var(--text-primary)]">{item.risk_score} / 100</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SECTION 2: ASSESSMENT FORM ───────────────────────────────── */}
      <section id="assessment" className="max-w-7xl mx-auto space-y-6">
        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-[var(--border-default)] space-y-6">
          <div className="flex items-center gap-2">
            <Shield size={22} className="text-[var(--brand-emerald)]" />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
                {t("assessment_title")}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t("assessment_subtitle")}
              </p>
            </div>
          </div>
          <AssessmentForm />
        </div>
      </section>

      {/* ── POST-SUBMIT SECTIONS (SHOW ONLY AFTER SUBMIT) ─────────────── */}
      {prediction && (
        <div ref={resultsRef} className="space-y-12">
          {/* ── SECTION 3: SCORE RESULT CARD ──────────────────────────── */}
          <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-default)] pb-4">
              <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t("score_result_title")}</h2>
                <p className="text-sm text-[var(--text-muted)]">{prediction.business_name}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadAssessmentReport}
                  className="px-4 py-2 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-deep)] text-white text-xs font-semibold flex items-center gap-2 transition-base shadow-sm"
                >
                  <Download size={14} /> {t("download_report")}
                </button>
                <RiskBadge label={prediction.risk_label} size="lg" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Gauge */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <ScoreGauge score={prediction.risk_score} label={prediction.risk_label} />
                <p className="text-center text-sm font-medium text-[var(--text-primary)] mt-4 max-w-xs leading-relaxed">
                  {prediction.risk_label === "LOW" && t("score_low_msg")}
                  {prediction.risk_label === "MEDIUM" && t("score_medium_msg")}
                  {prediction.risk_label === "HIGH" && t("score_high_msg")}
                </p>
              </div>

              {/* Recommendation Box */}
              <div
                className="lg:col-span-7 rounded-xl p-6 space-y-4"
                style={{
                  background: "var(--surface-secondary)",
                  border: "1px solid var(--border-default)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-[var(--brand-emerald)]" />
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{t("loan_recommendation")}</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)]">
                    <span className="text-xs text-[var(--text-muted)] uppercase font-medium">{t("eligible_amount")}</span>
                    <p className="text-lg font-bold text-[var(--text-primary)] mt-1 font-display">
                      {rec.suggested_amount ? formatCurrency(rec.suggested_amount) : "N/A"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)]">
                    <span className="text-xs text-[var(--text-muted)] uppercase font-medium">{t("suggested_rate")}</span>
                    <p className="text-lg font-bold text-[var(--text-primary)] mt-1 font-display">
                      {rec.interest_rate_range || "N/A"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[var(--surface-card)] border border-[var(--border-default)]">
                    <span className="text-xs text-[var(--text-muted)] uppercase font-medium">{t("repayment_period")}</span>
                    <p className="text-lg font-bold text-[var(--text-primary)] mt-1 font-display">
                      {rec.repayment_period_months ? `${rec.repayment_period_months} Months` : "N/A"}
                    </p>
                  </div>
                </div>

                {rec.reasons && rec.reasons.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-2">{t("key_drivers")}</p>
                    <ul className="space-y-1.5">
                      {rec.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-primary)]">
                          <CheckCircle2 className="w-4 h-4 text-[var(--brand-emerald)] flex-shrink-0 mt-0.5" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── SECTION 3.5: DOCUMENT VERIFICATION PIPELINE (FEATURE 4) ───── */}
          <section id="verification" className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[var(--border-default)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--brand-emerald)]/10 border border-[var(--brand-emerald)]/25 flex items-center justify-center text-[var(--brand-emerald)]">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
                    {t("doc_verif_title")}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {t("doc_verif_sub")}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[var(--brand-emerald)] bg-[var(--brand-emerald)]/10 border border-[var(--brand-emerald)]/25 px-2.5 py-1 rounded-full">
                AI OCR AUDIT
              </span>
            </div>
            <DocumentVerification
              submittedData={{
                business_name: lastFormPayload?.business_name || "",
                annual_revenue: lastFormPayload?.income || 0,
                monthly_upi_volume: lastFormPayload?.monthly_upi_volume || 0,
                gst_compliance_rate: lastFormPayload?.gst_compliance_rate || 0,
                sector_type: lastFormPayload?.sector_type || "",
                business_size: lastFormPayload?.business_size || "",
              }}
            />
          </section>

          {/* ── SECTION 4: EXPLAINABILITY PANEL ───────────────────────── */}
          <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t("score_explanation_title")}</h2>
            <p className="text-sm text-[var(--text-muted)]">
              {t("score_explanation_sub")}
            </p>

            <div className="space-y-4">
              {topFactors.map((f, idx) => {
                const val = f.impact_points !== undefined ? f.impact_points : (f.shap_value ?? 0);
                const isPositive = f.direction === "positive" || val >= 0;
                const points = Math.abs(Math.round(val));
                return (
                  <div key={idx} className="p-4 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)] space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[var(--text-primary)] capitalize">{f.feature.replace(/_/g, " ")}</span>
                      <span className={`font-bold ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                        {isPositive ? `+${points} points` : `-${points} points`}
                      </span>
                    </div>
                    {/* Bar visualization */}
                    <div className="w-full bg-[var(--border-default)] h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isPositive ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(100, Math.max(15, points * 3))}%` }}
                      />
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {isPositive
                        ? `Your ${f.feature.replace(/_/g, " ")} boosted your credit score.`
                        : `Lower or irregular ${f.feature.replace(/_/g, " ")} reduced your credit score.`}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── SECTION 5: IMPROVEMENT TIPS (FEATURE 3 - DYNAMIC FROM FACTORS) ── */}
          <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{t("improvement_tips")}</h2>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Actionable steps tailored to your model's adverse risk factors to reach a higher credit tier.
            </p>

            {(() => {
              // Filter factors for adverse/negative impact
              const negativeFactors = (prediction.factors || []).filter(
                (f) => f.direction === "negative" || (f.impact_points !== undefined ? f.impact_points < 0 : f.shap_value < 0)
              ).slice(0, 3);

              if (negativeFactors.length === 0) {
                return (
                  <div className="p-5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-default)] text-sm text-[var(--text-muted)]">
                    No specific improvement tips are available for this assessment — your key indicators are performing strongly!
                  </div>
                );
              }

              const getTipAdvice = (featKey, plainMsg) => {
                const key = (featKey || "").toLowerCase();
                if (key.includes("gst")) return "Maintain automated GST filing schedules and eliminate monthly filing delays to strengthen tax compliance.";
                if (key.includes("upi")) return "Increase digital customer payments via UPI to signal continuous cash flow activity to lenders.";
                if (key.includes("utility")) return "Pay electricity and utility bills on time; reducing payment delay days directly improves operational trust.";
                if (key.includes("vendor")) return "Clear vendor invoices promptly to build supplier credit trust ratings.";
                if (key.includes("income")) return "Diversify revenue channels to demonstrate consistent monthly cash inflow growth.";
                if (key.includes("afhi")) return "Maintain healthy average bank balances relative to your requested loan obligations.";
                return plainMsg || "Improve performance on this operational metric to raise overall credit evaluation.";
              };

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {negativeFactors.map((f, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl p-5 space-y-2 transition-base hover:border-l-[var(--brand-emerald)]"
                      style={{
                        background: "var(--surface-secondary)",
                        borderLeft: "3px solid #EF4444",
                        borderTop: "1px solid var(--border-default)",
                        borderRight: "1px solid var(--border-default)",
                        borderBottom: "1px solid var(--border-default)",
                      }}
                    >
                      <div className="flex items-center gap-2 text-red-500">
                        <Lightbulb size={18} />
                        <h3 className="font-bold text-[var(--text-primary)] text-sm capitalize">
                          {f.feature ? f.feature.replace(/_/g, " ") : "Risk Factor"}
                        </h3>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        {getTipAdvice(f.feature, f.plain_english)}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>

          {/* ── SECTION 6: CHATBOT ─────────────────────────────────────── */}
          <section id="chatbot" className="glass-panel rounded-2xl p-6 md:p-8 space-y-4">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Ask Vridhi Assistant</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Have questions about your score or loan options? Ask our AI assistant below.
            </p>
            <Chatbot context={chatContext} title="Vridhi Assistant" />
          </section>
        </div>
      )}
    </div>
  );
}

export default function BorrowerPage() {
  return (
    <ProtectedRoute requiredRole="borrower">
      <BorrowerPageContent />
    </ProtectedRoute>
  );
}
