import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import UserAvatar from '@/components/common/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';

interface AuthorResultCardProps {
    author: {
        id: string;
        username: string;
        display_name?: string | null;
        avatar_url?: string | null;
        profile_picture_url?: string | null;
        followers_count?: number;
    };
}

export default function AuthorResultCard({ author }: AuthorResultCardProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Check initial follow state
    useEffect(() => {
        const checkFollowStatus = async () => {
            if (!user || user.id === author.id) return;

            try {
                const { data } = await supabase
                    .from('follows')
                    .select('id')
                    .eq('follower_id', user.id)
                    .eq('following_id', author.id)
                    .maybeSingle();

                setIsFollowing(!!data);
            } catch (error) {
                console.error('Error checking follow status:', error);
            }
        };

        checkFollowStatus();
    }, [user, author.id]);

    const handleFollow = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate('/login');
            return;
        }

        // Can't follow yourself
        if (user.id === author.id) return;

        setIsLoading(true);

        try {
            if (isFollowing) {
                // Unfollow
                const { error } = await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', author.id);

                if (error) {
                    console.error('Unfollow error:', error);
                    alert(`Failed to unfollow: ${error.message}`);
                    return;
                }
                setIsFollowing(false);
            } else {
                // Follow
                const { error } = await supabase
                    .from('follows')
                    .insert({ follower_id: user.id, following_id: author.id });

                if (error) {
                    console.error('Follow error:', error);
                    alert(`Failed to follow: ${error.message}`);
                    return;
                }
                setIsFollowing(true);
            }
        } catch (err) {
            console.error('Follow toggle exception:', err);
            alert('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Get the display name for the avatar
    const displayName = author.display_name || author.username;
    // Get the profile image URL from either field
    const profileImageUrl = author.avatar_url || author.profile_picture_url;

    // Don't show follow button for own profile
    const showFollowButton = !user || user.id !== author.id;

    return (
        <Link
            to={`/user/${author.id}`}
            className="flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:bg-background-secondary transition-colors group"
        >
            {/* Avatar - using shared component for consistency */}
            <UserAvatar
                uri={profileImageUrl}
                name={displayName}
                size="large"
                className="w-12 h-12"
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground truncate">
                    {displayName}
                </h4>
                <p className="text-xs text-foreground-secondary">
                    Author
                </p>
            </div>

            {/* Action */}
            {showFollowButton && (
                <button
                    onClick={handleFollow}
                    disabled={isLoading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50 ${isFollowing
                        ? 'border border-sky-500 bg-white text-sky-500 hover:bg-sky-50'
                        : 'bg-sky-500 text-white hover:bg-sky-600 shadow-sky-500/20'
                        }`}
                >
                    {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isFollowing ? (
                        <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Following</span>
                        </>
                    ) : (
                        <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Follow</span>
                        </>
                    )}
                </button>
            )}
        </Link>
    );
}

