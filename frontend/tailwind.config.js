module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // Slate 900
        surface: '#1e293b',    // Slate 800
        surfaceHighlight: '#334155', // Slate 700
        primary: '#3b82f6',    // Blue 500
        secondary: '#64748b',  // Slate 500
        success: '#10b981',    // Emerald 500
        warning: '#f59e0b',    // Amber 500
        danger: '#ef4444',     // Red 500
        info: '#0ea5e9',       // Sky 500
        text: '#f8fafc',       // Slate 50
        textMuted: '#94a3b8',  // Slate 400
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
