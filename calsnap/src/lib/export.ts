import type { CalendarEvent } from '../types';

export const generateGoogleCalendarUrl = (event: CalendarEvent): string => {
    if (!event || !event.date) {
        console.warn('Invalid event data for Google Calendar URL:', event);
        return '#';
    }

    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams();
    params.set('action', 'TEMPLATE');
    params.set('text', event.activity || 'Untitled Event');

    // Check if it's an all-day event (no start time)
    if (!event.startTime) {
        // All-day event format: YYYYMMDD/YYYYMMDD (next day for single day event)
        const dateStr = event.date.replace(/-/g, '');
        const nextDay = new Date(event.date);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDateStr = nextDay.toISOString().split('T')[0].replace(/-/g, '');
        params.set('dates', `${dateStr}/${nextDateStr}`);
    } else {
        // Timed event format: YYYYMMDDTHHMMSS
        const formatDateTime = (date: string, time: string): string => {
            const d = date.replace(/-/g, '');
            const t = time.replace(':', '') + '00';
            return `${d}T${t}`;
        };

        const startDateTime = formatDateTime(event.date, event.startTime);
        const endDateTime = event.endTime
            ? formatDateTime(event.date, event.endTime)
            : formatDateTime(event.date, event.startTime);

        params.set('dates', `${startDateTime}/${endDateTime}`);
    }

    if (event.notes) params.set('details', event.notes);
    if (event.location) params.set('location', event.location);

    return `${baseUrl}?${params.toString()}`;
};

export const generateIcsFile = async (events: CalendarEvent[]): Promise<void> => {
    const ical = (await import('ical-generator')).default;

    const calendar = ical({ name: 'CalSnap Schedule' });

    events.forEach(event => {
        if (!event.date) return;

        // Check if it's an all-day event
        if (!event.startTime) {
            // All-day event
            calendar.createEvent({
                start: new Date(event.date),
                allDay: true,
                summary: event.activity || 'Untitled Event',
                description: event.notes,
                location: event.location
            });
        } else {
            // Timed event
            const start = new Date(`${event.date}T${event.startTime}`);
            let end = new Date(`${event.date}T${event.startTime}`);

            if (event.endTime) {
                end = new Date(`${event.date}T${event.endTime}`);
            } else {
                end.setHours(end.getHours() + 1);
            }

            calendar.createEvent({
                start,
                end,
                summary: event.activity || 'Untitled Event',
                description: event.notes,
                location: event.location
            });
        }
    });

    const blob = new Blob([calendar.toString()], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
