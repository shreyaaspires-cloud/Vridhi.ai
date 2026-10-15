/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/context/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Dark midnight palette ---
        midnight: {
          DEFAULT: "#070910",
          50:  "#0B1425",
          100: "#0C1C35",
          200: "#0E2244",
          300: "#1a2540",
          400: "#1e3158",
        },
        electric: {
          DEFAULT: "#168BFF",
          dim:    "#0E6CD4",
          muted:  "#168BFF26",
        },
        cyan: {
          DEFAULT: "#55D9FF",
          muted:  "#55D9FF20",
        },
        ink: {
          white:  "#EFF7FF",
          mid:    "#94A8C2",
          dim:    "#4A6080",
        },
        // --- Preserved original palette ---
        primary: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        accent: {
          50:  "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        // --- Semantic risk colors (untouched) ---
        risk: {
          low:    "#10b981",
          medium: "#f59e0b",
          high:   "#ef4444",
        },
      },
      fontFamily: {
        sans:     ["Inter", "system-ui", "sans-serif"],
        display:  ["'Space Grotesk'", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "hero-glow": "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(22,139,255,0.18) 0%, transparent 70%)",
        "card-sheen": "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)",
      },
      boxShadow: {
        "glass":    "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        "glass-lg": "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
        "electric": "0 0 0 1px rgba(22,139,255,0.35), 0 4px 20px rgba(22,139,255,0.12)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(22,139,255,0)" },
          "50%":      { boxShadow: "0 0 0 6px rgba(22,139,255,0.08)" },
        },
      },
      animation: {
        "fade-up":    "fade-up 0.5s ease-out both",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
