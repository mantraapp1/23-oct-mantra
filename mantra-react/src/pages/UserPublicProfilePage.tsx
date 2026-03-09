import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MoreVertical,
    Share2,
    Flag,
    Bookmark,
    BookmarkCheck
} from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/contexts/ToastContext';

interface UserProfile {
    id: string;
    username: string;
    display_name?: string;
    bio: string;
    profile_picture_url?: string;
    created_at: string;
}

interface Novel {
    id: string;
    title: string;
    cover_image_url: string;
    status: string;
    genres: string[];
}

interface FollowStats {
    followers: number;
    following: number;
    novels: number;
}

export default function UserPublicProfilePage() {
    const { id: userId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [novels, setNovels] = useState<Novel[]>([]);
    const [stats, setStats] = useState<FollowStats>({ followers: 0, following: 0, novels: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [bookmarkedNovels, setBookmarkedNovels] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadData();
    }, [userId]);

    useEffect(() => {
        const handleClickOutside = () => setMenuOpen(false);
        if (menuOpen) {
            document.addEventListener('click', handleClickOutside);
        }
        return () => document.removeEventListener('click', handleClickOutside);
    }, [menuOpen]);

    const loadData = async () => {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            // Load profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id, username, display_name, bio, profile_picture_url, created_at')
                .eq('id', userId)
                .single();

            if (profileData) {
                setProfile(profileData);
            }

            // Load user's novels
            const { data: novelsData } = await supabase
                .from('novels')
                .select('id, title, cover_image_url, status, genres')
                .eq('author_id', userId)
                .order('created_at', { ascending: false });

            setNovels(novelsData || []);

            // Load follow stats
            const [followersRes, followingRes] = await Promise.all([
                supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', userId),
                supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId)
            ]);

            setStats({
                followers: followersRes.count || 0,
                following: followingRes.count || 0,
                novels: novelsData?.length || 0
            });

            // Check if following
            if (user && userId) {
                const { data: followData } = await supabase
                    .from('follows')
                    .select('id')
                    .eq('follower_id', user.id)
                    .eq('following_id', userId)
                    .single();

                setIsFollowing(!!followData);

                // Load user's bookmarks
                const { data: libraryData } = await supabase
                    .from('library')
                    .select('novel_id')
                    .eq('user_id', user.id);

                if (libraryData) {
                    setBookmarkedNovels(new Set(libraryData.map(item => item.novel_id)));
                }
            }
        } catch {
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!currentUserId || !userId) return;

        if (isFollowing) {
            await supabase
                .from('follows')
                .delete()
                .eq('follower_id', currentUserId)
                .eq('following_id', userId);
            setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
        } else {
            await supabase
                .from('follows')
                .insert({
                    follower_id: currentUserId,
                    following_id: userId
                });
            setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
        }

        setIsFollowing(!isFollowing);
    };

    const toggleBookmark = async (e: React.MouseEvent, novelId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!currentUserId) return;

        const isBookmarked = bookmarkedNovels.has(novelId);

        if (isBookmarked) {
            await supabase
                .from('library')
                .delete()
                .eq('user_id', currentUserId)
                .eq('novel_id', novelId);

            setBookmarkedNovels(prev => {
                const next = new Set(prev);
                next.delete(novelId);
                return next;
            });
        } else {
            await supabase
                .from('library')
                .insert({ user_id: currentUserId, novel_id: novelId });

            setBookmarkedNovels(prev => new Set(prev).add(novelId));
        }
    };

    const formatCount = (count: number) => {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        }
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'k';
        }
        return count.toString();
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: profile?.display_name || profile?.username,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Profile link copied to clipboard!');
        }
        setMenuOpen(false);
    };

    const handleReport = () => {
        const name = profile?.display_name || profile?.username || 'User';
        navigate(`/report?type=user&id=${userId}&name=${encodeURIComponent(name)}`);
        setMenuOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl font-bold text-slate-900">User not found</h2>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-inter text-foreground">
            <div className="max-w-[1800px] mx-auto">
                {/* Header - Stays compact/relevant */}
                <div className="px-4 pt-6 pb-4 flex items-center justify-between">
                    <button
                        onClick={() => window.history.back()}
                        className="p-2 -ml-2 rounded-lg hover:bg-background-secondary active:scale-95 transition-all text-foreground-secondary hover:text-foreground"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                            className="p-2 -mr-2 rounded-lg hover:bg-background-secondary active:scale-95 transition-all text-foreground-secondary hover:text-foreground"
                        >
                            <MoreVertical className="w-6 h-6" />
                        </button>

                        {menuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-card rounded-lg shadow-lg border border-border py-2 z-50">
                                <button
                                    onClick={handleShare}
                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-background-secondary flex items-center gap-3 text-foreground"
                                >
                                    <Share2 className="w-4 h-4" />
                                    <span>Share</span>
                                </button>
                                <button
                                    onClick={handleReport}
                                    className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-3"
                                >
                                    <Flag className="w-4 h-4" />
                                    <span>Report</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile */}
                <div className="px-4 pb-24">
                    {/* Centered Profile Info Block */}
                    <div className="flex flex-col items-center max-w-2xl mx-auto mb-12">
                        {/* Avatar */}
                        <div className="mb-4">
                            <UserAvatar
                                uri={profile.profile_picture_url}
                                name={profile.display_name || profile.username}
                                size="xl"
                                className="w-24 h-24 text-3xl"
                                showBorder
                                borderColorClass="border-border"
                            />
                        </div>

                        {/* Name & Username */}
                        <div className="mt-4 text-center">
                            <div className="text-xl font-bold text-foreground">{profile.display_name || profile.username}</div>
                            <div className="text-sm text-muted-foreground mt-0.5">@{profile.username}</div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-6 mt-6 text-sm">
                            <button
                                onClick={() => navigate(`/user/${userId}/followers`)}
                                className="flex flex-col items-center hover:text-sky-500 transition-colors group"
                            >
                                <span className="font-bold text-lg text-foreground group-hover:text-sky-500">{formatCount(stats.followers)}</span>
                                <span className="text-muted-foreground text-xs uppercase tracking-wide group-hover:text-sky-500/80">Followers</span>
                            </button>
                            <button
                                onClick={() => navigate(`/user/${userId}/following`)}
                                className="flex flex-col items-center hover:text-sky-500 transition-colors group"
                            >
                                <span className="font-bold text-lg text-foreground group-hover:text-sky-500">{formatCount(stats.following)}</span>
                                <span className="text-muted-foreground text-xs uppercase tracking-wide group-hover:text-sky-500/80">Following</span>
                            </button>
                            <div className="flex flex-col items-center">
                                <span className="font-bold text-lg text-foreground">{stats.novels}</span>
                                <span className="text-muted-foreground text-xs uppercase tracking-wide">Novels</span>
                            </div>
                        </div>

                        {/* Follow Button - shown to everyone except profile owner */}
                        {currentUserId !== userId && (
                            <button
                                onClick={() => {
                                    if (!currentUserId) {
                                        navigate('/login');
                                        return;
                                    }
                                    handleFollowToggle();
                                }}
                                className={`mt-6 px-8 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all active:scale-95 ${isFollowing
                                    ? 'border border-primary bg-background text-primary hover:bg-background-secondary'
                                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'}`}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                        )}

                        {/* Bio */}
                        {profile.bio && (
                            <p className="mt-6 text-sm text-foreground-secondary text-center leading-relaxed max-w-lg">{profile.bio}</p>
                        )}
                    </div>

                    {/* Works Section - Full Width Grid */}
                    <div className="mt-8 border-t border-border pt-8">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-xl font-bold text-foreground">Published Works</span>
                            <span className="px-2 py-0.5 bg-background-secondary text-foreground-secondary text-xs font-bold rounded-full">{novels.length}</span>
                        </div>

                        {novels.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                {novels.map((novel) => (
                                    <Link
                                        key={novel.id}
                                        to={`/novel/${novel.id}`}
                                        className="relative rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group aspect-[2/3] bg-card border border-border"
                                    >
                                        <div className="h-full w-full">
                                            {novel.cover_image_url ? (
                                                <img
                                                    src={novel.cover_image_url}
                                                    alt={novel.title}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="h-full w-full bg-background-secondary flex items-center justify-center text-4xl">
                                                    📖
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                            <div className="text-sm font-bold line-clamp-2 mb-1 leading-tight group-hover:text-primary-foreground transition-colors">{novel.title}</div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                <span className="text-[10px] font-medium bg-white/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
                                                    {novel.genres?.[0] || 'Novel'}
                                                </span>
                                                <span className="text-[10px] font-medium bg-emerald-500/80 px-1.5 py-0.5 rounded backdrop-blur-sm capitalize">
                                                    {novel.status || 'Ongoing'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Bookmark Button */}
                                        <button
                                            onClick={(e) => toggleBookmark(e, novel.id)}
                                            className={`absolute top-2 right-2 p-2 rounded-full shadow-lg transition-all transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${bookmarkedNovels.has(novel.id)
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-card text-foreground hover:bg-background-secondary'}`}
                                        >
                                            {bookmarkedNovels.has(novel.id) ? (
                                                <BookmarkCheck className="w-4 h-4" />
                                            ) : (
                                                <Bookmark className="w-4 h-4" />
                                            )}
                                        </button>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-background-secondary rounded-2xl border border-dashed border-border">
                                <p className="text-muted-foreground font-medium">No novels published yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
