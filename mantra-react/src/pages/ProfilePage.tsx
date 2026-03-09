import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    BookMarked, PenTool, Wallet, Bell, Settings,
    HelpCircle, Star, Mail, Flag, ChevronRight
} from 'lucide-react';
import { getUserDisplayName } from '@/lib/utils/profileUtils';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import profileService from '@/services/profileService';
import { useQuery } from '@tanstack/react-query';
import UserAvatar from '@/components/common/UserAvatar';
import { useNotifications } from '@/contexts/NotificationContext';

export default function ProfilePage() {
    const { user, profile, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const { unreadCount } = useNotifications();

    // Fetch User Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['profile', 'stats', user?.id],
        queryFn: () => user ? profileService.getUserStats(user.id) : null,
        enabled: !!user,
        staleTime: 1000 * 60 * 5 // 5 minutes
    });

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [authLoading, user, navigate]);

    if (authLoading || (statsLoading && user)) {
        return (
            <div className="min-h-screen bg-background pb-24">
                <div className="min-h-[50vh] flex items-center justify-center">
                    <LoadingSpinner size="lg" />
                </div>
            </div>
        );
    }

    if (!user) return null;

    const menuItems = [
        { icon: BookMarked, title: 'My Library', subtitle: `${stats?.libraryCount || 0} novels`, path: '/library' },
        { icon: PenTool, title: 'Author Dashboard', subtitle: 'Manage your works', path: '/dashboard' },
        { icon: Wallet, title: 'Wallet', subtitle: `$${(stats?.balance || 0).toFixed(2)}`, path: '/wallet' },
        { icon: Bell, title: 'Notifications', subtitle: unreadCount > 0 ? `${unreadCount} unread` : 'No new notifications', path: '/notifications', hasIndicator: unreadCount > 0 },
        { icon: Settings, title: 'Settings', subtitle: 'Preferences', path: '/settings' },
        { icon: HelpCircle, title: 'FAQ', subtitle: 'Common questions', path: '/faq' },
        { icon: Star, title: 'Rate the App', subtitle: 'Share your feedback', onClick: () => { } },
        { icon: Mail, title: 'Contact Us', subtitle: 'Get in touch', path: '/contact' },
        { icon: Flag, title: 'Report', subtitle: 'Report an issue', path: '/report' },
    ];

    const formatCount = (count: number) => {
        if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
        return count.toString();
    };

    const displayName = getUserDisplayName(profile);

    return (
        <div className="min-h-screen bg-background pb-24 font-inter text-foreground">
            <div className="max-w-6xl mx-auto">
                <section className="min-h-screen pb-24">
                    <div className="px-4 pt-6">
                        {/* Profile Header - Responsive */}
                        <div className="flex items-center gap-4">
                            {/* Centralized UserAvatar Component */}
                            <UserAvatar
                                uri={profile?.profile_picture_url}
                                name={displayName}
                                size="large"
                                showBorder
                                borderColorClass="border-border"
                            />
                            <div className="flex-1">
                                <div className="text-base md:text-lg font-semibold text-foreground">
                                    {displayName}
                                </div>
                                <div className="text-xs md:text-sm text-foreground-secondary">
                                    @{profile?.username || 'user'}
                                </div>
                                <div className="text-[11px] md:text-xs text-foreground-secondary opacity-70">
                                    Member since {profile?.created_at ? new Date(profile.created_at).getFullYear() : new Date().getFullYear()}
                                </div>
                            </div>
                            <Link
                                to="/profile/edit"
                                className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-border text-xs md:text-sm bg-card hover:bg-background-secondary transition-colors"
                            >
                                Edit
                            </Link>
                        </div>

                        {/* Stats Grid - Responsive 3 columns on mobile, 4 on desktop */}
                        <div className="mt-4 grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                            <button
                                onClick={() => navigate(`/user/${user.id}/following`)}
                                className="rounded-xl border border-border p-3 md:p-4 text-center hover:bg-background-secondary transition-colors bg-card"
                            >
                                <div className="text-sm md:text-base font-semibold text-foreground">
                                    {formatCount(stats?.followingCount || 0)}
                                </div>
                                <div className="text-[11px] md:text-xs text-foreground-secondary">Following</div>
                            </button>
                            <button
                                onClick={() => navigate(`/user/${user.id}/followers`)}
                                className="rounded-xl border border-border p-3 md:p-4 text-center hover:bg-background-secondary transition-colors bg-card"
                            >
                                <div className="text-sm md:text-base font-semibold text-foreground">
                                    {formatCount(stats?.followerCount || 0)}
                                </div>
                                <div className="text-[11px] md:text-xs text-foreground-secondary">Followers</div>
                            </button>
                            <Link
                                to="/wallet"
                                className="rounded-xl border border-border p-3 md:p-4 text-center hover:bg-background-secondary transition-colors bg-card"
                            >
                                <div className="text-sm md:text-base font-semibold text-foreground">
                                    ${(stats?.earnings || 0).toFixed(0)}
                                </div>
                                <div className="text-[11px] md:text-xs text-foreground-secondary">Earnings</div>
                            </Link>
                            {/* Extra stat on desktop */}
                            <Link
                                to="/library"
                                className="hidden md:block rounded-xl border border-border p-3 md:p-4 text-center hover:bg-background-secondary transition-colors bg-card"
                            >
                                <div className="text-sm md:text-base font-semibold text-foreground">
                                    {stats?.libraryCount || 0}
                                </div>
                                <div className="text-[11px] md:text-xs text-foreground-secondary">Library</div>
                            </Link>
                        </div>

                        {/* Menu Items - Responsive grid on desktop */}
                        <div className="mt-4 space-y-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:space-y-0">
                            {menuItems.map((item, index) => (
                                item.path ? (
                                    <Link
                                        key={index}
                                        to={item.path}
                                        className="w-full flex items-center gap-3 p-3 md:p-4 rounded-xl border border-border hover:bg-background-secondary transition-colors bg-card"
                                    >
                                        <div className="relative">
                                            <item.icon className="w-5 h-5 text-foreground-secondary" />
                                            {'hasIndicator' in item && item.hasIndicator && (
                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--card)]" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="text-sm md:text-base font-semibold text-foreground">{item.title}</div>
                                            <div className="text-xs text-foreground-secondary">{item.subtitle}</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-foreground-secondary opacity-50" />
                                    </Link>
                                ) : (
                                    <button
                                        key={index}
                                        onClick={item.onClick}
                                        className="w-full flex items-center gap-3 p-3 md:p-4 rounded-xl border border-border hover:bg-background-secondary transition-colors bg-card"
                                    >
                                        <item.icon className="w-5 h-5 text-foreground-secondary" />
                                        <div className="flex-1 text-left">
                                            <div className="text-sm md:text-base font-semibold text-foreground">{item.title}</div>
                                            <div className="text-xs text-foreground-secondary">{item.subtitle}</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-foreground-secondary opacity-50" />
                                    </button>
                                )
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
