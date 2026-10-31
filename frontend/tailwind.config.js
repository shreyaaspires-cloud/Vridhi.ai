/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
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
        // --- Semantic CSS variable mappings ---
        theme: {
          bg:         "var(--bg-page)",
          "bg-soft":  "var(--bg-page-soft)",
          surface:    "var(--surface-primary)",
          "surface-sub": "var(--surface-secondary)",
          elevated:   "var(--surface-elevated)",
          border:     "var(--border-default)",
          text:       "var(--text-primary)",
          muted:      "var(--text-muted)",
          brand:      "var(--brand-primary)",
          emerald:    "var(--brand-emerald)",
        },
        // --- Dynamic midnight mapping to semantic surface variables ---
        midnight: {
          DEFAULT: "var(--midnight)",
          50:  "var(--midnight-50)",
          100: "var(--midnight-100)",
          200: "var(--midnight-200)",
          300: "var(--midnight-300)",
          400: "var(--midnight-400)",
        },
        electric: {
          DEFAULT: "var(--electric)",
          dim:    "var(--brand-emerald-dim)",
          muted:  "rgba(40, 118, 87, 0.15)",
        },
        cyan: {
          DEFAULT: "var(--cyan)",
          muted:  "rgba(22, 61, 50, 0.15)",
        },
        ink: {
          white:  "var(--ink-white)",
          mid:    "var(--ink-mid)",
          dim:    "var(--ink-dim)",
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
      boxShadow: {
        "glass":    "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.1)",
        "glass-lg": "0 8px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.15)",
        "electric": "0 0 0 1px rgba(40, 118, 87, 0.35), 0 4px 20px rgba(40, 118, 87, 0.12)",
      },
      keyframes: {
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up":    "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
