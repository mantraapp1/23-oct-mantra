import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

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
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background-secondary)] font-sans p-4">
            <div className="w-full max-w-md bg-[var(--card)] md:rounded-[var(--radius-xl)] md:shadow-xl md:border md:border-[var(--border)] overflow-hidden transition-all">
                <section className="h-full">
                    <div className="px-6 py-10 md:px-10 md:py-12">
                        <div className="mb-8 text-center md:text-left">
                            <img src="/logo.jpeg" alt="Mantra" className="h-12 w-12 mb-6 rounded-xl mx-auto md:mx-0 shadow-lg shadow-sky-500/20" />
                            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">Welcome back</h1>
                            <p className="text-[var(--foreground-secondary)] text-sm mt-2">Sign in to continue your reading journey</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5" noValidate>
                            <div>
                                <label htmlFor="email-input" className="block text-xs font-medium text-[var(--foreground-secondary)] mb-1.5">Email</label>
                                <Input
                                    id="email-input"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    autoFocus
                                    className="bg-[var(--input-background)] border-[var(--border)]"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="password-input" className="block text-xs font-medium text-[var(--foreground-secondary)]">Password</label>
                                    <Link to="/reset-password">
                                        <button type="button" className="text-xs font-semibold text-[var(--primary)] hover:underline">Forgot password?</button>
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password-input"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
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
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </Button>

                            <div className="text-center text-xs text-[var(--foreground-secondary)] mt-6">
                                Don't have an account?{' '}
                                <Link to="/signup" className="text-[var(--primary)] font-bold hover:underline">
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
