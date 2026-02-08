// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility to handle Deno global for non-Deno environments (IDE)
declare const Deno: any;

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const notification = await req.json();
        console.log('Received Midtrans Notification:', notification);

        const orderId = notification.order_id;
        const transactionStatus = notification.transaction_status;
        const fraudStatus = notification.fraud_status;
        // Midtrans custom fields might be at root or inside meta, checking root as per implementation in create-midtrans-token
        const customField1 = notification.custom_field1;

        console.log(`Order ID: ${orderId}, Status: ${transactionStatus}, Fraud: ${fraudStatus}, User: ${customField1}`);

        if (transactionStatus == 'capture') {
            if (fraudStatus == 'challenge') {
                // DO NOT accept
                console.log('Transaction challenged.');
                return new Response(JSON.stringify({ status: 'challenged' }), { headers: corsHeaders });
            } else if (fraudStatus == 'accept') {
                // Accept
                await handleSuccess(orderId, customField1);
            }
        } else if (transactionStatus == 'settlement') {
            // Accept
            await handleSuccess(orderId, customField1);
        } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
            // Ignore or log
            console.log('Transaction failed/cancelled.');
        } else if (transactionStatus == 'pending') {
            // Waiting
            console.log('Transaction pending.');
        }

        return new Response(JSON.stringify({ status: 'ok' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error('Error processing webhook:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});

async function handleSuccess(orderId: string, customField1?: string) {
    console.log(`Processing success for order: ${orderId}, User ID: ${customField1}`);

    if (!customField1) {
        console.error(`No User ID found in custom_field1 for order: ${orderId}`);
        return;
    }

    const userId = customField1;
    const creditsToAdd = 10; // Hardcoded 10 credits

    // Initialize Admin Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to update using RPC if available, or fallback to direct table update on 'profiles'
    // We try 'admin_add_credits' RPC first
    const { error } = await supabase.rpc('admin_add_credits', {
        target_user_id: userId,
        credits_amount: creditsToAdd
    });

    if (error) {
        console.warn('RPC admin_add_credits failed or not found, falling back to direct update:', error.message);

        // Fetch current profile to get current usage_limit
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('usage_limit')
            .eq('id', userId)
            .single();

        if (fetchError || !profile) {
            console.error('Profile not found or error fetching:', fetchError);
            return;
        }

        const newLimit = (profile.usage_limit || 0) + creditsToAdd;

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ usage_limit: newLimit })
            .eq('id', userId);

        if (updateError) {
            console.error('Failed to update profile directly:', updateError);
        } else {
            console.log(`Successfully added ${creditsToAdd} credits to user ${userId} (Direct Update)`);
        }
    } else {
        console.log(`Successfully added ${creditsToAdd} credits to user ${userId} (RPC)`);
    }
}
