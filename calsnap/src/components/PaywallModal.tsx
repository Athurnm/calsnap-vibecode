import * as React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUsage } from '../contexts/UsageContext';
import { createTransaction, loadSnapScript } from '../services/payment';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
    const { user, signInWithGoogle } = useAuth();
    const { checkPaymentStatus } = useUsage();
    const [loading, setLoading] = React.useState(false);

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
                        toast.success('Payment successful! You are now a premium member.');
                        await checkPaymentStatus(); // Refresh status
                        onClose();
                    },
                    onPending: (result: any) => {
                        console.log('Payment pending', result);
                        toast.info('Payment pending. Please complete payment.');
                    },
                    onError: (result: any) => {
                        console.error('Payment error', result);
                        toast.error('Payment failed. Please try again.');
                    },
                    onClose: () => {
                        console.log('Customer closed the popup without finishing payment');
                    }
                });
            } else {
                toast.error('Payment system not initialized. Please try again later.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to initiate payment.');
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
                        Unlock Unlimited Uploads
                    </h2>
                    <p className="text-gray-600 mb-8">
                        You've reached your free limit of 5 uploads. Upgrade to Premium to continue analyzing your schedules.
                    </p>

                    <div className="space-y-4 mb-8 text-left bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-green-100 rounded-full p-1">
                                <Check size={12} className="text-green-600" />
                            </div>
                            <span className="text-sm text-gray-700">100 uploads per month</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-green-100 rounded-full p-1">
                                <Check size={12} className="text-green-600" />
                            </div>
                            <span className="text-sm text-gray-700">Support for Image & Text processing</span>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-green-100 rounded-full p-1">
                                <Check size={12} className="text-green-600" />
                            </div>
                            <span className="text-sm text-gray-700">Premium support</span>
                        </div>
                    </div>

                    {!user ? (
                        <div className="space-y-3">
                            <button
                                onClick={signInWithGoogle}
                                disabled={loading}
                                className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors shadow-lg shadow-gray-200"
                            >
                                Sign in to Upgrade
                            </button>
                            <p className="text-xs text-gray-500 mt-2">
                                You need to sign in first to associate your subscription.
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
                                    {loading ? 'Processing...' : 'Upgrade for IDR 15.000'}
                                </button>
                            ) : (
                                <button
                                    disabled
                                    className="w-full py-3 px-4 bg-gray-100 text-gray-400 rounded-xl font-medium cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    Payments Temporarily Disabled
                                </button>
                            )}
                        </>
                    )}

                    <p className="mt-6 text-xs text-gray-400">
                        Secure payment via Midtrans QRIS / E-Wallet
                    </p>
                </div>
            </div>
        </div>
    );
}
