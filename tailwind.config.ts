import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F6F2E6",
        paper: "#FBF9F3",
        forest: { DEFAULT: "#17301F", 2: "#0F2417" },
        green: { DEFAULT: "#2F6B3F", light: "#5C9A55", 50: "#EAF3E7" },
        gold: { DEFAULT: "#C99A3D", light: "#E4C078" },
        clay: { DEFAULT: "#7A5738", light: "#A9835C" },
        ink: "#221D16",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "16px",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        marquee: "marquee 46s linear infinite",
        "marquee-reverse": "marquee-reverse 54s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
