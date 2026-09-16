export const COLORS = {
  primary: '#0284c7',
  primaryDark: '#0369a1',
  primaryLight: '#e0f2fe',
  navy: '#0f172a',
  navyLight: '#1e293b',
  blue: '#0284c7',
  blueLight: '#e0f2fe',
  indigo: '#4f46e5',
  amber: '#d97706',
  amberLight: '#fef3c7',
  danger: '#e11d48',
  dangerLight: '#ffe4e6',
  success: '#10b981',
  successDark: '#047857',
  successLight: '#d1fae5',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  background: '#f1f5f9',
  text: '#0f172a',
  textSecond: '#475569',
  textMuted: '#64748b',
  border: '#e2e8f0',
  accent: '#4f46e5',
  cyan: '#06b6d4',
  purple: '#a855f7',
  badge: '#f43f5e',
}

export const GRADIENT = {
  avatar: ['#6366f1', '#a855f7'],
  active: ['#06b6d4', '#6366f1'],
  statBlue: ['#3b82f6', '#22d3ee'],
  statGreen: ['#34d399', '#14b8a6'],
  statRed: ['#f43f5e', '#fb923c'],
  statPurple: ['#6366f1', '#a855f7'],
}

export const TYPE = {
  h1: 28, h2: 22, h3: 18, body: 17, small: 15, caption: 13,
  residentH1: 36, residentH2: 26, residentBody: 22, residentMin: 22,
}

export const WEIGHT = {
  regular: '400', semibold: '600', bold: '700', heavy: '800', black: '900',
} as const

export const FONT = {
  regular: 'Geist-Regular',
  medium: 'Geist-Medium',
  semibold: 'Geist-SemiBold',
  bold: 'Geist-Bold',
  heavy: 'Geist-ExtraBold',
  black: 'Geist-Black',
} as const

export const TOUCH = { standard: 52, resident: 80 }

export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 }
export const SPACE = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }

export const SHADOW = {
  card: {
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
}
