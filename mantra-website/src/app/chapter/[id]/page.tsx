import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface ChapterPageProps {
    params: Promise<{ id: string }>;
}

// This route redirects to the proper nested route
export default async function ChapterPage({ params }: ChapterPageProps) {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Fetch chapter to get novel_id
    const { data: chapter, error } = await supabase
        .from('chapters')
        .select('id, novel_id')
        .eq('id', id)
        .single();

    if (error || !chapter) {
        notFound();
    }

    // Redirect to the proper nested route
    redirect(`/novel/${chapter.novel_id}/chapter/${chapter.id}`);
}
