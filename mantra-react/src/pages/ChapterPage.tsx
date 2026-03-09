import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ReaderContent from '@/components/reader/ReaderContent';
import ChapterUnlockModal from '@/components/reader/ChapterUnlockModal';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import novelService from '@/services/novelService';
import { trackUniqueView } from '@/utils/viewTracker';
import { detectAdBlocker } from '@/utils/adBlocker';
import { AlertTriangle } from 'lucide-react';

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
    const [hasAdBlocker, setHasAdBlocker] = useState(false);

    // Check for ad blocker
    useEffect(() => {
        const checkAdBlocker = async () => {
            const isBlocked = await detectAdBlocker();
            setHasAdBlocker(isBlocked);
        };
        checkAdBlocker();
    }, []);

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
                    // Check if view is unique (debounced)
                    if (trackUniqueView(chapterId)) {
                        // Increment View (optional, silently)
                        supabase.rpc('increment_chapter_views', { chapter_id_param: chapterId });
                        // Also increment novel views
                        novelService.incrementViews(novelId);

                        // Record view for author payment if unlocked via ad or view
                        await recordChapterView(chapterId, novelId, normalizedNovel?.author?.id);
                    }
                }

            } catch {
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
                // Check if unlock has a timer or is immediate
                if (unlock.expiration_timestamp) {
                    const expirationTime = new Date(unlock.expiration_timestamp);

                    // Check if the unlock is completely expired
                    if (new Date() >= expirationTime || unlock.is_expired) {
                        return { isLocked: true, timerEndTime: null };
                    }

                    // For timers: Check if unlock timestamp is in the future
                    if (unlock.unlock_timestamp) {
                        const unlockTime = new Date(unlock.unlock_timestamp);

                        if (new Date() < unlockTime) {
                            // Timer still running
                            return { isLocked: true, timerEndTime: unlockTime };
                        }
                    }

                    // Otherwise it's unlocked (timer complete, or immediate Ad unlock)
                    return { isLocked: false, timerEndTime: null };
                }
            }
        }

        // Check localStorage for anonymous users
        const localUnlocks = JSON.parse(localStorage.getItem('chapter_unlocks') || '{}');
        const localUnlock = localUnlocks[targetChapterId];

        if (localUnlock) {
            const expirationTime = new Date(localUnlock.expirationTimestamp);

            if (new Date() >= expirationTime) {
                return { isLocked: true, timerEndTime: null };
            }

            if (localUnlock.unlockTimestamp) {
                const unlockTime = new Date(localUnlock.unlockTimestamp);
                if (new Date() < unlockTime) {
                    return { isLocked: true, timerEndTime: unlockTime };
                }
            }

            return { isLocked: false, timerEndTime: null };
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
                const unlockTime = new Date(now.getTime() + waitHours * 60 * 60 * 1000);
                const expirationTime = new Date(unlockTime.getTime() + UNLOCK_EXPIRY_HOURS * 60 * 60 * 1000);

                if (currentUser) {
                    // Save to database
                    await supabase.from('chapter_unlocks').upsert({
                        user_id: currentUser.id,
                        chapter_id: chapterId,
                        novel_id: novelId,
                        unlock_method: 'timer',
                        unlock_timestamp: unlockTime.toISOString(),
                        expiration_timestamp: expirationTime.toISOString(),
                        is_expired: false
                    });
                } else {
                    // Save to localStorage
                    const localUnlocks = JSON.parse(localStorage.getItem('chapter_unlocks') || '{}');
                    localUnlocks[chapterId] = {
                        method: 'timer',
                        unlockTimestamp: unlockTime.getTime(),
                        expirationTimestamp: expirationTime.getTime()
                    };
                    localStorage.setItem('chapter_unlocks', JSON.stringify(localUnlocks));
                }

                setTimerEndTime(unlockTime);
                setIsLocked(true);
            } else if (method === 'ad') {
                const now = new Date();
                const expirationTime = new Date(now.getTime() + UNLOCK_EXPIRY_HOURS * 60 * 60 * 1000);

                if (currentUser) {
                    // Save to database
                    await supabase.from('chapter_unlocks').upsert({
                        user_id: currentUser.id,
                        chapter_id: chapterId,
                        novel_id: novelId,
                        unlock_method: 'ad',
                        unlock_timestamp: now.toISOString(),
                        expiration_timestamp: expirationTime.toISOString(),
                        is_expired: false
                    });
                } else {
                    // Save to localStorage
                    const localUnlocks = JSON.parse(localStorage.getItem('chapter_unlocks') || '{}');
                    localUnlocks[chapterId] = {
                        method: 'ad',
                        unlockTimestamp: now.getTime(),
                        expirationTimestamp: expirationTime.getTime()
                    };
                    localStorage.setItem('chapter_unlocks', JSON.stringify(localUnlocks));
                }

                // Record the view for author payment
                await recordChapterView(chapterId, novelId!, novel?.author?.id);

                setIsLocked(false);
                setShowUnlockModal(false);

                // Increment views now that we're unlocked
                if (trackUniqueView(chapterId)) {
                    supabase.rpc('increment_chapter_views', { chapter_id_param: chapterId });
                    novelService.incrementViews(novelId!);
                }
            }
        } catch {
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
