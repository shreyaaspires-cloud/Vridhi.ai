"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Cell, ReferenceLine, Tooltip,
} from "recharts";

export default function ExplainabilityChart({ factors }) {
  if (!factors || factors.length === 0) return null;

  const data = factors.map((f) => ({
    name: f.feature.replace(/_/g, " "),
    value: f.impact_points,
    direction: f.direction,
  }));

  return (
    <div className="glass-panel rounded-xl p-6">
      <h3 className="text-sm font-semibold text-[#94A8C2] mb-4">
        Top 5 Risk Factors (SHAP Explainability)
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 30, right: 20, top: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#94A8C2" }}
            axisLine={{ stroke: "#1a2540" }}
            tickLine={{ stroke: "#1a2540" }}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 11, fill: "#94A8C2" }}
            width={120}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(22,139,255,0.05)" }}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid rgba(22,139,255,0.18)",
              background: "#0C1C35",
              color: "#EFF7FF",
              fontSize: 12,
            }}
            formatter={(value) => [
              `${value > 0 ? "+" : ""}${value} pts`,
              "Impact",
            ]}
          />
          <ReferenceLine x={0} stroke="#1a2540" />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.value >= 0 ? "#10b981" : "#ef4444"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {factors.map((f, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span
              className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                f.direction === "positive" ? "bg-emerald-400" : "bg-red-400"
              }`}
            />
            <span className="text-[#94A8C2]">{f.plain_english}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
