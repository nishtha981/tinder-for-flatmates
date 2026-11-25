/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // The two brand colours
        coral: { DEFAULT: "#FE5550", tint: "#FFE3E1" },
        violet: { DEFAULT: "#6547CA", tint: "#E7E0FB" },
        // Neutrals
        ink: "#16131F", // outlines, text, hard shadows
        paper: "#F6F2FF", // page background (grid paper)
      },
      fontFamily: {
        sans: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        brut: "4px 4px 0 0 #16131F",
        "brut-sm": "2px 2px 0 0 #16131F",
        "brut-lg": "6px 6px 0 0 #16131F",
      },
    },
  },
  plugins: [],
};
