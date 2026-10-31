"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, User, Building2, ShieldCheck,
  Zap, BarChart3, Layers, Scale, Sparkles, Cpu, Users2,
  CheckCircle2, ArrowUpRight
} from "lucide-react";

/* ── 3D Animated Financial Growth Chart (Client-only WebGL) ── */
const FinancialGrowthChart3D = dynamic(
  () => import("../components/FinancialGrowthChart3D"),
  { ssr: false }
);

/* ── Prefer-reduced-motion hook ──────────────────────────────────────── */
function usePrefersReducedMotion() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setV(mq.matches);
    const h = (e) => setV(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return v;
}

/* ── Scroll fade-in hook for natural narrative pacing ────────────────── */
function useScrollFadeIn() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".scroll-fade").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

const SCROLL_FADE_STYLE = {
  opacity: 0,
  transform: "translateY(24px)",
  transition: "opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)",
};

/* ── StatCounter with warm editorial styling ─────────────────────────── */
function StatCounter({ label, value, prefix = "", suffix = "", icon: Icon, delay = 0 }) {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const reduced = usePrefersReducedMotion();
  const id = `stat-${label.replace(/\s+/g, "-")}`;

  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [id]);

  useEffect(() => {
    if (!visible) return;
    if (reduced) { setCount(value); return; }
    let n = 0;
    const steps = 36;
    const inc = value / steps;
    const timer = setTimeout(() => {
      const t = setInterval(() => {
        n += inc;
        if (n >= value) { setCount(value); clearInterval(t); }
        else setCount(Math.floor(n));
      }, 30);
      return () => clearInterval(t);
    }, delay);
    return () => clearTimeout(timer);
  }, [visible, value, reduced, delay]);

  return (
    <div
      id={id}
      style={{
        background: "rgba(255, 255, 255, 0.88)",
        border: "1px solid rgba(180, 154, 99, 0.28)",
        borderRadius: "16px",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        boxShadow: "0 4px 16px rgba(22, 61, 50, 0.04)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.borderColor = "rgba(40, 118, 87, 0.5)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(22, 61, 50, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.borderColor = "rgba(180, 154, 99, 0.28)";
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(22, 61, 50, 0.04)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Icon size={18} style={{ color: "#287657" }} />
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#B49A63", opacity: 0.6 }} />
      </div>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "26px",
          fontWeight: 800,
          color: "#163D32",
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        {prefix || `${count}${suffix}`}
      </span>
      <span style={{ fontSize: "12px", color: "#556357", fontWeight: 500, lineHeight: 1.4 }}>
        {label}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   LANDING PAGE — Premium Fintech (Warm Ivory, Forest Green, Gold Coin)
══════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  useScrollFadeIn();

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .hero-heading {
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: -0.035em;
          line-height: 1.06;
        }
        .editorial-accent {
          font-family: 'Newsreader', Georgia, serif;
          font-style: italic;
          font-weight: 400;
        }
        .card-hover-lift {
          transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .card-hover-lift:hover {
          transform: translateY(-3px);
          border-color: rgba(40, 118, 87, 0.45) !important;
          box-shadow: 0 12px 32px rgba(22, 61, 50, 0.08) !important;
        }
        @media (max-width: 900px) {
          .hero-composition {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
            padding-top: 80px !important;
            padding-bottom: 60px !important;
          }
          .coin-container-col {
            min-height: 380px !important;
            max-width: 440px !important;
            margin: 0 auto !important;
          }
          .about-composition {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .features-layout {
            grid-template-columns: 1fr !important;
          }
          .features-divider {
            display: none !important;
          }
          .hiw-layout {
            grid-template-columns: 1fr !important;
          }
        }
      ` }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 0, width: "100%", background: "#F7F6F0" }}>

        {/* ══════════════════════════════════════════════════════════════
            1. HERO — Balanced Spacing, Zero Viewport Clipping & 3D Growth Chart
            LEFT: Brand, headline, description, borrower/lender actions (fits in 1366x768)
            RIGHT: Signature 3D Animated Financial Growth Chart & Gold Arrow
        ══════════════════════════════════════════════════════════════ */}
        <section
          id="home"
          style={{
            position: "relative",
            overflow: "hidden",
            minHeight: "auto",
            display: "flex",
            alignItems: "center",
            background: "linear-gradient(180deg, #F7F6F0 0%, #F3EFE4 55%, #EBE7D8 100%)",
            margin: "-1.5rem -1rem 0",
            padding: "0",
            borderBottom: "1px solid rgba(180, 154, 99, 0.22)",
          }}
          className="md:-mx-8"
        >
          {/* Subtle warm architectural texture */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage: `
                radial-gradient(ellipse 65% 55% at 75% 35%, rgba(180, 154, 99, 0.08) 0%, transparent 65%),
                radial-gradient(circle at 15% 85%, rgba(40, 118, 87, 0.06) 0%, transparent 50%),
                linear-gradient(rgba(180, 154, 99, 0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(180, 154, 99, 0.04) 1px, transparent 1px)
              `,
              backgroundSize: "100% 100%, 100% 100%, 80px 80px, 80px 80px",
              opacity: 0.9,
            }}
          />

          <div
            className="hero-composition"
            style={{
              position: "relative",
              zIndex: 10,
              maxWidth: 1280,
              margin: "0 auto",
              padding: "48px 2rem 40px",
              display: "grid",
              gridTemplateColumns: "1.15fr 0.95fr",
              gap: "2.5rem",
              alignItems: "center",
              width: "100%",
            }}
          >
            {/* ── LEFT COLUMN: Brand, Copy & Primary Entry Points ─────── */}
            <div style={{ animation: "fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both" }}>
              {/* Institutional pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "5px 12px",
                  borderRadius: "100px",
                  background: "rgba(22, 61, 50, 0.06)",
                  border: "1px solid rgba(22, 61, 50, 0.16)",
                  marginBottom: "1rem",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#287657",
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#163D32",
                  }}
                >
                  AI-Powered MSME Credit Intelligence
                </span>
              </div>

              {/* Primary Headline */}
              <h1
                className="hero-heading"
                style={{
                  fontSize: "clamp(38px, 4.4vw, 62px)",
                  fontWeight: 800,
                  color: "#163D32",
                  marginBottom: "0.85rem",
                  marginTop: 0,
                  lineHeight: 1.08,
                }}
              >
                Vridhi.ai —
                <br />
                <span>MSME Credit</span>
                <br />
                <span style={{ color: "#287657" }} className="editorial-accent">Intelligence</span>
              </h1>

              {/* Preserved Tagline */}
              <p
                style={{
                  fontSize: "clamp(15px, 1.4vw, 18px)",
                  color: "#222923",
                  fontWeight: 600,
                  lineHeight: 1.45,
                  maxWidth: "520px",
                  marginBottom: "0.6rem",
                  marginTop: 0,
                }}
              >
                Smarter credit insights. Explainable risk intelligence. Better-informed lending decisions.
              </p>

              {/* Preserved Supporting Description */}
              <p
                style={{
                  color: "#556357",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  maxWidth: "510px",
                  marginBottom: "1.5rem",
                  marginTop: 0,
                }}
              >
                Connecting small business borrowers and institutional underwriters through multidimensional alternative data analysis, verifiable cashflow signals, and RBI-aligned fairness compliance.
              </p>

              {/* Distinct Borrower & Lender Action Buttons */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "0.85rem",
                  marginBottom: "1.25rem",
                }}
              >
                {/* Primary Action: Business Owner */}
                <Link
                  href="/borrower"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "13px 28px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#F7F6F0",
                    background: "linear-gradient(135deg, #163D32 0%, #102C25 100%)",
                    border: "1px solid #163D32",
                    textDecoration: "none",
                    boxShadow: "0 6px 20px rgba(16, 44, 37, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 10px 28px rgba(16, 44, 37, 0.32)";
                    e.currentTarget.style.background = "#102C25";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 44, 37, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.15)";
                    e.currentTarget.style.background = "linear-gradient(135deg, #163D32 0%, #102C25 100%)";
                  }}
                >
                  <User size={16} /> Business Owner <ArrowRight size={16} />
                </Link>

                {/* Secondary Action: Bank / Lender */}
                <Link
                  href="/lender"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "13px 26px",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#163D32",
                    background: "#FFFFFF",
                    border: "1px solid rgba(22, 61, 50, 0.35)",
                    textDecoration: "none",
                    boxShadow: "0 2px 10px rgba(34, 41, 35, 0.05)",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "#163D32";
                    e.currentTarget.style.background = "#EEF4ED";
                    e.currentTarget.style.boxShadow = "0 6px 18px rgba(22, 61, 50, 0.10)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "";
                    e.currentTarget.style.borderColor = "rgba(22, 61, 50, 0.35)";
                    e.currentTarget.style.background = "#FFFFFF";
                    e.currentTarget.style.boxShadow = "0 2px 10px rgba(34, 41, 35, 0.05)";
                  }}
                >
                  <Building2 size={16} style={{ color: "#287657" }} /> Bank / Lender
                </Link>
              </div>

              {/* Data Signal Verification Strip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "12px",
                  color: "#556357",
                  borderTop: "1px solid rgba(180, 154, 99, 0.22)",
                  paddingTop: "0.85rem",
                }}
              >
                <span style={{ fontWeight: 600, color: "#163D32" }}>Signals Evaluated:</span>
                <span>GST compliance</span>
                <span style={{ color: "#B49A63" }}>•</span>
                <span>UPI velocity</span>
                <span style={{ color: "#B49A63" }}>•</span>
                <span>Vendor trust</span>
                <span style={{ color: "#B49A63" }}>•</span>
                <span>Health index</span>
              </div>
            </div>

            {/* ── RIGHT COLUMN: 3D Financial Growth Chart & Gold Arrow ── */}
            <div
              className="coin-container-col"
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "440px",
                maxHeight: "500px",
                animation: "fadeIn 1.1s ease-out 0.2s both",
              }}
            >
              {/* Subtle ambient halo behind the chart */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: "10%",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(180, 154, 99, 0.08) 0%, rgba(40, 118, 87, 0.03) 50%, transparent 75%)",
                  filter: "blur(24px)",
                  zIndex: 0,
                }}
              />

              {/* The Genuine WebGL 3D Animated Financial Growth Chart */}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FinancialGrowthChart3D />
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            2. TRUST STRIP — Clean, Human-Crafted Institutional Evidence
        ══════════════════════════════════════════════════════════════ */}
        <section
          className="scroll-fade"
          style={{
            ...SCROLL_FADE_STYLE,
            maxWidth: 1280,
            margin: "0 auto",
            padding: "64px 2rem 24px",
            width: "100%",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <span
              style={{
                fontSize: "11px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: "#7A8A7D",
              }}
            >
              Trusted Across the MSME Credit Lifecycle
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "18px",
            }}
          >
            {[
              { icon: ShieldCheck, title: "Transparent Insights", sub: "Clear factors behind every scoring decision" },
              { icon: Cpu, title: "AI-Powered Engine", sub: "XGBoost and SHAP explainability core" },
              { icon: Users2, title: "Empowering MSMEs", sub: "Unlocking access through alternative data" },
              { icon: BarChart3, title: "Prudent Underwriting", sub: "Portfolio segmentation and bias auditing" },
            ].map(({ icon: Icon, title, sub }) => (
              <div
                key={title}
                className="card-hover-lift"
                style={{
                  padding: "20px 22px",
                  borderRadius: "16px",
                  background: "#FFFFFF",
                  border: "1px solid rgba(180, 154, 99, 0.22)",
                  boxShadow: "0 2px 10px rgba(22, 61, 50, 0.03)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                }}
              >
                <div
                  style={{
                    padding: "10px",
                    borderRadius: "10px",
                    background: "rgba(40, 118, 87, 0.10)",
                    border: "1px solid rgba(40, 118, 87, 0.22)",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} style={{ color: "#287657" }} />
                </div>
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#163D32", margin: "0 0 4px" }}>
                    {title}
                  </h4>
                  <p style={{ fontSize: "12px", color: "#556357", margin: 0, lineHeight: 1.5 }}>
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            3. ABOUT — Deep Forest Green Grounded Editorial Card
        ══════════════════════════════════════════════════════════════ */}
        <section
          id="about"
          className="scroll-fade"
          style={{
            ...SCROLL_FADE_STYLE,
            maxWidth: 1280,
            margin: "0 auto",
            padding: "54px 2rem 24px",
            width: "100%",
          }}
        >
          <div
            style={{
              background: "linear-gradient(145deg, #163D32 0%, #102C25 100%)",
              borderRadius: "28px",
              padding: "3.5rem 3rem",
              position: "relative",
              overflow: "hidden",
              border: "1px solid rgba(180, 154, 99, 0.28)",
              boxShadow: "0 20px 48px rgba(16, 44, 37, 0.18)",
            }}
          >
            {/* Top decorative brass pinstripe */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: "linear-gradient(90deg, transparent, #B49A63, #DFE8DE, transparent)",
              }}
            />

            <div
              className="about-composition"
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 0.9fr",
                gap: "3.5rem",
                alignItems: "center",
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Left narrative content */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "7px",
                    padding: "5px 12px",
                    borderRadius: "100px",
                    background: "rgba(223, 232, 222, 0.12)",
                    border: "1px solid rgba(223, 232, 222, 0.22)",
                    width: "fit-content",
                  }}
                >
                  <ShieldCheck size={13} style={{ color: "#DFE8DE" }} />
                  <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#DFE8DE" }}>
                    About Vridhi.ai
                  </span>
                </div>

                <h2
                  className="hero-heading"
                  style={{
                    fontSize: "clamp(30px, 3.4vw, 44px)",
                    fontWeight: 800,
                    color: "#F7F6F0",
                    margin: 0,
                    lineHeight: 1.15,
                  }}
                >
                  Empowering MSME Growth{" "}
                  <br />
                  <span style={{ color: "#D8C496" }} className="editorial-accent">Through Verifiable Data</span>
                </h2>

                <p style={{ color: "#DFE8DE", fontSize: "15px", lineHeight: 1.75, margin: 0, opacity: 0.92 }}>
                  Vridhi.ai bridges the credit accessibility gap for India&apos;s micro, small, and medium enterprises. By combining machine learning risk models with transparent SHAP explanations, we enable small enterprises to demonstrate creditworthiness while equipping institutional lenders with real-time portfolio intelligence.
                </p>

                <div>
                  <Link
                    href="/borrower"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      background: "#B49A63",
                      color: "#102C25",
                      fontSize: "13px",
                      fontWeight: 700,
                      textDecoration: "none",
                      boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#D8C496"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#B49A63"; e.currentTarget.style.transform = ""; }}
                  >
                    Know More About Us <ArrowRight size={14} />
                  </Link>
                </div>

                {/* 4 Core Verification Metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "0.5rem" }}>
                  <StatCounter label="Evaluated Real-Time" value={8} suffix=" Signals" icon={Zap} delay={0} />
                  <StatCounter label="SHAP Transparency" value={100} suffix="% Tree" icon={BarChart3} delay={180} />
                  <StatCounter label="MSMEs in Portfolio" value={500} prefix="500+" icon={Layers} delay={360} />
                  <StatCounter label="Fairness Compliance" value={99} suffix="% RBI" icon={Scale} delay={540} />
                </div>
              </div>

              {/* Right: Dual-Ecosystem Framework */}
              <div
                style={{
                  background: "rgba(16, 44, 37, 0.65)",
                  border: "1px solid rgba(180, 154, 99, 0.25)",
                  borderRadius: "22px",
                  padding: "2.25rem",
                  color: "#F7F6F0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(180, 154, 99, 0.2)", paddingBottom: "1rem" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B49A63" }}>
                    The Dual-Ecosystem Framework
                  </span>
                  <span style={{ fontSize: "11px", color: "#DFE8DE", opacity: 0.7 }}>Production Architecture</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(223, 232, 222, 0.12)",
                      borderRadius: "14px",
                      padding: "16px 18px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <User size={15} style={{ color: "#D8C496" }} />
                      <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#F7F6F0", margin: 0 }}>
                        For Small Business Borrowers
                      </h4>
                    </div>
                    <p style={{ fontSize: "12px", color: "#DFE8DE", margin: 0, lineHeight: 1.5, opacity: 0.85 }}>
                      Transparent score cards, counterfactual scenario simulations, and prescriptive guidance to improve credit standing over time.
                    </p>
                  </div>

                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(223, 232, 222, 0.12)",
                      borderRadius: "14px",
                      padding: "16px 18px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <Building2 size={15} style={{ color: "#D8C496" }} />
                      <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#F7F6F0", margin: 0 }}>
                        For Institutional Lenders
                      </h4>
                    </div>
                    <p style={{ fontSize: "12px", color: "#DFE8DE", margin: 0, lineHeight: 1.5, opacity: 0.85 }}>
                      Batch CSV portfolio scoring, demographic fairness auditing against RBI guidelines, and underwriter notes management.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid rgba(180, 154, 99, 0.2)",
                    fontSize: "12px",
                    color: "#DFE8DE",
                    opacity: 0.85,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={14} style={{ color: "#287657" }} /> RBI Compliant
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={14} style={{ color: "#287657" }} /> Zero Biased Weights
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            4. FEATURES — Balanced Editorial Dual-Column Matrix
        ══════════════════════════════════════════════════════════════ */}
        <section
          id="features"
          className="scroll-fade"
          style={{
            ...SCROLL_FADE_STYLE,
            maxWidth: 1280,
            margin: "0 auto",
            padding: "54px 2rem 24px",
            width: "100%",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "3.25rem" }}>
            <span style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: "#287657" }}>
              Tailored Financial Solutions
            </span>
            <h2
              className="hero-heading"
              style={{
                fontSize: "clamp(32px, 3.8vw, 46px)",
                fontWeight: 800,
                color: "#163D32",
                margin: "10px 0 12px",
              }}
            >
              Key Capabilities
            </h2>
            <p style={{ color: "#556357", fontSize: "15px", margin: 0, maxWidth: "560px", marginInline: "auto" }}>
              Dedicated, purposeful workflows built to address the specific requirements of small businesses and credit underwriting teams.
            </p>
          </div>

          <div
            className="features-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2.5rem",
              position: "relative",
            }}
          >
            {/* Vertical separator pinstripe */}
            <div
              className="features-divider"
              style={{
                position: "absolute",
                left: "50%",
                top: 24,
                bottom: 24,
                width: "1px",
                background: "linear-gradient(to bottom, transparent, rgba(180, 154, 99, 0.35), transparent)",
                transform: "translateX(-50%)",
              }}
            />

            {/* Pillar 1: For Business Owners */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ borderLeft: "3px solid #287657", paddingLeft: "14px", marginBottom: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <User size={18} style={{ color: "#287657" }} />
                  <h3 style={{ fontSize: "19px", fontWeight: 800, color: "#163D32", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                    For Business Owners
                  </h3>
                </div>
              </div>

              {[
                ["Know Your Score", "Transparent credit risk score based on actual verified business performance, UPI volume, and GST filings."],
                ["Understand Why", "Discover precisely which operational factors aided or constrained your rating through SHAP feature attributions."],
                ["Improve Over Time", "Simulate counterfactual scenario changes in real-time to plan tangible debt eligibility improvements."],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="card-hover-lift"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(180, 154, 99, 0.22)",
                    borderRadius: "16px",
                    padding: "1.6rem 1.75rem",
                    boxShadow: "0 2px 10px rgba(22, 61, 50, 0.03)",
                  }}
                >
                  <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#163D32", margin: "0 0 6px" }}>
                    {title}
                  </h4>
                  <p style={{ fontSize: "13px", color: "#556357", lineHeight: 1.65, margin: 0 }}>
                    {desc}
                  </p>
                </div>
              ))}

              <div>
                <Link
                  href="/borrower"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#287657",
                    textDecoration: "none",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: "rgba(40, 118, 87, 0.08)",
                    border: "1px solid rgba(40, 118, 87, 0.2)",
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#287657"; e.currentTarget.style.color = "#FFFFFF"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(40, 118, 87, 0.08)"; e.currentTarget.style.color = "#287657"; }}
                >
                  Open Borrower Portal <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Pillar 2: For Banks & Lenders */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ borderLeft: "3px solid #163D32", paddingLeft: "14px", marginBottom: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Building2 size={18} style={{ color: "#163D32" }} />
                  <h3 style={{ fontSize: "19px", fontWeight: 800, color: "#163D32", margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                    For Banks &amp; Lenders
                  </h3>
                </div>
              </div>

              {[
                ["Portfolio Intelligence", "Segment and monitor your overall MSME loan book simultaneously by sector, region, and risk tier."],
                ["Batch Assessment", "Upload large CSV application sets to generate instantaneous batch risk rankings and audit-ready report exports."],
                ["Fairness Compliance", "Automated parity detection across demographic dimensions to satisfy RBI fair-lending regulatory standards."],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="card-hover-lift"
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid rgba(180, 154, 99, 0.22)",
                    borderRadius: "16px",
                    padding: "1.6rem 1.75rem",
                    boxShadow: "0 2px 10px rgba(22, 61, 50, 0.03)",
                  }}
                >
                  <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#163D32", margin: "0 0 6px" }}>
                    {title}
                  </h4>
                  <p style={{ fontSize: "13px", color: "#556357", lineHeight: 1.65, margin: 0 }}>
                    {desc}
                  </p>
                </div>
              ))}

              <div>
                <Link
                  href="/lender"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#163D32",
                    textDecoration: "none",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    background: "rgba(22, 61, 50, 0.08)",
                    border: "1px solid rgba(22, 61, 50, 0.2)",
                    transition: "all 0.18s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#163D32"; e.currentTarget.style.color = "#FFFFFF"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(22, 61, 50, 0.08)"; e.currentTarget.style.color = "#163D32"; }}
                >
                  Open Lender Intelligence Dashboard <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            5. HOW IT WORKS — Step-by-Step Production Process
        ══════════════════════════════════════════════════════════════ */}
        <section
          id="how-it-works"
          className="scroll-fade"
          style={{
            ...SCROLL_FADE_STYLE,
            maxWidth: 1280,
            margin: "0 auto",
            padding: "54px 2rem 36px",
            width: "100%",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: "#287657" }}>
              Operational Workflow
            </span>
            <h2
              className="hero-heading"
              style={{
                fontSize: "clamp(32px, 3.8vw, 46px)",
                fontWeight: 800,
                color: "#163D32",
                margin: "10px 0 0",
              }}
            >
              How Vridhi.ai Operates
            </h2>
          </div>

          <div
            className="hiw-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2.25rem",
            }}
          >
            {[
              {
                icon: User,
                title: "For Business Owners",
                href: "/borrower",
                steps: [
                  "Submit primary business and financial information",
                  "Receive an explainable AI credit risk assessment instantly",
                  "Examine granular positive and negative attribution drivers",
                  "Simulate scenario adjustments to enhance qualification",
                ],
              },
              {
                icon: Building2,
                title: "For Institutional Lenders",
                href: "/lender",
                steps: [
                  "Upload batch MSME loan application portfolios via CSV",
                  "Obtain instant risk stratification and default probability models",
                  "Segment applications across regional and sector dimensions",
                  "Export RBI-compliant demographic fairness audit certificates",
                ],
              },
            ].map(({ icon: Icon, title, href, steps }) => (
              <div
                key={title}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(180, 154, 99, 0.28)",
                  borderRadius: "22px",
                  padding: "2.5rem 2.25rem",
                  boxShadow: "0 4px 18px rgba(22, 61, 50, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "#163D32",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      margin: "0 0 1.5rem",
                      paddingBottom: "1.2rem",
                      borderBottom: "1px solid rgba(180, 154, 99, 0.2)",
                    }}
                  >
                    <Icon size={18} style={{ color: "#287657" }} /> {title}
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {steps.map((step, idx) => (
                      <div key={idx}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              background: "rgba(22, 61, 50, 0.06)",
                              border: "1px solid rgba(22, 61, 50, 0.2)",
                              color: "#163D32",
                              fontSize: "12px",
                              fontWeight: 800,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              marginTop: "2px",
                            }}
                          >
                            {idx + 1}
                          </div>
                          <p style={{ fontSize: "14px", fontWeight: 600, color: "#222923", margin: "6px 0", lineHeight: 1.5 }}>
                            {step}
                          </p>
                        </div>
                        {idx < steps.length - 1 && (
                          <div
                            style={{
                              width: "1px",
                              height: "18px",
                              marginLeft: "15px",
                              background: "rgba(180, 154, 99, 0.35)",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid rgba(180, 154, 99, 0.15)" }}>
                  <Link
                    href={href}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#287657",
                      textDecoration: "none",
                      transition: "gap 0.18s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.gap = "10px")}
                    onMouseLeave={(e) => (e.currentTarget.style.gap = "6px")}
                  >
                    Get Started <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            6. FOOTER — Restrained, Credible Fintech Signature
        ══════════════════════════════════════════════════════════════ */}
        <footer
          className="scroll-fade"
          style={{
            ...SCROLL_FADE_STYLE,
            maxWidth: 1280,
            margin: "0 auto",
            padding: "48px 2rem 36px",
            width: "100%",
            borderTop: "1px solid rgba(180, 154, 99, 0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/vridhi-logo.svg" alt="Vridhi.ai" style={{ height: 24, width: "auto" }} />
              <span style={{ fontSize: "13px", color: "#556357", fontWeight: 500 }}>
                — MSME Credit Risk Intelligence Platform
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.75rem" }}>
              {[
                { label: "Home", href: "/" },
                { label: "Borrower Portal", href: "/borrower" },
                { label: "Lender Portal", href: "/lender" },
                { label: "Portfolio Intelligence", href: "/portfolio" },
                { label: "Fairness Audits", href: "/fairness" },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#556357",
                    textDecoration: "none",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#163D32")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#556357")}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid rgba(180, 154, 99, 0.15)",
              fontSize: "12px",
              color: "#7A8A7D",
            }}
          >
            <span>© 2025 Vridhi.ai — Smart India Hackathon PS-12</span>
            <span>Predictive credit risk analytics powered by explainable XGBoost &amp; SHAP</span>
          </div>
        </footer>

      </div>
    </>
  );
}
