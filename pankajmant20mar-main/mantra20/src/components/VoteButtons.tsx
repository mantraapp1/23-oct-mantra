import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface VoteButtonsProps {
  novelId: string;
}

export default function VoteButtons({ novelId }: VoteButtonsProps) {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [voteCount, setVoteCount] = useState({ upvotes: 0, downvotes: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchVotes();
  }, [novelId, userProfile]);

  const fetchVotes = async () => {
    try {
      // Get vote counts
      const { data: voteCounts, error: countError } = await supabase
        .rpc('get_novel_vote_count', { novel_uuid: novelId });

      if (countError) throw countError;
      if (voteCounts) {
        setVoteCount(voteCounts[0]);
      }

      // Get user's vote if logged in
      if (userProfile) {
        const { data: userVoteData, error: voteError } = await supabase
          .from('Votes')
          .select('vote_type')
          .eq('novel_id', novelId)
          .eq('user_id', userProfile.user_id)
          .single();

        if (!voteError && userVoteData) {
          setUserVote(userVoteData.vote_type as 'up' | 'down');
        }
      }
    } catch (error) {
      console.error('Error fetching votes:', error);
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!userProfile) {
      navigate('/auth');
      return;
    }

    try {
      setIsLoading(true);

      if (userVote === voteType) {
        // Remove vote
        const { error } = await supabase
          .from('Votes')
          .delete()
          .eq('novel_id', novelId)
          .eq('user_id', userProfile.user_id);

        if (error) throw error;
        setUserVote(null);
      } else {
        // Upsert vote
        const { error } = await supabase
          .from('Votes')
          .upsert({
            novel_id: novelId,
            user_id: userProfile.user_id,
            vote_type: voteType,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'novel_id,user_id'
          });

        if (error) throw error;
        setUserVote(voteType);
      }

      await fetchVotes();
    } catch (error: any) {
      console.error('Error voting:', error);
      toast.error(error.message || 'Failed to vote');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => handleVote('up')}
        disabled={isLoading}
        className={`flex items-center gap-1 ${
          userVote === 'up'
            ? 'text-orange-500'
            : 'text-gray-500 hover:text-orange-500'
        }`}
      >
        <ArrowBigUp className={`h-6 w-6 ${userVote === 'up' ? 'fill-orange-500' : ''}`} />
        <span>{voteCount.upvotes}</span>
      </button>

      <button
        onClick={() => handleVote('down')}
        disabled={isLoading}
        className={`flex items-center gap-1 ${
          userVote === 'down'
            ? 'text-blue-500'
            : 'text-gray-500 hover:text-blue-500'
        }`}
      >
        <ArrowBigDown className={`h-6 w-6 ${userVote === 'down' ? 'fill-blue-500' : ''}`} />
        <span>{voteCount.downvotes}</span>
      </button>
    </div>
  );
}