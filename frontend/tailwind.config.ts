import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Surfaces (layered depth) ──────────────────────────────
        canvas:    '#0D1117',   // page background
        surface:   '#161B22',   // cards / panels
        surface2:  '#21262D',   // elevated rows, inputs, code blocks
        surface3:  '#2D333B',   // hover states, tertiary elements

        // ── Borders ───────────────────────────────────────────────
        border:    { DEFAULT: '#30363D', light: '#444C56' },

        // ── Text — all WCAG AA on #161B22 ─────────────────────────
        text: {
          primary:   '#E6EDF3',  // 12.6:1 on canvas ✅
          secondary: '#8B949E',  //  4.6:1 on canvas ✅
          muted:     '#6E7681',  //  3.1:1 on canvas (for large text) ✅
          link:      '#58A6FF',
        },

        // ── Brand accent (FIFA neon cyan) ─────────────────────────
        accent: {
          DEFAULT: '#00D4FF',
          dim:     'rgba(0,212,255,0.12)',
          hover:   '#33DCFF',
          muted:   '#0EA5C9',
        },

        // ── Status colours ────────────────────────────────────────
        status: {
          ok:      '#3FB950',  // green — 4.5:1 on surface ✅
          warn:    '#D29922',  // amber — 4.5:1 on surface ✅
          danger:  '#F85149',  // red   — 4.5:1 on surface ✅
          info:    '#58A6FF',  // blue  — 4.5:1 on surface ✅
          purple:  '#BC8CFF',  // purple
        },
      },

      fontFamily: {
        sans:    ['Outfit', 'system-ui', 'sans-serif'],
        heading: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },

      animation: {
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-up':   'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow':       'glow 2s ease-in-out infinite alternate',
      },

      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%':   { boxShadow: '0 0 8px rgba(0,212,255,0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0,212,255,0.5)' },
        },
      },

      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.2)',
        modal:  '0 8px 32px rgba(0,0,0,0.6)',
        accent: '0 0 16px rgba(0,212,255,0.3)',
      },
    },
  },
  plugins: [],
}

export default config