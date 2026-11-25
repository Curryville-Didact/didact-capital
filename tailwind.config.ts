import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#F3F6FA",
          100: "#E3EAF3",
          700: "#1C3D64",
          800: "#142C49",
          900: "#0B1B33",
          950: "#071322",
        },
        gold: {
          100: "#F6EBD2",
          400: "#D7B56A",
          500: "#C4A15A",
          600: "#A6853E",
        },
        sand: {
          50: "#F7F5F1",
          100: "#EFEAE3",
          200: "#E4DCD0",
          300: "#D2C6B4",
        },
        ink: "#1B2430",
        mute: "#5C6775",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Segoe UI", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 18px 50px -24px rgba(7, 19, 34, 0.45)",
      },
      maxWidth: {
        page: "72rem",
      },
    },
  },
  plugins: [],
};

export default config;
