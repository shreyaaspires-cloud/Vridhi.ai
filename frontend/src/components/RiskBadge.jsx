"use client";

import { getRiskBg } from "../lib/utils";

export default function RiskBadge({ label, size = "md" }) {
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1";

  // Dark-tinted semantic colors — meaning preserved
  const darkBg = {
    LOW:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    HIGH:   "bg-red-500/15 text-red-400 border-red-500/30",
  };

  const cls = darkBg[label] || getRiskBg(label);

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${cls} ${sizeClass}`}
    >
      {label}
    </span>
  );
}
