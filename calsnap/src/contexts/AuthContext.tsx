import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import posthog from 'posthog-js';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const identifyUser = (user: User) => {
        posthog.identify(user.id, {
            email: user.email,
            name: user.user_metadata?.full_name
        });
    };

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            if (session?.user) {
                identifyUser(session.user);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);

            if (session?.user) {
                identifyUser(session.user);
            } else if (_event === 'SIGNED_OUT') {
                posthog.reset();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
            },
        });
        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        posthog.reset();
    };

    const value = {
        session,
        user,
        loading,
        signInWithGoogle,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
