import type { Config } from "tailwindcss";

// Radhika's consistent navy / teal / orange design system, used across
// all her dashboards and documents.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0B1F3A", light: "#132C4F" },
        teal: { DEFAULT: "#0F9D9D", light: "#3FC1C1" },
        orange: { DEFAULT: "#F2994A", light: "#F7B076" },
      },
    },
  },
  plugins: [],
};
export default config;
