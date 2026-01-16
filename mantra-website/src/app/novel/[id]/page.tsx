import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface NovelDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function NovelDetailPage({ params }: NovelDetailPageProps) {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Fetch novel with author info
    const { data: novel, error } = await supabase
        .from('novels')
        .select(`
      *,
      author:profiles!novels_author_id_fkey(id, username, avatar_url),
      genres:novel_genres(genre:genres(id, name, slug, emoji))
    `)
        .eq('id', id)
        .single();

    if (error || !novel) {
        notFound();
    }

    // Fetch chapters
    const { data: chapters } = await supabase
        .from('chapters')
        .select('id, title, chapter_number, created_at, is_published')
        .eq('novel_id', id)
        .eq('is_published', true)
        .order('chapter_number', { ascending: true });

    // Fetch reviews
    const { data: reviews } = await supabase
        .from('reviews')
        .select(`
      id, rating, content, created_at,
      user:profiles!reviews_user_id_fkey(username, avatar_url)
    `)
        .eq('novel_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

    const genres = novel.genres?.map((g: any) => g.genre) || [];
    const avgRating = reviews?.length
        ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 'N/A';

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Novel Header */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
                {/* Cover Image */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-200 shadow-lg">
                        {novel.cover_image_url ? (
                            <img
                                src={novel.cover_image_url}
                                alt={novel.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-500/20 to-indigo-500/20">
                                <span className="text-6xl">📖</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Novel Info */}
                <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {genres.map((genre: any) => (
                            <Link
                                key={genre.id}
                                href={`/genre/${genre.slug}`}
                                className="px-3 py-1 bg-[var(--primary-light)] text-[var(--primary)] rounded-full text-sm font-medium hover:bg-[var(--primary)] hover:text-white transition-all"
                            >
                                {genre.emoji} {genre.name}
                            </Link>
                        ))}
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-2">
                        {novel.title}
                    </h1>

                    <Link
                        href={`/user/${novel.author?.id}`}
                        className="text-[var(--primary)] font-medium hover:underline"
                    >
                        By {novel.author?.username || 'Unknown Author'}
                    </Link>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-[var(--foreground-secondary)]">
                        <span className="flex items-center gap-1">
                            ⭐ {avgRating}
                        </span>
                        <span className="flex items-center gap-1">
                            👁️ {novel.view_count?.toLocaleString() || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                            ❤️ {novel.like_count?.toLocaleString() || 0} likes
                        </span>
                        <span className="flex items-center gap-1">
                            📚 {chapters?.length || 0} chapters
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${novel.status === 'ongoing'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                            {novel.status?.toUpperCase() || 'ONGOING'}
                        </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 mt-6">
                        {chapters && chapters.length > 0 && (
                            <Link
                                href={`/chapter/${chapters[0].id}`}
                                className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors"
                            >
                                Start Reading
                            </Link>
                        )}
                        <button className="px-6 py-3 border border-[var(--border)] text-[var(--foreground)] rounded-lg font-semibold hover:bg-[var(--background-secondary)] transition-colors">
                            + Add to Library
                        </button>
                        <button className="px-4 py-3 border border-[var(--border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--background-secondary)] transition-colors">
                            ❤️
                        </button>
                    </div>
                </div>
            </div>

            {/* Synopsis */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">Synopsis</h2>
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                    <p className="text-[var(--foreground)] whitespace-pre-line leading-relaxed">
                        {novel.synopsis || 'No synopsis available.'}
                    </p>
                </div>
            </div>

            {/* Chapters */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
                    Chapters ({chapters?.length || 0})
                </h2>
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                    {chapters && chapters.length > 0 ? (
                        <div className="divide-y divide-[var(--border)]">
                            {chapters.map((chapter) => (
                                <Link
                                    key={chapter.id}
                                    href={`/chapter/${chapter.id}`}
                                    className="flex items-center justify-between p-4 hover:bg-[var(--background-secondary)] transition-colors"
                                >
                                    <div>
                                        <span className="text-[var(--primary)] font-medium">
                                            Chapter {chapter.chapter_number}
                                        </span>
                                        <span className="text-[var(--foreground)] ml-2">
                                            {chapter.title}
                                        </span>
                                    </div>
                                    <span className="text-sm text-[var(--foreground-secondary)]">
                                        {new Date(chapter.created_at).toLocaleDateString()}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-[var(--foreground-secondary)]">
                            No chapters available yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Reviews */}
            <div>
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
                    Reviews ({reviews?.length || 0})
                </h2>
                <div className="space-y-4">
                    {reviews && reviews.length > 0 ? (
                        reviews.map((review: any) => (
                            <div
                                key={review.id}
                                className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-medium text-sm">
                                        {review.user?.username?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <span className="font-medium text-[var(--foreground)]">
                                            {review.user?.username || 'Anonymous'}
                                        </span>
                                        <span className="ml-2 text-amber-500">
                                            {'⭐'.repeat(review.rating)}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-[var(--foreground-secondary)]">
                                    {review.content}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 text-center text-[var(--foreground-secondary)]">
                            No reviews yet. Be the first to review!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
