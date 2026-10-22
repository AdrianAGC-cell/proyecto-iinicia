/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        iinicia: {
          50: '#f0f9fd',
          100: '#e0f3fb',
          200: '#b9e6f7',
          300: '#7dd3f1',
          400: '#38bce9',
          500: '#22abe2', // EXACT OFFICIAL LOGO CYAN BLUE
          600: '#148ebf',
          700: '#11719b',
          800: '#125f81',
          900: '#144f6b',
          950: '#0d3246',
        },
        brandCyan: {
          light: '#e0f3fb',
          DEFAULT: '#22abe2',
          hover: '#1b9ad0',
          dark: '#148ebf',
        },
        brandBlack: {
          DEFAULT: '#000000',
          soft: '#111827',
          card: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
