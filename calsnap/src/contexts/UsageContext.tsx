import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface UsageContextType {
    usageCount: number;
    usageLimit: number; // Added
    isPaid: boolean;
    canUpload: boolean;
    incrementUsage: () => Promise<boolean>; // Changed to Promise
    checkPaymentStatus: () => Promise<void>;
}

const MAX_FREE_USAGE = 5;

const UsageContext = createContext<UsageContextType | undefined>(undefined);

export function UsageProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [usageCount, setUsageCount] = useState(0);
    const [usageLimit, setUsageLimit] = useState(MAX_FREE_USAGE);
    const [isPaid, setIsPaid] = useState(false);

    // Load usage from session storage on mount (for guests)
    useEffect(() => {
        if (!user) {
            const stored = sessionStorage.getItem('calsnap_usage');
            if (stored) {
                setUsageCount(parseInt(stored, 10));
            }
        }
    }, [user]);

    // Check paid status and load usage from DB when user logs in
    useEffect(() => {
        if (user) {
            checkPaymentStatus();
        } else {
            setIsPaid(false);
            setUsageLimit(MAX_FREE_USAGE);
        }
    }, [user]);

    const checkPaymentStatus = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('profiles')
            .select('is_paid, usage_count, usage_limit')
            .eq('id', user.id)
            .single();

        if (!error && data) {
            setIsPaid(data.is_paid || false);
            // If usage_limit is null (legacy), default to 5. 
            // If paid but limit is < 5 (edge case), keep it? 
            // Let's rely on DB value.
            setUsageLimit(data.usage_limit ?? MAX_FREE_USAGE);
            setUsageCount(data.usage_count ?? 0);
        }
    };

    const incrementUsage = async (): Promise<boolean> => {
        if (usageCount >= usageLimit) {
            return false;
        }

        const newCount = usageCount + 1;
        setUsageCount(newCount);

        if (user) {
            // Update DB
            const { error } = await supabase.rpc('increment_usage');
            if (error) {
                console.error('Failed to increment usage in DB:', error);
                // Revert local state if critical? Or just ignore for UX smoothness.
            }
        } else {
            // Update Session Storage
            sessionStorage.setItem('calsnap_usage', newCount.toString());
        }

        return true;
    };

    const canUpload = usageCount < usageLimit;

    const value = {
        usageCount,
        usageLimit,
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
