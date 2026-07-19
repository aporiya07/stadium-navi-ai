export const theme = {
  colors: {
    fifaBlue: '#004B87',
    fifaBlueDark: '#003A6B',
    fifaBlueLight: '#E8F1FA',
    neutral: {
      50: '#F5F5F5',
      100: '#F0F0F0',
      200: '#E0E0E0',
      300: '#D0D0D0',
      400: '#A0A0A0',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    alert: {
      red: '#D32F2F',
      redLight: '#FEF2F2',
      amber: '#F57F17',
      amberLight: '#FEF9E7',
      green: '#2E7D32',
      greenLight: '#F0FDF4',
    },
    occupancy: {
      low: '#2E7D32',
      medium: '#F57F17',
      high: '#F57F17',
      critical: '#D32F2F',
    },
  },
  fonts: {
    sans: 'Inter, system-ui, sans-serif',
    heading: 'Space Grotesk, system-ui, sans-serif',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
}

export type Theme = typeof theme