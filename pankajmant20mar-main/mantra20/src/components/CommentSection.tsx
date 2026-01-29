import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface CommentSectionProps {
  chapterId: string;
  onCommentAdded: () => void;
}

export default function CommentSection({ chapterId, onCommentAdded }: CommentSectionProps) {
  const { userProfile } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      toast.error('Please login to comment');
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('Comments')
        .insert([{
          chapter_id: chapterId,
          user_id: userProfile.user_id,
          content,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setContent('');
      toast.success('Comment posted successfully!');
      onCommentAdded();
    } catch (error: any) {
      console.error('Error posting comment:', error);
      toast.error(error.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={3}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
            placeholder="Share your thoughts about this chapter..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
    </div>
  );
}