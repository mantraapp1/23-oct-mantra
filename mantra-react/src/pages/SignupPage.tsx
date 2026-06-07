import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { checkRateLimit, getRemainingWaitTimeMs } from '@/utils/rateLimiter';

export default function SignupPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<ReactNode>('');


    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // 1. Rate Limiting Check
        // Allow max 3 signup attempts per 2 minutes (120000ms)
        const isAllowed = checkRateLimit('signup-attempt', 3, 120000);
        if (!isAllowed) {
            const remainingMs = getRemainingWaitTimeMs('signup-attempt', 3, 120000);
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            setError(`Too many signup attempts. Please try again in ${remainingSeconds} seconds.`);
            setIsLoading(false);
            return;
        }

        if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
            setError('Username must be 3-20 characters (letters, numbers, underscores only)');
            setIsLoading(false);
            return;
        }

        if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^a-zA-Z0-9]/.test(password)) {
            setError('Password must be at least 8 characters with uppercase, number, and special character');
            setIsLoading(false);
            return;
        }

        // Check if username is already taken
        let usernameCheckData: any = null;
        const { data: userCheckVal, error: usernameError } = await supabase
            .from('profiles')
            .select('username, email, email_confirmed_at')
            .eq('username', username)
            .limit(1);

        if (usernameError) {
            // Fallback in case email_confirmed_at is not in table schema yet
            const { data: fallbackUserCheck, error: fallbackUserError } = await supabase
                .from('profiles')
                .select('username, email')
                .eq('username', username)
                .limit(1);
            if (fallbackUserError) {
                console.error('Error checking username:', fallbackUserError);
            } else {
                usernameCheckData = fallbackUserCheck;
            }
        } else {
            usernameCheckData = userCheckVal;
        }

        if (usernameCheckData && usernameCheckData.length > 0) {
            const registeredEmail = usernameCheckData[0].email;
            const isUnconfirmed = usernameCheckData[0].email_confirmed_at === null;

            if (registeredEmail === email) {
                // User is trying to sign up with the same username & email they already registered.
                // If it is unconfirmed, offer them verification. Otherwise, redirect to login.
                if (isUnconfirmed || usernameCheckData[0].email_confirmed_at === undefined) {
                    setError(
                        <span>
                            You have already registered this account. Please{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/verify-email', { state: { email, username } })}
                                className="underline font-bold hover:text-[var(--primary)] text-[var(--primary)] cursor-pointer"
                            >
                                verify your email now
                            </button>
                            .
                        </span>
                    );
                } else {
                    setError('Email is already registered. Please log in instead.');
                }
            } else {
                setError('Username is already taken');
            }
            setIsLoading(false);
            return;
        }

        // Check if email is already registered
        let emailCheckData: any = null;
        let isEmailUnconfirmed = false;
        
        const { data: emailCheckVal, error: emailError } = await supabase
            .from('profiles')
            .select('email, email_confirmed_at')
            .eq('email', email)
            .limit(1);

        if (emailError) {
            // Fallback in case email_confirmed_at is not in table schema yet
            const { data: fallbackEmailCheck, error: fallbackEmailError } = await supabase
                .from('profiles')
                .select('email')
                .eq('email', email)
                .limit(1);
            if (fallbackEmailError) {
                console.error('Error checking email:', fallbackEmailError);
            } else if (fallbackEmailCheck && fallbackEmailCheck.length > 0) {
                emailCheckData = fallbackEmailCheck;
                isEmailUnconfirmed = true; // Assume unconfirmed for fallback to allow redirection
            }
        } else if (emailCheckVal && emailCheckVal.length > 0) {
            emailCheckData = emailCheckVal;
            isEmailUnconfirmed = emailCheckVal[0].email_confirmed_at === null;
        }

        if (emailCheckData && emailCheckData.length > 0) {
            if (isEmailUnconfirmed) {
                setError(
                    <span>
                        Email is already registered but not verified. Please{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/verify-email', { state: { email, username } })}
                            className="underline font-bold hover:text-[var(--primary)] text-[var(--primary)] cursor-pointer"
                        >
                            verify your email now
                        </button>
                        .
                    </span>
                );
            } else {
                setError('Email is already registered. Please log in instead.');
            }
            setIsLoading(false);
            return;
        }

        // Sign up
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                },
            },
        });

        if (error) {

            setError(error.message);
            setIsLoading(false);
            return;
        }



        if (data.user && data.session) {
            // Try to create profile (may fail if no session, that's OK - the DB trigger handles it)
            try {
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    username,
                    email,
                });
            } catch {
                // Profile upsert may fail if no session - expected, DB trigger handles it
            }
        }

        // ALWAYS redirect to verify-email after signup
        // The verify-email page will handle both cases:
        // 1. Email confirmation enabled: user enters OTP
        // 2. Email confirmation disabled: page detects session and auto-redirects
        setIsLoading(false);
        navigate('/verify-email', { state: { email, username } });
    };



    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background-secondary)] font-sans p-4">
            <div className="w-full max-w-md bg-[var(--card)] md:rounded-[var(--radius-xl)] md:shadow-xl md:border md:border-[var(--border)] overflow-hidden transition-all">
                <section className="h-full">
                    <div className="px-6 py-10 md:px-10 md:py-12">
                        <div className="mb-8 text-center md:text-left">
                            <img src="/logo-circle.png" alt="Mantra" className="h-12 w-12 mb-6 rounded-xl mx-auto md:mx-0 shadow-lg shadow-sky-500/20" />
                            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Create account</h1>
                            <p className="text-[var(--foreground-secondary)] text-sm mt-2">Join us and start reading today</p>
                        </div>

                        <form onSubmit={handleSignup} className="space-y-5">
                            <div>
                                <label htmlFor="username-input" className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1.5">Username</label>
                                <Input
                                    id="username-input"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="username"
                                    autoComplete="username"
                                    className="bg-[var(--input-background)] border-[var(--border)]"
                                />
                            </div>

                            <div>
                                <label htmlFor="email-input" className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1.5">Email</label>
                                <Input
                                    id="email-input"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    className="bg-[var(--input-background)] border-[var(--border)]"
                                />
                            </div>

                            <div>
                                <label htmlFor="password-input" className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1.5">Password</label>
                                <Input
                                    id="password-input"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                    className="bg-[var(--input-background)] border-[var(--border)]"
                                />
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
                                {isLoading ? 'Creating account...' : 'Sign Up'}
                            </Button>

                            <div className="text-center text-xs text-[var(--foreground-secondary)] mt-6">
                                Already have an account?{' '}
                                <Link to="/login" className="text-[var(--primary)] font-bold hover:underline">
                                    Log in
                                </Link>
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
}
