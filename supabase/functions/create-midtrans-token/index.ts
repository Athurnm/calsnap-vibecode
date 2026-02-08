// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Utility to handle Deno global for non-Deno environments (IDE)
declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-ignore
serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        // Initialize Midtrans
        // Note: In Deno, we fetch the server key from env
        const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY');
        const midtransUrl = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true'
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        if (!midtransServerKey) {
            throw new Error('Midtrans Server Key not configured');
        }

        // Get user from auth header (optional validation)
        // const { data: { user }, error: authError } = await supabase.auth.getUser(token) ...

        // Create transaction details
        const orderId = `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const grossAmount = 15000; // IDR 15.000

        const payload = {
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount,
            },
            credit_card: {
                secure: true,
            },
            // You can add customer_details here if you want
        };

        // Call Midtrans API
        const response = await fetch(midtransUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(midtransServerKey + ':')}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Midtrans Error:', data);
            throw new Error(`Midtrans API Error: ${JSON.stringify(data)}`);
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
