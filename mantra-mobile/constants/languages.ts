export interface Language {
    code: string;
    label: string;
    native: string;
}

export const LANGUAGES: Language[] = [
    { code: 'All', label: 'All Languages', native: 'All' },
    { code: 'English', label: 'English', native: 'English' },
    { code: 'Hindi', label: 'Hindi', native: 'हिन्दी' },
    { code: 'Spanish', label: 'Spanish', native: 'Español' },
    { code: 'French', label: 'French', native: 'Français' },
    { code: 'Chinese', label: 'Chinese', native: '中文' },
    { code: 'Arabic', label: 'Arabic', native: 'العربية' },
    { code: 'Bengali', label: 'Bengali', native: 'বাংলা' },
    { code: 'Japanese', label: 'Japanese', native: '日本語' },
    { code: 'Korean', label: 'Korean', native: '한국어' },
    { code: 'German', label: 'German', native: 'Deutsch' },
    { code: 'Russian', label: 'Russian', native: 'Русский' },
    { code: 'Portuguese', label: 'Portuguese', native: 'Português' },
    { code: 'Italian', label: 'Italian', native: 'Italiano' },
    { code: 'Vietnamese', label: 'Vietnamese', native: 'Tiếng Việt' },
    { code: 'Turkish', label: 'Turkish', native: 'Türkçe' },
    { code: 'Indonesian', label: 'Indonesian', native: 'Bahasa Indonesia' },
    { code: 'Thai', label: 'Thai', native: 'ไทย' },
    { code: 'Telugu', label: 'Telugu', native: 'తెలుగు' },
    { code: 'Marathi', label: 'Marathi', native: 'मराठी' },
    { code: 'Tamil', label: 'Tamil', native: 'தமிழ்' },
    { code: 'Gujarati', label: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'Kannada', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'Malayalam', label: 'Malayalam', native: 'മലയാളം' },
    { code: 'Punjabi', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
];
