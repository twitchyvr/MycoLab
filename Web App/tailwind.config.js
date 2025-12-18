/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color extensions if needed
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        // Mycelium Navigation System animations
        'bioluminescence': 'bioluminescence 3s ease-in-out infinite',
        'spore-disperse': 'sporeDisperse 300ms ease-out forwards',
        'draw-thread': 'drawThread 500ms ease-out forwards',
        'fruiting': 'fruitingEmergence 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'hyphal-growth': 'hyphalGrowth 500ms ease-out forwards',
        'substrate-pulse': 'substratePulse 8s ease-in-out infinite',
        'thread-pulse': 'threadPulse 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(16, 185, 129, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.8)' },
        },
        // Mycelium Navigation System keyframes
        bioluminescence: {
          '0%, 100%': { opacity: '0.4', filter: 'blur(8px)' },
          '50%': { opacity: '0.8', filter: 'blur(12px)' },
        },
        sporeDisperse: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'scale(1) rotate(5deg)', opacity: '1' },
        },
        drawThread: {
          '0%': { strokeDashoffset: '100', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { strokeDashoffset: '0', opacity: '1' },
        },
        fruitingEmergence: {
          '0%': { transform: 'translateY(20px) scale(0.8)', opacity: '0' },
          '60%': { transform: 'translateY(-5px) scale(1.05)' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        hyphalGrowth: {
          '0%': { clipPath: 'circle(0% at center)', opacity: '0' },
          '100%': { clipPath: 'circle(100% at center)', opacity: '1' },
        },
        substratePulse: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        threadPulse: {
          '0%, 100%': { strokeOpacity: '0.3', strokeWidth: '1' },
          '50%': { strokeOpacity: '0.7', strokeWidth: '2' },
        },
      },
    },
  },
  plugins: [],
}
