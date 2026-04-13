/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        valo: {
          red: '#E84040',
          'red-dark': '#C0392B',
          dark: '#0B0B0B',
          'dark-2': '#111111',
          'dark-3': '#1A1A1A',
          card: '#0F0F0F',
          border: '#1E1E1E',
          accent: '#E84040',
          gold: '#F5A623',
          teal: '#00D4AA',
        },
      },
      fontFamily: {
        hero: ['"Anton"', 'sans-serif'],
        display: ['"Rajdhani"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.35s ease-out',
        'pulse-red': 'pulseRed 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(24px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseRed: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
        glow: { from: { boxShadow: '0 0 8px #E84040' }, to: { boxShadow: '0 0 20px #E84040, 0 0 40px #E8404040' } },
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231E1E1E' fill-opacity='0.6'%3E%3Cpath d='M0 0h1v40H0zm39 0h1v40h-1zM0 0v1h40V0zM0 39v1h40v-1z'/%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
