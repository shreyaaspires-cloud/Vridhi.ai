"use client";

import { useAssessment } from "../../../context/AssessmentContext";
import ScoreGauge from "../../../components/ScoreGauge";
import RiskBadge from "../../../components/RiskBadge";
import { formatCurrency } from "../../../lib/utils";
import { api } from "../../../lib/api";
import { useState, useEffect } from "react";
import { SlidersHorizontal, Play } from "lucide-react";

import toast from "react-hot-toast";

export default function BorrowerSimulatorPage() {
  const { prediction, chatContext } = useAssessment();

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

  useEffect(() => {
    if (chatContext) {
      setSimValues((prev) => ({
        ...prev,
        gst_compliance: chatContext.gst_compliance ?? prev.gst_compliance,
        monthly_upi_volume: chatContext.monthly_upi_volume ?? prev.monthly_upi_volume,
        requested_amount: chatContext.requested_amount ?? prev.requested_amount,
        monthly_revenue: chatContext.annual_income ? Math.round(chatContext.annual_income / 12) : prev.monthly_revenue,
        bank_balance: chatContext.avg_bank_balance ?? prev.bank_balance,
        years_in_business: chatContext.years_in_business ?? prev.years_in_business,
        vendor_trust_score: chatContext.vendor_trust_score ?? prev.vendor_trust_score,
      }));
    }
    // Calculate initial baseline prediction
    handleSimulate({
      ...simValues,
      gst_compliance: chatContext?.gst_compliance ?? simValues.gst_compliance,
      monthly_upi_volume: chatContext?.monthly_upi_volume ?? simValues.monthly_upi_volume,
      requested_amount: chatContext?.requested_amount ?? simValues.requested_amount,
    }, true);
  }, []);

  const handleSimulate = async (valsToUse, isInitial = false) => {
    const vals = valsToUse || simValues;
    setSimLoading(true);
    try {
      const payload = {
        business_name: prediction?.business_name || "MSME Borrower",
        income: (vals.monthly_revenue || 600000) * 12,
        loan_amount: vals.requested_amount || 1500000,
        gst_compliance_rate: vals.gst_compliance ?? 85,
        monthly_upi_volume: vals.monthly_upi_volume ?? 350000,
        utility_delay_days: prediction?.utility_delay_days ?? 5,
        vendor_trust_score: vals.vendor_trust_score ?? 85,
        sector_type: prediction?.sector_type || "Manufacturing",
        afhi_score: prediction?.afhi_score ?? 70,
        revenue_history: prediction?.revenue_history || [500000, 550000, 600000, 620000, 600000, 650000],
      };
      const res = await api.predict(payload);
      if (res.data) {
        setSimResult(res.data);
        if (!isInitial) {
          toast.success("Simulation updated successfully.");
        }
      } else if (res.error) {
        if (!isInitial) toast.error(res.error);
      }
    } catch (e) {
      console.error(e);
      if (!isInitial) toast.error("Failed to update simulation.");
    } finally {
      setSimLoading(false);
    }
  };

  const currentScore = simResult ? simResult.risk_score : (prediction ? prediction.risk_score : 72);
  const currentLabel = simResult ? simResult.risk_label : (prediction ? prediction.risk_label : "LOW");

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-[#168BFF]" />
          <h1 className="text-3xl font-bold text-[#EFF7FF]" style={{ fontFamily: "'Space Grotesk', Inter, sans-serif" }}>
            Business Score Simulator
          </h1>
        </div>
        <p className="text-sm text-[#94A8C2] mt-1">
          Adjust operational parameters below and click <strong>Simulate Credit Score</strong> to recalculate your score.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Sliders & Action Button */}
        <div className="lg:col-span-7 glass-panel p-6 md:p-8 rounded-2xl space-y-6">
          <h2 className="text-lg font-bold text-[#EFF7FF]">Adjust Parameters</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3 bg-[#0C1C35] p-5 rounded-xl border border-[rgba(22,139,255,0.12)]">
              <div className="flex justify-between text-xs font-semibold text-[#EFF7FF]">
                <span>GST Compliance Rate</span>
                <span className="text-[#168BFF]">{simValues.gst_compliance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={simValues.gst_compliance}
                onChange={(e) => setSimValues((prev) => ({ ...prev, gst_compliance: Number(e.target.value) }))}
                className="w-full accent-[#168BFF]"
              />
            </div>

            <div className="space-y-3 bg-[#0C1C35] p-5 rounded-xl border border-[rgba(22,139,255,0.12)]">
              <div className="flex justify-between text-xs font-semibold text-[#EFF7FF]">
                <span>Monthly UPI Volume</span>
                <span className="text-[#168BFF]">{formatCurrency(simValues.monthly_upi_volume)}</span>
              </div>
              <input
                type="range"
                min="50000"
                max="2000000"
                step="50000"
                value={simValues.monthly_upi_volume}
                onChange={(e) => setSimValues((prev) => ({ ...prev, monthly_upi_volume: Number(e.target.value) }))}
                className="w-full accent-[#168BFF]"
              />
            </div>

            <div className="space-y-3 bg-[#0C1C35] p-5 rounded-xl border border-[rgba(22,139,255,0.12)]">
              <div className="flex justify-between text-xs font-semibold text-[#EFF7FF]">
                <span>Vendor Trust Score</span>
                <span className="text-[#168BFF]">{simValues.vendor_trust_score} / 100</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={simValues.vendor_trust_score}
                onChange={(e) => setSimValues((prev) => ({ ...prev, vendor_trust_score: Number(e.target.value) }))}
                className="w-full accent-[#168BFF]"
              />
            </div>

            <div className="space-y-3 bg-[#0C1C35] p-5 rounded-xl border border-[rgba(22,139,255,0.12)]">
              <div className="flex justify-between text-xs font-semibold text-[#EFF7FF]">
                <span>Requested Loan Amount</span>
                <span className="text-[#168BFF]">{formatCurrency(simValues.requested_amount)}</span>
              </div>
              <input
                type="range"
                min="100000"
                max="5000000"
                step="100000"
                value={simValues.requested_amount}
                onChange={(e) => setSimValues((prev) => ({ ...prev, requested_amount: Number(e.target.value) }))}
                className="w-full accent-[#168BFF]"
              />
            </div>
          </div>

          <button
            onClick={() => handleSimulate()}
            disabled={simLoading}
            className="w-full font-bold py-3.5 px-6 rounded-xl text-white flex items-center justify-center gap-2 transition-all"
            style={{
              background: "linear-gradient(135deg, #168BFF 0%, #0E6CD4 100%)",
              boxShadow: "0 4px 16px rgba(22,139,255,0.3)",
            }}
          >
            <Play className="w-5 h-5 fill-current" />
            {simLoading ? "Calculating Score..." : "Simulate Credit Score"}
          </button>
        </div>

        {/* Right Column: Calculated Score Gauge */}
        <div className="lg:col-span-5 glass-panel p-6 md:p-8 rounded-2xl flex flex-col items-center justify-center space-y-6">
          <h2 className="text-sm font-semibold text-[#94A8C2] uppercase tracking-wider self-start">
            Calculated Credit Risk Score
          </h2>

          <ScoreGauge score={currentScore} label={currentLabel} />
          
          <div className="w-full flex justify-around items-center pt-4 border-t border-[rgba(22,139,255,0.15)]">
            <RiskBadge label={currentLabel} size="lg" />
            <div className="text-right">
              <span className="text-xs text-[#94A8C2] block">Updated Score</span>
              <span className="text-xl font-bold text-[#EFF7FF]">
                {Number(currentScore).toFixed(1)} / 100
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
