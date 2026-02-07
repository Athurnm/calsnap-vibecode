import React, { useCallback, useState } from 'react';
import { Upload, X, FileImage, AlertCircle } from 'lucide-react';

interface UploadZoneProps {
    onFileSelect: (file: File) => void;
    isProcessing?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isProcessing }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!isProcessing) setIsDragging(true);
    }, [isProcessing]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const validateAndProcessFile = useCallback((file: File) => {
        setError(null);

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Invalid file type. Please upload a PNG, JPG, or WebP image.');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setError('File is too large. Maximum size is 10MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        onFileSelect(file);
    }, [onFileSelect]);

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
        setError(null);
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
                                <p className="text-sm font-medium text-gray-700">Processing schedule...</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !isProcessing && document.getElementById('file-upload')?.click()}
                    className={`
            relative group cursor-pointer
            flex flex-col items-center justify-center
            p-10 rounded-2xl border-2 border-dashed
            transition-all duration-200 ease-in-out
            ${isDragging
                            ? 'border-blue-500 bg-blue-50/50 scale-[1.02]'
                            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                        }
            ${error ? 'border-red-300 bg-red-50/30' : ''}
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                >
                    <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept={ALLOWED_TYPES.join(',')}
                        onChange={handleFileInput}
                        disabled={isProcessing}
                        aria-label="Upload schedule image"
                    />

                    <div className={`
            p-4 rounded-full bg-blue-50 text-blue-600 mb-4
            group-hover:scale-110 group-hover:bg-blue-100 transition-transform duration-200
            ${error ? 'bg-red-50 text-red-500' : ''}
          `}>
                        {error ? <AlertCircle size={32} /> : <Upload size={32} />}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {error ? 'Upload failed' : 'Upload your schedule'}
                    </h3>

                    <p className="text-sm text-gray-500 text-center max-w-xs">
                        {error || 'Drag and drop your schedule image here, or click to browse'}
                    </p>

                    {!error && (
                        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                            <FileImage size={14} />
                            <span>PNG, JPG, WebP up to 10MB</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
