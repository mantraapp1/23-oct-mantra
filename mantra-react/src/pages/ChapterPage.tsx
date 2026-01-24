import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReaderContent from '@/components/reader/ReaderContent';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export default function ChapterPage() {
    const { novelId, chapterId } = useParams<{ novelId: string; chapterId: string }>();
    const [chapter, setChapter] = useState<any>(null);
    const [novel, setNovel] = useState<any>(null);
    const [prevChapter, setPrevChapter] = useState<any>(null);
    const [nextChapter, setNextChapter] = useState<any>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

        if (!novelId || !chapterId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Current Chapter
                const { data: chapterData } = await supabase
                    .from('chapters')
                    .select('*')
                    .eq('id', chapterId)
                    .single();

                if (!chapterData) {
                    navigate(`/novel/${novelId}`);
                    return;
                }
                setChapter(chapterData);

                // Fetch Novel Info
                const { data: novelData } = await supabase
                    .from('novels')
                    .select('id, title, author:profiles(id, username)')
                    .eq('id', novelId)
                    .single();
                setNovel(novelData);

                // Fetch Adjacent Chapters
                // Previous
                const { data: prev } = await supabase
                    .from('chapters')
                    .select('id, chapter_number')
                    .eq('novel_id', novelId)
                    .lt('chapter_number', chapterData.chapter_number)
                    .order('chapter_number', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                setPrevChapter(prev);

                // Next
                const { data: next } = await supabase
                    .from('chapters')
                    .select('id, chapter_number')
                    .eq('novel_id', novelId)
                    .gt('chapter_number', chapterData.chapter_number)
                    .order('chapter_number', { ascending: true })
                    .limit(1)
                    .maybeSingle();
                setNextChapter(next);

                // Increment View (optional, silently)
                supabase.rpc('increment_chapter_view', { chapter_id_param: chapterId });

            } catch (error) {
                console.error('Error fetching chapter:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [novelId, chapterId]);

    if (loading) return <div className="flex justify-center items-center min-h-screen bg-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div></div>;
    if (!chapter) return <div className="text-center py-20">Chapter not found</div>;

    return (
        <ReaderContent
            chapter={chapter}
            novel={novel}
            prevChapter={prevChapter}
            nextChapter={nextChapter}
            novelId={novelId!}
            currentUser={user}
        />
    );
}
