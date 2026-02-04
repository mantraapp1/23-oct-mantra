import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff } from 'lucide-react';

export default function UpdatePasswordPage() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isValidSession, setIsValidSession] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);

    // Check if user has a valid recovery session
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            // User needs a session from the recovery link
            if (session) {
                setIsValidSession(true);
            }
            setCheckingSession(false);
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            setSuccess(true);

            // Redirect to login after short delay
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to update password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background-secondary)]">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isValidSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background-secondary)] font-sans p-4">
                <div className="w-full max-w-md bg-[var(--card)] md:rounded-[var(--radius-xl)] md:shadow-xl md:border md:border-[var(--border)] overflow-hidden transition-all">
                    <section className="h-full">
                        <div className="px-6 py-10 md:px-10 md:py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-[var(--destructive)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mb-2">Invalid or Expired Link</h1>
                            <p className="text-[var(--foreground-secondary)] text-sm mb-6">
                                This password reset link is invalid or has expired. Please request a new one.
                            </p>
                            <Link
                                to="/reset-password"
                                className="inline-block px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl font-bold text-sm"
                            >
                                Request New Link
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background-secondary)] font-sans p-4">
                <div className="w-full max-w-md bg-[var(--card)] md:rounded-[var(--radius-xl)] md:shadow-xl md:border md:border-[var(--border)] overflow-hidden transition-all">
                    <section className="h-full">
                        <div className="px-6 py-10 md:px-10 md:py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mb-2">Password Updated!</h1>
                            <p className="text-[var(--foreground-secondary)] text-sm mb-6">
                                Your password has been successfully updated. Redirecting to login...
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background-secondary)] font-sans p-4">
            <div className="w-full max-w-md bg-[var(--card)] md:rounded-[var(--radius-xl)] md:shadow-xl md:border md:border-[var(--border)] overflow-hidden transition-all">
                <section className="h-full">
                    <div className="px-6 py-10 md:px-10 md:py-12">
                        <div className="mb-8 text-center md:text-left">
                            <img src="/logo.jpeg" alt="Mantra" className="h-12 w-12 mb-6 rounded-xl mx-auto md:mx-0 shadow-lg shadow-sky-500/20" />
                            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Set new password</h1>
                            <p className="text-[var(--foreground-secondary)] text-sm mt-2">Enter your new password below</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                            <div>
                                <label htmlFor="password-input" className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1.5">New Password</label>
                                <div className="relative">
                                    <Input
                                        id="password-input"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                        placeholder="••••••••"
                                        autoFocus
                                        className="bg-[var(--input-background)] border-[var(--border)]"
                                        endIcon={
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="hover:text-[var(--foreground)] transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        }
                                    />
                                </div>
                                <p className="text-xs text-[var(--foreground-secondary)] mt-1">Minimum 6 characters</p>
                            </div>

                            <div>
                                <label htmlFor="confirm-password-input" className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <Input
                                        id="confirm-password-input"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                                        placeholder="••••••••"
                                        className="bg-[var(--input-background)] border-[var(--border)]"
                                        endIcon={
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="hover:text-[var(--foreground)] transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        }
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 text-[var(--destructive)] text-xs font-medium text-center animate-in">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                fullWidth
                                size="lg"
                                isLoading={isLoading}
                                className="font-bold shadow-lg shadow-[var(--primary)]/25"
                            >
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </Button>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
}
