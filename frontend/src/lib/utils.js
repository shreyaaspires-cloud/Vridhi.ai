export function formatCurrency(value) {
  if (value === null || value === undefined) return "N/A";
  const num = Number(value);
  if (num >= 10000000) return `\u20b9${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `\u20b9${(num / 100000).toFixed(2)} L`;
  if (num >= 1000) return `\u20b9${(num / 1000).toFixed(1)}K`;
  return `\u20b9${num.toFixed(0)}`;
}

export function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined) return "N/A";
  return Number(value).toFixed(decimals);
}

export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return "N/A";
  return `${Number(value).toFixed(decimals)}%`;
}

export function getRiskColor(label) {
  if (label === "LOW") return "#10b981";
  if (label === "MEDIUM") return "#f59e0b";
  return "#ef4444";
}

export function getRiskBg(label) {
  if (label === "LOW") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (label === "MEDIUM") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}
