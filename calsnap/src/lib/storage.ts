import type { CalendarEvent } from '../types';

const STORAGE_KEYS = {
    IMAGE: 'calsnap_image',
    EVENTS: 'calsnap_events',
    LOCALE: 'calsnap_locale'
};

export const storage = {
    saveImage(base64Data: string) {
        try {
            sessionStorage.setItem(STORAGE_KEYS.IMAGE, base64Data);
        } catch (e) {
            console.warn('Image too large for session storage', e);
        }
    },

    getImage(): string | null {
        return sessionStorage.getItem(STORAGE_KEYS.IMAGE);
    },

    saveEvents(events: CalendarEvent[]) {
        try {
            sessionStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
        } catch (e) {
            console.error('Failed to save events', e);
        }
    },

    getEvents(): CalendarEvent[] {
        try {
            const data = sessionStorage.getItem(STORAGE_KEYS.EVENTS);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },

    clear() {
        sessionStorage.removeItem(STORAGE_KEYS.IMAGE);
        sessionStorage.removeItem(STORAGE_KEYS.EVENTS);
    }
};
