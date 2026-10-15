"use client";

import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

function getGaugeColor(score) {
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

export default function ScoreGauge({ score, label }) {
  const color = getGaugeColor(score);
  const data = [{ name: "score", value: score, fill: color }];

  return (
    <div className="glass-panel rounded-xl p-6 flex flex-col items-center">
      <h3 className="text-sm font-semibold text-[#94A8C2] mb-2 self-start">
        Credit Risk Score
      </h3>
      <div className="relative w-48 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar
              background={{ fill: "#1a2540" }}
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold font-display" style={{ color }}>
            {score}
          </span>
          <span className="text-xs text-[#4A6080] mt-1">out of 100</span>
        </div>
      </div>
      {label && (
        <div
          className="mt-3 px-4 py-1.5 rounded-full text-sm font-semibold"
          style={{
            backgroundColor: color + "22",
            color: color,
            border: `1px solid ${color}40`,
          }}
        >
          {label} RISK
        </div>
      )}
    </div>
  );
}
