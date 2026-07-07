import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        x: { DEFAULT: "#f43f5e", light: "#fda4af" },
        o: { DEFAULT: "#3b82f6", light: "#93c5fd" },
      },
    },
  },
  plugins: [],
};

export default config;
