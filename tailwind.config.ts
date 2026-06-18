import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Charcoal-black + deep midnight-navy background scale.
        pitch: {
          950: "#05070d", // near-black charcoal
          900: "#0a0f1c", // midnight navy
          850: "#0e1424", // raised navy (cards/base)
          800: "#121a2e", // panels
          700: "#1b2540", // borders / hovers
          600: "#27324f",
        },
        // Electric blue — primary accent for CTAs, odds, focus.
        accent: {
          DEFAULT: "#3b82f6",
          soft: "#60a5fa",
          deep: "#2563eb",
        },
        // Restrained gold — secondary accent for winnings/premium highlights.
        gold: {
          DEFAULT: "#cba24a",
          soft: "#e3c878",
        },
        // Directional colours for the odds up/down arrows.
        up: "#22c55e",
        down: "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(59,130,246,0.25), 0 8px 30px -8px rgba(59,130,246,0.45)",
        "glow-gold": "0 0 0 1px rgba(203,162,74,0.25), 0 8px 30px -10px rgba(203,162,74,0.35)",
        glass: "0 10px 40px -12px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.05)",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scorePop: {
          "0%": { transform: "scale(1)" },
          "35%": { transform: "scale(1.45)", color: "#e3c878" },
          "100%": { transform: "scale(1)" },
        },
        oddsFlash: {
          "0%": { backgroundColor: "rgba(59,130,246,0.0)" },
          "30%": { backgroundColor: "rgba(59,130,246,0.18)" },
          "100%": { backgroundColor: "rgba(59,130,246,0.0)" },
        },
        livePulse: {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.85)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.4s ease-out",
        slideUp: "slideUp 0.35s ease-out",
        scorePop: "scorePop 0.6s ease-out",
        oddsFlash: "oddsFlash 1.2s ease-out",
        livePulse: "livePulse 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
