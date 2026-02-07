import OpenAI from 'openai';
import type { CalendarEvent } from '../types';

const SYSTEM_PROMPT = `
Analyze this schedule image and extract calendar events.

Instructions:
1. Identify table structure or calendar layout.
2. Extract each event with: activity name, date, start time, end time (if available).
3. Return a JSON array: [{ "activity": "string", "date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM" }]
4. If date is ambiguous, use best guess based on context (assume current year if missing).
5. If time is missing, use null.
6. Return ONLY valid JSON, no markdown, no explanations.
`;

export async function analyzeScheduleImage(base64Image: string, apiKey: string): Promise<CalendarEvent[]> {
    const client = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
        dangerouslyAllowBrowser: true
    });

    try {
        const response = await client.chat.completions.create({
            model: "google/gemini-2.0-flash-001", // Using a cost-effective vision model via OpenRouter
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
            response_format: { type: "json_object" } // Force JSON if supported, otherwise prompt handles it
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No content received from LLM");

        // Clean up content if it contains markdown code blocks
        const jsonString = content.replace(/```json\n|\n```/g, '').trim();

        // Parse
        const result = JSON.parse(jsonString);

        // Handle if result is wrapped in an object key like "events"
        if (Array.isArray(result)) return result;
        if (result.events && Array.isArray(result.events)) return result.events;

        // Fallback: try to find array in the object
        const values = Object.values(result);
        const arrayStart = values.find(v => Array.isArray(v));
        if (arrayStart) return arrayStart as CalendarEvent[];

        throw new Error("Could not parse events structure from response");

    } catch (error) {
        console.error("LLM Analysis Failed:", error);
        throw error;
    }
}
