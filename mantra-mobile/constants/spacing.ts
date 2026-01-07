// Spacing values matching Tailwind CSS spacing scale

export const spacing = {
  0: 0,
  0.5: 2,   // 0.125rem
  1: 4,     // 0.25rem
  1.5: 6,   // 0.375rem
  2: 8,     // 0.5rem
  2.5: 10,  // 0.625rem
  3: 12,    // 0.75rem
  3.5: 14,  // 0.875rem
  4: 16,    // 1rem
  5: 20,    // 1.25rem
  6: 24,    // 1.5rem
  7: 28,    // 1.75rem
  8: 32,    // 2rem
  9: 36,    // 2.25rem
  10: 40,   // 2.5rem
  11: 44,   // 2.75rem
  12: 48,   // 3rem
  14: 56,   // 3.5rem
  16: 64,   // 4rem
  20: 80,   // 5rem
  24: 96,   // 6rem
  28: 112,  // 7rem
  32: 128,  // 8rem
};

// Border radius values matching Tailwind CSS
export const borderRadius = {
  none: 0,
  sm: 2,
  DEFAULT: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};

// Helper functions for padding/margin
export const px = (value: keyof typeof spacing) => ({ 
  paddingHorizontal: spacing[value] 
});

export const py = (value: keyof typeof spacing) => ({ 
  paddingVertical: spacing[value] 
});

export const pt = (value: keyof typeof spacing) => ({ 
  paddingTop: spacing[value] 
});

export const pb = (value: keyof typeof spacing) => ({ 
  paddingBottom: spacing[value] 
});

export const pl = (value: keyof typeof spacing) => ({ 
  paddingLeft: spacing[value] 
});

export const pr = (value: keyof typeof spacing) => ({ 
  paddingRight: spacing[value] 
});

export const mx = (value: keyof typeof spacing) => ({ 
  marginHorizontal: spacing[value] 
});

export const my = (value: keyof typeof spacing) => ({ 
  marginVertical: spacing[value] 
});

export const mt = (value: keyof typeof spacing) => ({ 
  marginTop: spacing[value] 
});

export const mb = (value: keyof typeof spacing) => ({ 
  marginBottom: spacing[value] 
});

export const ml = (value: keyof typeof spacing) => ({ 
  marginLeft: spacing[value] 
});

export const mr = (value: keyof typeof spacing) => ({ 
  marginRight: spacing[value] 
});
