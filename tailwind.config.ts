import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: { DEFAULT: "#FBF8F1", 2: "#F4EEE1", 3: "#EFE7D6" },
        ink: { DEFAULT: "#242019", soft: "#5a5346", faint: "#8a8069" },
        muted: "#9a9080",
        gold: {
          1: "#EAD79A",
          DEFAULT: "#C9A24B",
          2: "#C9A24B",
          3: "#A9812F",
          deep: "#8a6a25",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Jost"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      backgroundImage: {
        "gold-grad": "linear-gradient(135deg,#EAD79A 0%,#C9A24B 45%,#A9812F 100%)",
        "gold-sheen":
          "linear-gradient(105deg,#A9812F 0%,#EAD79A 45%,#C9A24B 55%,#A9812F 100%)",
      },
      letterSpacing: { luxe: "0.24em", wide2: "0.32em" },
      boxShadow: {
        soft: "0 10px 40px -20px rgba(120,90,30,0.35)",
        lift: "0 22px 60px -28px rgba(120,90,30,0.45)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up .7s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in .6s ease both",
        marquee: "marquee 28s linear infinite",
        "toast-in": "toast-in .3s cubic-bezier(.2,.7,.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
