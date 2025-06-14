// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // make sure you’re picking up ALL of your code, including popup:
    "./src/**/*.{html,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
};
