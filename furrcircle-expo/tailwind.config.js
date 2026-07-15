/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        coral: "#FF6B6B",
        sunshine: "#FFD93D",
        pinky: "#FF6FCF",
        success: "#4CAF50",
        primary: "#987D6B",
        skyBlue: "#87CEEB",
        surface: "#F7F8FA",
        foreground: "#1A1A2E",
      },
    },
  },
  plugins: [],
};
