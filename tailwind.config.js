/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,ejs}"],
  theme: {
    extend: {
      gridTemplateColumns: {
        2: "repeat(2, minmax(0, 1fr));",
      },
      gridTemplateRows: {
        2: "repeat(2, minmax(0, 1fr));",
      },
      keyframes: {
        opacityAnimation: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        opacityAnimation: "opacityAnimation 0.2s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animated"), require("tailwind-fontawesome")],
  darkMode: "class",
};
