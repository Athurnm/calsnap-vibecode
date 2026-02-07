import type { CalendarEvent } from '../types';
import { ICalEventRepeatingFreq } from 'ical-generator';
import type { ICalEventData } from 'ical-generator';

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
        // All-day event format: YYYYMMDD/YYYYMMDD
        const dateStr = event.date.replace(/-/g, '');

        // Use endDate if provided, otherwise use next day for single-day event
        let endDateStr: string;
        if (event.endDate) {
            // For multi-day events, Google Calendar needs the day AFTER the last day
            const dayAfterEnd = new Date(event.endDate);
            dayAfterEnd.setDate(dayAfterEnd.getDate() + 1);
            endDateStr = dayAfterEnd.toISOString().split('T')[0].replace(/-/g, '');
        } else {
            const nextDay = new Date(event.date);
            nextDay.setDate(nextDay.getDate() + 1);
            endDateStr = nextDay.toISOString().split('T')[0].replace(/-/g, '');
        }

        params.set('dates', `${dateStr}/${endDateStr}`);
    } else {
        // Timed event format: YYYYMMDDTHHMMSS
        const formatDateTime = (date: string, time: string): string => {
            const d = date.replace(/-/g, '');
            const t = time.replace(':', '') + '00';
            return `${d}T${t}`;
        };

        const startDateTime = formatDateTime(event.date, event.startTime);

        // For timed events with endDate, use the endDate with endTime or startTime
        const endDate = event.endDate || event.date;
        const endTime = event.endTime || event.startTime;
        const endDateTime = formatDateTime(endDate, endTime);

        params.set('dates', `${startDateTime}/${endDateTime}`);
    }

    if (event.notes) params.set('details', event.notes);
    if (event.location) params.set('location', event.location);

    // Add recurrence rule if specified
    if (event.recurrence && event.recurrence !== 'none') {
        const rruleMap: Record<string, string> = {
            daily: 'RRULE:FREQ=DAILY',
            weekly: 'RRULE:FREQ=WEEKLY',
            monthly: 'RRULE:FREQ=MONTHLY'
        };
        if (rruleMap[event.recurrence]) {
            params.set('recur', rruleMap[event.recurrence]);
        }
    }

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

            const eventConfig: ICalEventData = {
                start: new Date(event.date),
                allDay: true,
                summary: event.activity || 'Untitled Event',
                description: event.notes,
                location: event.location
            };

            // If endDate is specified, set the end to the day AFTER endDate
            if (event.endDate) {
                const endDate = new Date(event.endDate);
                endDate.setDate(endDate.getDate() + 1);
                eventConfig.end = endDate;
            }

            // Add recurrence rule if specified
            if (event.recurrence && event.recurrence !== 'none') {
                const freqMap: Record<string, ICalEventRepeatingFreq> = {
                    daily: ICalEventRepeatingFreq.DAILY,
                    weekly: ICalEventRepeatingFreq.WEEKLY,
                    monthly: ICalEventRepeatingFreq.MONTHLY
                };
                if (freqMap[event.recurrence]) {
                    eventConfig.repeating = { freq: freqMap[event.recurrence] };
                }
            }

            calendar.createEvent(eventConfig);
        } else {
            // Timed event
            const start = new Date(`${event.date}T${event.startTime}`);

            // Calculate end time considering endDate
            let end: Date;
            if (event.endDate && event.endTime) {
                end = new Date(`${event.endDate}T${event.endTime}`);
            } else if (event.endDate) {
                // If endDate exists but no endTime, use startTime on endDate
                end = new Date(`${event.endDate}T${event.startTime}`);
            } else if (event.endTime) {
                end = new Date(`${event.date}T${event.endTime}`);
            } else {
                // Default to 1 hour later
                end = new Date(start);
                end.setHours(end.getHours() + 1);
            }

            const eventConfig: ICalEventData = {
                start,
                end,
                summary: event.activity || 'Untitled Event',
                description: event.notes,
                location: event.location
            };

            // Add recurrence rule if specified
            if (event.recurrence && event.recurrence !== 'none') {
                const freqMap: Record<string, ICalEventRepeatingFreq> = {
                    daily: ICalEventRepeatingFreq.DAILY,
                    weekly: ICalEventRepeatingFreq.WEEKLY,
                    monthly: ICalEventRepeatingFreq.MONTHLY
                };
                if (freqMap[event.recurrence]) {
                    eventConfig.repeating = { freq: freqMap[event.recurrence] };
                }
            }

            calendar.createEvent(eventConfig);
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
