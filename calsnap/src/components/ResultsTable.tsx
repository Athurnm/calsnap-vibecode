import React, { useState } from 'react';
import { Trash2, Copy, Plus, Calendar, ExternalLink, Pencil, X, Check, RefreshCcw } from 'lucide-react';
import type { CalendarEvent } from '../types';
import { generateGoogleCalendarUrl } from '../lib/export';
import { formatDateTime } from '../lib/utils';

interface ResultsTableProps {
    events: CalendarEvent[];
    onUpdate: (index: number, field: keyof CalendarEvent, value: string | null) => void;
    onDelete: (index: number) => void;
    onDuplicate: (index: number) => void;
    onAdd: () => void;
}



// Inline date/time editor
interface DateTimeEditorProps {
    date: string;
    endDate?: string;
    startTime: string | null;
    endTime: string | null;
    recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
    onSave: (date: string, endDate: string | undefined, startTime: string | null, endTime: string | null, recurrence: 'none' | 'daily' | 'weekly' | 'monthly') => void;
    onCancel: () => void;
}

const DateTimeEditor: React.FC<DateTimeEditorProps> = ({ date, endDate, startTime, endTime, recurrence, onSave, onCancel }) => {
    const [editDate, setEditDate] = useState(date || new Date().toISOString().split('T')[0]);
    const [editEndDate, setEditEndDate] = useState(endDate || '');
    const [editStart, setEditStart] = useState(startTime || '');
    const [editEnd, setEditEnd] = useState(endTime || '');
    const [isAllDay, setIsAllDay] = useState(!startTime);
    const [editRecurrence, setEditRecurrence] = useState(recurrence || 'none');
    const [showRecurrence, setShowRecurrence] = useState(false);

    const handleSave = () => {
        if (isAllDay) {
            onSave(editDate, editEndDate || undefined, null, null, editRecurrence);
        } else {
            onSave(editDate, editEndDate || undefined, editStart || '09:00', editEnd || null, editRecurrence);
        }
    };

    return (
        <div className="absolute z-10 top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[280px]">
            <div className="space-y-3">
                {/* Start Date */}
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                    <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                        aria-label="Event start date"
                    />
                </div>

                {/* End Date (optional) */}
                <div>
                    <label className="text-xs text-gray-500 mb-1 block">End Date (optional)</label>
                    <input
                        type="date"
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                        min={editDate}
                        className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                        aria-label="Event end date"
                        placeholder="Same as start date"
                    />
                </div>

                {/* All Day Checkbox */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="allDay"
                        checked={isAllDay}
                        onChange={(e) => setIsAllDay(e.target.checked)}
                        className="rounded border-gray-300"
                    />
                    <label htmlFor="allDay" className="text-sm text-gray-600">All day</label>
                </div>

                {/* Time Inputs */}
                {!isAllDay && (
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">Start</label>
                            <input
                                type="time"
                                value={editStart}
                                onChange={(e) => setEditStart(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                                aria-label="Start time"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">End</label>
                            <input
                                type="time"
                                value={editEnd}
                                onChange={(e) => setEditEnd(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                                aria-label="End time"
                            />
                        </div>
                    </div>
                )}

                {/* Recurring Options (Collapsible) */}
                <div className="border-t border-gray-100 pt-3">
                    <button
                        type="button"
                        onClick={() => setShowRecurrence(!showRecurrence)}
                        className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900"
                    >
                        <span>Recurring Options</span>
                        <span className="text-xs">{showRecurrence ? '▲' : '▼'}</span>
                    </button>
                    {showRecurrence && (
                        <div className="mt-2">
                            <select
                                value={editRecurrence}
                                onChange={(e) => setEditRecurrence(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly')}
                                className="w-full px-2 py-1 border border-gray-200 rounded text-sm"
                                aria-label="Recurrence pattern"
                            >
                                <option value="none">None</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-100">
                <button
                    onClick={onCancel}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                    title="Cancel"
                    aria-label="Cancel editing"
                >
                    <X size={16} />
                </button>
                <button
                    onClick={handleSave}
                    className="p-1.5 text-blue-600 hover:text-blue-700 rounded"
                    title="Save"
                    aria-label="Save date and time"
                >
                    <Check size={16} />
                </button>
            </div>
        </div>
    );
};

export const ResultsTable: React.FC<ResultsTableProps> = ({
    events,
    onUpdate,
    onDelete,
    onDuplicate,
    onAdd
}) => {
    const [editingDateTime, setEditingDateTime] = useState<number | null>(null);

    const handleDateTimeSave = (index: number, date: string, endDate: string | undefined, startTime: string | null, endTime: string | null, recurrence: 'none' | 'daily' | 'weekly' | 'monthly') => {
        onUpdate(index, 'date', date);
        onUpdate(index, 'endDate', endDate || null);
        onUpdate(index, 'startTime', startTime);
        onUpdate(index, 'endTime', endTime);
        onUpdate(index, 'recurrence', recurrence);
        setEditingDateTime(null);
    };

    if (!events || events.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500 mb-4">No events found yet.</p>
                <button
                    onClick={onAdd}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={16} className="mr-2" />
                    Add Event Manually
                </button>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Review Events ({events.length})</h2>
                <button
                    onClick={onAdd}
                    className="hidden sm:inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 active:scale-95 transition-all text-sm font-medium"
                >
                    <Plus size={16} className="mr-1.5" />
                    Add Event
                </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200" data-table-container>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                            <th className="px-4 py-3 font-medium w-[45%]">Activity</th>
                            <th className="px-4 py-3 font-medium w-1/4">Date & Time</th>
                            <th className="px-4 py-3 font-medium w-1/5">Notes</th>
                            <th className="px-4 py-3 font-medium text-right w-[10%]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {events.map((event, index) => {
                            const safeEvent = {
                                activity: event?.activity || 'Untitled',
                                date: event?.date || '',
                                endDate: event?.endDate || undefined,
                                startTime: event?.startTime || null,
                                endTime: event?.endTime || null,
                                notes: event?.notes || event?.location || '',
                                recurrence: event?.recurrence || 'none' as 'none' | 'daily' | 'weekly' | 'monthly'
                            };

                            const { dateStr, timeStr } = formatDateTime(safeEvent.date, safeEvent.endDate, safeEvent.startTime, safeEvent.endTime);

                            return (
                                <tr key={index} className="hover:bg-gray-50 transition-colors group">
                                    {/* Activity - wider */}
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            value={safeEvent.activity}
                                            onChange={(e) => onUpdate(index, 'activity', e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-base font-medium text-gray-900 placeholder-gray-400"
                                            placeholder="Event Name"
                                            aria-label={`Activity for event ${index + 1}`}
                                        />
                                    </td>

                                    {/* Date & Time - two lines, date prominent */}
                                    <td className="px-4 py-2 relative">
                                        <button
                                            onClick={() => setEditingDateTime(editingDateTime === index ? null : index)}
                                            className="flex items-start gap-2 text-left hover:bg-gray-100 rounded-md px-2 py-1 -mx-2 transition-colors group/dt"
                                        >
                                            <Calendar size={14} className="text-gray-400 mt-0.5 group-hover/dt:text-blue-500" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-gray-900">{dateStr}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">{timeStr}</span>
                                                    {safeEvent.recurrence && safeEvent.recurrence !== 'none' && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 uppercase tracking-wide">
                                                            <RefreshCcw size={10} />
                                                            {safeEvent.recurrence}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Pencil size={10} className="text-gray-300 opacity-0 group-hover/dt:opacity-100 transition-opacity ml-1 mt-0.5" />
                                        </button>

                                        {editingDateTime === index && (
                                            <DateTimeEditor
                                                date={safeEvent.date}
                                                endDate={safeEvent.endDate}
                                                startTime={safeEvent.startTime}
                                                endTime={safeEvent.endTime}
                                                recurrence={safeEvent.recurrence}
                                                onSave={(d, ed, s, e, r) => handleDateTimeSave(index, d, ed, s, e, r)}
                                                onCancel={() => setEditingDateTime(null)}
                                            />
                                        )}
                                    </td>

                                    {/* Notes - narrower */}
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            value={safeEvent.notes}
                                            onChange={(e) => onUpdate(index, 'notes', e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-gray-600 placeholder-gray-300"
                                            placeholder="Notes..."
                                            aria-label={`Notes for event ${index + 1}`}
                                        />
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a
                                                href={generateGoogleCalendarUrl(event)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 active:scale-95 rounded-md transition-all"
                                                title="Add to Google Calendar"
                                                aria-label={`Add event ${index + 1} to Google Calendar`}
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                            <button
                                                onClick={() => onDuplicate(index)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 active:scale-95 rounded-md transition-all"
                                                title="Duplicate"
                                                aria-label={`Duplicate event ${index + 1}`}
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(index)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-95 rounded-md transition-all"
                                                title="Delete"
                                                aria-label={`Delete event ${index + 1}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {events.map((event, index) => {
                    const safeEvent = {
                        activity: event?.activity || 'Untitled',
                        date: event?.date || '',
                        endDate: event?.endDate || undefined,
                        startTime: event?.startTime || null,
                        endTime: event?.endTime || null,
                        notes: event?.notes || event?.location || '',
                        recurrence: event?.recurrence || 'none' as 'none' | 'daily' | 'weekly' | 'monthly'
                    };

                    const { dateStr, timeStr } = formatDateTime(safeEvent.date, safeEvent.endDate, safeEvent.startTime, safeEvent.endTime);

                    return (
                        <div key={index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                            <div className="flex justify-between items-start gap-3">
                                <input
                                    type="text"
                                    value={safeEvent.activity}
                                    onChange={(e) => onUpdate(index, 'activity', e.target.value)}
                                    className="flex-1 text-lg font-semibold text-gray-900 border-none p-0 focus:ring-0 placeholder-gray-300"
                                    placeholder="Event Name"
                                    aria-label={`Activity for event ${index + 1}`}
                                />
                                <div className="flex gap-1 shrink-0">
                                    <a
                                        href={generateGoogleCalendarUrl(event)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-400 hover:text-green-600 active:scale-95 bg-gray-50 rounded-lg transition-all"
                                        aria-label={`Add event ${index + 1} to Google Calendar`}
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                    <button
                                        onClick={() => onDuplicate(index)}
                                        className="p-2 text-gray-400 hover:text-blue-600 active:scale-95 bg-gray-50 rounded-lg transition-all"
                                        aria-label={`Duplicate event ${index + 1}`}
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(index)}
                                        className="p-2 text-gray-400 hover:text-red-600 active:scale-95 bg-gray-50 rounded-lg transition-all"
                                        aria-label={`Delete event ${index + 1}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Date/Time */}
                            <div className="relative">
                                <button
                                    onClick={() => setEditingDateTime(editingDateTime === index ? null : index)}
                                    className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg w-full"
                                >
                                    <Calendar size={14} className="text-gray-400" />
                                    <div className="flex flex-col text-left">
                                        <span className="text-sm font-medium text-gray-900">{dateStr}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{timeStr}</span>
                                            {safeEvent.recurrence && safeEvent.recurrence !== 'none' && (
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 uppercase tracking-wide">
                                                    <RefreshCcw size={10} />
                                                    {safeEvent.recurrence}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Pencil size={12} className="text-gray-300 ml-auto" />
                                </button>

                                {editingDateTime === index && (
                                    <DateTimeEditor
                                        date={safeEvent.date}
                                        endDate={safeEvent.endDate}
                                        startTime={safeEvent.startTime}
                                        endTime={safeEvent.endTime}
                                        recurrence={safeEvent.recurrence}
                                        onSave={(d, ed, s, e, r) => handleDateTimeSave(index, d, ed, s, e, r)}
                                        onCancel={() => setEditingDateTime(null)}
                                    />
                                )}
                            </div>

                            {/* Notes */}
                            <input
                                type="text"
                                value={safeEvent.notes}
                                onChange={(e) => onUpdate(index, 'notes', e.target.value)}
                                className="w-full text-sm text-gray-500 border-none p-0 focus:ring-0 placeholder-gray-300"
                                placeholder="Add notes..."
                                aria-label={`Notes for event ${index + 1}`}
                            />
                        </div>
                    );
                })}

                <button
                    onClick={onAdd}
                    className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-medium flex items-center justify-center hover:bg-blue-100 transition-colors"
                >
                    <Plus size={18} className="mr-2" />
                    Add Another Event
                </button>
            </div>
        </div>
    );
};
