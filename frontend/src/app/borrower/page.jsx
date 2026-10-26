"use client";

import ProtectedRoute from "../../components/ProtectedRoute";
import { useAssessment } from "../../context/AssessmentContext";
import AssessmentForm from "../../components/AssessmentForm";
import ScoreGauge from "../../components/ScoreGauge";
import RiskBadge from "../../components/RiskBadge";
import Chatbot from "../../components/Chatbot";
import { formatCurrency } from "../../lib/utils";
import { api } from "../../lib/api";
import { useState, useEffect, useRef } from "react";
import {
  Sparkles, Shield, Lightbulb, SlidersHorizontal,
  FileText, ArrowDown, TrendingUp, AlertTriangle, CheckCircle2,
  Download, Clock, Trash2
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from "recharts";
import toast from "react-hot-toast";

const STORAGE_KEY = "vridhi_history";

function BorrowerPageContent() {
  const { prediction, chatContext, setPrediction } = useAssessment();
  const resultsRef = useRef(null);

  // Local Storage Assessment History state (Feature 2)
  const [history, setHistory] = useState([]);

  // Load history safely on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 3));
        }
      }
    } catch (e) {
      console.error("Failed to read assessment history from localStorage:", e);
    }
  }, []);

  // Save new prediction to history (deduplicated by timestamp/id)
  useEffect(() => {
    if (!prediction || !prediction.business_name) return;

    try {
      setHistory((prev) => {
        // Prevent duplicate addition if prediction is already the latest in history
        if (prev.length > 0 && prev[0].id === prediction.id) {
          return prev;
        }

        const newItem = {
          id: prediction.id || `eval_${Date.now()}`,
          business_name: prediction.business_name,
          risk_score: prediction.risk_score,
          risk_label: prediction.risk_label,
          date: new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        };

        const updated = [newItem, ...prev.filter((item) => item.id !== newItem.id)].slice(0, 3);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error("Failed to save assessment to localStorage:", e);
    }
  }, [prediction]);

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your assessment history?")) {
      try {
        localStorage.removeItem(STORAGE_KEY);
        setHistory([]);
        toast.success("Assessment history cleared.");
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Plain-text downloadable report (Feature 4)
  const handleDownloadAssessmentReport = () => {
    if (!prediction) return;

    const rec = prediction.recommendation || {};
    const dateStr = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const reportLines = [
      "==========================================================================",
      "                   VRIDHI.AI — CREDIT RISK ASSESSMENT REPORT               ",
      "==========================================================================",
      `Date & Time          : ${dateStr}`,
      `Business Name        : ${prediction.business_name || "N/A"}`,
      `Credit Risk Score    : ${prediction.risk_score} / 100`,
      `Risk Classification  : ${prediction.risk_label || "N/A"}`,
      `Model Confidence     : ${prediction.confidence !== undefined ? (prediction.confidence * 100).toFixed(1) + "%" : "N/A"}`,
      `Default Probability  : ${prediction.default_probability !== undefined ? (prediction.default_probability * 100).toFixed(1) + "%" : "N/A"}`,
      "",
      "--------------------------------------------------------------------------",
      " LOAN RECOMMENDATION DETAILS",
      "--------------------------------------------------------------------------",
      `Eligible Loan Amount : ${rec.suggested_amount ? formatCurrency(rec.suggested_amount) : "N/A"}`,
      `Suggested Rate Range : ${rec.interest_rate_range || "N/A"}`,
      `Repayment Period     : ${rec.repayment_period_months ? rec.repayment_period_months + " Months" : "N/A"}`,
      `Key Recommendation   : ${rec.eligibility || "N/A"}`,
      "",
      "--------------------------------------------------------------------------",
      " TOP MODEL FACTORS (SHAP EXPLAINABILITY)",
      "--------------------------------------------------------------------------",
      ...(prediction.factors || []).slice(0, 5).map(
        (f) =>
          `* ${f.feature ? f.feature.replace(/_/g, " ").toUpperCase() : "FACTOR"}: ${
            f.impact_points !== undefined ? f.impact_points : (f.shap_value || 0)
          } pts (${f.direction || "neutral"}) — ${f.plain_english || ""}`
      ),
      "",
      "--------------------------------------------------------------------------",
      " DEMO DISCLAIMER",
      "--------------------------------------------------------------------------",
      "This assessment report is generated by the Vridhi.ai explainable credit-risk",
      "analytics platform for demonstration and analytical purposes only. It does NOT",
      "constitute a binding financial commitment or loan approval from any bank or lender.",
      "==========================================================================",
    ];

    const reportText = reportLines.join("\n");
    const safeName = (prediction.business_name || "Business").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Vridhi_Credit_Report_${safeName}_${new Date().toISOString().slice(0, 10)}.txt`;

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Assessment report downloaded successfully.");
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
        annual_income: (newVals.monthly_revenue || 600000) * 12,
        requested_amount: newVals.requested_amount,
        gst_compliance: newVals.gst_compliance,
        monthly_upi_volume: newVals.monthly_upi_volume,
        avg_bank_balance: newVals.bank_balance,
        years_in_business: newVals.years_in_business,
        vendor_trust_score: newVals.vendor_trust_score,
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

  // Generate 3 actionable improvement tips based on lowest factors
  const tips = [
    {
      title: "File GST consistently",
      desc: "Businesses with 90%+ GST compliance score 15 points higher on average. Set monthly automated filing reminders.",
    },
    {
      title: "Increase UPI transaction volume",
      desc: "Higher digital transaction frequency signals continuous financial activity and strong customer adoption to lenders.",
    },
    {
      title: "Maintain revenue growth",
      desc: "Even 5% monthly revenue growth significantly improves your operational risk profile and borrowing capacity.",
    },
  ];

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
            <Sparkles size={14} className="text-[#168BFF]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#168BFF]">
              Powered by Explainable AI
            </span>
          </div>
          <h1
            className="text-3xl md:text-5xl font-bold text-[#EFF7FF] leading-tight"
            style={{ fontFamily: "'Space Grotesk', Inter, system-ui, sans-serif" }}
          >
            Check Your Credit Eligibility
          </h1>
          <p className="text-[#94A8C2] text-base md:text-lg leading-relaxed">
            Get a transparent, AI-powered credit score based on your actual business performance — not just your CIBIL score.
          </p>
        </div>
      </section>

      {/* ── PREVIOUS ASSESSMENTS (FEATURE 2) ─────────────────────────── */}
      {history.length > 0 && (
        <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#168BFF]" />
              <h2 className="text-xl font-bold text-[#EFF7FF]">Previous Assessments</h2>
            </div>
            <button
              onClick={handleClearHistory}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-base"
            >
              <Trash2 size={13} /> Clear history
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#0C1C35] border border-[rgba(22,139,255,0.15)] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-[#EFF7FF] text-sm truncate">{item.business_name}</h3>
                    <RiskBadge label={item.risk_label} size="sm" />
                  </div>
                  <p className="text-xs text-[#94A8C2] mt-1">{item.date}</p>
                </div>
                <div className="flex items-center justify-between border-t border-white/5 pt-2">
                  <span className="text-xs text-[#94A8C2]">Score</span>
                  <span className="text-base font-bold text-[#EFF7FF]">{item.risk_score} / 100</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SECTION 2: ASSESSMENT FORM ───────────────────────────────── */}
      <section id="assessment" className="max-w-7xl mx-auto space-y-6">
        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-[#168BFF]/20 space-y-6">
          <div className="flex items-center gap-2">
            <Shield size={22} className="text-[#168BFF]" />
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-[#EFF7FF]">
                Business Credit Assessment
              </h2>
              <p className="text-xs text-[#94A8C2] mt-0.5">
                Fill in your operational business details below to calculate your credit risk score instantly.
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
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-[#EFF7FF]">Your Credit Assessment Result</h2>
                <p className="text-sm text-[#94A8C2]">{prediction.business_name}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadAssessmentReport}
                  className="px-4 py-2 rounded-xl bg-[#168BFF] hover:bg-[#1278e0] text-white text-xs font-semibold flex items-center gap-2 transition-base shadow-md shadow-[#168BFF]/20"
                >
                  <Download size={14} /> Download Report
                </button>
                <RiskBadge label={prediction.risk_label} size="lg" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Gauge */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <ScoreGauge score={prediction.risk_score} label={prediction.risk_label} />
                <p className="text-center text-sm font-medium text-[#EFF7FF] mt-4 max-w-xs leading-relaxed">
                  {prediction.risk_label === "LOW" && "Great news! Your business shows strong creditworthiness."}
                  {prediction.risk_label === "MEDIUM" && "Your business shows moderate risk. See tips below to improve."}
                  {prediction.risk_label === "HIGH" && "Your application needs improvement. Follow the tips below."}
                </p>
              </div>

              {/* Recommendation Box */}
              <div
                className="lg:col-span-7 rounded-xl p-6 space-y-4"
                style={{
                  background: "#0C1C35",
                  border: "1px solid rgba(22,139,255,0.15)",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-[#168BFF]" />
                  <h3 className="text-base font-semibold text-[#EFF7FF]">Loan Recommendation</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-lg bg-[#070910] border border-[#168BFF]/15">
                    <span className="text-xs text-[#94A8C2] uppercase font-medium">Eligible Amount</span>
                    <p className="text-lg font-bold text-[#EFF7FF] mt-1">
                      {rec.suggested_amount ? formatCurrency(rec.suggested_amount) : "N/A"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#070910] border border-[#168BFF]/15">
                    <span className="text-xs text-[#94A8C2] uppercase font-medium">Suggested Interest Rate</span>
                    <p className="text-lg font-bold text-[#EFF7FF] mt-1">
                      {rec.interest_rate_range || "N/A"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#070910] border border-[#168BFF]/15">
                    <span className="text-xs text-[#94A8C2] uppercase font-medium">Repayment Period</span>
                    <p className="text-lg font-bold text-[#EFF7FF] mt-1">
                      {rec.repayment_period_months ? `${rec.repayment_period_months} Months` : "N/A"}
                    </p>
                  </div>
                </div>

                {rec.reasons && rec.reasons.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-[#94A8C2] uppercase mb-2">Key Drivers</p>
                    <ul className="space-y-1.5">
                      {rec.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#EFF7FF]">
                          <CheckCircle2 className="w-4 h-4 text-[#168BFF] flex-shrink-0 mt-0.5" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── SECTION 4: EXPLAINABILITY PANEL ───────────────────────── */}
          <section className="glass-panel rounded-2xl p-6 md:p-8 space-y-6">
            <h2 className="text-2xl font-bold text-[#EFF7FF]">Why did you get this score?</h2>
            <p className="text-sm text-[#94A8C2]">
              Top 5 factors contributing to your score breakdown (SHAP TreeExplainer). Green bars boosted your score, red bars reduced it.
            </p>

            <div className="space-y-4">
              {topFactors.map((f, idx) => {
                const val = f.impact_points !== undefined ? f.impact_points : (f.shap_value ?? 0);
                const isPositive = f.direction === "positive" || val >= 0;
                const points = Math.abs(Math.round(val));
                return (
                  <div key={idx} className="p-4 rounded-xl bg-[#0C1C35] border border-[rgba(22,139,255,0.12)] space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#EFF7FF] capitalize">{f.feature.replace(/_/g, " ")}</span>
                      <span className={`font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
                        {isPositive ? `+${points} points` : `-${points} points`}
                      </span>
                    </div>
                    {/* Bar visualization */}
                    <div className="w-full bg-[#070910] h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isPositive ? "bg-emerald-500" : "bg-red-500"}`}
                        style={{ width: `${Math.min(100, Math.max(15, points * 3))}%` }}
                      />
                    </div>
                    <p className="text-xs text-[#94A8C2]">
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
              <Lightbulb className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-bold text-[#EFF7FF]">How to improve your score</h2>
            </div>
            <p className="text-sm text-[#94A8C2]">
              Actionable steps tailored to your model's adverse risk factors to reach a higher credit tier.
            </p>

            {(() => {
              // Filter factors for adverse/negative impact
              const negativeFactors = (prediction.factors || []).filter(
                (f) => f.direction === "negative" || (f.impact_points !== undefined ? f.impact_points < 0 : f.shap_value < 0)
              ).slice(0, 3);

              if (negativeFactors.length === 0) {
                return (
                  <div className="p-5 rounded-xl bg-[#0C1C35] border border-white/10 text-sm text-[#94A8C2]">
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
                      className="rounded-xl p-5 space-y-2 transition-base hover:border-l-[#55D9FF]"
                      style={{
                        background: "#0C1C35",
                        borderLeft: "3px solid #EF4444",
                        borderTop: "1px solid rgba(22,139,255,0.12)",
                        borderRight: "1px solid rgba(22,139,255,0.12)",
                        borderBottom: "1px solid rgba(22,139,255,0.12)",
                      }}
                    >
                      <div className="flex items-center gap-2 text-red-400">
                        <Lightbulb size={18} />
                        <h3 className="font-bold text-[#EFF7FF] text-sm capitalize">
                          {f.feature ? f.feature.replace(/_/g, " ") : "Risk Factor"}
                        </h3>
                      </div>
                      <p className="text-xs text-[#94A8C2] leading-relaxed">
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
            <h2 className="text-2xl font-bold text-[#EFF7FF]">Ask Vridhi Assistant</h2>
            <p className="text-sm text-[#94A8C2]">
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
