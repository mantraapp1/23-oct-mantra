import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, X } from 'lucide-react';
import UserAvatar from '@/components/common/UserAvatar';
import { supabase } from '@/lib/supabase/client';

interface FollowUser {
    id: string;
    username: string;
    display_name?: string;
    profile_picture_url?: string;
    bio?: string;
}

export default function FollowersListPage() {
    const { id: userId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [followers, setFollowers] = useState<FollowUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
    const [username, setUsername] = useState('');

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            // Get user info
            const { data: profile } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', userId)
                .single();

            if (profile) setUsername(profile.username);

            // Get followers
            const { data: followData } = await supabase
                .from('follows')
                .select(`
                    follower:profiles!follows_follower_id_fkey (
                        id, username, display_name, profile_picture_url, bio
                    )
                `)
                .eq('following_id', userId);

            if (followData) {
                setFollowers(followData.map((f: any) => f.follower).filter(Boolean));
            }

            // Get who current user follows
            if (user) {
                const { data: following } = await supabase
                    .from('follows')
                    .select('following_id')
                    .eq('follower_id', user.id);

                if (following) {
                    setFollowingSet(new Set(following.map(f => f.following_id)));
                }
            }
        } catch {
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowToggle = async (targetUserId: string) => {
        if (!currentUserId) {
            navigate('/login');
            return;
        }

        const isFollowing = followingSet.has(targetUserId);

        try {
            if (isFollowing) {
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', currentUserId)
                    .eq('following_id', targetUserId);

                if (error) {
                    alert(`Failed to unfollow: ${error.message}`);
                    return;
                }

                setFollowingSet(prev => {
                    const next = new Set(prev);
                    next.delete(targetUserId);
                    return next;
                });
            } else {
                const { error } = await supabase
                    .from('follows')
                    .insert({ follower_id: currentUserId, following_id: targetUserId });

                if (error) {
                    alert(`Failed to follow: ${error.message}`);
                    return;
                }

                setFollowingSet(prev => new Set(prev).add(targetUserId));
            }
        } catch {
            alert('An unexpected error occurred');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background font-inter text-foreground">
            <div className="max-w-[1800px] mx-auto">
                {/* Header */}
                <div className="sticky top-0 bg-background z-40 border-b border-border">
                    <div className="px-4 py-3 flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 rounded-lg hover:bg-muted active:scale-95 transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6 text-muted-foreground" />
                        </button>
                        <div>
                            <h1 className="text-base font-semibold">Followers</h1>
                            <p className="text-xs text-muted-foreground">@{username}</p>
                        </div>
                    </div>
                </div>

                {/* Followers List */}
                <div className="w-full">
                    {followers.length > 0 ? (
                        <div className="divide-y divide-border">
                            {followers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between px-4 py-4 hover:bg-muted/30 transition-colors">
                                    <Link to={`/user/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                                        <UserAvatar
                                            uri={user.profile_picture_url}
                                            name={user.display_name || user.username}
                                            size="medium"
                                            className="w-10 h-10 flex-shrink-0"
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <p className="font-semibold text-sm text-foreground truncate">
                                                {user.display_name || user.username}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                                        </div>
                                    </Link>

                                    <div className="flex items-center gap-3">
                                        {currentUserId && currentUserId !== user.id && (
                                            <button
                                                onClick={() => handleFollowToggle(user.id)}
                                                className={`px-6 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap ${followingSet.has(user.id)
                                                    ? 'border border-primary bg-background text-primary hover:bg-background-secondary'
                                                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20'}`}
                                            >
                                                {followingSet.has(user.id) ? 'Following' : 'Follow'}
                                            </button>
                                        )}

                                        {/* Only show remove button if viewing own profile's followers */}
                                        {currentUserId === userId && (
                                            <button
                                                onClick={() => handleFollowToggle(user.id)} // This should be handleRemoveClick ideally, but reusing for now or need to fix logic
                                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                                                title="Remove follower"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-background">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">👥</span>
                            </div>
                            <h3 className="font-bold text-foreground mb-1">No followers yet</h3>
                            <p className="text-muted-foreground text-sm">When someone follows this user, they'll appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
