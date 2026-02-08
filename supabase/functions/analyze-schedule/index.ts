// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Utility to handle Deno global for non-Deno environments (IDE)
declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
    mode: 'image' | 'text';
    content: string; // base64 image or text
    model: string;
    apiKey?: string; // Optional, for backward compatibility if needed, but we prefer server-side
}

// System Prompts (Moved from client to server for better security/management)
const IMAGE_SYSTEM_PROMPT = `
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

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { mode, content, model } = await req.json() as RequestBody;

        if (!content) {
            throw new Error('Missing content');
        }

        // Get API Key from Environment
        const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
        if (!openRouterKey) {
            console.error('Missing OPENROUTER_API_KEY');
            throw new Error('Server configuration error');
        }

        const messages = [];
        if (mode === 'image') {
            messages.push({
                role: "system",
                content: IMAGE_SYSTEM_PROMPT
            });
            messages.push({
                role: "user",
                content: [
                    { type: "text", text: "Extract events from this schedule." },
                    {
                        type: "image_url",
                        image_url: {
                            url: content // base64
                        }
                    }
                ]
            });
        } else {
            const currentDate = new Date().toISOString().split('T')[0];
            const userPrompt = `Current Date: ${currentDate}\n\nExtract events from this message:\n"${content}"`;

            messages.push({
                role: "system",
                content: TEXT_SYSTEM_PROMPT
            });
            messages.push({
                role: "user",
                content: userPrompt
            });
        }

        // Determine model string (mapping logic could be here or passed from client)
        // Client passes preference 'google' or 'qwen', we map to actual model ID here or allow client to pass full model ID?
        // Let's assume client passes the actual model ID string to keep it simple, or map it here.
        // The client currently has: 
        // google: { label: 'Google', model: 'google/gemini-3-flash-preview' },
        // qwen: { label: 'Qwen', model: 'qwen/qwen3-vl-235b-a22b-instruct' }

        // We'll trust the client to send the model ID to allow flexibility, 
        // OR we can map secure aliases if we want to restrict models.
        // For now, let's use the passed model string but validate/fallback if needed.

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API Error:', errorText);
            throw new Error(`OpenRouter API Error: ${response.statusText}`);
        }

        const data = await response.json();

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error('Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
