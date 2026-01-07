// Color palette matching Tailwind CSS colors from HTML designs

export const colors = {
  // Sky (Primary - used for buttons, links, active states)
  sky50: '#f0f9ff',
  sky100: '#e0f2fe',
  sky200: '#bae6fd',
  sky500: '#0ea5e9',
  sky600: '#0284c7',
  sky700: '#0369a1',
  
  // Slate (Neutral - used for text, borders, backgrounds)
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  
  // Emerald (Success - used for success states, new badges)
  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald700: '#047857',
  
  // Red (Error - used for error states, validation)
  red50: '#fef2f2',
  red100: '#fee2e2',
  red400: '#f87171',
  red500: '#ef4444',
  red600: '#dc2626',
  red700: '#b91c1c',
  
  // Amber (Warning - used for warning states)
  amber50: '#fffbeb',
  amber100: '#fef3c7',
  amber400: '#fbbf24',
  amber500: '#f59e0b',
  amber700: '#b45309',

  // Purple (Accent - used for special features)
  purple50: '#faf5ff',
  purple100: '#f3e8ff',
  purple500: '#a855f7',
  purple600: '#9333ea',
  purple700: '#7c3aed',
  
  // Base colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
};

// Semantic color aliases for easier usage
export const semanticColors = {
  primary: colors.sky500,
  primaryLight: colors.sky100,
  primaryDark: colors.sky700,
  
  text: colors.slate800,
  textLight: colors.slate500,
  textDark: colors.slate900,
  
  background: colors.white,
  backgroundLight: colors.slate50,
  
  border: colors.slate200,
  borderLight: colors.slate100,
  
  success: colors.emerald700,
  successLight: colors.emerald50,
  
  error: colors.red500,
  errorLight: colors.red400,
  
  warning: colors.amber500,
  warningLight: colors.amber50,
};
