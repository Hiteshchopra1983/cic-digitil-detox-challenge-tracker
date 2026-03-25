/** @type {import('tailwindcss').Config} */
export default {

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: "#0F5C4D",
        primaryLight: "#1E8E6E",
        accent: "#1F4EA3",
        background: "#F7F9F8",
        textMain: "#1F2937"
      }
    }
  },

  plugins: [],

}