/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a8a', // Dark Navy
        accent: '#3b82f6', // Blue
        success: '#10b981', // Green
        danger: '#ef4444', // Red
        bgLight: '#f3f4f6', // Light Gray
      }
    },
  },
  plugins: [],
}
