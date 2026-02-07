import OpenAI from 'openai';
import type { CalendarEvent } from '../types';
import { logger } from './logger';

export type ModelOption = 'google' | 'qwen';

export const MODEL_OPTIONS: Record<ModelOption, { label: string; model: string }> = {
    google: { label: 'Google', model: 'google/gemini-3-flash-preview' },
    qwen: { label: 'Qwen', model: 'qwen/qwen3-vl-235b-a22b-instruct' }
};

const SYSTEM_PROMPT = `
Analyze this schedule image and extract calendar events.

Instructions:
1. Identify table structure or calendar layout.
2. Extract each event with: activity name, date, start time(if shown), end time(if shown).
3. ** IMPORTANT **: Detect date ranges - if you see patterns like "Dec 1 - Dec 5", "Tgl 1 - 5", "2026-01-01 - 2026-01-03", or "{date} - {date}", extract BOTH the start date and end date.
4. Return a JSON array: [{ "activity": "string", "date": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" or null, "startTime": "HH:MM" or null, "endTime": "HH:MM" or null }]
5. Set "endDate" ONLY when the event explicitly spans multiple days.For single-day events, set endDate to null or omit it.
6. If date is ambiguous, use best guess based on context(assume current year if missing).
7. If time is not shown in the schedule, set startTime and endTime to null(for all-day events).
8. Return ONLY valid JSON, no markdown, no explanations.
`;

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function analyzeScheduleImage(
    base64Image: string,
    apiKey: string,
    model: ModelOption = 'qwen'
): Promise<CalendarEvent[]> {
    logger.info(`Starting analysis with model: ${MODEL_OPTIONS[model].label}`);

    const client = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });

    const modelConfig = MODEL_OPTIONS[model];
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            logger.info(`LLM attempt ${attempt + 1}/${MAX_RETRIES} using ${modelConfig.label}`);

            const response = await client.chat.completions.create({
                model: modelConfig.model,
                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPT
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Extract events from this schedule." },
                            {
                                type: "image_url",
                                image_url: {
                                    url: base64Image
                                }
                            }
                        ]
                    }
                ],
                response_format: { type: "json_object" }
            });

            logger.info('LLM response received, parsing events...');
            const content = response.choices[0].message.content;
            if (!content) {
                throw new Error("No content received from LLM");
            }

            const jsonString = content.replace(/```json\n|\n```/g, '').trim();
            const result = JSON.parse(jsonString);

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
                    throw new Error("Could not parse events structure from response");
                }
            }

            if (events.length === 0) {
                throw new Error("No events extracted from image");
            }

            // Normalize events - keep null times for all-day events
            const normalizedEvents = events.map(normalizeEvent);

            logger.success(`Successfully extracted ${normalizedEvents.length} events`);
            return normalizedEvents;

        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.warn(`LLM attempt ${attempt + 1} failed:`, lastError.message);
            logger.warning(`LLM attempt ${attempt + 1} failed: ${lastError.message}`);

            if (attempt < MAX_RETRIES - 1) {
                const delay = BASE_DELAY_MS * Math.pow(2, attempt);
                logger.info(`Retrying in ${delay}ms...`);
                await sleep(delay);
            }
        }
    }

    const finalError = lastError || new Error("Failed to analyze image after multiple attempts");
    logger.error(`Analysis failed: ${finalError.message}`);
    throw finalError;
}

const TEXT_SYSTEM_PROMPT = `
Analyze this message and extract calendar events.

Instructions:
1. Extract each event with: activity name, date, start time, end time.
2. ** CRITICAL **: Calculate relative dates based on the [Current Date] provided in the user prompt.
   - "Tomorrow" = Current Date + 1 day
   - "Next Friday" = The next Friday occurring after Current Date
   - "This Monday" = The Monday of this week (or next if passed)
3. ** Notes **: Extract context (Zoom links, locations, agendas, "don't forget", "bring laptop") into the "notes" field.
4. Return a JSON array: [{ "activity": "string", "date": "YYYY-MM-DD", "endDate": "YYYY-MM-DD" or null, "startTime": "HH:MM" or null, "endTime": "HH:MM" or null, "location": "string", "notes": "string" }]
5. If time is not specified, set startTime/endTime to null (all-day).
6. Return ONLY valid JSON.
`;

export async function analyzeScheduleText(
    text: string,
    apiKey: string,
    model: ModelOption = 'qwen'
): Promise<CalendarEvent[]> {
    logger.info(`Starting text analysis with model: ${MODEL_OPTIONS[model].label}`);

    const client = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });

    const modelConfig = MODEL_OPTIONS[model];
    // For text, we can use a faster/cheaper model if available, but staying consistent for now.
    // Qwen/Gemini are both good at this.

    const currentDate = new Date().toISOString().split('T')[0];
    const userPrompt = `Current Date: ${currentDate}\n\nExtract events from this message:\n"${text}"`;

    try {
        const response = await client.chat.completions.create({
            model: modelConfig.model,
            messages: [
                {
                    role: "system",
                    content: TEXT_SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: userPrompt
                }
            ],
            response_format: { type: "json_object" }
        });

        logger.info('LLM response received, parsing events...');
        const content = response.choices[0].message.content;
        if (!content) throw new Error("No content received from LLM");

        const jsonString = content.replace(/```json\n|\n```/g, '').trim();
        const result = JSON.parse(jsonString);

        let events: CalendarEvent[];
        if (Array.isArray(result)) {
            events = result;
        } else if (result.events && Array.isArray(result.events)) {
            events = result.events;
        } else {
            // Fallback for single object
            events = [result as CalendarEvent];
        }

        // Normalize
        return events.map(normalizeEvent);

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

