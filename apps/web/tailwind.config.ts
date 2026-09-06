import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0C1829",
          light: "#182C48",
          muted: "#4A5568",
          subtle: "#8A99AD",
        },
        paper: {
          DEFAULT: "#F0EFEA",
          sheet: "#FAFAF7",
          card: "#FFFFFF",
          sub: "#E8E6DF",
        },
        teal: {
          DEFAULT: "#0D6E6E",
          light: "#128B8B",
          dark: "#095454",
          tint: "#E6F4F4",
        },
        gold: {
          DEFAULT: "#B87B28",
          light: "#CD8E38",
          dark: "#9E671D",
          tint: "#FDF8EE",
        },
        orange: {
          DEFAULT: "#B87B28",
          light: "#CD8E38",
        },
        navy: {
          DEFAULT: "#0C1829",
          light: "#182C48",
        },
        rose: {
          DEFAULT: "#B33939",
          light: "#C94848",
          dark: "#962828",
          tint: "#FDEEEE",
        },
        line: {
          DEFAULT: "#DDD9CF",
          subtle: "#EAE7DF",
          dark: "#C4BFB4",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Lora", "Georgia", "serif"],
        sans: ["var(--font-sans)", "IBM Plex Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(12, 24, 41, 0.04), 0 1px 3px 0 rgba(12, 24, 41, 0.02)",
        ledger: "0 1px 3px 0 rgba(12, 24, 41, 0.06), 0 1px 2px -1px rgba(12, 24, 41, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
