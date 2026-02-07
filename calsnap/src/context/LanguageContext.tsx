import { useState, type ReactNode } from 'react';
import { translations, type Language, type TranslationKey } from '../lib/translations';
import { LanguageContext } from './LanguageContextCore';

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>(() => {
        const savedLang = localStorage.getItem('calsnap_locale') as Language;
        if (savedLang && (savedLang === 'en' || savedLang === 'id')) {
            return savedLang;
        }
        if (typeof navigator !== 'undefined' && navigator.language.startsWith('id')) {
            return 'id';
        }
        return 'en';
    });

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('calsnap_locale', lang);
    };

    const t = (key: TranslationKey): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}
