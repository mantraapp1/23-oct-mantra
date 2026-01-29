import { Link } from 'react-router-dom';
import { UserPlus, UserCheck } from 'lucide-react';
import { useState } from 'react';
// import { followService } from '@/services/followService'; // TODO: Implement if needed

interface AuthorResultCardProps {
    author: {
        id: string;
        username: string;
        avatar_url: string | null;
        followers_count?: number; // Optional if not available in search
    };
}

export default function AuthorResultCard({ author }: AuthorResultCardProps) {
    const [isFollowing, setIsFollowing] = useState(false); // Mock state for now

    const handleFollow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsFollowing(!isFollowing);
        // TODO: Call follow service
    };

    return (
        <Link
            to={`/user/${author.id}`}
            className="flex items-center gap-3 p-3 rounded-2xl border border-transparent hover:bg-background-secondary transition-colors group"
        >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full overflow-hidden border border-border flex-shrink-0">
                <img
                    src={author.avatar_url || `https://ui-avatars.com/api/?name=${author.username}&background=random`}
                    alt={author.username}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-foreground truncate">
                    {author.username}
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
