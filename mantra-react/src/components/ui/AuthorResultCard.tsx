import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, UserCheck } from 'lucide-react';
import { useState } from 'react';
import UserAvatar from '@/components/common/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';

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

    const handleFollow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate('/login');
            return;
        }

        setIsFollowing(!isFollowing);
        // TODO: Call follow service
    };

    // Get the display name for the avatar
    const displayName = author.display_name || author.username;
    // Get the profile image URL from either field
    const profileImageUrl = author.avatar_url || author.profile_picture_url;

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
            <button
                onClick={handleFollow}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${isFollowing
                    ? 'border border-sky-500 bg-white text-sky-500 hover:bg-sky-50'
                    : 'bg-sky-500 text-white hover:bg-sky-600 shadow-sky-500/20'
                    }`}
            >
                {isFollowing ? (
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
        </Link>
    );
}

