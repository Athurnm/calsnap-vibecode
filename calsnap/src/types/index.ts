export interface CalendarEvent {
    activity: string;
    date: string; // YYYY-MM-DD (start date)
    endDate?: string; // YYYY-MM-DD (optional end date for multi-day events)
    startTime: string | null; // HH:MM (24h) or null for all-day events
    endTime: string | null; // HH:MM (24h) or null
    location?: string;
    notes?: string;
    recurrence?: 'none' | 'daily' | 'weekly' | 'monthly'; // Recurring pattern
}

export interface DaySchedule {
    date: string;
    events: CalendarEvent[];
}
