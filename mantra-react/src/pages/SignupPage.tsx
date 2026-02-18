import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignupPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');


    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setIsLoading(false);
            return;
        }

        console.log('[Signup] Starting signup for:', email);

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
            console.error('[Signup] Error:', error);
            setError(error.message);
            setIsLoading(false);
            return;
        }

        console.log('[Signup] Success:', data);

        if (data.user) {
            console.log('[Signup] Creating profile for:', data.user.id);
            await supabase.from('profiles').upsert({
                id: data.user.id,
                username,
                email,
            });
        }


        if (data.session) {
            console.log('[Signup] Session created immediately (Email verification disabled?)');
            // Email verification is disabled in Supabase, user is auto-confirmed and logged in
            setIsLoading(false);
            navigate('/onboarding');
        } else if (data.user && !data.session) {
            console.log('[Signup] User created but no session (Email verification required)');
            // Email verification is enabled, user needs to verify
            setIsLoading(false);
            navigate(`/verify-email?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}`);
        } else {
            console.warn('[Signup] Unexpected state: No user and no session');
            setError('Something went wrong during signup. Please try again.');
            setIsLoading(false);
        }
    };



    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background-secondary)] font-sans p-4">
            <div className="w-full max-w-md bg-[var(--card)] md:rounded-[var(--radius-xl)] md:shadow-xl md:border md:border-[var(--border)] overflow-hidden transition-all">
                <section className="h-full">
                    <div className="px-6 py-10 md:px-10 md:py-12">
                        <div className="mb-8 text-center md:text-left">
                            <img src="/logo.jpeg" alt="Mantra" className="h-12 w-12 mb-6 rounded-xl mx-auto md:mx-0 shadow-lg shadow-sky-500/20" />
                            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Create account</h1>
                            <p className="text-[var(--foreground-secondary)] text-sm mt-2">Join us and start reading today</p>
                        </div>

                        <form onSubmit={handleSignup} className="space-y-5" noValidate>
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
