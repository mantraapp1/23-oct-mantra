import { Link, useNavigate } from 'react-router-dom';
import { useTrendingNovels, useTopRankedNovels, useLatestNovels, useNewArrivals, useEditorsPicks } from '@/hooks/useNovels';
import { getNovelCover } from '@/lib/defaultImages';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { NovelCardSkeleton } from '@/components/ui/Skeleton';
import NovelCard from '@/components/ui/NovelCard';
import HeroSection from '@/components/ui/HeroSection';



export default function HomePage() {
    const navigate = useNavigate();


    // React Query Hooks
    const {
        data: trendingNovels = [],
        isLoading: loadingTrending,
        error: errorTrendingObj,
        refetch: refetchTrending
    } = useTrendingNovels();

    const {
        data: topRankedNovels = [],
        isLoading: loadingRanked,
        error: errorRankedObj,
        refetch: refetchRanked
    } = useTopRankedNovels();

    const {
        data: latestNovels = [],
        isLoading: loadingLatest,
        error: errorLatestObj,
        refetch: refetchLatest
    } = useLatestNovels();

    const {
        data: newArrivals = [],
        isLoading: loadingNew,
        error: errorNewObj,
        refetch: refetchNew
    } = useNewArrivals(6);

    const {
        data: editorsPicks = [],
        isLoading: loadingEditors
    } = useEditorsPicks(6);

    // Fallback for You May Like: Use trending if editors picks are empty
    const recommendedNovels = editorsPicks.length > 0 ? editorsPicks : trendingNovels;
    const loadingRecommended = loadingEditors || (editorsPicks.length === 0 && loadingTrending);

    const getGenre = (novel: any) => {
        return novel.genres?.[0] || 'Unknown';
    };

    const formatViews = (count: number): string => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
        return count?.toString() || '0';
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

    // Error Block Helper
    const ErrorBlock = ({ error, onRetry }: { error: any; onRetry: () => void }) => (
        <div className="flex flex-col items-center justify-center py-6 text-center bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 mx-4">
            <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
            <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">Error Loading Data</p>
            {error?.message && (
                <p className="text-xs text-red-600 dark:text-red-300 mb-2 max-w-xs line-clamp-2">{String(error.message)}</p>
            )}
            <button
                onClick={onRetry}
                className="text-xs font-semibold text-white hover:bg-red-600 flex items-center gap-1 bg-red-500 px-4 py-2 rounded-lg shadow-sm hover:shadow transition-colors"
            >
                <RefreshCw className="w-3 h-3" /> Retry Connection
            </button>
        </div>
    );

    // Section Header Component
    const SectionHeader = ({ title, onSeeAll, showSeeAll = true }: { title: string; onSeeAll?: () => void; showSeeAll?: boolean }) => (
        <div className="px-4 flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">{title}</h2>
            {showSeeAll && onSeeAll && (
                <button onClick={onSeeAll} className="text-xs text-[var(--primary)] font-semibold hover:text-[var(--primary-hover)]">
                    See all
                </button>
            )}
        </div>
    );

    // List Item Card (for You May Like This)
    const ListItemCard = ({ novel }: { novel: any }) => (
        <Link
            to={`/novel/${novel.id}`}
            className="flex gap-3 p-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-sm hover:shadow-md transition-all group hover:border-[var(--primary)]/30"
        >
            <div className="h-20 w-16 rounded-[var(--radius-lg)] overflow-hidden bg-[var(--background-secondary)] flex-shrink-0">
                <img src={getNovelCover(novel.cover_image_url)} className="h-full w-full object-cover" alt={novel.title} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold line-clamp-1 group-hover:text-[var(--primary)] transition-colors text-[var(--foreground)]">
                    {novel.title}
                </div>
                <div className="text-[11px] text-[var(--foreground-secondary)] mt-0.5">
                    {getGenre(novel)} · {novel.average_rating || '0'}★ · {formatViews(novel.total_views || 0)} views
                </div>
                <p className="text-xs text-[var(--foreground-secondary)] mt-1 line-clamp-2">
                    {novel.description || 'No description available'}
                </p>
            </div>
        </Link>
    );

    // Recently Updated Card
    const RecentlyUpdatedCard = ({ novel }: { novel: any }) => (
        <Link
            to={`/novel/${novel.id}`}
            className="flex gap-3 p-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-sm hover:shadow-md transition-all group hover:border-[var(--primary)]/30"
        >
            <div className="h-16 w-12 rounded-[var(--radius-lg)] overflow-hidden bg-[var(--background-secondary)] flex-shrink-0">
                <img src={getNovelCover(novel.cover_image_url)} className="h-full w-full object-cover" alt={novel.title} />
            </div>
            <div className="flex-1 min-w-0 py-1">
                <div className="text-sm font-bold line-clamp-1 group-hover:text-[var(--primary)] transition-colors text-[var(--foreground)]">
                    {novel.title}
                </div>
                <div className="text-xs text-[var(--foreground-secondary)] mt-1">
                    {getGenre(novel)} · {new Date(novel.updated_at).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1 mt-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${novel.status === 'ongoing'
                        ? 'bg-[var(--emerald-500)]/10 text-[var(--emerald-600)]'
                        : 'bg-[var(--slate-100)] text-[var(--slate-500)] dark:bg-[var(--slate-800)] dark:text-[var(--slate-400)]'
                        }`}>
                        {novel.status || 'Ongoing'}
                    </span>
                </div>
            </div>
        </Link>
    );

    return (
        <div className="min-h-screen bg-background text-foreground pb-24 font-sans">
            <div className="w-full">
                {/* Search Bar */}



                {/* Hero Section */}
                <HeroSection novels={editorsPicks.length > 0 ? editorsPicks : trendingNovels} />

                {/* New Arrivals Section */}
                <div className="mt-6">
                    <SectionHeader title="New Arrivals" onSeeAll={() => navigate('/see-all/new-arrivals')} />
                    <div className="overflow-x-auto px-4 no-scrollbar pb-4">
                        {loadingNew ? (
                            <SkeletonRow />
                        ) : errorNewObj ? (
                            <ErrorBlock error={errorNewObj} onRetry={() => refetchNew()} />
                        ) : (
                            <div className="flex gap-4 min-w-max">
                                {newArrivals.map((novel: any) => (
                                    <NovelCard key={novel.id} novel={novel} className="w-36 md:w-44" />
                                ))}
                                {newArrivals.length === 0 && (
                                    <div className="text-sm text-[var(--foreground-secondary)] py-8">No new arrivals yet</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Trending Section */}
                <div className="mt-4">
                    <SectionHeader title="Trending" onSeeAll={() => navigate('/see-all/trending')} />
                    <div className="overflow-x-auto px-4 no-scrollbar pb-4">
                        {loadingTrending ? (
                            <SkeletonRow />
                        ) : errorTrendingObj ? (
                            <ErrorBlock error={errorTrendingObj} onRetry={() => refetchTrending()} />
                        ) : (
                            <div className="flex gap-4 min-w-max">
                                {trendingNovels.map((novel: any) => (
                                    <NovelCard key={novel.id} novel={novel} className="w-36 md:w-44" />
                                ))}
                                {trendingNovels.length === 0 && (
                                    <div className="text-sm text-[var(--foreground-secondary)] py-8">No trending novels yet</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Rankings */}
                <div className="mt-4">
                    <SectionHeader title="Top Rankings" onSeeAll={() => navigate('/ranking')} />
                    <div className="overflow-x-auto px-4 no-scrollbar pb-4">
                        {loadingRanked ? (
                            <SkeletonRow />
                        ) : errorRankedObj ? (
                            <ErrorBlock error={errorRankedObj} onRetry={() => refetchRanked()} />
                        ) : (
                            <div className="flex gap-4 min-w-max">
                                {topRankedNovels.slice(0, 6).map((novel: any) => (
                                    <NovelCard key={novel.id} novel={novel} className="w-44 md:w-52" />
                                ))}
                                {topRankedNovels.length === 0 && (
                                    <div className="text-sm text-[var(--foreground-secondary)] py-8">No ranked novels yet</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Popular Section */}
                <div className="mt-4">
                    <SectionHeader title="Popular" onSeeAll={() => navigate('/see-all/popular')} />
                    <div className="overflow-x-auto px-4 no-scrollbar pb-4">
                        {loadingRanked ? (
                            <SkeletonRow />
                        ) : errorRankedObj ? (
                            <ErrorBlock error={errorRankedObj} onRetry={() => refetchRanked()} />
                        ) : (
                            <div className="flex gap-4 min-w-max">
                                {topRankedNovels.map((novel: any) => (
                                    <NovelCard key={novel.id} novel={novel} className="w-36 md:w-44" />
                                ))}
                            </div>
                        )}
                    </div>
                </div>



                {/* Recently Updated */}
                <div className="mt-6">
                    <SectionHeader title="Recently Updated" showSeeAll={false} />
                    {loadingLatest ? (
                        <div className="px-4 space-y-3 md:grid md:grid-cols-2 md:space-y-0 md:gap-4 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex gap-3 p-3 rounded-xl border border-border bg-card">
                                    <div className="h-16 w-12 rounded-lg bg-background-secondary animate-pulse"></div>
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 bg-background-secondary rounded w-3/4 animate-pulse"></div>
                                        <div className="h-3 bg-background-secondary rounded w-1/2 animate-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : errorLatestObj ? (
                        <div className="px-4">
                            <ErrorBlock error={errorLatestObj} onRetry={() => refetchLatest()} />
                        </div>
                    ) : (
                        <div className="px-4 space-y-3 md:grid md:grid-cols-2 md:space-y-0 md:gap-4 lg:grid-cols-3">
                            {latestNovels.map((novel: any) => (
                                <RecentlyUpdatedCard key={novel.id} novel={novel} />
                            ))}
                            {latestNovels.length === 0 && (
                                <div className="text-sm text-foreground-secondary py-8 col-span-full text-center">No novels updated yet</div>
                            )}
                        </div>
                    )}
                </div>

                {/* You May Like This Section */}
                <div className="mt-6">
                    <SectionHeader title="You May Like This" showSeeAll={false} />
                    <div className="px-4 space-y-3">
                        {loadingRecommended ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex gap-3 p-3 rounded-xl border border-border bg-card">
                                    <div className="h-20 w-16 rounded-lg bg-background-secondary animate-pulse"></div>
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 bg-background-secondary rounded w-3/4 animate-pulse"></div>
                                        <div className="h-3 bg-background-secondary rounded w-1/2 animate-pulse"></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            recommendedNovels.slice(0, 6).map((novel: any) => (
                                <ListItemCard key={novel.id} novel={novel} />
                            ))
                        )}
                        {!loadingRecommended && recommendedNovels.length === 0 && (
                            <div className="text-sm text-foreground-secondary py-4 text-center">No recommendations available</div>
                        )}
                    </div>
                </div>

                <div className="h-6"></div>
            </div>
        </div>
    );
}
