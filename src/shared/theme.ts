// Design tokens shared across all modules (see docs/01-architecture.md §2.5).
// Mirrors the CSS custom properties defined in src/index.css's @theme block —
// use this when a token is needed from TypeScript (e.g. inline chart colors).
export const theme = {
  colors: {
    accent: '#6C63FF',
    accentDark: '#5a52e0',
    accentLight: '#EEF2FF',
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E5E7EB',
    borderHover: '#C4B5FD',
    borderFocus: '#6C63FF',
    text: '#111827',
    textSub: '#6B7280',
    textLight: '#9CA3AF',
    error: '#EF4444',
    errorBg: '#FEF2F2',
    warn: '#D97706',
    warnBg: '#FFFBEB',
    info: '#2563EB',
    infoBg: '#EFF6FF',
    success: '#10B981',
  },
  radius: {
    lg: '14px',
    md: '8px',
    sm: '6px',
  },
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.04)',
    md: '0 4px 20px rgba(0,0,0,.07), 0 2px 8px rgba(0,0,0,.04)',
    lg: '0 10px 40px rgba(0,0,0,.10), 0 4px 16px rgba(0,0,0,.06)',
  },
} as const

export const APP_NAME = 'LaTeX Research Toolkit'
