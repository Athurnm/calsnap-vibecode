// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

        // Get user from auth header
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            console.error('Auth Error:', userError);
            throw new Error('User not found or not authenticated');
        }

        const email = user.email;
        const fullName = user.user_metadata?.full_name || email?.split('@')[0] || 'User';
        const phone = user.user_metadata?.phone || '';

        // Split name into first and last name for Midtrans (optional but good practice)
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        // Create transaction details
        const orderId = `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const grossAmount = 15000; // IDR 15.000

        const itemDetails = [{
            id: 'quota-100',
            price: grossAmount,
            quantity: 1,
            name: '100 Use Quota'
        }];

        const customerDetails = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
        };

        const payload = {
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount,
            },
            item_details: itemDetails,
            customer_details: customerDetails,
            credit_card: {
                secure: true,
            },
        };

        // Call Midtrans API
        const response = await fetch(midtransUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
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
