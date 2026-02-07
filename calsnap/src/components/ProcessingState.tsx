import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingStateProps {
    status: 'uploading' | 'analyzing' | 'extracting';
}

const tips = [
    "Did you know? You can set recurring events after processing.",
    "Pro Tip: Check the 'End Date' for multi-day events.",
    "Your schedule is securely analyzed via OpenRouter AI.",
    "You can edit details before downloading your calendar.",
    "Reviewing now ensures your schedule is 100% accurate."
];

export const ProcessingState: React.FC<ProcessingStateProps> = ({ status }) => {
    const [tipIndex, setTipIndex] = React.useState(0);

    const messages = {
        uploading: 'Uploading your schedule...',
        analyzing: 'Analyzing image structure...',
        extracting: 'Extracting events and details...',
    };

    React.useEffect(() => {
        const interval = setInterval(() => {
            setTipIndex((prev) => (prev + 1) % tips.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

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

            <p className="text-gray-500 max-w-sm mx-auto mb-8">
                This usually takes 10-20 seconds depending on the complexity of your schedule.
            </p>

            {/* Tip Carousel */}
            <div className="h-12 flex items-center justify-center">
                <p key={tipIndex} className="text-sm font-medium text-blue-600 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    💡 {tips[tipIndex]}
                </p>
            </div>

            {/* Progress bar simulation */}
            <div className="w-64 h-2 bg-gray-100 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-progress origin-left"></div>
            </div>
        </div>
    );
};
