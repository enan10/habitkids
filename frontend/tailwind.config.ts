import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kids: {
          red:    '#FF6B6B',
          orange: '#FF9F43',
          yellow: '#FECA57',
          green:  '#48DBFB',
          teal:   '#1DD1A1',
          blue:   '#54A0FF',
          purple: '#5F27CD',
          pink:   '#FF9FF3',
        },
      },
      fontFamily: {
        kids: ['"Nunito"', 'sans-serif'],
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%':       { transform: 'rotate(3deg)' },
        },
        pop: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '70%':  { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
      },
      animation: {
        wiggle:       'wiggle 0.5s ease-in-out',
        pop:          'pop 0.3s ease-out',
        'bounce-slow':'bounce 2s infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
