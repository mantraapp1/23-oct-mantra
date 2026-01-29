import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { Star } from 'lucide-react';

interface ReviewSectionProps {
  novelId: string;
  onReviewAdded: () => void;
}

export default function ReviewSection({ novelId, onReviewAdded }: ReviewSectionProps) {
  const { userProfile } = useAuth();
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      toast.error('Please login to review');
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('Reviews')
        .upsert([{
          novel_id: novelId,
          user_id: userProfile.user_id,
          content,
          rating,
          created_at: new Date().toISOString()
        }], {
          onConflict: 'novel_id,user_id'
        });

      if (error) throw error;

      setContent('');
      setRating(5);
      toast.success('Review posted successfully!');
      onReviewAdded();
    } catch (error: any) {
      console.error('Error posting review:', error);
      toast.error(error.message || 'Failed to post review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="text-yellow-400 hover:text-yellow-500 focus:outline-none"
              >
                <Star
                  className={`h-6 w-6 ${value <= rating ? 'fill-current' : ''}`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={4}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="Share your thoughts about this novel..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Posting...' : 'Post Review'}
        </button>
      </form>
    </div>
  );
}