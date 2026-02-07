import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContextCore';

interface TextInputZoneProps {
    onAnalyze: (text: string) => void;
    isProcessing: boolean;
}

export function TextInputZone({ onAnalyze, isProcessing }: TextInputZoneProps) {
    const { t } = useLanguage();
    const [text, setText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!text.trim()) {
            setError(t('input.text.error_empty'));
            return;
        }
        setError(null);
        onAnalyze(text);
    };

    const handleClear = () => {
        setText('');
        setError(null);
    };

    return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="relative">
                <textarea
                    value={text}
                    onChange={(e) => {
                        setText(e.target.value);
                        if (error) setError(null);
                    }}
                    placeholder={t('input.text.placeholder')}
                    className="w-full h-48 p-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none shadow-sm text-base text-gray-800 placeholder:text-gray-400"
                    disabled={isProcessing}
                />

                {text && (
                    <button
                        onClick={handleClear}
                        className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title={t('input.text.clear_btn')}
                        disabled={isProcessing}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {error && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                    {error}
                </p>
            )}

            <button
                onClick={handleSubmit}
                disabled={!text.trim() || isProcessing}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
                {isProcessing ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Analyzing...</span>
                    </>
                ) : (
                    <>
                        <Sparkles size={20} />
                        <span>{t('input.text.analyze_btn')}</span>
                    </>
                )}
            </button>
        </div>
    );
}
