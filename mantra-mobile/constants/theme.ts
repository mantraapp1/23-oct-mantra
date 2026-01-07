import { colors } from './colors';

export interface ThemeColors {
    background: string;
    backgroundSecondary: string;
    card: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    primaryLight: string;
    error: string;
    success: string;
    inputBackground: string;
    tabBarBackground: string;
    tabBarActive: string;
    tabBarInactive: string;
    headerBackground: string;
    shadow: string;
}

export const lightTheme: ThemeColors = {
    background: colors.white,
    backgroundSecondary: colors.slate50,
    card: colors.white,
    text: colors.slate900,
    textSecondary: colors.slate500,
    border: colors.slate200,
    primary: colors.sky500,
    primaryLight: colors.sky50,
    error: colors.red500,
    success: colors.emerald600,
    inputBackground: colors.white,
    tabBarBackground: colors.white,
    tabBarActive: colors.sky500,
    tabBarInactive: colors.slate400,
    headerBackground: 'rgba(255, 255, 255, 0.85)',
    shadow: colors.black,
};

export const darkTheme: ThemeColors = {
    background: '#0f172a', // slate-900
    backgroundSecondary: '#1e293b', // slate-800
    card: '#1e293b', // slate-800
    text: '#f8fafc', // slate-50
    textSecondary: '#94a3b8', // slate-400
    border: '#334155', // slate-700
    primary: colors.sky500,
    primaryLight: 'rgba(14, 165, 233, 0.2)',
    error: colors.red400,
    success: colors.emerald500,
    inputBackground: '#334155', // slate-700
    tabBarBackground: '#1e293b', // slate-800
    tabBarActive: colors.sky500,
    tabBarInactive: colors.slate500,
    headerBackground: 'rgba(15, 23, 42, 0.85)',
    shadow: '#000000',
};
