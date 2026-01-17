import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ReaderContent from '@/components/reader/ReaderContent';

interface ReaderPageProps {
    params: Promise<{ id: string; chapterId: string }>;
}

export default async function ReaderPage({ params }: ReaderPageProps) {
    const { id, chapterId } = await params;
    const supabase = await createServerSupabaseClient();

    // Fetch chapter content
    const { data: chapter, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .eq('novel_id', id)
        .single();

    if (error || !chapter) {
        notFound();
    }

    // Fetch Previous/Next Navigation
    const { data: navigation } = await supabase
        .from('chapters')
        .select('id, chapter_number')
        .eq('novel_id', id)
        .or(`chapter_number.eq.${chapter.chapter_number - 1},chapter_number.eq.${chapter.chapter_number + 1}`);

    const prevChapter = navigation?.find(c => c.chapter_number === chapter.chapter_number - 1);
    const nextChapter = navigation?.find(c => c.chapter_number === chapter.chapter_number + 1);

    // Fetch current user for comments
    const { data: { user } } = await supabase.auth.getUser();

    return (
        <ReaderContent
            chapter={chapter}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
            novelId={id}
            currentUser={user}
        />
    );
}
