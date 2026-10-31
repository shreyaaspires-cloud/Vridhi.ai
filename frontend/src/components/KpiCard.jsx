"use client";

export default function KpiCard({ title, value, subtitle, icon: Icon, color = "blue" }) {
  const iconColors = {
    blue:    "from-[var(--brand-emerald)] to-[var(--brand-primary)]",
    emerald: "from-emerald-500/80 to-emerald-700",
    amber:   "from-amber-500/80 to-amber-700",
    red:     "from-red-500/80 to-red-700",
    slate:   "from-[#4A6080] to-[#2e3f58]",
  };

  return (
    <div className="glass-panel rounded-xl p-5 card-hover transition-colors">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider truncate">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)] leading-none font-display">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1.5 text-xs text-[var(--text-secondary)]">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div
            className={`ml-3 flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${iconColors[color] || iconColors.blue} flex items-center justify-center shadow-sm`}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
