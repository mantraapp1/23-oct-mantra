'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getProfilePicture } from '@/lib/defaultImages';
import type { User } from '@supabase/supabase-js';

interface Profile {
    display_name: string | null;
    username: string;
    profile_picture_url: string | null;
}

export default function Header() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        // Check auth state
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            setUser(user);
            if (user) {
                // Fetch profile for avatar
                const { data } = await supabase
                    .from('profiles')
                    .select('display_name, username, profile_picture_url')
                    .eq('id', user.id)
                    .single();
                setProfile(data);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('display_name, username, profile_picture_url')
                    .eq('id', session.user.id)
                    .single();
                setProfile(data);
            } else {
                setProfile(null);
            }
        });

        // Scroll listener for header shadow
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Get avatar URL using profile data
    const displayName = profile?.display_name || profile?.username || 'User';
    const avatarUrl = getProfilePicture(profile?.profile_picture_url, displayName);

    return (
        <header
            className={`sticky top-0 z-50 backdrop-blur-md transition-all duration-300 ${isScrolled
                ? 'bg-[var(--background)]/95 shadow-sm border-b border-[var(--border)]'
                : 'bg-[var(--background)]/90'
                }`}
        >
            <div className="w-full px-4">
                <div className="flex items-center justify-between h-14 md:h-16">
                    {/* Logo (Mobile Style) */}
                    <div className="flex items-center gap-4">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <img
                                    src="/logo.jpeg"
                                    alt="Mantra Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-lg md:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 leading-none tracking-tight">
                                    Mantra
                                </span>
                                <span className="text-[0.6rem] md:text-[0.65rem] font-medium text-[var(--primary)] uppercase tracking-wider leading-none mt-0.5">
                                    Novel
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation - Centered */}
                    <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                        <Link href="/" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors font-medium">
                            Home
                        </Link>
                        <Link href="/ranking" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors font-medium">
                            Ranking
                        </Link>
                        {user && (
                            <Link href="/library" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors font-medium">
                                Library
                            </Link>
                        )}
                    </nav>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Search */}
                        <Link
                            href="/search"
                            className="p-2 rounded-full hover:bg-[var(--background-secondary)] transition-colors"
                        >
                            <svg className="w-5 h-5 text-[var(--foreground-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </Link>

                        {user ? (
                            <>
                                {/* Notifications */}
                                <Link
                                    href="/notifications"
                                    className="p-2 rounded-full hover:bg-[var(--background-secondary)] transition-colors relative hidden md:block"
                                >
                                    <svg className="w-5 h-5 text-[var(--foreground-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </Link>

                                {/* Profile Avatar */}
                                <Link
                                    href="/profile"
                                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="hidden sm:block text-[var(--foreground-secondary)] hover:text-[var(--foreground)] font-medium transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-sky-600 transition-colors text-sm"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-full hover:bg-[var(--background-secondary)] transition-colors"
                        >
                            <svg className="w-6 h-6 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-[var(--border)]">
                        <nav className="flex flex-col gap-2">
                            <Link href="/" className="px-4 py-2 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--foreground)]" onClick={() => setIsMenuOpen(false)}>
                                Home
                            </Link>
                            <Link href="/ranking" className="px-4 py-2 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--foreground)]" onClick={() => setIsMenuOpen(false)}>
                                Ranking
                            </Link>
                            {user && (
                                <Link href="/library" className="px-4 py-2 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--foreground)]" onClick={() => setIsMenuOpen(false)}>
                                    Library
                                </Link>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}
