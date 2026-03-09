import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';
import { Button } from '@/components/ui/Button';
import { getUserDisplayName } from '@/lib/utils/profileUtils';
import { useNotifications } from '@/contexts/NotificationContext';

export default function Header() {
    const { user, profile, isLoading: authLoading } = useAuth();
    const { resolvedTheme, toggleTheme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const { unreadCount } = useNotifications();

    useEffect(() => {
        // Scroll listener for header shadow
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Get display name using centralized utility
    const displayName = getUserDisplayName(profile);

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 bg-background ${isScrolled
                ? 'shadow-sm border-b border-border'
                : ''
                }`}
        >
            <div className="w-full px-4">
                <div className="flex items-center justify-between h-14 md:h-16">
                    {/* Logo (Mobile Style) */}
                    <div className="flex items-center gap-4">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-200">
                                <img
                                    src="/logo.jpeg"
                                    alt="Mantra Logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex flex-col justify-center">
                                <span className="text-xl md:text-2xl font-serif font-bold text-sky-500 leading-none tracking-tight italic">
                                    Mantra
                                </span>
                                <span className="text-[0.6rem] md:text-[0.65rem] font-semibold text-sky-600/80 uppercase tracking-widest leading-none mt-0.5 ml-1">
                                    Novel
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Desktop Navigation - Centered */}
                    <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                        <Link to="/" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors font-medium">
                            Home
                        </Link>
                        <Link to="/ranking" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors font-medium">
                            Ranking
                        </Link>
                        {user && (
                            <Link to="/library" className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors font-medium">
                                Library
                            </Link>
                        )}
                    </nav>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="rounded-full text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
                            aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
                        >
                            {resolvedTheme === 'light' ? (
                                <Moon className="w-5 h-5" />
                            ) : (
                                <Sun className="w-5 h-5" />
                            )}
                        </Button>

                        {/* Search */}
                        <Link to="/search">
                            <Button variant="ghost" size="icon" className="rounded-full text-[var(--foreground-secondary)] hover:text-[var(--foreground)]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </Button>
                        </Link>

                        {user ? (
                            <>
                                {/* Notifications */}
                                <Link to="/notifications">
                                    <Button variant="ghost" size="icon" className="rounded-full text-[var(--foreground-secondary)] hover:text-[var(--foreground)] relative">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--background)]" />
                                        )}
                                    </Button>
                                </Link>

                                {/* Profile Avatar - Uses centralized UserAvatar */}
                                <Link to="/profile" className="hover:opacity-90 transition-opacity">
                                    {authLoading ? (
                                        <div className="w-9 h-9 rounded-full bg-[var(--background-secondary)] animate-pulse" />
                                    ) : (
                                        <UserAvatar
                                            uri={profile?.profile_picture_url}
                                            name={displayName}
                                            size="small"
                                            showBorder
                                            borderColorClass="border-[var(--background)]"
                                        />
                                    )}
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button variant="ghost" className="hidden sm:inline-flex text-[var(--foreground-secondary)] hover:text-[var(--foreground)]">
                                        Login
                                    </Button>
                                </Link>
                                <Link to="/signup">
                                    <Button variant="primary">
                                        Get Started
                                    </Button>
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
                            <Link to="/" className="px-4 py-2 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--foreground)]" onClick={() => setIsMenuOpen(false)}>
                                Home
                            </Link>
                            <Link to="/ranking" className="px-4 py-2 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--foreground)]" onClick={() => setIsMenuOpen(false)}>
                                Ranking
                            </Link>
                            {user && (
                                <Link to="/library" className="px-4 py-2 rounded-lg hover:bg-[var(--background-secondary)] text-[var(--foreground)]" onClick={() => setIsMenuOpen(false)}>
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
