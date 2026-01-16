'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

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

        // Create profile
        if (data.user) {
            await supabase.from('profiles').upsert({
                id: data.user.id,
                username,
                email,
            });
        }

        setSuccess(true);
        setIsLoading(false);
    };

    if (success) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✉️</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Check your email</h1>
                    <p className="text-[var(--foreground-secondary)] mb-6">
                        We've sent a verification link to <strong>{email}</strong>
                    </p>
                    <Link href="/login" className="text-[var(--primary)] hover:underline">
                        Back to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span className="text-white font-bold text-2xl">M</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">Create Account</h1>
                    <p className="text-[var(--foreground-secondary)] mt-1">Join the Mantra community</p>
                </div>

                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                minLength={3}
                                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                placeholder="Choose a username"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                placeholder="Enter your email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                placeholder="Create a password (min 6 chars)"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-[var(--primary)] text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-xs text-[var(--foreground-secondary)] mt-4">
                        By signing up, you agree to our{' '}
                        <Link href="/terms" className="text-[var(--primary)] hover:underline">Terms</Link>
                        {' '}and{' '}
                        <Link href="/privacy" className="text-[var(--primary)] hover:underline">Privacy Policy</Link>
                    </p>

                    <p className="text-center text-sm text-[var(--foreground-secondary)] mt-6">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[var(--primary)] hover:underline font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
