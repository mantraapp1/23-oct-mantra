import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface GenreDetailPageProps {
    params: Promise<{ slug: string }>;
}

export default async function GenreDetailPage({ params }: GenreDetailPageProps) {
    const { slug } = await params;
    const supabase = await createServerSupabaseClient();

    // Fetch genre
    const { data: genre } = await supabase
        .from('genres')
        .select('*')
        .eq('slug', slug)
        .single();

    if (!genre) {
        notFound();
    }

    // Fetch novels in this genre
    const { data: novelGenres } = await supabase
        .from('novel_genres')
        .select(`
      novel:novels!novel_genres_novel_id_fkey(
        id, title, cover_image_url, synopsis, view_count, like_count, status,
        author:profiles!novels_author_id_fkey(username)
      )
    `)
        .eq('genre_id', genre.id)
        .limit(50);

    const novels = novelGenres
        ?.map((ng: any) => ({ ...ng.novel, author_name: ng.novel?.author?.username }))
        .filter((n: any) => n?.id) || [];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link href="/genre" className="text-[var(--primary)] hover:underline text-sm mb-2 inline-block">
                    ← All Genres
                </Link>
                <div className="flex items-center gap-4">
                    <span className="text-5xl">{genre.emoji || '📖'}</span>
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--foreground)]">{genre.name}</h1>
                        {genre.description && (
                            <p className="text-[var(--foreground-secondary)] mt-1">{genre.description}</p>
                        )}
                        <p className="text-sm text-[var(--foreground-secondary)] mt-2">
                            {novels.length} novels
                        </p>
                    </div>
                </div>
            </div>

            {/* Novels Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {novels.map((novel: any) => (
                    <Link
                        key={novel.id}
                        href={`/novel/${novel.id}`}
                        className="group block bg-[var(--card)] rounded-xl overflow-hidden border border-[var(--border)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className="aspect-[3/4] relative overflow-hidden bg-slate-200">
                            {novel.cover_image_url ? (
                                <img
                                    src={novel.cover_image_url}
                                    alt={novel.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-500/20 to-indigo-500/20">
                                    <span className="text-4xl">📖</span>
                                </div>
                            )}
                        </div>
                        <div className="p-3">
                            <h3 className="font-semibold text-[var(--foreground)] line-clamp-2 text-sm group-hover:text-[var(--primary)] transition-colors">
                                {novel.title}
                            </h3>
                            <p className="text-xs text-[var(--foreground-secondary)] mt-1 line-clamp-1">
                                {novel.author_name || 'Unknown Author'}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-[var(--foreground-secondary)]">
                                <span>👁️ {novel.view_count?.toLocaleString() || 0}</span>
                                <span>❤️ {novel.like_count?.toLocaleString() || 0}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {novels.length === 0 && (
                <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">📭</span>
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No novels yet</h3>
                    <p className="text-[var(--foreground-secondary)]">
                        Be the first to write a {genre.name} novel!
                    </p>
                </div>
            )}
        </div>
    );
}
