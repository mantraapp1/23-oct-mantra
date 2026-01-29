import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import novelService from '@/services/novelService';
import { getNovelCover } from '@/lib/defaultImages';
import { NovelCardSkeleton } from '@/components/ui/Skeleton';
import MatureBadge from '@/components/ui/MatureBadge';
import type { NovelWithAuthor } from '@/types/supabase';

export default function SeeAllPage() {
    const { type } = useParams<{ type: string }>();
    const navigate = useNavigate();
    const [novels, setNovels] = useState<NovelWithAuthor[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');

    useEffect(() => {
        fetchNovels();
    }, [type]);

    const fetchNovels = async () => {
        setLoading(true);
        try {
            let data: NovelWithAuthor[] = [];

            switch (type) {
                case 'trending':
                    setTitle('Trending Novels');
                    data = await novelService.getTrendingNovels(50);
                    break;
                case 'new-arrivals':
                    setTitle('New Arrivals');
                    data = await novelService.getNewArrivals(50);
                    break;
                case 'popular':
                    setTitle('Popular Novels');
                    data = await novelService.getPopularNovels(50);
                    break;
                case 'top-rated':
                    setTitle('Top Rated');
                    data = await novelService.getTopRatedNovels(50);
                    break;
                case 'updated':
                    setTitle('Recently Updated');
                    data = await novelService.getRecentlyUpdatedNovels(50);
                    break;
                case 'editors-pick':
                    setTitle("Editor's Picks");
                    data = await novelService.getEditorsPicks(100); // Show all editor's picks
                    break;
                default:
                    setTitle('All Novels');
                    data = await novelService.getTrendingNovels(50);
            }
            setNovels(data);
        } catch (error) {
            console.error('Error fetching novels:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGenre = (novel: any) => novel.genres?.[0] || 'Unknown';

    return (
        <div className="min-h-screen bg-background text-foreground pb-10">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background border-b border-border">
                <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 py-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full hover:bg-background-secondary active:scale-95 transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-semibold capitalize">{title}</h1>
                </div>
            </header>

            {/* Grid Content - Full Width */}
            <main className="px-4 sm:px-6 lg:px-8 py-6">
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6">
                        {Array.from({ length: 21 }).map((_, i) => (
                            <NovelCardSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6">
                        {novels.map((novel) => (
                            <div
                                key={novel.id}
                                onClick={() => navigate(`/novel/${novel.id}`)}
                                className="group cursor-pointer flex flex-col gap-2"
                            >
                                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-background-secondary relative shadow-sm transition-all group-hover:shadow-md group-hover:-translate-y-1">
                                    <img
                                        src={getNovelCover(novel.cover_image_url)}
                                        alt={novel.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {/* Rating Badge */}
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                        {novel.average_rating ? `★ ${novel.average_rating.toFixed(1)}` : 'New'}
                                    </div>
                                    {/* 18+ Mature Badge */}
                                    {novel.is_mature && (
                                        <div className="absolute top-2 left-2">
                                            <MatureBadge size="sm" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-sky-500 transition-colors">
                                        {novel.title}
                                    </h3>
                                    <p className="text-xs text-foreground-secondary mt-1">
                                        {getGenre(novel)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && novels.length === 0 && (
                    <div className="text-center py-20 text-foreground-secondary">
                        No novels found in this category.
                    </div>
                )}
            </main>
        </div>
    );
}
