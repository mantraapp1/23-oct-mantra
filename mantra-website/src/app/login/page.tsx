'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            router.push('/');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white md:bg-slate-50 font-inter text-slate-800">
            <div className="w-full max-w-md bg-white md:rounded-2xl md:shadow-xl md:border md:border-slate-100 overflow-hidden">
                <section className="h-full">
                    <div className="px-5 py-12 md:px-8 md:py-12">
                        <div className="mb-8 text-center md:text-left">
                            <img src="/logo.jpeg" alt="Mantra" className="h-12 w-auto mb-4 rounded-lg mx-auto md:mx-0" />
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h1>
                            <p className="text-slate-500 text-sm mt-2">Sign in to continue your reading journey</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5" noValidate>
                            <div>
                                <label htmlFor="email-input" className="block text-xs font-medium text-slate-700 mb-1.5">Email</label>
                                <input
                                    id="email-input"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white placeholder:text-slate-400 transition-all"
                                    placeholder="you@example.com"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="password-input" className="block text-xs font-medium text-slate-700">Password</label>
                                    <Link href="/reset-password">
                                        <button type="button" className="text-xs font-semibold text-sky-600 hover:text-sky-700">Forgot password?</button>
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password-input"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white placeholder:text-slate-400 transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-medium text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full rounded-xl bg-sky-500 text-white text-sm font-semibold py-3 active:scale-[0.98] shadow-sm hover:bg-sky-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </button>

                            <div className="text-center text-xs text-slate-500 mt-4">
                                Don't have an account?{' '}
                                <Link href="/signup" className="text-sky-600 hover:text-sky-700 font-semibold hover:underline">
                                    Create one now
                                </Link>
                            </div>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
}
