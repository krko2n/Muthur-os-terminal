/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'muthur-bg': '#000000',
        'muthur-primary': '#00ff41',
        'muthur-secondary': '#00d4ff',
        'muthur-accent': '#ff006e',
        'muthur-border': '#0a3622',
        'muthur-panel': '#0a1612',
      },
      fontFamily: {
        'mono': ['"Courier New"', 'monospace'],
        'tech': ['"Share Tech Mono"', 'monospace'],
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.96' },
        },
      },
    },
  },
  plugins: [],
}
