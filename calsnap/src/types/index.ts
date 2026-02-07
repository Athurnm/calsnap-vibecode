export interface CalendarEvent {
    activity: string;
    date: string; // YYYY-MM-DD
    startTime: string | null; // HH:MM (24h) or null for all-day events
    endTime: string | null; // HH:MM (24h) or null
    location?: string;
    notes?: string;
}

export interface DaySchedule {
    date: string;
    events: CalendarEvent[];
}
