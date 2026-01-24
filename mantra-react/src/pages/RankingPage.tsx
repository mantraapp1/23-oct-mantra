import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';
import { Dropdown } from '@/components/ui/Dropdown';
import { getNovelCover } from '@/lib/defaultImages';
import { NovelListCardSkeleton } from '@/components/ui/Skeleton';

interface RankingNovel {
    id: string;
    title: string;
    cover_image_url: string;
    description?: string;
    total_chapters?: number;
    status: string;
    total_views: number;
    total_votes: number;
    average_rating: number;
    genres: string[];
    author: { username: string; display_name: string } | { username: string; display_name: string }[];
    chapters: { count: number }[];
}

const SORT_OPTIONS = ['Trending', 'Most Viewed', 'Most Voted', 'Highest Rated'];
const TIME_OPTIONS = ['Today', 'Weekly', 'Monthly', 'Yearly'];
const GENRE_OPTIONS = ['All Genres', 'Fantasy', 'Romance', 'Adventure', 'Thriller', 'Slice of Life'];

export default function RankingPage() {
    const supabase = createClient();

    const [sortBy, setSortBy] = useState('Trending');
    const [timeRange, setTimeRange] = useState('Today');
    const [genre, setGenre] = useState('All Genres');
    const [novels, setNovels] = useState<RankingNovel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadRankings();
    }, [sortBy, genre]);

    const loadRankings = async () => {
        setIsLoading(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s strict timeout

        try {
            // Start with base query - filter out mature content for anonymous users
            // This avoids RLS policy issues with can_view_mature_content() function
            let query = supabase
                .from('novels')
                .select(`
                    id, title, cover_image_url, status, total_views, total_votes, genres, average_rating, description,
                    author:profiles!novels_author_id_fkey(username, display_name),
                    chapters(count)
                `)
                .eq('is_mature', false);

            // Apply genre filter
            if (genre !== 'All Genres') {
                query = query.contains('genres', [genre]);
            }

            // Apply sorting
            switch (sortBy) {
                case 'Trending':
                case 'Most Viewed':
                    query = query.order('total_views', { ascending: false });
                    break;
                case 'Most Voted':
                    query = query.order('total_votes', { ascending: false });
                    break;
                case 'Highest Rated':
                    query = query.order('average_rating', { ascending: false });
                    break;
            }

            const { data, error } = await query
                .limit(20)
                .abortSignal(controller.signal);

            clearTimeout(timeoutId);
            if (error) throw error;
            setNovels((data as any) || []);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error('Error loading rankings:', error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getAuthorName = (author: any) => {
        if (Array.isArray(author)) {
            return author[0]?.display_name || author[0]?.username || 'Unknown';
        }
        return author?.display_name || author?.username || 'Unknown';
    };

    const formatCount = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
        return (count || 0).toLocaleString();
    };

    return (
        <div className="min-h-screen bg-white font-inter text-slate-800 pb-24">
            {/* Sticky Header with Filters */}
            <div className="sticky top-[56px] md:top-[64px] bg-white z-40 border-b border-slate-100">
                <div className="px-4 py-3 w-full">
                    <div className="flex flex-col md:flex-row md:items-center md:gap-4 md:justify-between">
                        <div className="hidden md:block text-base font-semibold">Rankings</div>
                        <div className="flex flex-wrap gap-2">
                            <Dropdown
                                options={SORT_OPTIONS}
                                value={sortBy}
                                onChange={setSortBy}
                            />
                            <Dropdown
                                options={TIME_OPTIONS}
                                value={timeRange}
                                onChange={setTimeRange}
                            />
                            <Dropdown
                                options={GENRE_OPTIONS}
                                value={genre}
                                onChange={setGenre}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="w-full px-4 pt-4 pb-24">
                {isLoading ? (
                    <div className="flex flex-col gap-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <NovelListCardSkeleton key={i} />
                        ))}
                    </div>
                ) : novels.length > 0 ? (
                    // Responsive Vertical List
                    <div className="flex flex-col gap-3">
                        {novels.map((novel, index) => (
                            <Link
                                key={novel.id}
                                to={`/novel/${novel.id}`}
                                className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all bg-white group cursor-pointer"
                            >
                                {/* Rank Number Box */}
                                <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl text-base sm:text-lg font-bold flex items-center justify-center flex-shrink-0 ${index < 3 ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'
                                    }`}>
                                    {index + 1}
                                </div>

                                {/* Cover Image */}
                                <div className="h-16 w-12 sm:h-20 sm:w-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                    <img
                                        src={getNovelCover(novel.cover_image_url)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-start h-full py-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <div className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1 mb-1">
                                                {novel.title}
                                            </div>
                                            <div className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-2 mb-2">
                                                <span>{getAuthorName(novel.author)}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className={`${novel.status === 'completed' ? 'text-emerald-600' : 'text-sky-600'}`}>
                                                    {novel.status || 'Ongoing'}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span>{novel.chapters?.[0]?.count || 0} Chapters</span>
                                            </div>
                                        </div>

                                        {/* Status/Change Badge */}
                                        <div className={`hidden sm:flex px-2.5 py-1 rounded-full text-xs font-semibold ${index < 3 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'
                                            }`}>
                                            {index < 3 ? `+${3 - index} Positions` : '- No change'}
                                        </div>
                                    </div>

                                    {/* Description Preview */}
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 hidden sm:block">
                                        {novel.description || 'No description available.'}
                                    </p>

                                    {/* Stats Row */}
                                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-auto">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            {formatCount(novel.total_views)}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                            {novel.average_rating || '0.0'}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                            {novel.genres?.[0] || 'Novel'}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <span className="text-4xl mb-4 block">📚</span>
                        <p className="text-slate-500">No novels found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
