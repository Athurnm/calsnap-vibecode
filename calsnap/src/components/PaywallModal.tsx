import * as React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUsage } from '../contexts/UsageContext';
import { useLanguage } from '../context/LanguageContextCore';
import { createTransaction, loadSnapScript } from '../services/payment';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
    const { t } = useLanguage();
    const { user, signInWithGoogle } = useAuth();
    const { checkPaymentStatus, usageLimit } = useUsage();
    const [loading, setLoading] = React.useState(false);
    const isRefill = usageLimit > 5;

    if (!isOpen) return null;

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            await loadSnapScript();
            const { token } = await createTransaction();

            // Open Snap Popup
            if (window.snap) {
                window.snap.pay(token, {
                    onSuccess: async (result: any) => {
                        console.log('Payment success', result);
                        toast.success(t('paywall.success'));

                        // Optimistically update or call RPC to add credits
                        // For now we rely on the manual check, but since we don't have a webhook listener updating DB instantly,
                        // checking profile might not show changes yet unless the backend updated it.
                        // We will call the add_credits RPC from here for immediate update (client-side trust for MVP)
                        // In production, this should be done via webhook to edge function.
                        try {
                            // Assuming user is authenticated if they paid
                            const { error } = await import('../lib/supabase').then(m => m.supabase.rpc('add_credits', { credits_to_add: 10 }));
                            if (error) console.error('Error adding credits:', error);
                        } catch (err) {
                            console.error('Error calling rpc:', err);
                        }

                        await checkPaymentStatus(); // Refresh status
                        onClose();
                    },
                    onPending: (result: any) => {
                        console.log('Payment pending', result);
                        toast.info(t('paywall.pending'));
                    },
                    onError: (result: any) => {
                        console.error('Payment error', result);
                        toast.error(t('paywall.error'));
                    },
                    onClose: () => {
                        console.log('Customer closed the popup without finishing payment');
                    }
                });
            } else {
                toast.error(t('paywall.error.system'));
            }
        } catch (error) {
            console.error(error);
            toast.error(t('paywall.error.init'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">🚀</span>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {isRefill ? t('paywall.title.refill') : t('paywall.title')}
                    </h2>
                    <p className="text-gray-600 mb-8">
                        {isRefill
                            ? t('paywall.subtitle.refill')
                            : t('paywall.subtitle')}
                    </p>

                    <div className="space-y-4 mb-8 text-left bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-green-100 rounded-full p-1">
                                <Check size={12} className="text-green-600" />
                            </div>
                            <span className="text-sm text-gray-700">{t('paywall.benefit.1')}</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-green-100 rounded-full p-1">
                                <Check size={12} className="text-green-600" />
                            </div>
                            <span className="text-sm text-gray-700">{t('paywall.benefit.2')}</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-green-100 rounded-full p-1">
                                <Check size={12} className="text-green-600" />
                            </div>
                            <span className="text-sm text-gray-700">{t('paywall.benefit.3')}</span>
                        </div>
                    </div>

                    {!user ? (
                        <div className="space-y-3">
                            <button
                                onClick={signInWithGoogle}
                                disabled={loading}
                                className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors shadow-lg shadow-gray-200"
                            >
                                {t('paywall.signin')}
                            </button>
                            <p className="text-xs text-gray-500 mt-2">
                                {t('paywall.signin.note')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {import.meta.env.VITE_ENABLE_PAYMENT === 'true' ? (
                                <button
                                    onClick={handleUpgrade}
                                    disabled={loading}
                                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                                >
                                    {loading ? t('paywall.processing') : t('paywall.upgrade')}
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="w-full py-3 px-4 bg-gray-100 text-gray-400 rounded-xl font-medium cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {t('paywall.disabled')}
                                </button>
                            )}
                        </>
                    )}

                    <p className="mt-6 text-xs text-gray-400">
                        {t('paywall.secure')}
                    </p>
                </div>
            </div>
        </div>
    );
}
