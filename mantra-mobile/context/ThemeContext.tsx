import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { ThemeColors, lightTheme, darkTheme } from '../constants/theme';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
    theme: ThemeColors;
    isDarkMode: boolean;
    themeType: ThemeType;
    toggleTheme: () => void;
    setTheme: (type: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: lightTheme,
    isDarkMode: false,
    themeType: 'light',
    toggleTheme: () => { },
    setTheme: () => { },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [themeType, setThemeType] = useState<ThemeType>('light');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        loadThemePersistence();
    }, []);

    const loadThemePersistence = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('mantra_theme');
            if (savedTheme) {
                setThemeType(savedTheme as ThemeType);
            } else if (systemColorScheme) {
                setThemeType(systemColorScheme as ThemeType);
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
        } finally {
            setIsLoaded(true);
        }
    };

    const toggleTheme = async () => {
        const newTheme = themeType === 'light' ? 'dark' : 'light';
        setThemeType(newTheme);
        try {
            await AsyncStorage.setItem('mantra_theme', newTheme);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    const setTheme = async (type: ThemeType) => {
        setThemeType(type);
        try {
            await AsyncStorage.setItem('mantra_theme', type);
        } catch (error) {
            console.error('Failed to save theme:', error);
        }
    };

    const theme = themeType === 'dark' ? darkTheme : lightTheme;

    if (!isLoaded) {
        return null; // Or a splash screen loader
    }

    return (
        <ThemeContext.Provider value={{ theme, isDarkMode: themeType === 'dark', themeType, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
