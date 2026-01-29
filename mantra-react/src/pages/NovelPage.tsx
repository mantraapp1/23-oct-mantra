import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NovelHero from '@/components/novel/NovelHero';
import NovelTabs from '@/components/novel/NovelTabs';
import YouMayLike from '@/components/novel/YouMayLike';
import AgeGateModal from '@/components/ui/AgeGateModal';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

    // Age gate state
    const [showAgeGate, setShowAgeGate] = useState(false);
    const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);

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
                        .select('id, title, chapter_number, created_at:published_at, is_locked, views')
                        .eq('novel_id', id)
                        .order('chapter_number', { ascending: true })
                        .then(({ data, error }) => {
                            if (error) console.error('Error fetching chapters:', error);
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
            } catch (error) {
                console.error('Error fetching novel:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

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
