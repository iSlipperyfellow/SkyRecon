/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0efff',
          200: '#bae3ff',
          300: '#7ccfff',
          400: '#36bbff',
          500: '#0ba5ec',
          600: '#0091d5',
          700: '#0074ac',
          800: '#005a8d',
          900: '#004873',
          950: '#002d4d',
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ede9ff',
          200: '#ddd3ff',
          300: '#c7b1ff',
          400: '#ad7fff',
          500: '#9355ff',
          600: '#8939f5',
          700: '#7c24db',
          800: '#681bb7',
          900: '#581794',
          950: '#3a0f7d',
        },
        accent: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        slideIn: 'slideIn 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
