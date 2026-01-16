import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function RankingPage() {
    const supabase = await createServerSupabaseClient();

    // Fetch top novels by views
    const { data: topByViews } = await supabase
        .from('novels')
        .select(`
      id, title, cover_image_url, status, view_count, like_count,
      author:profiles!novels_author_id_fkey(username)
    `)
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(20);

    // Fetch top novels by likes
    const { data: topByLikes } = await supabase
        .from('novels')
        .select(`
      id, title, cover_image_url, status, view_count, like_count,
      author:profiles!novels_author_id_fkey(username)
    `)
        .eq('is_published', true)
        .order('like_count', { ascending: false })
        .limit(20);

    const formatNovels = (novels: any[]) =>
        novels?.map(n => ({ ...n, author_name: n.author?.username })) || [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">🏆 Rankings</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Top by Views */}
                <div>
                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                        👁️ Most Viewed
                    </h2>
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                        {formatNovels(topByViews || []).map((novel, index) => (
                            <Link
                                key={novel.id}
                                href={`/novel/${novel.id}`}
                                className="flex items-center gap-4 p-4 hover:bg-[var(--background-secondary)] transition-colors border-b border-[var(--border)] last:border-b-0"
                            >
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index < 3
                                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                                        : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)]'
                                    }`}>
                                    {index + 1}
                                </span>
                                <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                                    {novel.cover_image_url ? (
                                        <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">📖</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-[var(--foreground)] truncate">{novel.title}</h3>
                                    <p className="text-sm text-[var(--foreground-secondary)] truncate">{novel.author_name}</p>
                                </div>
                                <span className="text-sm text-[var(--foreground-secondary)]">
                                    {novel.view_count?.toLocaleString() || 0}
                                </span>
                            </Link>
                        ))}
                        {(!topByViews || topByViews.length === 0) && (
                            <div className="p-8 text-center text-[var(--foreground-secondary)]">
                                No novels found
                            </div>
                        )}
                    </div>
                </div>

                {/* Top by Likes */}
                <div>
                    <h2 className="text-xl font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
                        ❤️ Most Liked
                    </h2>
                    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                        {formatNovels(topByLikes || []).map((novel, index) => (
                            <Link
                                key={novel.id}
                                href={`/novel/${novel.id}`}
                                className="flex items-center gap-4 p-4 hover:bg-[var(--background-secondary)] transition-colors border-b border-[var(--border)] last:border-b-0"
                            >
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index < 3
                                        ? 'bg-gradient-to-br from-red-400 to-red-600 text-white'
                                        : 'bg-[var(--background-secondary)] text-[var(--foreground-secondary)]'
                                    }`}>
                                    {index + 1}
                                </span>
                                <div className="w-12 h-16 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                                    {novel.cover_image_url ? (
                                        <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">📖</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-[var(--foreground)] truncate">{novel.title}</h3>
                                    <p className="text-sm text-[var(--foreground-secondary)] truncate">{novel.author_name}</p>
                                </div>
                                <span className="text-sm text-[var(--foreground-secondary)]">
                                    ❤️ {novel.like_count?.toLocaleString() || 0}
                                </span>
                            </Link>
                        ))}
                        {(!topByLikes || topByLikes.length === 0) && (
                            <div className="p-8 text-center text-[var(--foreground-secondary)]">
                                No novels found
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
