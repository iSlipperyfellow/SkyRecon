/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f9f5ff',
          100: '#f3ebff',
          200: '#e7d7ff',
          300: '#d4b5ff',
          400: '#b88eff',
          500: '#9d5dff',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2d0f5a',
        },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c3d6e',
          950: '#051e3e',
        },
        accent: '#10b981',
      },
      fontFamily: {
        sans: ['Sohne', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(157, 93, 255, 0.3)',
        'glow-sm': '0 0 10px rgba(157, 93, 255, 0.2)',
        'glow-lg': '0 0 30px rgba(157, 93, 255, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
