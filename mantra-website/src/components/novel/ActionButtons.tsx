'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsUp, Bookmark, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface ActionButtonsProps {
    novelId: string;
    currentUser: User | null;
}

export default function ActionButtons({ novelId, currentUser }: ActionButtonsProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isInLibrary, setIsInLibrary] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
    const [isLoadingVote, setIsLoadingVote] = useState(false);

    // Check library status on mount
    useState(() => {
        if (currentUser) {
            checkLibraryStatus();
            checkVoteStatus();
        }
    });

    const checkLibraryStatus = async () => {
        if (!currentUser) return;
        const { data } = await supabase
            .from('library')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('novel_id', novelId)
            .maybeSingle();
        setIsInLibrary(!!data);
    };

    const checkVoteStatus = async () => {
        if (!currentUser) return;
        const { data } = await supabase
            .from('votes')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('novel_id', novelId)
            .maybeSingle();
        setHasVoted(!!data);
    };

    const handleAddToLibrary = async () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }

        setIsLoadingLibrary(true);

        if (isInLibrary) {
            // Remove from library
            await supabase
                .from('library')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('novel_id', novelId);
            setIsInLibrary(false);
        } else {
            // Add to library
            await supabase
                .from('library')
                .insert({
                    user_id: currentUser.id,
                    novel_id: novelId,
                });
            setIsInLibrary(true);
        }

        setIsLoadingLibrary(false);
    };

    const handleVote = async () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }

        setIsLoadingVote(true);

        if (hasVoted) {
            // Remove vote
            await supabase
                .from('votes')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('novel_id', novelId);

            // Decrement total_votes
            await supabase.rpc('decrement_votes', { novel_id_param: novelId });
            setHasVoted(false);
        } else {
            // Add vote
            await supabase
                .from('votes')
                .insert({
                    user_id: currentUser.id,
                    novel_id: novelId,
                });

            // Increment total_votes
            await supabase.rpc('increment_votes', { novel_id_param: novelId });
            setHasVoted(true);
        }

        setIsLoadingVote(false);
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={handleAddToLibrary}
                disabled={isLoadingLibrary}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${isInLibrary
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-sky-500 text-white hover:bg-sky-600'
                    }`}
            >
                {isLoadingLibrary ? (
                    <Loader2 className="w-[18px] h-[18px] animate-spin" />
                ) : isInLibrary ? (
                    <Check className="w-[18px] h-[18px]" />
                ) : (
                    <Bookmark className="w-[18px] h-[18px]" />
                )}
                {isInLibrary ? 'In Library' : 'Add to Library'}
            </button>
            <button
                onClick={handleVote}
                disabled={isLoadingVote}
                className={`px-4 py-3 border rounded-xl transition-colors ${hasVoted
                        ? 'bg-sky-500 text-white border-sky-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
            >
                {isLoadingVote ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <ThumbsUp size={20} className={hasVoted ? 'text-white' : 'text-slate-600'} />
                )}
            </button>
        </div>
    );
}
