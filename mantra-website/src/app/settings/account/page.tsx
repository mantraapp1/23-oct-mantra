'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AccountSettingsPage() {
    const router = useRouter();
    const supabase = createClient();

    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setEmail(user.email || '');
        setIsLoading(false);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newPassword) {
            setError('New password is required');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            setSuccess('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.message || 'Failed to update password');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
        if (!confirm('All your novels, chapters, and data will be permanently deleted. Continue?')) return;

        // Note: Actual account deletion would require a backend function
        alert('Please contact support to delete your account.');
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-8 font-inter text-slate-800">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/settings" className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
            </div>

            <div className="space-y-8">
                {/* Email Section */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                    <h2 className="text-sm font-bold text-slate-700 mb-3">Email Address</h2>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-600">{email}</span>
                        <span className="text-xs text-emerald-600 font-semibold">Verified</span>
                    </div>
                </div>

                {/* Change Password Section */}
                <form onSubmit={handleChangePassword} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                    <h2 className="text-sm font-bold text-slate-700">Change Password</h2>

                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
                            {success}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-sky-500 text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50 text-sm"
                    >
                        {isSubmitting ? 'Updating...' : 'Update Password'}
                    </button>
                </form>

                {/* Danger Zone */}
                <div className="bg-white border border-rose-200 rounded-xl p-5">
                    <h2 className="text-sm font-bold text-rose-700 mb-3">Danger Zone</h2>
                    <p className="text-xs text-slate-500 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button
                        onClick={handleDeleteAccount}
                        className="w-full py-2.5 border border-rose-200 text-rose-600 rounded-lg font-semibold hover:bg-rose-50 transition-colors text-sm"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
}
