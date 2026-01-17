'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getProfilePicture } from '@/lib/defaultImages';
import type { User } from '@supabase/supabase-js';
import {
    BookMarked, PenTool, Wallet, Bell, Settings, HelpCircle,
    Star, Mail, Flag, ChevronRight, LogOut
} from 'lucide-react';

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUser(user);

        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        setProfile(profileData);
        setIsLoading(false);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20 min-h-screen">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const startYear = new Date(user?.created_at || Date.now()).getFullYear();
    const displayName = profile?.display_name || profile?.username || 'User';
    const avatarUrl = getProfilePicture(profile?.avatar_url, displayName);

    return (
        <div className="bg-white md:bg-slate-50 min-h-screen pb-24 font-inter text-slate-800">
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-10">
                <h1 className="text-2xl font-bold text-slate-900 mb-6 hidden md:block">Profile & Settings</h1>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Left Column: Profile Card & Stats */}
                    <div className="md:col-span-4 lg:col-span-3 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white md:rounded-2xl md:shadow-sm md:border md:border-slate-100 p-0 md:p-6">
                            <div className="flex items-center gap-4 md:flex-col md:text-center md:gap-2 mb-4 md:mb-6">
                                <div className="h-16 w-16 md:h-24 md:w-24 rounded-full overflow-hidden border-2 border-white shadow-md bg-slate-50">
                                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 md:flex-none">
                                    <div className="text-lg font-bold text-slate-900">{displayName}</div>
                                    <div className="text-sm text-slate-500">@{profile?.username}</div>
                                    <div className="text-xs text-slate-400 mt-1">Member since {startYear}</div>
                                </div>
                                <Link href="/profile/edit" className="md:w-full md:mt-2">
                                    <button className="px-4 py-2 rounded-lg border border-slate-200 text-sm bg-white hover:bg-slate-50 transition-colors font-medium md:w-full">
                                        Edit Profile
                                    </button>
                                </Link>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-2 md:gap-4 md:grid-cols-1 md:border-t md:border-slate-100 md:pt-6">
                                <div className="md:flex md:items-center md:justify-between p-3 rounded-xl border border-slate-100 md:border-0 md:p-0 md:bg-transparent text-center md:text-left">
                                    <div className="text-[11px] md:text-sm text-slate-500 order-2 md:order-1">Following</div>
                                    <div className="text-sm md:text-base font-bold text-slate-900 order-1 md:order-2">0</div>
                                </div>
                                <div className="md:flex md:items-center md:justify-between p-3 rounded-xl border border-slate-100 md:border-0 md:p-0 md:bg-transparent text-center md:text-left">
                                    <div className="text-[11px] md:text-sm text-slate-500 order-2 md:order-1">Followers</div>
                                    <div className="text-sm md:text-base font-bold text-slate-900 order-1 md:order-2">0</div>
                                </div>
                                <div className="md:flex md:items-center md:justify-between p-3 rounded-xl border border-slate-100 md:border-0 md:p-0 md:bg-transparent text-center md:text-left">
                                    <div className="text-[11px] md:text-sm text-slate-500 order-2 md:order-1">Library</div>
                                    <div className="text-sm md:text-base font-bold text-slate-900 order-1 md:order-2">0</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Menu Items */}
                    <div className="md:col-span-8 lg:col-span-9 space-y-4">
                        {/* Main Actions */}
                        <div className="bg-white md:rounded-2xl md:shadow-sm md:border md:border-slate-100 md:p-2">
                            <Link href="/library" className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                                    <BookMarked className="w-5 h-5 text-sky-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-slate-900">My Library</div>
                                    <div className="text-xs text-slate-500">Your saved novels and reading history</div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500" />
                            </Link>
                            <Link href="/author/dashboard" className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                    <PenTool className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-slate-900">Author Dashboard</div>
                                    <div className="text-xs text-slate-500">Manage your novels and chapters</div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500" />
                            </Link>
                            <Link href="/wallet" className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <Wallet className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-slate-900">Wallet</div>
                                    <div className="text-xs text-slate-500">View earnings and transactions</div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500" />
                            </Link>
                        </div>

                        {/* Settings */}
                        <div className="bg-white md:rounded-2xl md:shadow-sm md:border md:border-slate-100 md:p-2">
                            <div className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Settings</div>
                            <Link href="/notifications" className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors group">
                                <Bell className="w-5 h-5 text-slate-600" />
                                <span className="flex-1 text-sm font-medium text-slate-900">Notifications</span>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500" />
                            </Link>
                            <Link href="/settings" className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors group">
                                <Settings className="w-5 h-5 text-slate-600" />
                                <span className="flex-1 text-sm font-medium text-slate-900">Settings</span>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500" />
                            </Link>
                        </div>

                        {/* Support */}
                        <div className="bg-white md:rounded-2xl md:shadow-sm md:border md:border-slate-100 md:p-2">
                            <div className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Support</div>
                            <Link href="/faq" className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors group">
                                <HelpCircle className="w-5 h-5 text-slate-600" />
                                <span className="flex-1 text-sm font-medium text-slate-900">FAQ</span>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500" />
                            </Link>
                            <Link href="/contact" className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors group">
                                <Mail className="w-5 h-5 text-slate-600" />
                                <span className="flex-1 text-sm font-medium text-slate-900">Contact Us</span>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500" />
                            </Link>
                            <Link href="/report" className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors group">
                                <Flag className="w-5 h-5 text-slate-600" />
                                <span className="flex-1 text-sm font-medium text-slate-900">Report Issue</span>
                                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500" />
                            </Link>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 p-4 bg-white md:rounded-2xl md:shadow-sm md:border md:border-slate-100 text-rose-600 font-semibold hover:bg-rose-50 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
