import React, { useState } from 'react';
import { Trash2, Copy, Plus, Calendar, ExternalLink, Pencil, X, Check, RefreshCcw } from 'lucide-react';
import posthog from 'posthog-js';
import { useLanguage } from '../context/LanguageContextCore';
import type { CalendarEvent } from '../types';
import { generateGoogleCalendarUrl } from '../lib/export';
import { formatDateTime } from '../lib/utils';
import { logger } from '../lib/logger';

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
    const { t } = useLanguage();
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

        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/25 backdrop-blur-sm animate-in fade-in" onClick={onCancel}>
            <div
                className="bg-white border border-gray-200 rounded-xl shadow-2xl p-4 min-w-[300px] max-w-sm w-full animate-in zoom-in-95"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">{t('table.dateTime')}</h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Start Date */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">{t('table.editor.start_date')}</label>
                        <input
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                            aria-label="Event start date"
                        />
                    </div>

                    {/* End Date (optional) */}
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">{t('table.editor.end_date')}</label>
                        <input
                            type="date"
                            value={editEndDate}
                            onChange={(e) => setEditEndDate(e.target.value)}
                            min={editDate}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
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
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="allDay" className="text-sm text-gray-700 cursor-pointer select-none">{t('table.editor.all_day')}</label>
                    </div>

                    {/* Time Inputs */}
                    {!isAllDay && (
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="text-xs font-medium text-gray-500 mb-1.5 block">{t('table.editor.start_time')}</label>
                                <input
                                    type="time"
                                    value={editStart}
                                    onChange={(e) => setEditStart(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    aria-label="Start time"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-medium text-gray-500 mb-1.5 block">{t('table.editor.end_time')}</label>
                                <input
                                    type="time"
                                    value={editEnd}
                                    onChange={(e) => setEditEnd(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    aria-label="End time"
                                />
                            </div>
                        </div>
                    )}

                    {/* Recurring Options (Collapsible) */}
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => setShowRecurrence(!showRecurrence)}
                            className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900 bg-gray-50 p-2 rounded-lg"
                        >
                            <span className="font-medium">{t('table.editor.recurrence')}</span>
                            <span className="text-xs">{showRecurrence ? '▲' : '▼'}</span>
                        </button>
                        {showRecurrence && (
                            <div className="mt-2 animate-in slide-in-from-top-2">
                                <select
                                    value={editRecurrence}
                                    onChange={(e) => setEditRecurrence(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly')}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    aria-label="Recurrence pattern"
                                >
                                    <option value="none">{t('table.editor.recurrence.none')}</option>
                                    <option value="daily">{t('table.editor.recurrence.daily')}</option>
                                    <option value="weekly">{t('table.editor.recurrence.weekly')}</option>
                                    <option value="monthly">{t('table.editor.recurrence.monthly')}</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        {t('table.editor.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-200 transition-colors flex items-center gap-2"
                    >
                        <Check size={16} />
                        {t('table.editor.save')}
                    </button>
                </div>
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
    const { t } = useLanguage();
    const [editingDateTime, setEditingDateTime] = useState<number | null>(null);
    const [exportedIndices, setExportedIndices] = useState<Set<number>>(new Set());

    const handleDateTimeSave = (index: number, date: string, endDate: string | undefined, startTime: string | null, endTime: string | null, recurrence: 'none' | 'daily' | 'weekly' | 'monthly') => {
        onUpdate(index, 'date', date);
        onUpdate(index, 'endDate', endDate || null);
        onUpdate(index, 'startTime', startTime);
        onUpdate(index, 'endTime', endTime);
        onUpdate(index, 'recurrence', recurrence);
        setEditingDateTime(null);
        logger.info(`Updated event ${index + 1}: ${events[index].activity}`);
    };

    if (!events || events.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500 mb-4">{t('results.empty')}</p>
                <button
                    onClick={onAdd}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={16} className="mr-2" />
                    {t('results.addEvent')}
                </button>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">{t('results.title')} ({events.length})</h2>
                <button
                    onClick={onAdd}
                    className="hidden sm:inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 active:scale-95 transition-all text-sm font-medium"
                >
                    <Plus size={16} className="mr-1.5" />
                    {t('results.addEvent')}
                </button>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200" data-table-container>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                            <th className="px-4 py-3 font-medium w-[45%]">{t('table.activity')}</th>
                            <th className="px-4 py-3 font-medium w-1/4">{t('table.dateTime')}</th>
                            <th className="px-4 py-3 font-medium w-1/5">{t('table.notes')}</th>
                            <th className="px-4 py-3 font-medium text-right w-[10%]">{t('table.actions')}</th>
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
                                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 active:scale-95 rounded-md transition-all"
                                                title="Add to Google Calendar"
                                                aria-label={`Add event ${index + 1} to Google Calendar`}
                                                onClick={() => {
                                                    posthog.capture('gcal_export_clicked', { source: 'desktop_row' });
                                                }}
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                            <button
                                                onClick={() => {
                                                    onDuplicate(index);
                                                    logger.info(`Duplicated event: ${event.activity}`);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 active:scale-95 rounded-md transition-all"
                                                title={t('action.duplicate')}
                                                aria-label={`Duplicate event ${index + 1}`}
                                            >
                                                <Copy size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onDelete(index);
                                                    logger.info(`Deleted event: ${event.activity}`);
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-95 rounded-md transition-all"
                                                title={t('action.delete')}
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
                    const isExported = exportedIndices.has(index);
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
                        <div
                            key={index}
                            className={`p-4 rounded-xl shadow-sm border transition-colors duration-300 space-y-3 ${isExported
                                ? 'bg-emerald-50/80 border-emerald-200'
                                : 'bg-white border-gray-100'
                                }`}
                        >
                            <div className="flex justify-between items-start gap-3">
                                <input
                                    type="text"
                                    value={safeEvent.activity}
                                    onChange={(e) => onUpdate(index, 'activity', e.target.value)}
                                    className="flex-1 text-lg font-semibold text-gray-900 border-none p-0 focus:ring-0 placeholder-gray-400 bg-transparent"
                                    placeholder="Event Name"
                                    aria-label={`Activity for event ${index + 1}`}
                                />
                            </div>

                            {/* Date/Time */}
                            <div className="relative">
                                <button
                                    onClick={() => setEditingDateTime(editingDateTime === index ? null : index)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full transition-colors ${isExported ? 'bg-white/60' : 'bg-gray-50'
                                        }`}
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
                                className="w-full text-sm text-gray-500 border-none p-0 focus:ring-0 placeholder-gray-400 bg-transparent"
                                placeholder="Add notes..."
                                aria-label={`Notes for event ${index + 1}`}
                            />

                            {/* Actions - moved to bottom */}
                            <div className={`flex flex-col gap-2 pt-2 border-t ${isExported ? 'border-emerald-200' : 'border-gray-50'}`}>
                                <a
                                    href={generateGoogleCalendarUrl(event)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm ${isExported
                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md'
                                        }`}
                                    title="Add to Google Calendar"
                                    onClick={() => {
                                        logger.info(`Exported to Google Calendar: ${event.activity}`);
                                        setExportedIndices(prev => new Set(prev).add(index));
                                        posthog.capture('gcal_export_clicked', { source: 'mobile_card' });
                                    }}
                                >
                                    <Calendar size={18} />
                                    <span>{isExported ? t('table.gcal.added') : t('table.gcal.add')}</span>
                                </a>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            onDuplicate(index);
                                            logger.info(`Duplicated event: ${event.activity}`);
                                        }}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all border ${isExported
                                            ? 'bg-white/60 text-gray-600 border-emerald-200 hover:bg-white'
                                            : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-blue-50 hover:text-blue-600'
                                            }`}
                                        aria-label={`Duplicate event ${index + 1}`}
                                    >
                                        <Copy size={18} />
                                        <span className="text-sm">{t('action.duplicate')}</span>
                                    </button>
                                    <button
                                        onClick={() => onDelete(index)}
                                        className={`flex-1 py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all border ${isExported
                                            ? 'bg-white/60 text-gray-600 border-emerald-200 hover:bg-red-50 hover:text-red-600'
                                            : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-red-50 hover:text-red-600'
                                            }`}
                                        aria-label={`Delete event ${index + 1}`}
                                    >
                                        <Trash2 size={18} />
                                        <span className="text-sm">{t('action.delete')}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <button
                    onClick={onAdd}
                    className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-medium flex items-center justify-center hover:bg-blue-100 transition-colors"
                >
                    <Plus size={18} className="mr-2" />
                    {t('results.addAnother')}
                </button>
            </div>
        </div>
    );
};
