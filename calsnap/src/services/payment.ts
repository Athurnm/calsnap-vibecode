import { supabase } from '../lib/supabase';

interface SnapResponse {
    token: string;
    redirect_url: string;
}

export const createTransaction = async (): Promise<SnapResponse> => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        throw new Error('User must be logged in to make a payment');
    }

    // Call Supabase Edge Function to get Snap Token
    // We assume there is an edge function named 'create-midtrans-token'
    const { data, error } = await supabase.functions.invoke('create-midtrans-token', {
        body: {},
    });

    if (error) {
        console.error('Error creating transaction:', error);
        throw new Error('Failed to create transaction');
    }

    return data as SnapResponse;
};

export const loadSnapScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const scriptId = 'midtrans-snap-script';
        if (document.getElementById(scriptId)) {
            resolve();
            return;
        }

        const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
        const snapUrl = import.meta.env.VITE_MIDTRANS_SNAP_URL || 'https://app.sandbox.midtrans.com/snap/snap.js';

        if (!clientKey) {
            reject(new Error('Midtrans Client Key not found in environment variables.'));
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = snapUrl;
        script.setAttribute('data-client-key', clientKey);
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Midtrans Snap script.'));
        document.body.appendChild(script);
    });
};

// Types for Midtrans Snap
declare global {
    interface Window {
        snap: {
            pay: (
                token: string,
                options: {
                    onSuccess: (result: any) => void;
                    onPending: (result: any) => void;
                    onError: (result: any) => void;
                    onClose: () => void;
                }
            ) => void;
        };
    }
}
