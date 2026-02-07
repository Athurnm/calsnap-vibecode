import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingStateProps {
    status: 'uploading' | 'analyzing' | 'extracting';
}

export const ProcessingState: React.FC<ProcessingStateProps> = ({ status }) => {
    const messages = {
        uploading: 'Uploading your schedule...',
        analyzing: 'Analyzing image structure...',
        extracting: 'Extracting events and details...',
    };

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-300">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-white p-4 rounded-full shadow-sm border border-blue-100">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {messages[status]}
            </h3>

            <p className="text-gray-500 max-w-sm mx-auto">
                This usually takes 10-20 seconds depending on the complexity of your schedule.
            </p>

            {/* Progress bar simulation */}
            <div className="w-64 h-2 bg-gray-100 rounded-full mt-8 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-progress origin-left"></div>
            </div>
        </div>
    );
};
