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
          border: "var(--yt-border)",
        },
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "system-ui", "sans-serif"],
      },
      gridTemplateColumns: {
        "media-sm": "repeat(2, minmax(0, 1fr))",
        "media-md": "repeat(3, minmax(0, 1fr))",
        "media-lg": "repeat(4, minmax(0, 1fr))",
        "media-xl": "repeat(5, minmax(0, 1fr))",
      },
    },
  },
  plugins: [],
};
