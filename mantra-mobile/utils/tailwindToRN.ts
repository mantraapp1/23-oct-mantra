// Utility functions to convert Tailwind CSS classes to React Native styles

import { ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../constants';

/**
 * Converts Tailwind padding classes to React Native styles
 * Example: 'px-4 py-2' → { paddingHorizontal: 16, paddingVertical: 8 }
 */
export const convertPadding = (tailwindClass: string): ViewStyle => {
  const styles: ViewStyle = {};

  const paddingMap: Record<string, keyof ViewStyle> = {
    'p-': 'padding',
    'px-': 'paddingHorizontal',
    'py-': 'paddingVertical',
    'pt-': 'paddingTop',
    'pb-': 'paddingBottom',
    'pl-': 'paddingLeft',
    'pr-': 'paddingRight',
  };

  Object.entries(paddingMap).forEach(([prefix, property]) => {
    const match = tailwindClass.match(new RegExp(`${prefix}(\\d+\\.?\\d*)`));
    if (match) {
      const value = parseFloat(match[1]);
      (styles as any)[property] = spacing[value as keyof typeof spacing] || value * 4;
    }
  });

  return styles;
};

/**
 * Converts Tailwind margin classes to React Native styles
 * Example: 'mx-4 my-2' → { marginHorizontal: 16, marginVertical: 8 }
 */
export const convertMargin = (tailwindClass: string): ViewStyle => {
  const styles: ViewStyle = {};

  const marginMap: Record<string, keyof ViewStyle> = {
    'm-': 'margin',
    'mx-': 'marginHorizontal',
    'my-': 'marginVertical',
    'mt-': 'marginTop',
    'mb-': 'marginBottom',
    'ml-': 'marginLeft',
    'mr-': 'marginRight',
  };

  Object.entries(marginMap).forEach(([prefix, property]) => {
    const match = tailwindClass.match(new RegExp(`${prefix}(\\d+\\.?\\d*)`));
    if (match) {
      const value = parseFloat(match[1]);
      (styles as any)[property] = spacing[value as keyof typeof spacing] || value * 4;
    }
  });

  return styles;
};

/**
 * Converts Tailwind rounded classes to React Native borderRadius
 * Example: 'rounded-xl' → { borderRadius: 12 }
 */
export const convertBorderRadius = (tailwindClass: string): ViewStyle => {
  const match = tailwindClass.match(/rounded-(\w+)/);
  if (!match) return {};

  const size = match[1];
  return {
    borderRadius: borderRadius[size as keyof typeof borderRadius] || borderRadius.DEFAULT
  };
};

/**
 * Converts Tailwind text color classes to React Native color
 * Example: 'text-sky-600' → '#0284c7'
 */
export const convertTextColor = (tailwindClass: string): string => {
  const match = tailwindClass.match(/text-(\w+)-(\d+)/);
  if (!match) return colors.slate900;

  const [, colorName, shade] = match;
  const colorKey = `${colorName}${shade}` as keyof typeof colors;
  return colors[colorKey] || colors.slate900;
};

/**
 * Converts Tailwind background color classes to React Native color
 * Example: 'bg-sky-500' → '#0ea5e9'
 */
export const convertBackgroundColor = (tailwindClass: string): string => {
  const match = tailwindClass.match(/bg-(\w+)-(\d+)/);
  if (!match) return colors.white;

  const [, colorName, shade] = match;
  const colorKey = `${colorName}${shade}` as keyof typeof colors;
  return colors[colorKey] || colors.white;
};

/**
 * Converts Tailwind border color classes to React Native color
 * Example: 'border-slate-200' → '#e2e8f0'
 */
export const convertBorderColor = (tailwindClass: string): string => {
  const match = tailwindClass.match(/border-(\w+)-(\d+)/);
  if (!match) return colors.slate200;

  const [, colorName, shade] = match;
  const colorKey = `${colorName}${shade}` as keyof typeof colors;
  return colors[colorKey] || colors.slate200;
};

/**
 * Converts Tailwind shadow classes to React Native shadow styles
 * Example: 'shadow-sm' → { shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation }
 */
export const convertShadow = (tailwindClass: string): ViewStyle => {
  if (tailwindClass.includes('shadow-sm')) {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    };
  }

  if (tailwindClass.includes('shadow-md')) {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    };
  }

  if (tailwindClass.includes('shadow-lg')) {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    };
  }

  if (tailwindClass.includes('shadow')) {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    };
  }

  return {};
};

/**
 * Converts Tailwind font size classes to React Native fontSize
 * Example: 'text-sm' → 14
 */
export const convertFontSize = (tailwindClass: string): number => {
  const match = tailwindClass.match(/text-(\w+)/);
  if (!match) return typography.fontSize.base;

  const size = match[1];
  return typography.fontSize[size as keyof typeof typography.fontSize] || typography.fontSize.base;
};

/**
 * Converts Tailwind font weight classes to React Native fontWeight
 * Example: 'font-semibold' → '600'
 */
export const convertFontWeight = (tailwindClass: string): TextStyle['fontWeight'] => {
  const match = tailwindClass.match(/font-(\w+)/);
  if (!match) return typography.fontWeight.normal;

  const weight = match[1];
  return typography.fontWeight[weight as keyof typeof typography.fontWeight] || typography.fontWeight.normal;
};

/**
 * Converts Tailwind gap classes to React Native gap
 * Example: 'gap-3' → 12
 */
export const convertGap = (tailwindClass: string): number => {
  const match = tailwindClass.match(/gap-(\d+\.?\d*)/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  return spacing[value as keyof typeof spacing] || value * 4;
};

/**
 * Converts Tailwind width classes to React Native width
 * Example: 'w-36' → 144
 */
export const convertWidth = (tailwindClass: string): number | string => {
  // Handle numeric widths
  const numMatch = tailwindClass.match(/w-(\d+)/);
  if (numMatch) {
    const value = parseInt(numMatch[1]);
    return spacing[value as keyof typeof spacing] || value * 4;
  }

  // Handle percentage widths
  if (tailwindClass.includes('w-full')) return '100%';
  if (tailwindClass.includes('w-1/2')) return '50%';
  if (tailwindClass.includes('w-1/3')) return '33.333%';
  if (tailwindClass.includes('w-2/3')) return '66.666%';
  if (tailwindClass.includes('w-1/4')) return '25%';
  if (tailwindClass.includes('w-3/4')) return '75%';

  return 'auto';
};

/**
 * Converts Tailwind height classes to React Native height
 * Example: 'h-48' → 192
 */
export const convertHeight = (tailwindClass: string): number | string => {
  // Handle numeric heights
  const numMatch = tailwindClass.match(/h-(\d+)/);
  if (numMatch) {
    const value = parseInt(numMatch[1]);
    return spacing[value as keyof typeof spacing] || value * 4;
  }

  // Handle percentage heights
  if (tailwindClass.includes('h-full')) return '100%';
  if (tailwindClass.includes('h-screen')) return '100%';

  return 'auto';
};
