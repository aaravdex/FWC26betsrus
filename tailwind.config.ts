import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          950: "#020617",
          900: "#0b1220",
          850: "#0f1a2e",
          800: "#13203a",
          700: "#1c2c4d",
          600: "#26395f",
        },
        accent: {
          DEFAULT: "#22c55e",
          soft: "#16a34a",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
