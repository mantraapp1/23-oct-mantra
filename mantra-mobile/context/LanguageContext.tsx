import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import profileService from '../services/profileService';

const LANGUAGE_KEY = 'mantra_preferred_language';

interface LanguageContextType {
    language: string;
    setLanguage: (lang: string) => Promise<void>;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'All',
    setLanguage: async () => { },
    isLoading: true,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState('All');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            // 1. Try to get from local storage first for speed
            const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
            if (savedLang) {
                setLanguageState(savedLang);
            }

            // 2. Then sync with profile if logged in
            const user = await authService.getCurrentUser();
            if (user) {
                const profile = await profileService.getProfile(user.id);
                if (profile?.preferred_language) {
                    setLanguageState(profile.preferred_language);
                    await AsyncStorage.setItem(LANGUAGE_KEY, profile.preferred_language);
                }
            }
        } catch (error) {
            console.error('Error loading language in context:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setLanguage = async (newLang: string) => {
        setLanguageState(newLang);
        try {
            // 1. Save to local storage
            await AsyncStorage.setItem(LANGUAGE_KEY, newLang);

            // 2. Update profile if logged in
            const user = await authService.getCurrentUser();
            if (user) {
                await profileService.updateProfile(user.id, {
                    preferred_language: newLang,
                });
            }
        } catch (error) {
            console.error('Error saving language in context:', error);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
