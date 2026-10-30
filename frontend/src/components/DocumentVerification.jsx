import { useState, useRef } from "react";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import toast from "react-hot-toast";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
  Info,
  ChevronRight,
  FileCheck,
} from "lucide-react";

const DOCUMENT_TYPES = [
  { id: "bank_statement", label: "Bank Statement", desc: "PDF or image of recent 3-6 months statement" },
  { id: "gst_return", label: "GST Return (GSTR-3B / GSTR-1)", desc: "Monthly/Quarterly tax filing document" },
  { id: "financial_statement", label: "Audited Financial Statement", desc: "Balance sheet, P&L statement" },
  { id: "itr_acknowledgement", label: "ITR Acknowledgement", desc: "Income Tax Return filing confirmation" },
  { id: "udyam_certificate", label: "Udyam Registration Certificate", desc: "Official MSME registration certificate" },
];

export default function DocumentVerification({ submittedData = {} }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [docType, setDocType] = useState("bank_statement");
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile) => {
    const validExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
    const ext = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf("."));
    if (!validExtensions.includes(ext)) {
      toast.error("Unsupported file type. Please upload a PDF, PNG, or JPEG file.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10 MB limit.");
      return;
    }
    setFile(selectedFile);
    setResult(null);
  };

  const handleVerify = async () => {
    if (!file) {
      toast.error("Please select a document to upload.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payloadData = {
        business_name: submittedData.business_name || "",
        income: submittedData.income || 0,
        monthly_upi_volume: submittedData.monthly_upi_volume || 0,
        gst_compliance_rate: submittedData.gst_compliance_rate || 0,
        sector_type: submittedData.sector_type || "",
        business_size: submittedData.business_size || "",
      };

      const res = await api.verifyDocument(file, docType, payloadData);

      if (res.error) {
        toast.error(res.error);
      } else {
        setResult(res.data);
        if (res.data.status === "VERIFIED" || res.data.status === "VERIFIED_DEMO") {
          toast.success(res.data.message || "Verified (Demo Mode) — Document verified successfully!");
        } else if (res.data.status === "PARTIALLY_VERIFIED") {
          toast("Document partially verified with notes", { icon: "👍" });
        } else {
          toast("Verification needs manual review", { icon: "⚠️" });
        }

        // Persist to Supabase document_verifications table if user logged in
        if (user) {
          try {
            await supabase.from("document_verifications").insert({
              user_id: user.id,
              document_type: docType,
              status: res.data.status || "COMPLETED",
              verification_score: res.data.verification_score ?? null,
              comparison_results: res.data.comparison ?? {},
              flags: res.data.flags ?? [],
              processed_at: new Date().toISOString(),
            });
          } catch (persistErr) {
            console.error("Supabase verification persistence error:", persistErr);
          }
        }
      }
    } catch (err) {
      toast.error(err.message || "Document verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "VERIFIED_DEMO":
        return {
          bg: "rgba(16,185,129,0.15)",
          border: "rgba(16,185,129,0.4)",
          text: "#10B981",
          icon: <ShieldCheck className="w-4 h-4" />,
          label: "Verified (Demo Mode)",
        };
      case "VERIFIED":
        return {
          bg: "rgba(16,185,129,0.15)",
          border: "rgba(16,185,129,0.4)",
          text: "#10B981",
          icon: <CheckCircle2 className="w-4 h-4" />,
          label: "VERIFIED",
        };
      case "PARTIALLY_VERIFIED":
        return {
          bg: "rgba(245,158,11,0.15)",
          border: "rgba(245,158,11,0.4)",
          text: "#F59E0B",
          icon: <AlertTriangle className="w-4 h-4" />,
          label: "PARTIALLY VERIFIED",
        };
      case "NEEDS_REVIEW":
        return {
          bg: "rgba(239,68,68,0.15)",
          border: "rgba(239,68,68,0.4)",
          text: "#EF4444",
          icon: <AlertTriangle className="w-4 h-4" />,
          label: "NEEDS REVIEW",
        };
      case "COULD_NOT_VERIFY":
        return {
          bg: "rgba(148,168,194,0.15)",
          border: "rgba(148,168,194,0.4)",
          text: "#94A8C2",
          icon: <HelpCircle className="w-4 h-4" />,
          label: "COULD NOT VERIFY",
        };
      default:
        return {
          bg: "rgba(239,68,68,0.15)",
          border: "rgba(239,68,68,0.4)",
          text: "#EF4444",
          icon: <XCircle className="w-4 h-4" />,
          label: status || "UNKNOWN",
        };
    }
  };

  const getComparisonStatusStyle = (status) => {
    switch (status) {
      case "consistent":
        return {
          badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: "Consistent",
        };
      case "mismatch":
        return {
          badge: "bg-red-500/15 text-red-400 border border-red-500/30",
          icon: <XCircle className="w-3.5 h-3.5" />,
          label: "Mismatch",
        };
      case "needs_review":
        return {
          badge: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          label: "Needs Review",
        };
      default:
        return {
          badge: "bg-gray-500/15 text-[#94A8C2] border border-gray-500/30",
          icon: <HelpCircle className="w-3.5 h-3.5" />,
          label: "Unverifiable",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Type Selector & Upload Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Type Picker */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-[#EFF7FF]">
            1. Select Document Type
          </label>
          <div className="space-y-2">
            {DOCUMENT_TYPES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setDocType(item.id);
                  setResult(null);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  docType === item.id
                    ? "bg-[#168BFF]/15 border-[#168BFF] shadow-[0_0_15px_rgba(22,139,255,0.25)]"
                    : "bg-[#0C1C35] border-white/10 hover:border-white/20"
                }`}
              >
                <FileText
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    docType === item.id ? "text-[#55D9FF]" : "text-[#94A8C2]"
                  }`}
                />
                <div>
                  <p className={`text-sm font-semibold ${docType === item.id ? "text-[#EFF7FF]" : "text-[#94A8C2]"}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-[#4A6080] mt-0.5">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Upload Dropzone */}
        <div className="lg:col-span-2 space-y-3">
          <label className="block text-sm font-semibold text-[#EFF7FF]">
            2. {t("upload_doc")}
          </label>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
              dragActive
                ? "border-[#168BFF] bg-[#168BFF]/10 scale-[1.01]"
                : file
                ? "border-emerald-500/50 bg-[#0C1C35]"
                : "border-white/15 bg-[#0C1C35]/60 hover:border-white/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#EFF7FF]">{file.name}</p>
                  <p className="text-xs text-[#94A8C2] mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to verify
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setResult(null);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 underline"
                >
                  Remove or choose another file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#168BFF]/15 text-[#55D9FF] flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#EFF7FF]">
                    Click to browse or drag & drop document here
                  </p>
                  <p className="text-xs text-[#94A8C2] mt-1">
                    Supports PDF, PNG, JPG, JPEG (Max 10 MB)
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-[#4A6080] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#168BFF]" />
              Secure OCR extraction with automated cross-field matching
            </p>
            <button
              type="button"
              disabled={!file || loading}
              onClick={handleVerify}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white flex items-center gap-2 transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #168BFF 0%, #0E6CD4 100%)",
                boxShadow: !file || loading ? "none" : "0 4px 15px rgba(22,139,255,0.3)",
              }}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t("analyzing_btn")}
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  {t("verify_btn")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Verification Results Panel */}
      {result && (
        <div className="rounded-2xl p-6 bg-[#081325] border border-white/10 space-y-6">
          {/* Header Status & Score */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              {(() => {
                const badge = getStatusBadge(result.status);
                return (
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
                    style={{ background: badge.bg, borderColor: badge.border, color: badge.text }}
                  >
                    {badge.icon}
                    {badge.label}
                  </div>
                );
              })()}
              {result.reporting_period && (
                <span className="text-xs text-[#94A8C2] bg-white/5 px-2.5 py-1 rounded-md">
                  Period: {result.reporting_period}
                </span>
              )}
            </div>

            {result.verification_score !== null && result.verification_score !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94A8C2]">Verification Score:</span>
                <span className="text-lg font-bold text-[#EFF7FF]">
                  {result.verification_score}%
                </span>
              </div>
            )}
          </div>

          {/* Flags & Warnings */}
          {result.flags && result.flags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A8C2]">
                Verification Notes & Flags
              </h4>
              <div className="space-y-1.5">
                {result.flags.map((flag, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300"
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comparison Table */}
          {result.comparison && Object.keys(result.comparison).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94A8C2]">
                Cross-Field Comparison (Submitted vs Document)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[#94A8C2]">
                      <th className="py-2.5 px-3">Field</th>
                      <th className="py-2.5 px-3">Submitted Value</th>
                      <th className="py-2.5 px-3">Document Value</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {Object.entries(result.comparison).map(([fieldKey, item]) => {
                      const st = getComparisonStatusStyle(item.status);
                      const fieldDisplayName = fieldKey
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase());

                      const formatVal = (val) => {
                        if (val === null || val === undefined) return "—";
                        if (typeof val === "number") {
                          if (val > 1000) return `₹${val.toLocaleString("en-IN")}`;
                          return String(val);
                        }
                        return String(val);
                      };

                      return (
                        <tr key={fieldKey} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-3 font-medium text-[#EFF7FF]">
                            {fieldDisplayName}
                          </td>
                          <td className="py-3 px-3 text-[#94A8C2]">
                            {formatVal(item.submitted_value)}
                          </td>
                          <td className="py-3 px-3 text-[#EFF7FF] font-mono">
                            {formatVal(item.extracted_value)}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${st.badge}`}
                            >
                              {st.icon}
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Extracted Fields Summary */}
          {result.extracted_fields && Object.keys(result.extracted_fields).length > 0 && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <h5 className="text-xs font-semibold text-[#94A8C2] mb-2">
                Document Details Extracted
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {Object.entries(result.extracted_fields).map(([k, v]) => {
                  if (v === null || v === undefined) return null;
                  return (
                    <div key={k}>
                      <span className="text-[#4A6080] capitalize block">
                        {k.replace(/_/g, " ")}:
                      </span>
                      <span className="text-[#EFF7FF] font-medium">
                        {typeof v === "number" && v > 1000 ? `₹${v.toLocaleString("en-IN")}` : String(v)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Regulatory Disclaimer */}
          {result.disclaimer && (
            <p className="text-[11px] text-[#4A6080] italic border-t border-white/5 pt-3">
              {result.disclaimer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}