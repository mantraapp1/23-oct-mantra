import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Eye, EyeOff, Info, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase/client';

export default function AccountSettingsPage() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { toast } = useToast();

    // Email change state
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [emailPassword, setEmailPassword] = useState('');
    const [showEmailPassword, setShowEmailPassword] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);

    // Password change state
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Delete account state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleEmailChange = async () => {
        setEmailError('');
        if (!newEmail || !newEmail.includes('@')) {
            setEmailError('Please enter a valid email address');
            return;
        }
        if (!emailPassword) {
            setEmailError('Password is required');
            return;
        }

        setEmailLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;
            toast.success('Verification email sent to ' + newEmail);
            setShowEmailForm(false);
            setNewEmail('');
            setEmailPassword('');
        } catch (err: any) {
            setEmailError(err.message || 'Failed to update email');
        } finally {
            setEmailLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        setPasswordError('');
        if (!currentPassword) {
            setPasswordError('Current password is required');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords don't match");
            return;
        }

        setPasswordLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success('Password updated successfully!');
            setShowPasswordForm(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordError(err.message || 'Failed to update password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteError('');
        if (deleteConfirmText !== 'DELETE') {
            setDeleteError('Please type DELETE to confirm');
            return;
        }
        if (!deletePassword) {
            setDeleteError('Password is required');
            return;
        }

        setDeleteLoading(true);
        try {
            // In production, this would call a backend endpoint
            await signOut();
            navigate('/login');
        } catch (err: any) {
            setDeleteError(err.message || 'Failed to delete account');
        } finally {
            setDeleteLoading(false);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-background font-sans">
            {/* Header */}
            <div className="sticky top-0 bg-background z-40 border-b border-border">
                <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2">
                    <button onClick={() => navigate('/settings')} className="p-2 rounded-lg hover:bg-background-secondary active:scale-95">
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <div className="text-base font-semibold text-foreground">Account Settings</div>
                </div>
            </div>

            <div className="max-w-[1800px] mx-auto px-4 pt-4 pb-24 space-y-6">
                {/* Email Section */}
                <div>
                    <div className="text-sm font-semibold mb-2 text-foreground">Email Address</div>
                    <div className="rounded-xl border border-border p-3 bg-card">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="text-xs text-foreground-secondary">Current Email</div>
                                <div className="text-sm font-semibold mt-0.5 text-foreground">{user?.email || 'you@example.com'}</div>
                            </div>
                            <button
                                onClick={() => setShowEmailForm(!showEmailForm)}
                                className="px-3 py-1.5 rounded-lg border border-border text-xs bg-card hover:bg-background-secondary text-foreground"
                            >
                                {showEmailForm ? 'Cancel' : 'Change'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Change Email Form */}
                {showEmailForm && (
                    <div className="space-y-3">
                        <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-500/5 p-3">
                            <div className="flex gap-2">
                                <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-sky-900 dark:text-sky-200">
                                    We'll send a verification code to your new email address to confirm the change.
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">New Email Address</label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                placeholder="new@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showEmailPassword ? "text" : "password"}
                                    value={emailPassword}
                                    onChange={(e) => setEmailPassword(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-sky-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    placeholder="Enter current password"
                                />
                                <button onClick={() => setShowEmailPassword(!showEmailPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        {emailError && <div className="text-xs text-red-500">{emailError}</div>}
                        <button
                            onClick={handleEmailChange}
                            disabled={emailLoading}
                            className="w-full rounded-xl bg-sky-500 text-white text-sm font-semibold py-2.5 shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            {emailLoading ? 'Updating...' : 'Update Email'}
                        </button>
                    </div>
                )}

                {/* Password Section */}
                <div>
                    <div className="text-sm font-semibold mb-2 text-foreground">Password</div>
                    <button
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:bg-background-secondary bg-card"
                    >
                        <span className="text-sm text-foreground">Change Password</span>
                        <ChevronRight className="w-4 h-4 text-foreground-secondary" />
                    </button>
                </div>

                {/* Change Password Form */}
                {showPasswordForm && (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-foreground-secondary mb-1">Current Password</label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full rounded-xl border border-border px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-sky-500 bg-card text-foreground"
                                    placeholder="Enter current password"
                                />
                                <button onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary hover:text-foreground">
                                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-foreground-secondary mb-1">New Password</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full rounded-xl border border-border px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-sky-500 bg-card text-foreground"
                                    placeholder="Enter new password"
                                />
                                <button onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary hover:text-foreground">
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">Minimum 8 characters</div>
                        </div>
                        <div>
                            <label className="block text-xs text-foreground-secondary mb-1">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full rounded-xl border border-border px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-sky-500 bg-card text-foreground"
                                    placeholder="Re-enter new password"
                                />
                                <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-secondary hover:text-foreground">
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        {passwordError && <div className="text-xs text-red-500">{passwordError}</div>}
                        <div className="flex gap-2">
                            <button onClick={() => setShowPasswordForm(false)} className="flex-1 rounded-xl border border-border bg-card text-sm font-semibold py-2.5 hover:bg-background-secondary text-foreground">
                                Cancel
                            </button>
                            <button onClick={handlePasswordChange} disabled={passwordLoading} className="flex-1 rounded-xl bg-sky-500 text-white text-sm font-semibold py-2.5 shadow-sm active:scale-95 disabled:opacity-50">
                                {passwordLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Danger Zone */}
                <div>
                    <div className="text-sm font-semibold mb-2 text-rose-600 dark:text-rose-400">Danger Zone</div>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50"
                    >
                        <div className="text-left">
                            <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">Delete Account</div>
                            <div className="text-xs text-rose-500 dark:text-rose-300 mt-0.5">Permanently delete your account and data</div>
                        </div>
                        <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    </button>
                </div>

                {/* Account Info */}
                <div className="rounded-xl border border-border p-4 bg-muted/30">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Account Created</span>
                            <span className="text-xs text-foreground font-semibold">{formatDate(user?.created_at || null)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Account ID</span>
                            <span className="text-xs text-foreground font-mono">{user?.id?.slice(0, 16) || 'N/A'}...</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-card rounded-2xl max-w-sm w-full p-6 shadow-xl border border-border" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/50 mx-auto mb-4">
                            <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                        </div>

                        <h3 className="text-lg font-semibold text-center mb-2 text-foreground">Delete Account?</h3>
                        <p className="text-sm text-foreground-secondary text-center mb-4">
                            This action cannot be undone. All your data including your library, novels, and reading history will be permanently deleted.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Type "DELETE" to confirm</label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500 bg-card text-foreground"
                                    placeholder="DELETE"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1">Enter your password</label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500 bg-card text-foreground"
                                    placeholder="Your password"
                                />
                            </div>
                            {deleteError && <div className="text-xs text-red-500 text-center">{deleteError}</div>}
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted text-foreground">
                                Cancel
                            </button>
                            <button onClick={handleDeleteAccount} disabled={deleteLoading} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 active:scale-95 disabled:opacity-50">
                                {deleteLoading ? 'Deleting...' : 'Delete Forever'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
