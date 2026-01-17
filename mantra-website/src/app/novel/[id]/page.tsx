import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import NovelHero from '@/components/novel/NovelHero';
import NovelTabs from '@/components/novel/NovelTabs';
import { ThumbsUp } from 'lucide-react';

interface NovelDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function NovelDetailPage({ params }: NovelDetailPageProps) {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Fetch novel with author info - use correct column names from schema
    const { data: novel, error } = await supabase
        .from('novels')
        .select(`
            id, title, description, cover_image_url, genres, tags, language, 
            is_mature, status, total_chapters, total_views, total_votes, 
            average_rating, total_reviews, is_featured, is_editors_pick,
            created_at, updated_at,
            author:profiles!novels_author_id_fkey(id, username, display_name, profile_picture_url)
        `)
        .eq('id', id)
        .single();

    if (error || !novel) {
        notFound();
    }

    // Fetch chapters
    const { data: chapters } = await supabase
        .from('chapters')
        .select('id, title, chapter_number, created_at:published_at, is_locked, views')
        .eq('novel_id', id)
        .order('chapter_number', { ascending: true });

    // Fetch reviews
    const { data: reviews } = await supabase
        .from('reviews')
        .select(`
            id, rating, content:review_text, created_at,
            user:profiles!reviews_user_id_fkey(username, profile_picture_url)
        `)
        .eq('novel_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

    // Use genres array field directly from novel
    const genres = novel.genres || [];

    // Normalize author data
    const author = Array.isArray(novel.author) ? novel.author[0] : novel.author;

    // Calculated Stats
    const stats = {
        rating: novel.average_rating || 0,
        views: novel.total_views >= 1000 ? `${(novel.total_views / 1000).toFixed(1)}k` : novel.total_views || 0,
        votes: novel.total_votes >= 1000 ? `${(novel.total_votes / 1000).toFixed(1)}k` : novel.total_votes || 0,
        chapters: novel.total_chapters || chapters?.length || 0,
    };

    // Fetch current user
    const { data: { user } } = await supabase.auth.getUser();

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
                        <div className="flex gap-2">
                            <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                                Add to Library
                            </button>
                            <button className="px-4 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                <ThumbsUp size={20} className="text-slate-600" />
                            </button>
                        </div>
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
