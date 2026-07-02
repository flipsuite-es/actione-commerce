import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: { DEFAULT: "#FBF8F1", 2: "#F4EEE1" },
        ink: { DEFAULT: "#2b2620", soft: "#5a5346" },
        muted: "#8a8069",
        gold: { 1: "#E7CE93", DEFAULT: "#C9A24B", 2: "#C9A24B", 3: "#A9812F" },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Jost"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      backgroundImage: {
        "gold-grad":
          "linear-gradient(135deg,#E7CE93 0%,#C9A24B 45%,#A9812F 100%)",
      },
      letterSpacing: {
        luxe: "0.24em",
      },
    },
  },
  plugins: [],
};

export default config;
