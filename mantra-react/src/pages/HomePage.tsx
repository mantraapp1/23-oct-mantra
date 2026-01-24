import { Link } from 'react-router-dom';
import { useTrendingNovels, useTopRankedNovels, useLatestNovels } from '@/hooks/useNovels';
import { getNovelCover } from '@/lib/defaultImages';
import type { Novel } from '@/types/database';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { NovelCardSkeleton } from '@/components/ui/Skeleton';

export default function HomePage() {
    // React Query Hooks
    const {
        data: trendingNovels = [],
        isLoading: loadingTrending,
        error: errorTrendingObj,
        refetch: refetchTrending
    } = useTrendingNovels();
    const errorTrending = errorTrendingObj ? 'Failed to load content' : null;

    const {
        data: topRankedNovels = [],
        isLoading: loadingRanked,
        error: errorRankedObj,
        refetch: refetchRanked
    } = useTopRankedNovels();
    const errorRanked = errorRankedObj ? 'Failed to load content' : null;

    const {
        data: latestNovels = [],
        isLoading: loadingLatest,
        error: errorLatestObj,
        refetch: refetchLatest
    } = useLatestNovels();
    const errorLatest = errorLatestObj ? 'Failed to load content' : null;

    // Retry handlers (mapped to match previous variable names for JSX compatibility)
    const fetchTrending = () => refetchTrending();
    const fetchRanked = () => refetchRanked();
    const fetchLatest = () => refetchLatest();

    const getGenre = (novel: any) => {
        return novel.genres?.[0] || 'Unknown';
    };

    // Horizontal Skeleton Row Helper
    const SkeletonRow = () => (
        <div className="flex gap-4 min-w-max">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-36 md:w-44 flex-shrink-0">
                    <NovelCardSkeleton />
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-white text-slate-800 pb-24 font-sans">
            <div className="w-full">
                {/* Featured Banner */}
                <div className="px-4 md:px-8 mt-6">
                    <div className="relative rounded-2xl overflow-hidden h-44 shadow-sm md:h-[400px] lg:h-[450px] bg-slate-100">
                        <img
                            src="https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=1200&auto=format&fit=crop"
                            className="h-full w-full object-cover"
                            alt="Featured"
                            onLoad={(e) => e.currentTarget.classList.remove('opacity-0')}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                        <div className="absolute bottom-3 left-3 right-3 text-white md:bottom-6 md:left-6 md:right-6">
                            <div className="text-lg font-semibold tracking-tight md:text-2xl">Weekly Featured</div>
                            <div className="text-xs text-white/80 mt-0.5 line-clamp-1 md:text-sm">Handpicked stories loved by editors</div>
                        </div>
                    </div>
                </div>

                {/* Trending Section */}
                <div className="mt-8">
                    <div className="px-4 flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Trending</h2>
                        <Link to="/ranking" className="text-xs text-sky-600 font-semibold hover:text-sky-700">See all</Link>
                    </div>
                    <div className="overflow-x-auto px-4 no-scrollbar pb-4">
                        {loadingTrending ? (
                            <SkeletonRow />
                        ) : errorTrending ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <AlertTriangle className="w-6 h-6 text-amber-500 mb-2" />
                                <p className="text-sm text-slate-600 mb-3">{errorTrending}</p>
                                <button onClick={fetchTrending} className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:shadow">
                                    <RefreshCw className="w-3 h-3" /> Retry
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-4 min-w-max">
                                {trendingNovels.map((novel) => (
                                    <Link key={novel.id} to={`/novel/${novel.id}`} className="w-36 md:w-44 flex-shrink-0 block group">
                                        <div className="relative rounded-xl overflow-hidden bg-slate-100 h-48 md:h-60 shadow-sm group-hover:shadow-md transition-shadow">
                                            <img src={getNovelCover(novel.cover_image_url)} className="h-full w-full object-cover" alt={novel.title} />
                                        </div>
                                        <div className="mt-3">
                                            <div className="text-sm font-bold line-clamp-1 group-hover:text-sky-600 transition-colors text-slate-900">{novel.title}</div>
                                            <div className="text-xs text-slate-500 mt-1">{getGenre(novel)}</div>
                                        </div>
                                    </Link>
                                ))}
                                {trendingNovels.length === 0 && (
                                    <div className="text-sm text-slate-500 py-8">No trending novels yet</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Rankings */}
                <div className="mt-4">
                    <div className="px-4 flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Top Rankings</h2>
                        <Link to="/ranking" className="text-xs text-sky-600 font-semibold hover:text-sky-700">View all</Link>
                    </div>
                    <div className="overflow-x-auto px-4 no-scrollbar pb-4">
                        {loadingRanked ? (
                            <SkeletonRow />
                        ) : errorRanked ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <AlertTriangle className="w-6 h-6 text-amber-500 mb-2" />
                                <p className="text-sm text-slate-600 mb-3">{errorRanked}</p>
                                <button onClick={fetchRanked} className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:shadow">
                                    <RefreshCw className="w-3 h-3" /> Retry
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-4 min-w-max">
                                {topRankedNovels.map((novel) => (
                                    <Link key={novel.id} to={`/novel/${novel.id}`} className="w-44 md:w-52 flex-shrink-0 block group">
                                        <div className="relative rounded-xl overflow-hidden bg-slate-100 h-56 md:h-72 shadow-sm group-hover:shadow-md transition-shadow">
                                            <img src={getNovelCover(novel.cover_image_url)} className="h-full w-full object-cover" alt={novel.title} />
                                        </div>
                                        <div className="mt-3">
                                            <div className="text-sm font-bold line-clamp-1 group-hover:text-sky-600 transition-colors text-slate-900">{novel.title}</div>
                                            <div className="text-xs text-slate-500 mt-1">{getGenre(novel)} · {novel.average_rating || '0'}★</div>
                                        </div>
                                    </Link>
                                ))}
                                {topRankedNovels.length === 0 && (
                                    <div className="text-sm text-slate-500 py-8">No novels ranked yet</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recently Updated */}
                <div className="mt-4">
                    <div className="px-4 mb-3">
                        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Recently Updated</h2>
                    </div>
                    {loadingLatest ? (
                        <div className="px-4 space-y-3 md:grid md:grid-cols-2 md:space-y-0 md:gap-4 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-100">
                                    <div className="h-20 w-14 rounded-lg bg-slate-200 animate-pulse"></div>
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                                        <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : errorLatest ? (
                        <div className="px-4">
                            <div className="flex flex-col items-center justify-center py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <AlertTriangle className="w-6 h-6 text-amber-500 mb-2" />
                                <p className="text-sm text-slate-600 mb-3">{errorLatest}</p>
                                <button onClick={fetchLatest} className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:shadow">
                                    <RefreshCw className="w-3 h-3" /> Retry
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="px-4 space-y-3 md:grid md:grid-cols-2 md:space-y-0 md:gap-4 lg:grid-cols-3">
                            {latestNovels.map(novel => (
                                <Link key={novel.id} to={`/novel/${novel.id}`} className="flex gap-3 p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow transition bg-white block group">
                                    <div className="h-20 w-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                                        <img src={getNovelCover(novel.cover_image_url)} className="h-full w-full object-cover" alt={novel.title} />
                                    </div>
                                    <div className="flex-1 min-w-0 py-1">
                                        <div className="text-sm font-bold line-clamp-1 group-hover:text-sky-600 transition-colors text-slate-900">{novel.title}</div>
                                        <div className="text-xs text-slate-500 mt-1">
                                            {getGenre(novel)} · {new Date(novel.updated_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1 mt-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${novel.status === 'ongoing' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                                                {novel.status || 'Ongoing'}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {latestNovels.length === 0 && (
                                <div className="text-sm text-slate-500 py-8 col-span-full text-center">No novels updated yet</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
