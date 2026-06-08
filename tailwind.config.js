/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'muthur-bg': '#05080d',
        'muthur-primary': '#00ff41',
        'muthur-secondary': '#aacfd1',
        'muthur-accent': '#ff006e',
        'muthur-border': 'rgba(0, 255, 65, 0.15)',
        'muthur-panel': '#05080d',
        'muthur-dim': 'rgba(0, 255, 65, 0.4)',
        'muthur-faint': 'rgba(0, 255, 65, 0.08)',
      },
      fontFamily: {
        'mono': ['"Share Tech Mono"', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
}
