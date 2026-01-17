import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ReaderContent from '@/components/reader/ReaderContent';

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
    const prevChapter = currentIndex > 0 ? (allChapters?.[currentIndex - 1] || null) : null;
    const nextChapter = currentIndex < (allChapters?.length ?? 0) - 1 ? (allChapters?.[currentIndex + 1] || null) : null;

    return (
        <ReaderContent
            chapter={chapter}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
        />
    );
}
