'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

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
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const menuItems = [
        { icon: '📊', label: 'Author Dashboard', href: '/author/dashboard' },
        { icon: '💰', label: 'Wallet & Earnings', href: '/wallet' },
        { icon: '📚', label: 'My Library', href: '/library' },
        { icon: '🔔', label: 'Notifications', href: '/profile/notifications' },
        { icon: '⚙️', label: 'Settings', href: '/profile/settings' },
        { icon: '❓', label: 'Help & FAQ', href: '/faq' },
        { icon: '✉️', label: 'Contact Us', href: '/contact' },
    ];

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Profile Header */}
            <div className="text-center mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <span className="text-white font-bold text-3xl">
                            {profile?.username?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    )}
                </div>
                <h1 className="text-2xl font-bold text-[var(--foreground)]">{profile?.username || 'User'}</h1>
                <p className="text-[var(--foreground-secondary)]">{user?.email}</p>
                <Link
                    href="/profile/edit"
                    className="inline-block mt-4 px-4 py-2 border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
                >
                    Edit Profile
                </Link>
            </div>

            {/* Menu */}
            <div className="space-y-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-4 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:bg-[var(--background-secondary)] transition-colors"
                    >
                        <span className="text-2xl">{item.icon}</span>
                        <span className="font-medium text-[var(--foreground)]">{item.label}</span>
                        <span className="ml-auto text-[var(--foreground-secondary)]">→</span>
                    </Link>
                ))}
            </div>

            {/* Logout */}
            <button
                onClick={handleLogout}
                className="w-full mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 font-medium hover:bg-red-100 transition-colors"
            >
                Sign Out
            </button>
        </div>
    );
}
