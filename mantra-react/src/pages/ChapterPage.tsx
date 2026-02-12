import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ReaderContent from '@/components/reader/ReaderContent';
import ChapterUnlockModal from '@/components/reader/ChapterUnlockModal';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import novelService from '@/services/novelService';

// Chapter locking configuration
const FREE_CHAPTERS = 7; // First 7 chapters are always free
const SHORT_WAIT_CHAPTERS = { from: 8, to: 30, hours: 3 }; // Ch 8-30: 3hr wait
const LONG_WAIT_HOURS = 24; // Ch 31+: 24hr wait
const UNLOCK_EXPIRY_HOURS = 72; // Unlocks expire after 72 hours

export default function ChapterPage() {
    const { novelId, chapterId } = useParams<{ novelId: string; chapterId: string }>();
    const [searchParams] = useSearchParams();
    const [chapter, setChapter] = useState<any>(null);
    const [novel, setNovel] = useState<any>(null);
    const [prevChapter, setPrevChapter] = useState<any>(null);
    const [nextChapter, setNextChapter] = useState<any>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Locking states
    const [isLocked, setIsLocked] = useState(false);
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [timerEndTime, setTimerEndTime] = useState<Date | null>(null);
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [unlockMethod, setUnlockMethod] = useState<'ad' | null>(null);

    // Check if URL has unlock=ad parameter (coming from ad view)
    useEffect(() => {
        if (searchParams.get('unlock') === 'ad') {
            setUnlockMethod('ad');
        }
    }, [searchParams]);

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

                // Check if chapter is locked
                const lockStatus = await checkChapterLock(chapterData.chapter_number, chapterId, normalizedNovel?.author?.id);
                setIsLocked(lockStatus.isLocked);
                setTimerEndTime(lockStatus.timerEndTime);

                // Show modal if locked and not coming from ad
                if (lockStatus.isLocked && unlockMethod !== 'ad') {
                    setShowUnlockModal(true);
                }

                // If not locked or unlocked via ad, increment views
                if (!lockStatus.isLocked || unlockMethod === 'ad') {
                    // Increment View (optional, silently)
                    supabase.rpc('increment_chapter_views', { chapter_id_param: chapterId });
                    // Also increment novel views
                    novelService.incrementViews(novelId);

                    // Record view for author payment if unlocked via ad or view
                    await recordChapterView(chapterId, novelId, normalizedNovel?.author?.id);
                }

            } catch (error) {
                console.error('Error fetching chapter:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [novelId, chapterId, unlockMethod]);

    /**
     * Check if a chapter is locked for the current user
     */
    const checkChapterLock = async (
        chapterNumber: number,
        targetChapterId: string,
        authorId: string | undefined
    ): Promise<{ isLocked: boolean; timerEndTime: Date | null }> => {
        // First N chapters are always free
        if (chapterNumber <= FREE_CHAPTERS) {
            return { isLocked: false, timerEndTime: null };
        }

        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();

        // Authors can read their own chapters
        if (currentUser && authorId && currentUser.id === authorId) {
            return { isLocked: false, timerEndTime: null };
        }

        // Check for existing unlock in database
        if (currentUser) {
            const { data: unlock } = await supabase
                .from('chapter_unlocks')
                .select('*')
                .eq('user_id', currentUser.id)
                .eq('chapter_id', targetChapterId)
                .maybeSingle();

            if (unlock) {
                // Check if unlock has a timer
                if (unlock.timer_start) {
                    const timerStart = new Date(unlock.timer_start);
                    const waitHours = getWaitHours(chapterNumber);
                    const timerEnd = new Date(timerStart.getTime() + waitHours * 60 * 60 * 1000);

                    if (new Date() >= timerEnd) {
                        // Timer complete - chapter is unlocked
                        return { isLocked: false, timerEndTime: null };
                    } else {
                        // Timer still running
                        return { isLocked: true, timerEndTime: timerEnd };
                    }
                }

                // Check if unlock is not expired
                if (unlock.unlocked_at) {
                    const unlockedAt = new Date(unlock.unlocked_at);
                    const expiresAt = new Date(unlockedAt.getTime() + UNLOCK_EXPIRY_HOURS * 60 * 60 * 1000);

                    if (new Date() < expiresAt) {
                        return { isLocked: false, timerEndTime: null };
                    }
                }
            }
        }

        // Check localStorage for anonymous users
        const localUnlocks = JSON.parse(localStorage.getItem('chapter_unlocks') || '{}');
        const localUnlock = localUnlocks[targetChapterId];

        if (localUnlock) {
            if (localUnlock.timerStart) {
                const timerEnd = new Date(localUnlock.timerStart + getWaitHours(chapterNumber) * 60 * 60 * 1000);
                if (new Date() >= timerEnd) {
                    return { isLocked: false, timerEndTime: null };
                }
                return { isLocked: true, timerEndTime: timerEnd };
            }

            if (localUnlock.unlockedAt) {
                const expiresAt = new Date(localUnlock.unlockedAt + UNLOCK_EXPIRY_HOURS * 60 * 60 * 1000);
                if (new Date() < expiresAt) {
                    return { isLocked: false, timerEndTime: null };
                }
            }
        }

        // Chapter is locked
        return { isLocked: true, timerEndTime: null };
    };

    /**
     * Get wait hours based on chapter number
     */
    const getWaitHours = (chapterNumber: number): number => {
        if (chapterNumber >= SHORT_WAIT_CHAPTERS.from && chapterNumber <= SHORT_WAIT_CHAPTERS.to) {
            return SHORT_WAIT_CHAPTERS.hours;
        }
        return LONG_WAIT_HOURS;
    };

    /**
     * Handle chapter unlock
     */
    const handleUnlock = async (method: 'timer' | 'ad') => {
        if (!chapter || !chapterId) return;

        setIsUnlocking(true);

        try {
            const { data: { user: currentUser } } = await supabase.auth.getUser();

            if (method === 'timer') {
                const now = new Date();
                const waitHours = getWaitHours(chapter.chapter_number);
                const timerEnd = new Date(now.getTime() + waitHours * 60 * 60 * 1000);

                if (currentUser) {
                    // Save to database
                    await supabase.from('chapter_unlocks').upsert({
                        user_id: currentUser.id,
                        chapter_id: chapterId,
                        novel_id: novelId,
                        timer_start: now.toISOString(),
                        unlocked_at: null,
                    });
                } else {
                    // Save to localStorage
                    const localUnlocks = JSON.parse(localStorage.getItem('chapter_unlocks') || '{}');
                    localUnlocks[chapterId] = { timerStart: now.getTime() };
                    localStorage.setItem('chapter_unlocks', JSON.stringify(localUnlocks));
                }

                setTimerEndTime(timerEnd);
                setIsLocked(true);
            } else if (method === 'ad') {
                const now = new Date();

                if (currentUser) {
                    // Save to database
                    await supabase.from('chapter_unlocks').upsert({
                        user_id: currentUser.id,
                        chapter_id: chapterId,
                        novel_id: novelId,
                        timer_start: null,
                        unlocked_at: now.toISOString(),
                    });
                } else {
                    // Save to localStorage
                    const localUnlocks = JSON.parse(localStorage.getItem('chapter_unlocks') || '{}');
                    localUnlocks[chapterId] = { unlockedAt: now.getTime() };
                    localStorage.setItem('chapter_unlocks', JSON.stringify(localUnlocks));
                }

                // Record the view for author payment
                await recordChapterView(chapterId, novelId!, novel?.author?.id);

                setIsLocked(false);
                setShowUnlockModal(false);

                // Increment views now that we're unlocked
                supabase.rpc('increment_chapter_views', { chapter_id_param: chapterId });
                novelService.incrementViews(novelId!);
            }
        } catch (error) {
            console.error('Error unlocking chapter:', error);
            alert('Failed to unlock chapter. Please try again.');
        } finally {
            setIsUnlocking(false);
        }
    };

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
        } catch (error) {
            // Silently fail - view recording shouldn't block reading
            console.error('Error recording chapter view:', error);
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen bg-background"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div></div>;
    if (!chapter) return <div className="text-center py-20 bg-background text-foreground min-h-screen">Chapter not found</div>;

    // Show unlock modal for locked chapters
    if (isLocked && showUnlockModal) {
        return (
            <ChapterUnlockModal
                isOpen={true}
                onClose={() => navigate(`/novel/${novelId}`)}
                onUnlock={handleUnlock}
                chapterNumber={chapter.chapter_number}
                waitHours={getWaitHours(chapter.chapter_number)}
                timerEndTime={timerEndTime}
                isUnlocking={isUnlocking}
            />
        );
    }

    // Show timer waiting screen if timer is active
    if (isLocked && timerEndTime) {
        return (
            <ChapterUnlockModal
                isOpen={true}
                onClose={() => navigate(`/novel/${novelId}`)}
                onUnlock={handleUnlock}
                chapterNumber={chapter.chapter_number}
                waitHours={getWaitHours(chapter.chapter_number)}
                timerEndTime={timerEndTime}
                isUnlocking={isUnlocking}
            />
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
