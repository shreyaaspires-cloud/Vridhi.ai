"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
const CreditCoin3D = dynamic(
  () => import("../components/CreditCoin3D"),
  { ssr: false, loading: () => (
    <div className="w-full h-48 rounded-2xl bg-[#0C1C35] animate-pulse" />
  )}
);
import {
  ArrowRight, User, Building2, FileSearch, ShieldCheck,
  Zap, BarChart3, Layers, Scale, Sparkles, SlidersHorizontal,
  TrendingUp, Upload, CheckCircle2
} from "lucide-react";

/* ── Client-only WebGL components ───────────────────────────────────── */
const LightRays = dynamic(() => import("../components/LightRays"), { ssr: false });
const ElectricLogo = dynamic(() => import("../components/ElectricLogo"), { ssr: false });

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function useIsSmallScreen() {
  const [small, setSmall] = useState(false);
  useEffect(() => {
    const checkSize = () => setSmall(window.innerWidth < 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);
  return small;
}

function StatCounter({ label, value, prefix = "", suffix = "", icon: Icon, color = "text-[#168BFF]" }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );
    const element = document.getElementById(`stat-${label.replace(/\s+/g, "-")}`);
    if (element) observer.observe(element);
    return () => observer.disconnect();
  }, [label]);

  useEffect(() => {
    if (!isVisible) return;
    if (reducedMotion) {
      setCount(value);
      return;
    }

    let start = 0;
    const duration = 1200;
    const stepTime = 30;
    const steps = duration / stepTime;
    const increment = value / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isVisible, value, reducedMotion]);

  return (
    <div
      id={`stat-${label.replace(/\s+/g, "-")}`}
      className="p-4 rounded-xl bg-[#0C1C35] border border-[#168BFF]/15 flex flex-col justify-between"
    >
      <Icon size={22} className={`${color} mb-2`} />
      <span className="text-2xl font-bold text-[#EFF7FF]">
        {prefix ? prefix : `${count}${suffix}`}
      </span>
      <span className="text-xs text-[#94A8C2]">{label}</span>
    </div>
  );
}

