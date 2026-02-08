// import OpenAI from 'openai'; // Removed for security
import type { CalendarEvent } from '../types';
import { logger } from './logger';

export type ModelOption = 'google' | 'qwen';

export const MODEL_OPTIONS: Record<ModelOption, { label: string; model: string }> = {
    google: { label: 'Google', model: 'google/gemini-3-flash-preview' },
    qwen: { label: 'Qwen', model: 'qwen/qwen3-vl-235b-a22b-instruct' }
};

interface CompletionUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

// Pricing per 1M tokens (USD) - Approximate, based on OpenRouter/Provider pricing
export const PRICING = {
    google: { input: 0.50, output: 3 }, // Gemini 3 Flash
    qwen: { input: 0.2, output: 0.88 } // Qwen 3 VL ( OpenRouter)
};

export interface AnalysisResult {
    events: CalendarEvent[];
    usage: CompletionUsage | null;
}

// Constants removed as they are now handled in Edge Function

import { supabase } from './supabase';

export async function analyzeScheduleImage(
    base64Image: string,
    model: ModelOption = 'qwen'
): Promise<AnalysisResult> {
    logger.info(`Starting analysis with model: ${MODEL_OPTIONS[model].label}`);

    try {
        const { data, error } = await supabase.functions.invoke('analyze-schedule', {
            body: {
                mode: 'image',
                content: base64Image,
                model: MODEL_OPTIONS[model].model
            }
        });

        if (error) throw error;
        if (!data) throw new Error("No data received from analysis service");

        // The Edge Function returns the raw OpenRouter/OpenAI response format
        // We need to parse the content string from choices[0].message.content
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("No content received from LLM response");

        // Clean up markdown code blocks if present
        const jsonString = content.replace(/```json\n|\n```/g, '').trim();
        let result;
        try {
            result = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse JSON from LLM:", jsonString);
            throw new Error("Failed to parse LLM response as JSON");
        }

        let events: CalendarEvent[];

        if (Array.isArray(result)) {
            events = result;
        } else if (result.events && Array.isArray(result.events)) {
            events = result.events;
        } else {
            const values = Object.values(result);
            const arrayStart = values.find(v => Array.isArray(v));
            if (arrayStart) {
                events = arrayStart as CalendarEvent[];
            } else {
                // If it's a single event object or something else, try to wrap or fail
                // The edge function should return standardized JSON, but let's be safe
                // Check if it looks like a single event
                if (result.activity && result.date) {
                    events = [result as CalendarEvent];
                } else {
                    throw new Error("Could not parse events structure from response");
                }
            }
        }

        if (events.length === 0) {
            throw new Error("No events extracted from image");
        }

        // Normalize events
        const normalizedEvents = events.map(normalizeEvent);
        const usage = data.usage as CompletionUsage | null; // usage is at root level of OpenAI response

        logger.success(`Successfully extracted ${normalizedEvents.length} events`);
        return { events: normalizedEvents, usage };

    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`Analysis failed: ${err.message}`);
        throw err;
    }
}

export async function analyzeScheduleText(
    text: string,
    model: ModelOption = 'qwen'
): Promise<AnalysisResult> {
    logger.info(`Starting text analysis with model: ${MODEL_OPTIONS[model].label}`);

    try {
        const { data, error } = await supabase.functions.invoke('analyze-schedule', {
            body: {
                mode: 'text',
                content: text,
                model: MODEL_OPTIONS[model].model
            }
        });

        if (error) throw error;
        if (!data) throw new Error("No data received from analysis service");

        // Parse content from OpenAI response structure
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("No content received from LLM response");

        const jsonString = content.replace(/```json\n|\n```/g, '').trim();
        let result;
        try {
            result = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse JSON from LLM:", jsonString);
            throw new Error("Failed to parse LLM response as JSON");
        }

        let events: CalendarEvent[];

        if (Array.isArray(result)) {
            events = result;
        } else if (result.events && Array.isArray(result.events)) {
            events = result.events;
        } else {
            events = [result as CalendarEvent];
        }

        const normalizedEvents = events.map(normalizeEvent);
        const usage = data.usage as CompletionUsage | null;

        return { events: normalizedEvents, usage };

    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error(`Text analysis failed: ${err.message}`);
        throw err;
    }
}

// Helper type for raw event data from LLM
interface RawCalendarEvent {
    activity?: string | null;
    date?: string | null;
    endDate?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    notes?: string | null;
    recurrence?: string | null;
}

function normalizeEvent(event: RawCalendarEvent): CalendarEvent {
    const startTime = event.startTime || null;
    let endTime = event.endTime || null;

    // Rule: If not all-day (has startTime) and (endTime is null OR endTime equals startTime),
    // set endTime to startTime + 15 minutes.
    if (startTime) {
        if (!endTime || endTime === startTime) {
            try {
                const [hours, minutes] = String(startTime).split(':').map(Number);
                const date = new Date();
                date.setHours(hours, minutes + 15);
                const newHours = String(date.getHours()).padStart(2, '0');
                const newMinutes = String(date.getMinutes()).padStart(2, '0');
                endTime = `${newHours}:${newMinutes}`;
            } catch (e) {
                // Keep original if parsing fails
                console.warn('Failed to calculate end time', e);
            }
        }
    }

    return {
        activity: event.activity || 'Untitled Event',
        date: event.date || new Date().toISOString().split('T')[0],
        endDate: event.endDate || undefined,
        startTime: startTime,
        endTime: endTime,
        location: event.location || '',
        notes: event.notes || '',
        recurrence: (event.recurrence as CalendarEvent['recurrence']) || 'none'
    };
}

