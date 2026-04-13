/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pp: {
          orange: '#FF6B00',
          'orange-dark': '#E05E00',
          'orange-light': '#FFF3E8',
          bg: '#FAFAFA',
          surface: '#FFFFFF',
          border: '#E8E4DF',
          'input-bg': '#F5F2EE',
          'muted': '#6B6B6B',
          'subtle': '#9E9E9E',
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
        'pulse-orange': 'pulseOrange 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(24px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulseOrange: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
      },
    },
  },
  plugins: [],
};
