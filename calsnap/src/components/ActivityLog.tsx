import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Copy, Terminal } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '../context/LanguageContextCore';

import { logger, type LogEntry } from '../lib/logger';

export const ActivityLog: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const { t } = useLanguage();

    useEffect(() => {
        const unsubscribe = logger.subscribe((entry) => {
            setLogs(prev => [entry, ...prev].slice(0, 50)); // Keep last 50 logs
        });
        return () => { unsubscribe(); };
    }, []);

    const copyLogs = () => {
        const text = logs.map(l => `[${format(l.timestamp, 'HH:mm:ss')}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
        navigator.clipboard.writeText(text);
    };

    if (logs.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pointer-events-none">
            <div className="max-w-6xl mx-auto pointer-events-auto">
                <div className={`bg-white border-t border-l border-r border-gray-200 shadow-lg rounded-t-xl overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'h-64' : 'h-10'}`}>
                    <div
                        className="bg-gray-50 px-4 h-10 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            <Terminal size={14} className="text-gray-500" />
                            {t('activity.title')}
                            <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px] min-w-[20px] text-center">
                                {logs.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {isOpen && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); copyLogs(); }}
                                    className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                                    title={t('activity.copy')}
                                >
                                    <Copy size={14} />
                                </button>
                            )}
                            {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
                        </div>
                    </div>

                    <div className="h-[calc(100%-40px)] overflow-y-auto p-4 space-y-1 bg-white font-mono text-xs">
                        {logs.map((log) => (
                            <div key={log.id} className="flex gap-3 hover:bg-gray-50 p-1 rounded">
                                <span className="text-gray-400 shrink-0">
                                    {format(log.timestamp, 'HH:mm:ss')}
                                </span>
                                <span className={`shrink-0 font-medium ${log.type === 'error' ? 'text-red-600' :
                                    log.type === 'success' ? 'text-green-600' :
                                        log.type === 'warning' ? 'text-yellow-600' :
                                            'text-blue-600'
                                    }`}>
                                    {log.type.toUpperCase()}
                                </span>
                                <span className="text-gray-700 break-all">
                                    {log.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
