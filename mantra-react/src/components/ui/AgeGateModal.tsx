import { ShieldAlert, LogIn, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AgeGateModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    novelTitle?: string;
}

/**
 * Age Gate Modal for mature content verification
 * - Logged-in users: Can confirm and proceed
 * - Anonymous users: Must login/signup to verify age
 */
export default function AgeGateModal({ isOpen, onConfirm, onCancel, novelTitle }: AgeGateModalProps) {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleLoginRedirect = () => {
        // Store the intended destination
        sessionStorage.setItem('redirect_after_login', window.location.pathname);
        navigate('/login');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 animate-in fade-in duration-200"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 p-1 text-foreground-secondary/50 hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="p-6 text-center">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="w-8 h-8 text-red-500" />
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-foreground mb-2">
                        Mature Content Warning
                    </h2>

                    {/* Description */}
                    <p className="text-foreground-secondary text-sm leading-relaxed mb-2">
                        {novelTitle ? (
                            <>
                                <span className="font-semibold text-foreground">"{novelTitle}"</span> contains mature content intended for adults only.
                            </>
                        ) : (
                            'This novel contains mature content intended for adults only.'
                        )}
                    </p>

                    <p className="text-foreground-secondary text-sm leading-relaxed mb-6">
                        This may include explicit themes, violence, or adult situations.
                        You must be <span className="font-bold text-red-500">18 years or older</span> to view this content.
                    </p>

                    {/* Actions */}
                    {user ? (
                        // Logged-in user: Show confirm/cancel
                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 px-4 py-3 text-sm font-semibold text-foreground-secondary bg-secondary hover:bg-secondary/80 rounded-xl transition-colors"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-lg shadow-red-500/20"
                            >
                                I'm 18+, Continue
                            </button>
                        </div>
                    ) : (
                        // Anonymous user: Must login
                        <div className="space-y-3">
                            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                                You need to verify your age to view mature content. Please login or create an account.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-3 text-sm font-semibold text-foreground-secondary bg-secondary hover:bg-secondary/80 rounded-xl transition-colors"
                                >
                                    Go Back
                                </button>
                                <button
                                    onClick={handleLoginRedirect}
                                    className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
                                >
                                    <LogIn className="w-4 h-4" />
                                    Login / Sign Up
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
