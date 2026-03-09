import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import NovelCard from '@/components/ui/NovelCard';

interface YouMayLikeProps {
    currentNovelId: string;
    genres: string[];
}

export default function YouMayLike({ currentNovelId, genres }: YouMayLikeProps) {
    const [novels, setNovels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSimilarNovels = async () => {
            setLoading(true);
            try {
                // Try to get novels with matching genres first
                let query = supabase
                    .from('novels')
                    .select(`
                        id, title, cover_image_url, status, total_views,
                        author:profiles!novels_author_id_fkey(username)
                    `)
                    .neq('id', currentNovelId)
                    .eq('is_mature', false)
                    .order('total_views', { ascending: false })
                    .limit(8);

                // If genres exist, filter by them using the overlaps operator
                if (genres && genres.length > 0) {
                    query = query.overlaps('genres', genres);
                }

                const { data } = await query;

                if (data && data.length > 0) {
                    setNovels(data);
                } else {
                    // Fallback to popular novels
                    const { data: popularData } = await supabase
                        .from('novels')
                        .select(`
                            id, title, cover_image_url, status, total_views,
                            author:profiles!novels_author_id_fkey(username)
                        `)
                        .neq('id', currentNovelId)
                        .eq('is_mature', false)
                        .order('total_views', { ascending: false })
                        .limit(8);

                    setNovels(popularData || []);
                }
            } catch {
            } finally {
                setLoading(false);
            }
        };

        fetchSimilarNovels();
    }, [currentNovelId, genres]);

    if (loading) {
        return (
            <div className="mt-12">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-foreground">You May Like</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-[2/3] bg-background-secondary rounded-xl mb-2" />
                            <div className="h-4 bg-background-secondary rounded w-3/4 mb-1" />
                            <div className="h-3 bg-background-secondary rounded w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (novels.length === 0) return null;

    return (
        <div className="mt-12 border-t border-border pt-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">You May Like</h2>
                <Link
                    to="/ranking"
                    className="flex items-center gap-1 text-sm font-semibold text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
                >
                    View All <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {novels.slice(0, 8).map(novel => (
                    <NovelCard key={novel.id} novel={novel} />
                ))}
            </div>
        </div>
    );
}
