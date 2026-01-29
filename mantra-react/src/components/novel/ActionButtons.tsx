import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, BookOpen, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import novelService from '@/services/novelService';

interface ActionButtonsProps {
    novelId: string;
    currentUser: User | null;
    onVoteChange?: (increment: boolean) => void;
}

export default function ActionButtons({ novelId, currentUser, onVoteChange }: ActionButtonsProps) {
    const navigate = useNavigate();
    const [isInLibrary, setIsInLibrary] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
    const [isLoadingVote, setIsLoadingVote] = useState(false);

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

    return (
        <div className="flex gap-3 w-full">
            <Button
                size="lg"
                onClick={() => navigate(`/novel/${novelId}/read`)}
                className="flex-1 font-bold text-base shadow-[var(--primary)]/20 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
                <BookOpen className="w-4 h-4 mr-2" />
                Read
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
