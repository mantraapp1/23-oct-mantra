import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown } from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/badge-2';
import { getNovelCover } from '@/lib/defaultImages';
import { NovelListCardSkeleton } from '@/components/ui/Skeleton';
import { useRankedNovels } from '@/hooks/useNovels';

const SORT_OPTIONS = ['Trending', 'Most Viewed', 'Most Voted', 'Highest Rated'];
const TIME_OPTIONS = ['Today', 'Weekly', 'Monthly', 'Yearly'];
const GENRE_OPTIONS = ['All Genres', 'Fantasy', 'Romance', 'Adventure', 'Thriller', 'Slice of Life'];

export default function RankingPage() {
    const [sortBy, setSortBy] = useState('Trending');
    const [timeRange, setTimeRange] = useState('Today');
    const [genre, setGenre] = useState('All Genres');

    // Mapped filters for novelService
    const filters = {
        genres: genre !== 'All Genres' ? [genre] : undefined,
        status: sortBy === 'Most Voted' ? 'popular' : undefined,
    };

    // Use React Query Hook with sortBy strategy
    const { data: novels = [], isLoading, error } = useRankedNovels(sortBy, filters);

    if (error) {
    }


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
        <div className="min-h-screen bg-background font-inter text-foreground pb-24">
            {/* Sticky Header with Filters */}
            <div className="sticky top-[56px] md:top-[64px] bg-background z-40 border-b border-border">
                <div className="px-4 py-3 w-full">
                    <div className="flex flex-col md:flex-row md:items-center md:gap-4 md:justify-between">
                        <div className="hidden md:block text-base font-semibold text-foreground">Rankings</div>
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
                                className="flex items-center gap-4 p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all bg-card group cursor-pointer"
                            >
                                {/* Rank Number Box */}
                                <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl text-base sm:text-lg font-bold flex items-center justify-center flex-shrink-0 border ${index < 3
                                    ? 'bg-sky-500 text-white border-sky-500 shadow-md shadow-sky-500/20'
                                    : 'bg-card border-border text-foreground-secondary'
                                    }`}>
                                    {index + 1}
                                </div>

                                {/* Cover Image */}
                                <div className="h-16 w-12 sm:h-20 sm:w-16 rounded-lg overflow-hidden bg-background-secondary flex-shrink-0">
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
                                            <div className="text-base sm:text-lg font-bold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1 mb-1">
                                                {novel.title}
                                            </div>
                                            <div className="text-xs sm:text-sm text-foreground-secondary font-medium flex items-center gap-2 mb-2">
                                                <span>{getAuthorName(novel.author)}</span>
                                                <span className="w-1 h-1 rounded-full bg-foreground-secondary opacity-50"></span>
                                                <span className={`${novel.status === 'completed' ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}`}>
                                                    {novel.status || 'Ongoing'}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-foreground-secondary opacity-50"></span>
                                                <span>{novel.total_chapters || 0} Chapters</span>
                                            </div>
                                        </div>

                                        {/* Status/Change Badge */}
                                        <div className="hidden sm:flex">
                                            <Badge
                                                variant={index < 3 ? 'success' : 'purple'}
                                                className="rounded-full text-xs font-semibold"
                                            >
                                                {index < 3 ? `+${3 - index} Positions` : '~ Stable'}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Description Preview */}
                                    <p className="text-xs text-foreground-secondary line-clamp-2 mb-3 hidden sm:block">
                                        {novel.description || 'No description available.'}
                                    </p>

                                    {/* Stats Row */}
                                    <div className="flex items-center gap-4 text-xs font-medium text-foreground-secondary mt-auto">
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            {formatCount(novel.total_views)}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                            {novel.average_rating || '0.0'}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
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
                        <p className="text-foreground-secondary">No novels found</p>
                    </div>
                )}
            </div>
        </div>
    );
}
