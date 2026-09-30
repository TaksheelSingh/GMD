/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#090d16',
          900: '#0f172a',
          850: '#131c31',
          800: '#1e293b',
          700: '#334155',
        },
        brand: {
          500: '#6366f1',
          600: '#4f46e5',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-red': 'glowRed 2s ease-in-out infinite alternate',
        'glow-green': 'glowGreen 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glowRed: {
          '0%': { boxShadow: '0 0 5px rgba(239, 68, 68, 0.4)' },
          '100%': { boxShadow: '0 0 15px rgba(239, 68, 68, 0.8)' },
        },
        glowGreen: {
          '0%': { boxShadow: '0 0 5px rgba(34, 197, 94, 0.4)' },
          '100%': { boxShadow: '0 0 15px rgba(34, 197, 94, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
