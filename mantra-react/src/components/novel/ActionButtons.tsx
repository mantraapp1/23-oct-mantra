import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Check, ThumbsUp, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import novelService from '@/services/novelService';
import readingService from '@/services/readingService';

interface ActionButtonsProps {
    novelId: string;
    currentUser: User | null;
    chapters?: { id: string; chapter_number: number }[];
    onVoteChange?: (increment: boolean) => void;
}

export default function ActionButtons({ novelId, currentUser, chapters = [], onVoteChange }: ActionButtonsProps) {
    const navigate = useNavigate();
    const [isInLibrary, setIsInLibrary] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
    const [isLoadingVote, setIsLoadingVote] = useState(false);
    const [readingProgress, setReadingProgress] = useState<{ current_chapter_number: number; chapter_id?: string } | null>(null);

    // Initial Status Check
    useEffect(() => {
        if (currentUser && novelId) {
            checkStatus();
        }
    }, [currentUser, novelId]);

    const checkStatus = async () => {
        if (!currentUser) return;

        try {
            // Check Library
            const { data: libraryData } = await supabase
                .from('library')
                .select('id')
                .eq('user_id', currentUser.id)
                .eq('novel_id', novelId)
                .maybeSingle();
            setIsInLibrary(!!libraryData);

            // Check Vote using service
            const voted = await novelService.hasVoted(currentUser.id, novelId);
            setHasVoted(voted);

            // Check Reading Progress
            const progress = await readingService.getReadingProgress(currentUser.id, novelId);
            if (progress) {
                setReadingProgress(progress);
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    };

    const handleAddToLibrary = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        setIsLoadingLibrary(true);
        try {
            if (isInLibrary) {
                const { error } = await supabase
                    .from('library')
                    .delete()
                    .eq('user_id', currentUser.id)
                    .eq('novel_id', novelId);
                if (error) throw error;
                setIsInLibrary(false);
            } else {
                const { error } = await supabase
                    .from('library')
                    .insert({
                        user_id: currentUser.id,
                        novel_id: novelId,
                    });
                if (error) throw error;
                setIsInLibrary(true);
            }
        } catch (error) {
            console.error('Error updating library:', error);
        } finally {
            setIsLoadingLibrary(false);
        }
    };

    const handleVote = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }

        setIsLoadingVote(true);
        try {
            const result = await novelService.toggleVote(currentUser.id, novelId);
            if (result.success) {
                const newVotedState = result.hasVoted;
                setHasVoted(newVotedState);

                // Immediate update
                if (onVoteChange) {
                    onVoteChange(newVotedState); // true = increment, false = decrement
                }
            }
        } catch (error) {
            console.error('Error voting:', error);
        } finally {
            setIsLoadingVote(false);
        }
    };

    // Determine read button behavior
    const handleReadClick = () => {
        // If user has reading progress, continue from there
        if (readingProgress && readingProgress.current_chapter_number) {
            // Find the chapter with this number
            const continueChapter = chapters.find(c => c.chapter_number === readingProgress.current_chapter_number);
            if (continueChapter) {
                navigate(`/novel/${novelId}/chapter/${continueChapter.id}`);
                return;
            }
        }

        // Start from first chapter
        if (chapters.length > 0) {
            const firstChapter = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number)[0];
            navigate(`/novel/${novelId}/chapter/${firstChapter.id}`);
        }
    };

    // Determine button text and state
    const hasProgress = readingProgress && readingProgress.current_chapter_number > 0;
    const hasChapters = chapters.length > 0;
    const readButtonText = hasProgress ? 'Continue' : 'Read';
    const ReadIcon = hasProgress ? Play : BookOpen;

    return (
        <div className="flex gap-3 w-full">
            <Button
                size="lg"
                onClick={handleReadClick}
                disabled={!hasChapters}
                className={`flex-1 font-bold text-base shadow-[var(--primary)]/20 shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${!hasChapters ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <ReadIcon className="w-4 h-4 mr-2" />
                {hasChapters ? readButtonText : 'Coming Soon'}
            </Button>

            <Button
                size="lg"
                variant={isInLibrary ? "primary" : "secondary"}
                onClick={handleAddToLibrary}
                isLoading={isLoadingLibrary}
                className={`flex-1 font-semibold ${isInLibrary ? 'shadow-[var(--primary)]/20 shadow-lg' : ''}`}
            >
                {!isLoadingLibrary && (
                    isInLibrary ? (
                        <>
                            <Check className="w-4 h-4 mr-2" />
                            In Library
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4 mr-2" />
                            Library
                        </>
                    )
                )}
            </Button>

            <Button
                size="lg"
                variant={hasVoted ? "primary" : "secondary"}
                onClick={handleVote}
                isLoading={isLoadingVote}
                className={`flex-1 font-semibold ${hasVoted ? 'shadow-[var(--primary)]/20 shadow-lg' : ''}`}
            >
                {!isLoadingVote && (
                    <>
                        <ThumbsUp className={`w-4 h-4 mr-2 ${hasVoted ? 'fill-current' : ''}`} />
                        {hasVoted ? 'Voted' : 'Vote'}
                    </>
                )}
            </Button>
        </div>
    );
}
