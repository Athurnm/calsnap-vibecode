import { useLanguage } from '../context/LanguageContextCore';

export function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-full inline-flex relative">
            <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 ${language === 'en'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                aria-label="Switch to English"
            >
                EN
            </button>
            <button
                onClick={() => setLanguage('id')}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all duration-200 ${language === 'id'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                aria-label="Switch to Bahasa Indonesia"
            >
                ID
            </button>
        </div>
    );
}
