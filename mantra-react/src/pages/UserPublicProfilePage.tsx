import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
    id: string;
    username: string;
    bio: string;
    created_at: string;
}

interface Novel {
    id: string;
    title: string;
    cover_image_url: string;
    view_count: number;
    like_count: number;
}

export default function UserPublicProfilePage() {
    const { id: userId } = useParams<{ id: string }>();
    const supabase = createClient();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [novels, setNovels] = useState<Novel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id || null);

            // Load profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('id, username, bio, created_at')
                .eq('id', userId)
                .single();

            if (profileData) {
                setProfile(profileData);
            }

            // Load user's novels
            const { data: novelsData } = await supabase
                .from('novels')
                .select('id, title, cover_image_url, view_count, like_count')
                .eq('author_id', userId)
                .eq('is_published', true)
                .order('created_at', { ascending: false });

            setNovels(novelsData || []);

            // Check if following
            if (user && userId) {
                const { data: followData } = await supabase
                    .from('follows')
                    .select('id')
                    .eq('follower_id', user.id)
                    .eq('following_id', userId)
                    .single();

                setIsFollowing(!!followData);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
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
        } else {
            await supabase
                .from('follows')
                .insert({
                    follower_id: currentUserId,
                    following_id: userId
                });
        }

        setIsFollowing(!isFollowing);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
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
        <div className="max-w-2xl mx-auto px-4 py-8 font-inter text-slate-800">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h1 className="text-xl font-bold text-slate-900">Profile</h1>
            </div>

            {/* Profile Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 text-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                    {profile.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{profile.username}</h2>
                {profile.bio && (
                    <p className="text-slate-500 text-sm mb-4 max-w-md mx-auto">{profile.bio}</p>
                )}
                <p className="text-xs text-slate-400 mb-6">
                    Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>

                {currentUserId && currentUserId !== userId && (
                    <button
                        onClick={handleFollowToggle}
                        className={`px-8 py-2.5 rounded-xl font-semibold transition-colors ${isFollowing
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            : 'bg-sky-500 text-white hover:bg-sky-600'
                            }`}
                    >
                        {isFollowing ? 'Following' : 'Follow'}
                    </button>
                )}
            </div>

            {/* Novels */}
            <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Novels ({novels.length})</h3>
                {novels.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {novels.map((novel) => (
                            <Link
                                key={novel.id}
                                to={`/novel/${novel.id}`}
                                className="group"
                            >
                                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-slate-100 mb-2 shadow-sm group-hover:shadow-md transition-all">
                                    {novel.cover_image_url ? (
                                        <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl text-slate-300">📖</div>
                                    )}
                                </div>
                                <h4 className="font-semibold text-slate-900 text-sm line-clamp-2 group-hover:text-sky-600 transition-colors">{novel.title}</h4>
                                <p className="text-xs text-slate-500 mt-1">{novel.view_count?.toLocaleString() || 0} views</p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-xl">
                        <p className="text-slate-500">No novels published yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
