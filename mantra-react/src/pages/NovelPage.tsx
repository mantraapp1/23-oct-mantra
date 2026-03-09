import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NovelHero from '@/components/novel/NovelHero';
import NovelTabs from '@/components/novel/NovelTabs';
import YouMayLike from '@/components/novel/YouMayLike';
import AgeGateModal from '@/components/ui/AgeGateModal';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import readingService from '@/services/readingService';
import { detectAdBlocker } from '@/utils/adBlocker';
import { AlertTriangle } from 'lucide-react';

// Session storage key for confirmed mature novels
const CONFIRMED_MATURE_NOVELS_KEY = 'confirmed_mature_novels';

function getConfirmedNovels(): string[] {
    try {
        const stored = sessionStorage.getItem(CONFIRMED_MATURE_NOVELS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function confirmNovel(novelId: string): void {
    const confirmed = getConfirmedNovels();
    if (!confirmed.includes(novelId)) {
        confirmed.push(novelId);
        sessionStorage.setItem(CONFIRMED_MATURE_NOVELS_KEY, JSON.stringify(confirmed));
    }
}

export default function NovelPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [novel, setNovel] = useState<any>(null);
    const [chapters, setChapters] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [currentChapterNumber, setCurrentChapterNumber] = useState<number | undefined>(undefined);

    // Age gate state
    const [showAgeGate, setShowAgeGate] = useState(false);
    const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);

    // Ad blocker state
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
        if (!id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Novel Metadata (Blocking)
                const { data: novelData } = await supabase
                    .from('novels')
                    .select(`
                        id, title, description, cover_image_url, genres, tags, language, 
                        is_mature, status, total_chapters, total_views, total_votes, 
                        average_rating, total_reviews, is_featured, is_editors_pick,
                        created_at, updated_at,
                        author:profiles!novels_author_id_fkey(id, username, display_name, profile_picture_url)
                    `)
                    .eq('id', id)
                    .single();

                if (novelData) {
                    setNovel(novelData);

                    // Check if mature content needs age gate
                    if (novelData.is_mature) {
                        const confirmedNovels = getConfirmedNovels();
                        if (confirmedNovels.includes(id)) {
                            setIsAgeConfirmed(true);
                        } else {
                            setShowAgeGate(true);
                        }
                    } else {
                        setIsAgeConfirmed(true); // Non-mature content doesn't need confirmation
                    }

                    setLoading(false); // UNBLOCK UI IMMEDIATELY

                    // 2. Fetch Content (Background / Progressive)

                    // Fetch Chapters
                    supabase
                        .from('chapters')
                        .select('id, title, chapter_number, created_at:published_at, views')
                        .eq('novel_id', id)
                        .order('chapter_number', { ascending: true })
                        .then(({ data, error }) => {
                            if (data) setChapters(data);
                        });

                    // Fetch Reviews
                    supabase
                        .from('reviews')
                        .select(`
                            id, rating, content:review_text, created_at,
                            user:profiles!reviews_user_id_fkey(username, profile_picture_url)
                        `)
                        .eq('novel_id', id)
                        .order('created_at', { ascending: false })
                        .limit(5)
                        .then(({ data }) => {
                            if (data) setReviews(data);
                        });
                } else {
                    setLoading(false); // Novel not found
                }
            } catch {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Fetch reading progress for logged-in user
    useEffect(() => {
        if (!user || !id) return;

        const fetchReadingProgress = async () => {
            try {
                const progress = await readingService.getReadingProgress(user.id, id);
                if (progress && progress.current_chapter_number) {
                    setCurrentChapterNumber(progress.current_chapter_number);
                }
            } catch {
            }
        };

        fetchReadingProgress();
    }, [user, id]);

    // Record novel view to reading_progress (for logged-in users)
    useEffect(() => {
        if (!user || !id || loading) return;

        // Record view to reading_progress (silently, non-blocking)
        // This creates or updates the user's reading progress for this novel
        const recordView = async () => {
            try {
                // Upsert to reading_progress - this table has UNIQUE(user_id, novel_id)
                await supabase
                    .from('reading_progress')
                    .upsert({
                        user_id: user.id,
                        novel_id: id,
                        last_updated: new Date().toISOString(),
                    }, {
                        onConflict: 'user_id,novel_id',
                        ignoreDuplicates: false
                    });
            } catch {
                // Silently fail - don't interrupt user experience
            }
        };

        recordView();
    }, [user, id, loading]);

    // Handle age gate confirmation
    const handleAgeConfirm = () => {
        if (id) {
            confirmNovel(id);
            setIsAgeConfirmed(true);
            setShowAgeGate(false);
        }
    };

    // Handle age gate cancel - go back
    const handleAgeCancel = () => {
        setShowAgeGate(false);
        navigate(-1);
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-background">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
        </div>
    );

    if (!novel) return (
        <div className="text-center py-20 text-foreground bg-background min-h-screen">
            Novel not found
        </div>
    );

    if (hasAdBlocker) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-background text-foreground p-4">
                <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2 text-center">Ad Blocker Detected</h1>
                <p className="text-center text-slate-500 mb-6 max-w-md">
                    We rely on ads to keep this platform running and support our authors. Please disable your ad blocker to view this novel.
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

    // Derived stats
    const author = Array.isArray(novel.author) ? novel.author[0] : novel.author;
    const genres = novel.genres || [];

    // Handle immediate vote update
    const handleVoteChange = (increment: boolean) => {
        setNovel((prev: any) => {
            if (!prev) return prev;
            return {
                ...prev,
                total_votes: (prev.total_votes || 0) + (increment ? 1 : -1)
            };
        });
    };

    return (
        <>
            {/* Age Gate Modal for Mature Content */}
            <AgeGateModal
                isOpen={showAgeGate}
                onConfirm={handleAgeConfirm}
                onCancel={handleAgeCancel}
                novelTitle={novel.title}
            />

            {/* Only show content if age confirmed or not mature */}
            {isAgeConfirmed && (
                <div className="min-h-screen bg-background pb-24 font-inter">
                    {/* 1. Hero Section */}
                    {/* 1. Hero Section + Content (Nested for single Overlapping Container) */}
                    <NovelHero
                        novel={{
                            ...novel,
                            author,
                            genres
                        }}
                        chapters={chapters}
                        onVoteChange={handleVoteChange}
                    >
                        {/* Tabs Content */}
                        <div className="mb-12">
                            <NovelTabs
                                description={novel.description || ''}
                                novelId={novel.id}
                                chapters={chapters || []}
                                reviews={reviews || []}
                                tags={novel.tags || []}
                                currentUser={user}
                                currentChapterNumber={currentChapterNumber}
                            />
                        </div>

                        {/* You May Like Section */}
                        <YouMayLike currentNovelId={novel.id} genres={genres} />
                    </NovelHero>
                </div>
            )}
        </>
    );
}
