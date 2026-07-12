/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0e17',
          card: '#131826',
          elevated: '#1a2032',
          hover: '#222a3d',
        },
        border: {
          DEFAULT: '#2a3245',
          subtle: '#1f2638',
          accent: '#3b4561',
        },
        brand: {
          50: '#eafbf3',
          100: '#cef6df',
          200: '#92e9bf',
          300: '#56dca0',
          400: '#2bbf7f',
          500: '#16c474',
          600: '#0fa563',
          700: '#0c8452',
          800: '#0a6740',
          900: '#08513a',
        },
        gold: {
          400: '#f5c451',
          500: '#e8a838',
          600: '#cf8a1f',
        },
        danger: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        muted: '#8b95a8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: { '0%,100%': { boxShadow: '0 0 20px rgba(22,196,116,0.3)' }, '50%': { boxShadow: '0 0 40px rgba(22,196,116,0.6)' } },
        shimmer: { '0%': { backgroundPosition: '-1000px 0' }, '100%': { backgroundPosition: '1000px 0' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(42,50,69,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(42,50,69,0.3) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};
