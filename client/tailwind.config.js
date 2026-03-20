/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'delta-blue': '#1448A8',
        'delta-green': '#90B548',
        'delta-dark': '#1A1A1A',
        'delta-gray': '#F3F4F6',
      },
    },
  },
  plugins: [],
}