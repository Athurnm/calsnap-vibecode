export const formatDateTime = (date: string | null, endDate: string | undefined, startTime: string | null, endTime: string | null): { dateStr: string; timeStr: string } => {
    if (!date) return { dateStr: 'No date', timeStr: '' };

    try {
        const dateObj = new Date(date + 'T00:00:00');
        const startDateStr = dateObj.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        // If there's an end date, format as a date range
        let dateStr = startDateStr;
        if (endDate && endDate !== date) {
            const endDateObj = new Date(endDate + 'T00:00:00');
            const endDateStr = endDateObj.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
            dateStr = `${startDateStr} - ${endDateStr}`;
        }

        if (!startTime) {
            return { dateStr, timeStr: 'All day' };
        }

        const formatTime = (t: string) => {
            if (!t) return '';
            return t; // Already in HH:MM format
        };

        const timeStr = endTime
            ? `${formatTime(startTime)} - ${formatTime(endTime)}`
            : formatTime(startTime);

        return { dateStr, timeStr };
    } catch {
        return { dateStr: date || 'Invalid', timeStr: '' };
    }
};
