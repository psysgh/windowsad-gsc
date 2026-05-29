import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0a0e14",
        panel: "#111722",
        panel2: "#0d1320",
        border: "#1f2a3d",
        accent: "#5eead4",
        accent2: "#38bdf8",
        warn: "#fbbf24",
        danger: "#f87171",
        ok: "#4ade80",
        muted: "#64748b",
        text: "#e2e8f0"
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