export default function LandingPage() {
  const reducedMotion = usePrefersReducedMotion();
  const isSmall = useIsSmallScreen();
  const showWebGL = !reducedMotion && !isSmall;

  const scrollToSection = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-16 pb-12">
      {/* ── 1. HERO SECTION ────────────────────────────────────────────── */}
      <section
        id="home"
        className="relative rounded-3xl overflow-hidden px-6 md:px-12 py-12 md:py-20"
        style={{
          background: "linear-gradient(180deg, #0B1425 0%, #070910 100%)",
          border: "1px solid rgba(22,139,255,0.15)",
          minHeight: 540,
        }}
      >
        {showWebGL && (
          <div aria-hidden="true" className="absolute inset-0 z-0 pointer-events-none">
            <LightRays
              raysOrigin="top-center"
              raysColor="#168BFF"
              raysSpeed={0.5}
              lightSpread={0.6}
              rayLength={1.1}
              followMouse={true}
              mouseInfluence={0.06}
              noiseAmount={0.03}
              distortion={0.02}
              fadeDistance={0.9}
              saturation={0.85}
              pulsating={false}
            />
          </div>
        )}

        {!showWebGL && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(22,139,255,0.14) 0%, transparent 70%)",
            }}
          />
        )}

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-5">
            {showWebGL ? (
              <div
                aria-label="Vridhi.ai"
                className="mb-1"
                style={{ width: "min(320px, 60vw)", height: "min(90px, 16vw)" }}
              >
                <ElectricLogo
                  src="/vridhi-logo.svg"
                  color="#C8F3FF"
                  glowColor="#168BFF"
                  scale={0.6}
                  intensity={0.9}
                  glow={1.1}
                  thickness={1.4}
                  strands={3}
                  bend={0.5}
                  crackle={1.2}
                  arcs={1}
                  flicker={0.45}
                  fill={0}
                  speed={2.2}
                  interactive={true}
                  cursorIntensity={0.65}
                  cursorRadius={90}
                  theme="dark"
                />
              </div>
            ) : (
              <div className="mb-1">
                <Image src="/vridhi-logo.svg" alt="Vridhi.ai" width={200} height={50} priority />
              </div>
            )}

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#168BFF]/10 border border-[#168BFF]/25">
              <Sparkles size={13} className="text-[#168BFF]" />
              <span className="text-xs uppercase tracking-widest font-semibold text-cyan-300">
                MSME CREDIT INTELLIGENCE PLATFORM
              </span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#EFF7FF] leading-tight"
              style={{ fontFamily: "'Space Grotesk', Inter, system-ui, sans-serif" }}
            >
              See the signal. <br />
              <span className="animate-electric-sweep">Back the potential.</span>
            </h1>

            <p className="text-[#94A8C2] text-base md:text-lg leading-relaxed max-w-xl">
              Transparent, explainable credit-risk scoring connecting MSME borrowers and institutional lenders with alternative data intelligence.
            </p>

            {/* DUAL HERO CTAS (Side by side) */}
            <div className="flex flex-wrap items-center gap-4 pt-3">
              <Link
                href="/login/borrower"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-base shadow-lg shadow-[#168BFF]/20"
                style={{
                  background: "#168BFF",
                  borderRadius: "10px",
                  padding: "12px 24px",
                }}
              >
                I&apos;m a Business Owner →
              </Link>

              <Link
                href="/login/lender"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-[#EFF7FF] transition-base hover:bg-[#168BFF]/10"
                style={{
                  background: "transparent",
                  border: "1px solid rgba(22,139,255,0.4)",
                  color: "#EFF7FF",
                  borderRadius: "10px",
                  padding: "12px 24px",
                }}
              >
                I&apos;m a Bank / Lender →
              </Link>
            </div>

            <p className="text-xs text-[#4A6080] pt-1">
              Evaluates GST compliance, UPI transactions, vendor trust, and financial health index.
            </p>
          </div>

          <div className="lg:col-span-5 flex items-center justify-center">
            <CreditCoin3D />
          </div>
        </div>
      </section>

      {/* ── 2. ABOUT SECTION ───────────────────────────────────────────── */}
      <section id="about" className="scroll-mt-20 max-w-7xl mx-auto px-4">
        <div
          className="glass-panel rounded-2xl p-8 md:p-12 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(11,20,37,0.85) 0%, rgba(7,9,16,0.95) 100%)",
            border: "1px solid rgba(22,139,255,0.14)",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#168BFF]/10 border border-[#168BFF]/20 text-xs font-medium text-[#168BFF]">
                <ShieldCheck size={14} /> ABOUT VRIDHI.AI
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-[#EFF7FF]">
                Unlocking MSME Credit with Alternative Data Signals
              </h2>
              <p className="text-[#94A8C2] text-sm md:text-base leading-relaxed">
                Traditional credit scoring often overlooks creditworthy MSMEs due to thin financial documentation.
                Vridhi.ai bridges this gap by aggregating alternative digital footprints into explainable credit risk intelligence for both borrowers and lenders.
              </p>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <StatCounter label="Evaluated Real-Time" value={8} suffix=" Signals" icon={Zap} color="text-[#168BFF]" />
              <StatCounter label="TreeExplainer Transparency" value={100} suffix="% SHAP" icon={BarChart3} color="text-cyan-400" />
              <StatCounter label="Segmentation & Audits" value={500} prefix="500+" suffix=" MSMEs" icon={Layers} color="text-[#168BFF]" />
              <StatCounter label="Demographic Bias Monitoring" value={99} suffix="% Fair" icon={Scale} color="text-cyan-400" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. FEATURES (TWO-COLUMN PORTAL SPLIT) ───────────────────────── */}
      <section id="features" className="scroll-mt-20 max-w-7xl mx-auto px-4 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest font-semibold text-[#168BFF]">
            TAILORED SOLUTIONS
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#EFF7FF]">
            Platform Capabilities
          </h2>
          <p className="text-[#94A8C2] text-sm md:text-base">
            Dedicated portals designed for small businesses and institutional lenders.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
          {/* Left Column: Business Owners */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-[#168BFF]/20">
              <User className="w-5 h-5 text-[#168BFF]" />
              <h3 className="text-xl font-bold text-[#EFF7FF]">For Business Owners</h3>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl p-6 bg-[#0C1C35] border border-[rgba(22,139,255,0.15)]">
                <h4 className="text-base font-bold text-[#EFF7FF] mb-1">Know Your Score</h4>
                <p className="text-xs text-[#94A8C2] leading-relaxed">
                  Transparent credit risk score based on your real business data and alternative performance signals.
                </p>
              </div>

              <div className="rounded-2xl p-6 bg-[#0C1C35] border border-[rgba(22,139,255,0.15)]">
                <h4 className="text-base font-bold text-[#EFF7FF] mb-1">Understand Why</h4>
                <p className="text-xs text-[#94A8C2] leading-relaxed">
                  See exactly which operational factors helped or hurt your score with SHAP explainability breakdown.
                </p>
              </div>

              <div className="rounded-2xl p-6 bg-[#0C1C35] border border-[rgba(22,139,255,0.15)]">
                <h4 className="text-base font-bold text-[#EFF7FF] mb-1">Improve Over Time</h4>
                <p className="text-xs text-[#94A8C2] leading-relaxed">
                  Get personalized improvement tips and simulate financial scenario changes in real-time.
                </p>
              </div>
            </div>

            <Link
              href="/borrower"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#168BFF] hover:text-[#55D9FF] transition-base pt-2"
            >
              Open Borrower Portal <ArrowRight size={16} />
            </Link>
          </div>

          {/* Vertical Divider (Desktop) */}
          <div className="hidden lg:block absolute left-1/2 top-10 bottom-10 w-[1px] bg-white/10 -translate-x-1/2" />

          {/* Right Column: Banks & Lenders */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-[#168BFF]/20">
              <Building2 className="w-5 h-5 text-[#168BFF]" />
              <h3 className="text-xl font-bold text-[#EFF7FF]">For Banks & Lenders</h3>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl p-6 bg-[#0C1C35] border border-[rgba(22,139,255,0.15)]">
                <h4 className="text-base font-bold text-[#EFF7FF] mb-1">Portfolio Intelligence</h4>
                <p className="text-xs text-[#94A8C2] leading-relaxed">
                  View and segment your entire MSME loan book at once by sector, region, and risk tier.
                </p>
              </div>

              <div className="rounded-2xl p-6 bg-[#0C1C35] border border-[rgba(22,139,255,0.15)]">
                <h4 className="text-base font-bold text-[#EFF7FF] mb-1">Batch Assessment</h4>
                <p className="text-xs text-[#94A8C2] leading-relaxed">
                  Upload hundreds of applications via CSV and get instant batch credit risk scores and report exports.
                </p>
              </div>

              <div className="rounded-2xl p-6 bg-[#0C1C35] border border-[rgba(22,139,255,0.15)]">
                <h4 className="text-base font-bold text-[#EFF7FF] mb-1">Fairness Compliance</h4>
                <p className="text-xs text-[#94A8C2] leading-relaxed">
                  Built-in bias detection across demographics for RBI-compliant fair lending practices.
                </p>
              </div>
            </div>

            <Link
              href="/lender"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#168BFF] hover:text-[#55D9FF] transition-base pt-2"
            >
              Open Lender Intelligence Dashboard <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS (DUAL STEPPER FLOWS) ───────────────────────── */}
      <section id="how-it-works" className="scroll-mt-20 max-w-7xl mx-auto px-4 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-widest font-semibold text-cyan-400">
            WORKFLOW OVERVIEW
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#EFF7FF]">
            How Vridhi.ai Works
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Business Owner Stepper */}
          <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-4">
            <h3 className="text-lg font-bold text-[#EFF7FF] border-b border-white/10 pb-3 flex items-center gap-2">
              <User size={18} className="text-[#168BFF]" /> For Business Owners
            </h3>

            <div className="space-y-4 pt-2">
              {[
                ["Step 1", "Fill your business details"],
                ["Step 2", "Get your AI credit score instantly"],
                ["Step 3", "See why you got that score"],
                ["Step 4", "Simulate improvements and apply"],
              ].map(([step, title], idx) => (
                <div key={idx} className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-[#168BFF]/20 border border-[#168BFF]/40 text-[#168BFF] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="text-[10px] text-[#168BFF] uppercase font-bold tracking-wider">{step}</span>
                    <p className="text-sm font-medium text-[#EFF7FF]">{title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lender Stepper */}
          <div className="glass-panel rounded-2xl p-6 md:p-8 space-y-4">
            <h3 className="text-lg font-bold text-[#EFF7FF] border-b border-white/10 pb-3 flex items-center gap-2">
              <Building2 size={18} className="text-[#168BFF]" /> For Lenders
            </h3>

            <div className="space-y-4 pt-2">
              {[
                ["Step 1", "Upload your MSME application CSV"],
                ["Step 2", "Get risk scores for all applications"],
                ["Step 3", "Segment by sector, region, size"],
                ["Step 4", "Download fairness report for compliance"],
              ].map(([step, title], idx) => (
                <div key={idx} className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-[#168BFF]/20 border border-[#168BFF]/40 text-[#168BFF] text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div>
                    <span className="text-[10px] text-[#168BFF] uppercase font-bold tracking-wider">{step}</span>
                    <p className="text-sm font-medium text-[#EFF7FF]">{title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. FOOTER ─────────────────────────────────────────────────── */}
      <footer className="max-w-7xl mx-auto px-4 pt-8 border-t border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 text-xs text-[#94A8C2]">
          <div className="flex items-center gap-3">
            <Image src="/vridhi-logo.svg" alt="Vridhi.ai" width={110} height={28} style={{ height: 22, width: "auto" }} />
            <span>— Predictive Credit Risk Analytics Platform</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/" className="hover:text-white transition-base">Home</Link>
            <Link href="/borrower" className="hover:text-white transition-base">Borrower Portal</Link>
            <Link href="/lender" className="hover:text-white transition-base">Lender Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
