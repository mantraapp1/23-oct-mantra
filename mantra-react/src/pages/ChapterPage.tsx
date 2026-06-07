import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReaderContent from '@/components/reader/ReaderContent';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import novelService from '@/services/novelService';
import { trackUniqueView } from '@/utils/viewTracker';
import { detectAdBlocker } from '@/utils/adBlocker';
import { AlertTriangle } from 'lucide-react';

export default function ChapterPage() {
    const { novelId, chapterId } = useParams<{ novelId: string; chapterId: string }>();
    const [chapter, setChapter] = useState<any>(null);
    const [novel, setNovel] = useState<any>(null);
    const [prevChapter, setPrevChapter] = useState<any>(null);
    const [nextChapter, setNextChapter] = useState<any>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [hasAdBlocker, setHasAdBlocker] = useState(false);

    // Check for ad blocker
    useEffect(() => {
        const checkAdBlocker = async () => {
            const isBlocked = await detectAdBlocker();
            setHasAdBlocker(isBlocked);
        };
        checkAdBlocker();
    }, []);

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

                // Fetch Novel Info (with author as single object)
                const { data: novelData } = await supabase
                    .from('novels')
                    .select('id, title, author_id, author:profiles!novels_author_id_fkey(id, username)')
                    .eq('id', novelId)
                    .single();

                // Normalize author object (Supabase returns array for joined tables)
                const normalizedNovel = novelData ? {
                    ...novelData,
                    author: Array.isArray(novelData.author) ? novelData.author[0] : novelData.author
                } : null;
                setNovel(normalizedNovel);

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

                // Increment views (if unique)
                if (trackUniqueView(chapterId)) {
                    // Increment View (optional, silently)
                    supabase.rpc('increment_chapter_views', { chapter_id_param: chapterId });
                    // Also increment novel views
                    novelService.incrementViews(novelId);

                    // Record view for author payment
                    await recordChapterView(chapterId, novelId, normalizedNovel?.author?.id);
                }

            } catch {
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [novelId, chapterId]);

    /**
     * Record a chapter view for author payment
     */
    const recordChapterView = async (
        targetChapterId: string,
        targetNovelId: string,
        authorId: string | undefined
    ) => {
        if (!authorId) return;

        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            await supabase.from('chapter_views_for_payment').insert({
                chapter_id: targetChapterId,
                novel_id: targetNovelId,
                author_id: authorId,
                viewer_id: currentUser?.id || null,
                viewed_at: new Date().toISOString(),
                paid: false,
            });
        } catch {
            // Silently fail - view recording shouldn't block reading
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen bg-background"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>;
    if (!chapter) return <div className="text-center py-20 bg-background text-foreground min-h-screen">Chapter not found</div>;

    if (hasAdBlocker) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-background text-foreground p-4">
                <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2 text-center">Ad Blocker Detected</h1>
                <p className="text-center text-slate-500 mb-6 max-w-md">
                    We rely on ads to keep this platform running and support our authors. Please disable your ad blocker to continue reading this chapter.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 font-medium transition-colors"
                >
                    I've disabled it, reload page
                </button>
            </div>
        );
    }

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
