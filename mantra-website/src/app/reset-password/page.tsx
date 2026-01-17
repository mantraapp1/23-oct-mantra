'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Email is required');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/settings/account`,
            });

            if (resetError) throw resetError;

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center font-inter">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h1>
                <p className="text-slate-500 mb-6">
                    We've sent a password reset link to <strong>{email}</strong>
                </p>
                <Link href="/login" className="text-sky-600 font-semibold hover:underline">
                    Back to Login
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto px-4 py-16 font-inter text-slate-800">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h1>
                <p className="text-slate-500">Enter your email to receive a reset link</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </button>

                <p className="text-center text-sm text-slate-500">
                    Remember your password?{' '}
                    <Link href="/login" className="text-sky-600 font-semibold hover:underline">
                        Login
                    </Link>
                </p>
            </form>
        </div>
    );
}
