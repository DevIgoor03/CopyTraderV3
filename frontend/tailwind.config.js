/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f7fee7',
          100: '#ecfccb',
          200: '#d9f99d',
          300: '#bef264',
          400: '#a3e635',
          500: '#84cc16',
          600: '#65a30d',
          700: '#4d7c0f',
        },
        sidebar: '#111827',
        'sidebar-hover': '#1f2937',
        'sidebar-active': '#374151',
        canvas: '#f0f2f7',
        'canvas-dark': '#0d0d0d',
      },
      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-dark':'0 1px 3px rgba(0,0,0,0.4),  0 4px 16px rgba(0,0,0,0.25)',
        'card-hover':'0 2px 6px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)',
        modal:      '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        'modal-dark':'0 8px 48px rgba(0,0,0,0.6), 0 2px 12px rgba(0,0,0,0.3)',
        'glow-brand':'0 0 20px rgba(132,204,22,0.25)',
        'inner-top': 'inset 0 1px 0 rgba(255,255,255,0.8)',
      },
      animation: {
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-up':  'slideUp 0.28s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':  'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        'pulse-dot': 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        scaleIn: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        pulseDot:{ '0%,100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
      },
    },
  },
  plugins: [],
};
