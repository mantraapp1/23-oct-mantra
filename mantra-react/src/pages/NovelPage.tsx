import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import NovelHero from '@/components/novel/NovelHero';
import NovelTabs from '@/components/novel/NovelTabs';
import ActionButtons from '@/components/novel/ActionButtons';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function NovelPage() {
    const { id } = useParams<{ id: string }>();
    const [novel, setNovel] = useState<any>(null);
    const [chapters, setChapters] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

        if (!id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Novel Metadata (Blocking)
                const { data: novelData } = await supabase
                    .from('novels')
                    .select(`
                        id, title, description, cover_image_url, genres, tags, language, 
                        is_mature, status, total_chapters, total_views, total_votes, 
                        average_rating, total_reviews, is_featured, is_editors_pick,
                        created_at, updated_at,
                        author:profiles!novels_author_id_fkey(id, username, display_name, profile_picture_url)
                    `)
                    .eq('id', id)
                    .eq('is_mature', false) // Bypass RLS blocking function
                    .single();

                if (novelData) {
                    setNovel(novelData);
                    setLoading(false); // UNBLOCK UI IMMEDIATELY

                    // 2. Fetch Content (Background / Progressive)

                    // Fetch Chapters
                    supabase
                        .from('chapters')
                        .select('id, title, chapter_number, created_at:published_at, is_locked, views')
                        .eq('novel_id', id)
                        .order('chapter_number', { ascending: true })
                        .then(({ data, error }) => {
                            if (error) console.error('Error fetching chapters:', error);
                            if (data) setChapters(data);
                        });

                    // Fetch Reviews
                    supabase
                        .from('reviews')
                        .select(`
                            id, rating, content:review_text, created_at,
                            user:profiles!reviews_user_id_fkey(username, profile_picture_url)
                        `)
                        .eq('novel_id', id)
                        .order('created_at', { ascending: false })
                        .limit(5)
                        .then(({ data }) => {
                            if (data) setReviews(data);
                        });
                } else {
                    setLoading(false); // Novel not found
                }
            } catch (error) {
                console.error('Error fetching novel:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>;
    if (!novel) return <div className="text-center py-20">Novel not found</div>;

    // Derived stats
    const stats = {
        rating: novel.average_rating || 0,
        views: novel.total_views >= 1000 ? `${(novel.total_views / 1000).toFixed(1)}k` : novel.total_views || 0,
        votes: novel.total_votes >= 1000 ? `${(novel.total_votes / 1000).toFixed(1)}k` : novel.total_votes || 0,
        chapters: novel.total_chapters || chapters.length || 0,
    };

    const author = Array.isArray(novel.author) ? novel.author[0] : novel.author;
    const genres = novel.genres || [];

    return (
        <div className="min-h-screen bg-white pb-24 font-inter">
            {/* 1. Hero Section */}
            <NovelHero
                novel={{
                    ...novel,
                    author,
                    genres
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 md:mt-8 relative z-10">
                <div className="flex flex-col md:flex-row md:gap-12">
                    {/* Left Column (Desktop): Stats & Actions */}
                    <div className="md:w-80 md:flex-shrink-0 space-y-6">
                        {/* 2. Stats Grid */}
                        <div className="grid grid-cols-4 md:grid-cols-2 gap-2 md:gap-4">
                            <div className="rounded-xl border border-slate-100 p-2.5 md:p-4 text-center bg-white shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-sm md:text-lg font-bold text-slate-900">{stats.rating}</div>
                                <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide font-medium">Rating</div>
                            </div>
                            <div className="rounded-xl border border-slate-100 p-2.5 md:p-4 text-center bg-white shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-sm md:text-lg font-bold text-slate-900">{stats.views}</div>
                                <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide font-medium">Views</div>
                            </div>
                            <div className="rounded-xl border border-slate-100 p-2.5 md:p-4 text-center bg-white shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-sm md:text-lg font-bold text-slate-900">{stats.votes}</div>
                                <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide font-medium">Votes</div>
                            </div>
                            <div className="rounded-xl border border-slate-100 p-2.5 md:p-4 text-center bg-white shadow-sm hover:shadow-md transition-shadow">
                                <div className="text-sm md:text-lg font-bold text-slate-900">{stats.chapters}</div>
                                <div className="text-[10px] md:text-xs text-slate-500 uppercase tracking-wide font-medium">Chapters</div>
                            </div>
                        </div>

                        {/* 3. Action Buttons */}
                        <ActionButtons novelId={novel.id} currentUser={user} />
                    </div>

                    {/* Right Column: Tabs Content */}
                    <div className="flex-1 mt-6 md:mt-0">
                        <NovelTabs
                            description={novel.description || ''}
                            novelId={novel.id}
                            chapters={chapters || []}
                            reviews={reviews || []}
                            tags={novel.tags || []}
                            currentUser={user}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
