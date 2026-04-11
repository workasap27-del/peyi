import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette Péyi — inspirée de la Guadeloupe
        peyi: {
          green:  '#1a7a4a',  // mangrove
          teal:   '#0d9488',  // mer des Caraïbes
          gold:   '#f59e0b',  // soleil
          red:    '#dc2626',  // flamboyant
          blue:   '#1d4ed8',  // ciel
          sand:   '#fef3c7',  // sable
          dark:   '#1c1917',  // terre
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
