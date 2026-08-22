/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f3ff',
          100: '#e4ebff',
          200: '#cdd9ff',
          300: '#abbdff',
          400: '#8297ff',
          500: '#5c6cff',
          600: '#4349f9',
          700: '#3535e2',
          800: '#2b2ab6',
          900: '#282991',
          950: '#181754',
        }
      }
    },
  },
  plugins: [],
}
