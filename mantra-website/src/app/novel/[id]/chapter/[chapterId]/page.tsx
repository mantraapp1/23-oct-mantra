import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ReaderContent from '@/components/reader/ReaderContent';

interface ReaderPageProps {
    params: Promise<{ id: string; chapterId: string }>;
}

export default async function ReaderPage({ params }: ReaderPageProps) {
    const { id, chapterId } = await params;
    const supabase = await createServerSupabaseClient();

    // Fetch chapter content with novel info
    const { data: chapter, error } = await supabase
        .from('chapters')
        .select(`
            *,
            novel:novels!chapters_novel_id_fkey(
                id, title, author_id,
                author:profiles!novels_author_id_fkey(id, username, display_name)
            )
        `)
        .eq('id', chapterId)
        .eq('novel_id', id)
        .single();

    if (error || !chapter) {
        notFound();
    }

    // Fetch Previous/Next Navigation
    const { data: navigation } = await supabase
        .from('chapters')
        .select('id, chapter_number, title')
        .eq('novel_id', id)
        .or(`chapter_number.eq.${chapter.chapter_number - 1},chapter_number.eq.${chapter.chapter_number + 1}`);

    const prevChapter = navigation?.find(c => c.chapter_number === chapter.chapter_number - 1);
    const nextChapter = navigation?.find(c => c.chapter_number === chapter.chapter_number + 1);

    // Fetch current user for comments
    const { data: { user } } = await supabase.auth.getUser();

    // Normalize novel data
    const novel = Array.isArray(chapter.novel) ? chapter.novel[0] : chapter.novel;

    return (
        <ReaderContent
            chapter={chapter}
            novel={novel}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
            novelId={id}
            currentUser={user}
        />
    );
}
