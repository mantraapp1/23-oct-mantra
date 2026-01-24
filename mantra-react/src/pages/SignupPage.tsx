import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const supabase = createClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
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
            <div className="min-h-screen flex items-center justify-center px-4 bg-white font-inter text-slate-800">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl text-emerald-600">✉️</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h1>
                    <p className="text-slate-500 mb-6">
                        We've sent a verification link to <strong>{email}</strong>
                    </p>
                    <Link to="/login" className="text-sky-600 hover:text-sky-700 font-semibold hover:underline">
                        Back to login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white md:bg-slate-50 font-inter text-slate-800">
            <div className="w-full max-w-md bg-white md:rounded-2xl md:shadow-xl md:border md:border-slate-100 overflow-hidden">
                <section className="h-full">
                    <div className="px-5 py-12 md:px-8 md:py-12">
                        <div className="mb-8 text-center md:text-left">
                            <img src="/logo.jpeg" alt="Mantra" className="h-12 w-auto mb-4 rounded-lg mx-auto md:mx-0" />
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create account</h1>
                            <p className="text-slate-500 text-sm mt-2">Join us and start reading today</p>
                        </div>

                        <form onSubmit={handleSignup} className="space-y-5" noValidate>
                            <div>
                                <label htmlFor="username-input" className="block text-xs font-medium text-slate-700 mb-1.5">Username</label>
                                <input
                                    id="username-input"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white placeholder:text-slate-400 transition-all"
                                    placeholder="username"
                                    autoComplete="username"
                                />
                            </div>

                            <div>
                                <label htmlFor="email-input" className="block text-xs font-medium text-slate-700 mb-1.5">Email</label>
                                <input
                                    id="email-input"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white placeholder:text-slate-400 transition-all"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                />
                            </div>

                            <div>
                                <label htmlFor="password-input" className="block text-xs font-medium text-slate-700 mb-1.5">Password</label>
                                <input
                                    id="password-input"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white placeholder:text-slate-400 transition-all"
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
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
                                {isLoading ? 'Creating account...' : 'Sign Up'}
                            </button>

                            <div className="text-center text-xs text-slate-500 mt-4">
                                Already have an account?{' '}
                                <Link to="/login" className="text-sky-600 hover:text-sky-700 font-semibold hover:underline">
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
