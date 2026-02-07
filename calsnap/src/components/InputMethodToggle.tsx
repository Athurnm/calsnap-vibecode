import { Image, Type } from 'lucide-react';
import { useLanguage } from '../context/LanguageContextCore';

interface InputMethodToggleProps {
    method: 'image' | 'text';
    onChange: (method: 'image' | 'text') => void;
}

export function InputMethodToggle({ method, onChange }: InputMethodToggleProps) {
    const { t } = useLanguage();

    return (
        <div className="flex p-1 bg-gray-100 rounded-lg mb-6 max-w-sm mx-auto">
            <button
                onClick={() => onChange('image')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${method === 'image'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                <Image size={18} />
                {t('input.mode.image')}
            </button>
            <button
                onClick={() => onChange('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${method === 'text'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
            >
                <Type size={18} />
                {t('input.mode.text')}
            </button>
        </div>
    );
}
