// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Utility to handle Deno global for non-Deno environments (IDE)
declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-ignore
serve(async (req: Request) => {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 2. Check Authorization Header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error("Missing Authorization header");
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        // 3. Environment Variables Check
        // Note: Deno.env.get returns string or undefined
        const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY');
        const isProduction = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true';
        const midtransUrl = isProduction
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

        if (!midtransServerKey) {
            console.error("Configuration Error: MIDTRANS_SERVER_KEY is missing");
            throw new Error('Server configuration error');
        }
        if (!supabaseUrl || !supabaseAnonKey) {
            console.error("Configuration Error: Database credentials missing");
            throw new Error('Server configuration error');
        }



        // 4. Initialize Supabase Client
        // Remove 'global' headers here, we will pass token explicitly
        const supabaseClient = createClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                auth: {
                    persistSession: false,
                }
            }
        );

        // 5. Get User Details
        const token = authHeader.replace('Bearer ', '');

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError) {
            console.error('Supabase Auth Error:', userError);
            return new Response(JSON.stringify({ error: 'Authentication failed', details: userError.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        if (!user) {
            console.error('User not found in session');
            return new Response(JSON.stringify({ error: 'User not found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        console.log(`User authenticated: ${user.email}`);

        // 6. Prepare Data
        const email = user.email;
        const fullName = user.user_metadata?.full_name || email?.split('@')[0] || 'User';
        const phone = user.user_metadata?.phone || '';

        const nameParts = fullName.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        const orderId = `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const grossAmount = 15000;

        const itemDetails = [{
            id: 'quota-10',
            price: grossAmount,
            quantity: 1,
            name: '10 Use Quota'
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
            custom_field1: user.id,
        };

        // 7. Call Midtrans API
        // 7. Call Midtrans API
        const midtransAuth = btoa(midtransServerKey + ':');
        const response = await fetch(midtransUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Basic ${midtransAuth}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Midtrans API Error Response:', data);
            return new Response(JSON.stringify(data), { // Pass specific error back
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400, // Midtrans error usually user/request error
            });
        }

        console.log("Midtrans transaction created successfully");

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("Internal Server Error:", error);
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
