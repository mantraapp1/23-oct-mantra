import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReaderContent from '@/components/reader/ReaderContent';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import novelService from '@/services/novelService';
import { trackUniqueView } from '@/utils/viewTracker';
import SEO from '@/components/seo/SEO';

export default function ChapterPage() {
    const { novelId, chapterId } = useParams<{ novelId: string; chapterId: string }>();
    const [chapter, setChapter] = useState<any>(null);
    const [novel, setNovel] = useState<any>(null);
    const [prevChapter, setPrevChapter] = useState<any>(null);
    const [nextChapter, setNextChapter] = useState<any>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
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

                // Fetch Novel Info (with author as single object)
                const { data: novelData } = await supabase
                    .from('novels')
                    .select('id, title, author_id, language, author:profiles!novels_author_id_fkey(id, username)')
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

    const authorName = novel?.author?.username || 'Unknown';
    const chapterSchema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        'headline': `${novel?.title || ''} - Chapter ${chapter.chapter_number}: ${chapter.title}`,
        'description': `Read Chapter ${chapter.chapter_number}: ${chapter.title} of ${novel?.title || ''} on Mantra.`,
        'articleBody': chapter.content ? chapter.content.slice(0, 300) : '',
        'author': {
            '@type': 'Person',
            'name': authorName
        },
        'publisher': {
            '@type': 'Organization',
            'name': 'Mantra',
            'logo': {
                '@type': 'ImageObject',
                'url': `${import.meta.env.VITE_SITE_URL || 'https://mantranovels.com'}/logo-circle.png`
            }
        },
        'isPartOf': novel ? {
            '@type': 'Book',
            'name': novel.title,
            'url': `${import.meta.env.VITE_SITE_URL || 'https://mantranovels.com'}/novel/${novel.id}`
        } : undefined
    };

    const langMapping: Record<string, string> = {
        'English': 'en',
        'Hindi': 'hi',
        'Spanish': 'es',
        'French': 'fr',
        'German': 'de',
        'Portuguese': 'pt',
        'Italian': 'it',
        'Russian': 'ru',
        'Japanese': 'ja',
        'Korean': 'ko',
        'Chinese': 'zh',
        'Arabic': 'ar'
    };
    const novelLang = novel ? (langMapping[novel.language] || 'en') : 'en';

    return (
        <>
            <SEO
                title={`Read ${novel?.title || ''} - Chapter ${chapter.chapter_number}: ${chapter.title} | Mantra`}
                description={`Read Chapter ${chapter.chapter_number}: ${chapter.title} of ${novel?.title || ''} web novel online on Mantra. ${chapter.content ? chapter.content.slice(0, 120) : ''}...`}
                keywords={`${novel?.title || ''} chapter ${chapter.chapter_number}, read ${novel?.title || ''} chapter ${chapter.chapter_number}, ${chapter.title}, webnovel, lightnovel`}
                url={`/novel/${novelId}/chapter/${chapterId}`}
                type="article"
                schema={chapterSchema}
                lang={novelLang}
                author={authorName}
                publishDate={chapter.published_at}
            />
            <ReaderContent
                chapter={chapter}
                novel={novel}
                prevChapter={prevChapter}
                nextChapter={nextChapter}
                novelId={novelId!}
                currentUser={user}
            />
        </>
    );
}
