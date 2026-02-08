import React, { useCallback, useState } from 'react';
import { Upload, X, FileImage, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContextCore';

interface UploadZoneProps {
    onFileSelect: (file: File) => void;
    isProcessing?: boolean;
    error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isProcessing, error: externalError }) => {
    const { t } = useLanguage();
    const [isDragging, setIsDragging] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const displayError = externalError || localError;

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!isProcessing) setIsDragging(true);
    }, [isProcessing]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const validateAndProcessFile = useCallback((file: File) => {
        setLocalError(null);

        if (!ALLOWED_TYPES.includes(file.type)) {
            setLocalError(t('error.fileType'));
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setLocalError(t('error.fileSize'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        onFileSelect(file);
    }, [onFileSelect, t]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (isProcessing) return;

        const file = e.dataTransfer.files[0];
        if (file) {
            validateAndProcessFile(file);
        }
    }, [isProcessing, validateAndProcessFile]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            validateAndProcessFile(file);
        }
    }, [validateAndProcessFile]);

    const clearFile = useCallback(() => {
        setPreview(null);
        setLocalError(null);
        // Note: We might want to notify parent to clear selection
    }, []);

    return (
        <div className="w-full max-w-xl mx-auto">
            {preview ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                    <img
                        src={preview}
                        alt="Schedule Preview"
                        className="w-full h-auto max-h-[500px] object-contain bg-gray-50"
                    />
                    <button
                        onClick={clearFile}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 text-gray-600 rounded-full shadow-sm hover:text-red-600 hover:bg-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Remove image"
                        disabled={isProcessing}
                    >
                        <X size={20} />
                    </button>
                    {isProcessing && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <p className="text-sm font-medium text-gray-700">{t('processing.schedule')}</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div
                    className={`
                    relative w-full aspect-[2/1] min-h-[300px] rounded-xl border-2 border-dashed transition-all duration-200 ease-in-out flex flex-col items-center justify-center p-8
                    ${isDragging
                            ? 'border-blue-500 bg-blue-50/50 scale-[1.02]'
                            : displayError
                                ? 'border-red-300 bg-red-50/10 hover:border-red-400 hover:bg-red-50/20'
                                : 'border-gray-200 bg-white hover:border-blue-400 hover:bg-blue-50/30'
                        }
                `}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileInput}
                        accept={ALLOWED_TYPES.join(',')}
                        disabled={isProcessing}
                        aria-label={t('upload.title')}
                    />

                    <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-blue-100 text-blue-600' :
                        displayError ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600'
                        }`}>
                        {displayError ? <AlertCircle size={32} /> : <Upload size={32} />}
                    </div>

                    <div className="teerxt-center space-y-2">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {displayError ? t('upload.failed') : t('upload.title')}
                        </h3>

                        <p className="text-sm text-gray-500 text-center max-w-xs">
                            {displayError || (isDragging ? t('upload.dragActive') : t('upload.subtitle'))}
                        </p>

                        {!displayError && (
                            <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                                <FileImage size={14} />
                                <span>{t('upload.formats')}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
