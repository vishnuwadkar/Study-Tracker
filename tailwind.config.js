/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 👈 This line enables the manual dark mode toggle
  theme: {
    extend: {},
  },
  plugins: [],
}