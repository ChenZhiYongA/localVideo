/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        yt: {
          bg: "var(--yt-bg)",
          surface: "var(--yt-surface)",
          "surface-2": "var(--yt-surface-2)",
          "surface-3": "var(--yt-surface-3)",
          text: "var(--yt-text)",
          "text-2": "var(--yt-text-2)",
          "text-3": "var(--yt-text-3)",
          red: "var(--yt-red)",
          "red-dark": "var(--yt-red-dark)",
          accent: "var(--yt-accent)",
          border: "var(--yt-border)",
          hover: "var(--yt-hover)",
        },
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
