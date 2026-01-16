import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface ChapterPageProps {
    params: Promise<{ id: string }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Fetch chapter with novel info
    const { data: chapter, error } = await supabase
        .from('chapters')
        .select(`
      *,
      novel:novels!chapters_novel_id_fkey(id, title, author_id)
    `)
        .eq('id', id)
        .single();

    if (error || !chapter) {
        notFound();
    }

    // Fetch previous and next chapters
    const { data: allChapters } = await supabase
        .from('chapters')
        .select('id, chapter_number')
        .eq('novel_id', chapter.novel_id)
        .eq('is_published', true)
        .order('chapter_number', { ascending: true });

    const currentIndex = allChapters?.findIndex(c => c.id === id) ?? -1;
    const prevChapter = currentIndex > 0 ? allChapters?.[currentIndex - 1] : null;
    const nextChapter = currentIndex < (allChapters?.length ?? 0) - 1 ? allChapters?.[currentIndex + 1] : null;

    return (
        <div className="min-h-screen">
            {/* Header */}
            <div className="sticky top-16 z-40 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--border)]">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link
                        href={`/novel/${chapter.novel?.id}`}
                        className="text-[var(--primary)] hover:underline flex items-center gap-2"
                    >
                        ← Back to Novel
                    </Link>
                    <div className="flex items-center gap-2">
                        {prevChapter && (
                            <Link
                                href={`/chapter/${prevChapter.id}`}
                                className="px-3 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
                            >
                                ← Prev
                            </Link>
                        )}
                        {nextChapter && (
                            <Link
                                href={`/chapter/${nextChapter.id}`}
                                className="px-3 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-sky-600 transition-colors"
                            >
                                Next →
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <article className="max-w-4xl mx-auto px-4 py-8">
                <header className="mb-8 text-center">
                    <Link
                        href={`/novel/${chapter.novel?.id}`}
                        className="text-[var(--primary)] hover:underline text-sm"
                    >
                        {chapter.novel?.title}
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mt-2">
                        Chapter {chapter.chapter_number}: {chapter.title}
                    </h1>
                    <p className="text-[var(--foreground-secondary)] mt-2">
                        {new Date(chapter.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </header>

                {/* Chapter Content */}
                <div
                    className="prose prose-lg max-w-none text-[var(--foreground)] leading-relaxed"
                    style={{
                        fontSize: '18px',
                        lineHeight: '1.8',
                    }}
                >
                    {chapter.content?.split('\n').map((paragraph: string, index: number) => (
                        paragraph.trim() && (
                            <p key={index} className="mb-4">
                                {paragraph}
                            </p>
                        )
                    )) || (
                            <p className="text-[var(--foreground-secondary)] text-center py-8">
                                No content available.
                            </p>
                        )}
                </div>

                {/* Bottom Navigation */}
                <div className="mt-12 pt-8 border-t border-[var(--border)] flex items-center justify-between">
                    {prevChapter ? (
                        <Link
                            href={`/chapter/${prevChapter.id}`}
                            className="flex items-center gap-2 text-[var(--primary)] hover:underline"
                        >
                            ← Previous Chapter
                        </Link>
                    ) : (
                        <span></span>
                    )}

                    <Link
                        href={`/novel/${chapter.novel?.id}`}
                        className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
                    >
                        📚 All Chapters
                    </Link>

                    {nextChapter ? (
                        <Link
                            href={`/chapter/${nextChapter.id}`}
                            className="flex items-center gap-2 text-[var(--primary)] hover:underline"
                        >
                            Next Chapter →
                        </Link>
                    ) : (
                        <span className="text-[var(--foreground-secondary)]">
                            End of available chapters
                        </span>
                    )}
                </div>
            </article>
        </div>
    );
}
