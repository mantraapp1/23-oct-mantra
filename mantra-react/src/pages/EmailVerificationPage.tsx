import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { ChevronLeft } from 'lucide-react';

export default function EmailVerificationPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const stateData = location.state as { email?: string; username?: string } | null;
    const email = stateData?.email || searchParams.get('email') || '';
    // Username passed for potential future use in onboarding

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(60);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Auto-focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();

        // Check if user is already verified (e.g. forced redirect from signup but backend auto-confirmed)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const isConfirmed = session.user.email_confirmed_at || session.user.phone_confirmed_at;
                if (isConfirmed) {

                    navigate('/onboarding', { replace: true });
                }
            }
        };
        checkSession();
    }, [navigate]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleOtpChange = (value: string, index: number) => {
        // Only allow single digit
        if (value.length > 1) return;

        // Only allow numbers
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            inputRefs.current[5]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpCode = otp.join('');

        if (otpCode.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setIsLoading(true);
        setError('');


        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token: otpCode,
                type: 'signup',
            });

            if (error) {

                throw error;
            }



            if (!data.session) {

                // This can happen if Autoconfirm is off or other settings. But usually verifyOtp logs them in.
            }

            setSuccess('Email verified successfully!');

            // Navigate to onboarding after short delay
            setTimeout(() => {
                navigate('/onboarding', { replace: true });
            }, 500);
        } catch (err: any) {

            setError(err.message || 'Verification failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);
        setError('');

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
            });

            if (error) throw error;

            setSuccess('Verification code sent to your email');
            setOtp(['', '', '', '', '', '']);
            setResendCooldown(60);
            inputRefs.current[0]?.focus();
        } catch (err: any) {
            setError(err.message || 'Failed to resend code. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background-secondary)] font-sans p-4">
            <div className="w-full max-w-md bg-[var(--card)] md:rounded-[var(--radius-xl)] md:shadow-xl md:border md:border-[var(--border)] overflow-hidden transition-all">
                <section className="h-full">
                    <div className="px-6 py-10 md:px-10 md:py-12">
                        {/* Back Button */}
                        <button
                            onClick={() => navigate('/signup')}
                            className="mb-6 flex items-center text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back
                        </button>

                        {/* Header */}
                        <div className="mb-8 text-center md:text-left">
                            <img src="/logo.jpeg" alt="Mantra" className="h-12 w-12 mb-6 rounded-xl mx-auto md:mx-0 shadow-lg shadow-sky-500/20" />
                            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Verify your email</h1>
                            <p className="text-[var(--foreground-secondary)] text-sm mt-2">
                                Enter the 6-digit code sent to <span className="font-medium text-[var(--foreground)]">{email}</span>
                            </p>
                        </div>

                        {/* OTP Input */}
                        <div className="flex justify-between gap-2 mb-6" onPaste={handlePaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => { inputRefs.current[index] = el; }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(e.target.value, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    onFocus={() => setFocusedIndex(index)}
                                    onBlur={() => setFocusedIndex(null)}
                                    className={`w-12 h-14 text-center text-lg font-semibold rounded-xl border-2 outline-none transition-all bg-[var(--card)] text-[var(--foreground)] ${focusedIndex === index
                                        ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20'
                                        : digit
                                            ? 'border-[var(--primary)]'
                                            : 'border-[var(--border)]'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Error/Success Messages */}
                        {error && (
                            <div className="p-3 rounded-lg bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-xs font-medium text-center mb-4 animate-in">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium text-center mb-4 animate-in">
                                {success}
                            </div>
                        )}

                        {/* Verify Button */}
                        <button
                            onClick={handleVerify}
                            disabled={isLoading || otp.join('').length !== 6}
                            className="w-full rounded-xl bg-[var(--primary)] text-white text-sm font-bold py-3 shadow-lg shadow-[var(--primary)]/25 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Verifying...' : 'Verify'}
                        </button>

                        {/* Resend Link */}
                        <div className="text-center text-xs text-[var(--foreground-secondary)] mt-6">
                            Didn't receive the code?{' '}
                            <button
                                onClick={handleResend}
                                disabled={isResending || resendCooldown > 0}
                                className="text-[var(--primary)] font-bold hover:underline disabled:opacity-50"
                            >
                                {isResending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
