import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface UsageContextType {
    usageCount: number;
    isPaid: boolean;
    canUpload: boolean;
    incrementUsage: () => boolean;
    checkPaymentStatus: () => Promise<void>;
}

const MAX_FREE_USAGE = 5;

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [usageCount, setUsageCount] = useState(0);
    const [isPaid, setIsPaid] = useState(false);

    // Load usage from session storage on mount
    useEffect(() => {
        const stored = sessionStorage.getItem('calsnap_usage');
        if (stored) {
            setUsageCount(parseInt(stored, 10));
        }
    }, []);

    // Check paid status when user logs in
    useEffect(() => {
        if (user) {
            checkPaymentStatus();
        } else {
            setIsPaid(false);
        }
    }, [user]);

    const checkPaymentStatus = async () => {
        if (!user) return;

        // In a real app, you might want to cache this or use a subscription
        const { data, error } = await supabase
            .from('profiles')
            .select('is_paid')
            .eq('id', user.id)
            .single();

        if (!error && data) {
            setIsPaid(data.is_paid || false);
        }
    };

    const incrementUsage = (): boolean => {
        if (isPaid) return true;

        if (usageCount >= MAX_FREE_USAGE) {
            return false;
        }

        const newCount = usageCount + 1;
        setUsageCount(newCount);
        sessionStorage.setItem('calsnap_usage', newCount.toString());
        return true;
    };

    const canUpload = isPaid || usageCount < MAX_FREE_USAGE;

    const value = {
        usageCount,
        isPaid,
        canUpload,
        incrementUsage,
        checkPaymentStatus,
    };

    return <UsageContext.Provider value={value}>{children}</UsageContext.Provider>;
}

export const useUsage = () => {
    const context = useContext(UsageContext);
    if (context === undefined) {
        throw new Error('useUsage must be used within an UsageProvider');
    }
    return context;
};
