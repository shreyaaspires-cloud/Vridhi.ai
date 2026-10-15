"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function BorrowerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailValue = email.trim() || "business@msme.in";
    const name = emailValue.split("@")[0];

    localStorage.setItem(
      "vridhi_user",
      JSON.stringify({
        role: "borrower",
        email: emailValue,
        name: name,
      })
    );
    router.push("/borrower");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "#070910" }}
    >
      <div
        className="w-full relative shadow-2xl"
        style={{
          background: "#0C1C35",
          border: "1px solid rgba(22, 139, 255, 0.15)",
          borderRadius: "20px",
          padding: "40px",
          maxWidth: "420px",
        }}
      >
        {/* Logo at top center */}
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Image
              src="/vridhi-logo.svg"
              alt="Vridhi.ai"
              width={140}
              height={36}
              style={{ height: 32, width: "auto" }}
              priority
            />
          </Link>
        </div>

        {/* Badge */}
        <div className="flex justify-center mb-3">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(22, 139, 255, 0.15)",
              color: "#168BFF",
              border: "1px solid rgba(22, 139, 255, 0.3)",
            }}
          >
            Business Owner Portal
          </span>
        </div>

        {/* Heading & Subtext */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-xs text-[#94A8C2] leading-relaxed">
            Sign in to check your credit score and track improvement
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#94A8C2] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@enterprise.in"
              style={{
                background: "#070910",
                border: "1px solid rgba(22, 139, 255, 0.2)",
                color: "#EFF7FF",
                borderRadius: "10px",
                padding: "10px 14px",
                width: "100%",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#168BFF")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(22, 139, 255, 0.2)")}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A8C2] mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                background: "#070910",
                border: "1px solid rgba(22, 139, 255, 0.2)",
                color: "#EFF7FF",
                borderRadius: "10px",
                padding: "10px 14px",
                width: "100%",
                outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#168BFF")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(22, 139, 255, 0.2)")}
            />
          </div>

          <button
            type="submit"
            className="w-full font-semibold transition-opacity hover:opacity-90 mt-2"
            style={{
              background: "#168BFF",
              color: "#FFFFFF",
              borderRadius: "10px",
              padding: "12px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Sign In
          </button>
        </form>

        {/* Links below button */}
        <div className="text-center mt-5 space-y-2">
          <p className="text-xs text-[#94A8C2]">
            Don&apos;t have an account?{" "}
            <Link href="/" className="text-[#168BFF] hover:underline font-medium">
              Register
            </Link>
          </p>

          <div>
            <Link
              href="/borrower"
              className="text-xs text-[#94A8C2] hover:text-[#EFF7FF] underline transition-colors"
            >
              Continue as Guest
            </Link>
          </div>
        </div>

        {/* Bottom switch link */}
        <div className="mt-8 pt-4 border-t border-white/10 text-center">
          <Link
            href="/login/lender"
            className="text-xs text-[#94A8C2] hover:text-[#EFF7FF] transition-colors"
          >
            Are you a Bank or Lender? <span className="text-[#168BFF] font-medium">Sign in here →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
