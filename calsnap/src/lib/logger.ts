export type LogType = 'info' | 'success' | 'error' | 'warning';

export interface LogEntry {
    id: string;
    timestamp: Date;
    message: string;
    type: LogType;
}

// Simple event bus for logging since we need to log from non-React files (llm.ts)
type LogListener = (entry: LogEntry) => void;
const listeners: Set<LogListener> = new Set();

export const logger = {
    log: (message: string, type: LogType = 'info') => {
        const entry: LogEntry = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            message,
            type
        };
        listeners.forEach(listener => listener(entry));
    },
    info: (message: string) => logger.log(message, 'info'),
    success: (message: string) => logger.log(message, 'success'),
    error: (message: string) => logger.log(message, 'error'),
    warning: (message: string) => logger.log(message, 'warning'),
    subscribe: (listener: LogListener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }
};
