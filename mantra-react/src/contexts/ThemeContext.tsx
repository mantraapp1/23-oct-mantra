import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

// ============================================
// Types
// ============================================

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

// ============================================
// Constants
// ============================================

const THEME_KEY = 'mantra-theme';

// ============================================
// Context
// ============================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

interface ThemeProviderProps {
    children: ReactNode;
    defaultTheme?: Theme;
}

export function ThemeProvider({ children, defaultTheme = 'system' }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') return defaultTheme;
        return (localStorage.getItem(THEME_KEY) as Theme) || defaultTheme;
    });

    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

    // Get system preference
    const getSystemTheme = useCallback((): 'light' | 'dark' => {
        if (typeof window === 'undefined') return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }, []);

    // Update resolved theme based on current setting
    const updateResolvedTheme = useCallback(() => {
        const resolved = theme === 'system' ? getSystemTheme() : theme;
        setResolvedTheme(resolved);

        // Apply to document
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolved);
    }, [theme, getSystemTheme]);

    // Set theme and persist
    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
    }, []);

    // Toggle between light and dark
    const toggleTheme = useCallback(() => {
        setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
    }, [resolvedTheme, setTheme]);

    // Apply theme on mount and changes
    useEffect(() => {
        updateResolvedTheme();
    }, [updateResolvedTheme]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
            if (theme === 'system') {
                updateResolvedTheme();
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, updateResolvedTheme]);

    const value: ThemeContextType = {
        theme,
        resolvedTheme,
        setTheme,
        toggleTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// ============================================
// Hook
// ============================================

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }

    return context;
}
