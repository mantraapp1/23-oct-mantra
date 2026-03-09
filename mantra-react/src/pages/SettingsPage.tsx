import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    ChevronRight,
    LogOut,
    Moon,
    Bell,
    ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase/client';

export default function SettingsPage() {
    const { user, profile, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [pushNotifications, setPushNotifications] = useState(true);
    const [showMatureContent, setShowMatureContent] = useState(false);
    const [isTogglingMature, setIsTogglingMature] = useState(false);

    // Load mature content preference from profile
    useEffect(() => {
        if (profile?.show_mature_content !== undefined) {
            setShowMatureContent(profile.show_mature_content);
        }
    }, [profile]);

    // Check if user is 18+
    const isOver18 = (): boolean => {
        if (!profile?.age) return false;
        return profile.age >= 18;
    };

    const handleMatureContentToggle = async () => {
        if (!user) {
            toast.warning('Please login to change this setting');
            return;
        }

        // Check age requirement
        if (!showMatureContent && !isOver18()) {
            toast.error('You must be 18+ to enable mature content. Update your date of birth in Account Settings.');
            return;
        }

        setIsTogglingMature(true);
        try {
            const newValue = !showMatureContent;
            const { error } = await supabase
                .from('profiles')
                .update({ show_mature_content: newValue })
                .eq('id', user.id);

            if (error) throw error;

            setShowMatureContent(newValue);
            toast.success(newValue ? 'Mature content enabled' : 'Mature content disabled');
        } catch (error) {
            toast.error('Failed to update setting');
        } finally {
            setIsTogglingMature(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch {
        }
    };

    return (
        <div className="min-h-screen bg-background font-sans">
            {/* Header */}
            <div className="sticky top-0 bg-background z-40 border-b border-border">
                <div className="px-4 py-3 flex items-center gap-2">
                    <button
                        onClick={() => navigate('/profile')}
                        className="p-2 rounded-lg hover:bg-background-secondary active:scale-95 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-foreground" />
                    </button>
                    <div className="text-base font-semibold text-foreground">Settings</div>
                </div>
            </div>

            <div className="max-w-[1800px] mx-auto px-4 pt-4 pb-24 space-y-6">
                {/* Account Section */}
                <div>
                    <div className="text-sm font-semibold mb-2 text-foreground">Account</div>
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <button
                            onClick={() => { }}
                            className="w-full flex items-center justify-between p-4 bg-card border-b border-border last:border-0 hover:bg-background-secondary transition-colors"
                        >
                            <span className="text-sm font-medium text-foreground">Email</span>
                            <span className="text-sm text-foreground-secondary">{user?.email || 'you@example.com'}</span>
                        </button>
                        <button
                            onClick={() => navigate('/settings/account')}
                            className="w-full flex items-center justify-between p-4 bg-card last:border-0 hover:bg-background-secondary transition-colors"
                        >
                            <span className="text-sm font-medium text-foreground">Account Settings</span>
                            <ChevronRight className="w-4 h-4 text-foreground-secondary" />
                        </button>
                    </div>
                </div>

                {/* Preferences Section */}
                <div>
                    <div className="text-sm font-semibold mb-2 text-foreground">Preferences</div>
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        {/* Push Notifications Toggle */}
                        <div className="flex items-center justify-between p-4 bg-card border-b border-border hover:bg-background-secondary transition-colors">
                            <div className="flex items-center gap-3">
                                <Bell className="w-5 h-5 text-foreground-secondary" />
                                <span className="text-sm font-medium text-foreground">Push Notifications</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={pushNotifications}
                                    onChange={() => setPushNotifications(!pushNotifications)}
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                            </label>
                        </div>

                        {/* Dark Mode Toggle */}
                        <div className="flex items-center justify-between p-4 bg-card border-b border-border hover:bg-background-secondary transition-colors">
                            <div className="flex items-center gap-3">
                                <Moon className="w-5 h-5 text-foreground-secondary" />
                                <span className="text-sm font-medium text-foreground">Dark Mode</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={theme === 'dark'}
                                    onChange={toggleTheme}
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                            </label>
                        </div>

                        {/* Mature Content Toggle */}
                        <div className="flex items-center justify-between p-4 bg-card hover:bg-background-secondary transition-colors">
                            <div className="flex items-center gap-3">
                                <ShieldAlert className="w-5 h-5 text-red-500" />
                                <div>
                                    <span className="text-sm font-medium text-foreground block">Show Mature Content</span>
                                    <span className="text-xs text-foreground-secondary">18+ only. Requires age verification.</span>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={showMatureContent}
                                    onChange={handleMatureContentToggle}
                                    disabled={isTogglingMature || !user}
                                />
                                <div className={`w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500 ${isTogglingMature ? 'opacity-50' : ''}`}></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* About Section */}
                <div>
                    <div className="text-sm font-semibold mb-2 text-foreground">About</div>
                    <div className="bg-card rounded-xl border border-border overflow-hidden">
                        <button
                            onClick={() => window.open('/terms', '_blank')}
                            className="w-full flex items-center justify-between p-4 bg-card border-b border-border hover:bg-background-secondary transition-colors"
                        >
                            <span className="text-sm font-medium text-foreground">Terms of Service</span>
                            <ChevronRight className="w-4 h-4 text-foreground-secondary" />
                        </button>
                        <button
                            onClick={() => window.open('/privacy', '_blank')}
                            className="w-full flex items-center justify-between p-4 bg-card border-b border-border hover:bg-background-secondary transition-colors"
                        >
                            <span className="text-sm font-medium text-foreground">Privacy Policy</span>
                            <ChevronRight className="w-4 h-4 text-foreground-secondary" />
                        </button>
                        <div className="flex items-center justify-between p-4 bg-card">
                            <span className="text-sm font-medium text-foreground">Version</span>
                            <span className="text-sm text-foreground-secondary">1.0.0</span>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/30 flex items-center justify-center gap-2"
                >
                    <LogOut className="w-4 h-4" />
                    Log Out
                </button>
            </div>
        </div>
    );
}
