import { createClient } from '@/lib/supabase/client';

// Types
export interface CreateCommentData {
    chapter_id: string;
    comment_text: string;
    parent_comment_id?: string;
}

export interface CommentWithUser {
    id: string;
    chapter_id: string;
    user_id: string;
    comment_text: string;
    likes: number;
    dislikes: number;
    reply_count: number;
    parent_comment_id: string | null;
    created_at: string;
    user: {
        id: string;
        username: string;
        display_name: string | null;
        profile_picture_url: string | null;
    };
    user_has_liked?: boolean;
    user_has_disliked?: boolean;
}

/**
 * Comment Service for Chapter Comments
 * Ported from mobile app's commentService.ts
 */
class CommentService {
    private supabase = createClient();

    /**
     * Get comments for a chapter
     */
    async getChapterComments(
        chapterId: string,
        userId: string | null,
        page: number = 1,
        pageSize: number = 50,
        sortBy: 'newest' | 'most_liked' = 'newest'
    ): Promise<CommentWithUser[]> {
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = this.supabase
                .from('comments')
                .select(`
          *,
          user:profiles!comments_user_id_fkey(id, username, display_name, profile_picture_url)
        `)
                .eq('chapter_id', chapterId)
                .is('parent_comment_id', null) // Only top-level comments
                .range(from, to);

            if (sortBy === 'newest') {
                query = query.order('created_at', { ascending: false });
            } else {
                query = query.order('likes', { ascending: false });
            }

            const { data, error } = await query;

            if (error) throw error;
            if (!data || data.length === 0) return [];

            // Fetch user reactions if logged in
            if (userId && data.length > 0) {
                const commentIds = data.map((c: any) => c.id);

                const { data: reactions } = await this.supabase
                    .from('comment_reactions')
                    .select('comment_id, reaction_type')
                    .eq('user_id', userId)
                    .in('comment_id', commentIds);

                const reactionMap = new Map(
                    reactions?.map(r => [r.comment_id, r.reaction_type]) || []
                );

                return data.map((comment: any) => {
                    const reaction = reactionMap.get(comment.id);
                    return {
                        ...comment,
                        user_has_liked: reaction === 'like',
                        user_has_disliked: reaction === 'dislike',
                    };
                }) as CommentWithUser[];
            }

            return data as CommentWithUser[];
        } catch (error) {
            console.error('Error getting chapter comments:', error);
            return [];
        }
    }

    /**
     * Get replies for a comment
     */
    async getCommentReplies(
        parentCommentId: string,
        userId: string | null
    ): Promise<CommentWithUser[]> {
        try {
            const { data, error } = await this.supabase
                .from('comments')
                .select(`
          *,
          user:profiles!comments_user_id_fkey(id, username, display_name, profile_picture_url)
        `)
                .eq('parent_comment_id', parentCommentId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            if (!data || data.length === 0) return [];

            // Fetch user reactions if logged in
            if (userId && data.length > 0) {
                const commentIds = data.map((c: any) => c.id);

                const { data: reactions } = await this.supabase
                    .from('comment_reactions')
                    .select('comment_id, reaction_type')
                    .eq('user_id', userId)
                    .in('comment_id', commentIds);

                const reactionMap = new Map(
                    reactions?.map(r => [r.comment_id, r.reaction_type]) || []
                );

                return data.map((comment: any) => {
                    const reaction = reactionMap.get(comment.id);
                    return {
                        ...comment,
                        user_has_liked: reaction === 'like',
                        user_has_disliked: reaction === 'dislike',
                    };
                }) as CommentWithUser[];
            }

            return data as CommentWithUser[];
        } catch (error) {
            console.error('Error getting comment replies:', error);
            return [];
        }
    }

    /**
     * Create a new comment
     */
    async createComment(
        userId: string,
        data: CreateCommentData
    ): Promise<{ success: boolean; message: string; comment?: any }> {
        try {
            const { data: comment, error } = await this.supabase
                .from('comments')
                .insert({
                    user_id: userId,
                    ...data,
                })
                .select(`
          *,
          user:profiles!comments_user_id_fkey(id, username, display_name, profile_picture_url)
        `)
                .single();

            if (error) throw error;

            // Update reply count if this is a reply
            if (data.parent_comment_id) {
                await this.updateReplyCount(data.parent_comment_id);
            }

            return {
                success: true,
                message: 'Comment posted successfully',
                comment,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to post comment',
            };
        }
    }

    /**
     * Update a comment
     */
    async updateComment(
        commentId: string,
        commentText: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            const { error } = await this.supabase
                .from('comments')
                .update({ comment_text: commentText })
                .eq('id', commentId);

            if (error) throw error;

            return {
                success: true,
                message: 'Comment updated successfully',
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to update comment',
            };
        }
    }

    /**
     * Delete a comment
     */
    async deleteComment(commentId: string): Promise<{ success: boolean; message: string }> {
        try {
            // Get comment to check if it has a parent
            const { data: comment } = await this.supabase
                .from('comments')
                .select('parent_comment_id')
                .eq('id', commentId)
                .single();

            const { error } = await this.supabase
                .from('comments')
                .delete()
                .eq('id', commentId);

            if (error) throw error;

            // Update reply count if this was a reply
            if (comment?.parent_comment_id) {
                await this.updateReplyCount(comment.parent_comment_id);
            }

            return {
                success: true,
                message: 'Comment deleted successfully',
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to delete comment',
            };
        }
    }

    /**
     * React to a comment (like/dislike)
     */
    async reactToComment(
        userId: string,
        commentId: string,
        reactionType: 'like' | 'dislike'
    ): Promise<{ success: boolean; message: string; action: 'added' | 'removed' | 'updated' }> {
        try {
            // Check if user already reacted
            const { data: existingReaction } = await this.supabase
                .from('comment_reactions')
                .select('*')
                .eq('user_id', userId)
                .eq('comment_id', commentId)
                .maybeSingle();

            if (existingReaction) {
                if (existingReaction.reaction_type !== reactionType) {
                    // Update reaction if different
                    await this.supabase
                        .from('comment_reactions')
                        .update({ reaction_type: reactionType })
                        .eq('id', existingReaction.id);

                    return { success: true, message: 'Reaction updated', action: 'updated' };
                } else {
                    // Remove reaction if same (toggle off)
                    await this.supabase
                        .from('comment_reactions')
                        .delete()
                        .eq('id', existingReaction.id);

                    return { success: true, message: 'Reaction removed', action: 'removed' };
                }
            }

            // Create new reaction
            const { error } = await this.supabase
                .from('comment_reactions')
                .insert({
                    user_id: userId,
                    comment_id: commentId,
                    reaction_type: reactionType,
                });

            if (error) throw error;

            return { success: true, message: 'Reaction recorded', action: 'added' };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to record reaction',
                action: 'added',
            };
        }
    }

    /**
     * Update reply count for a parent comment
     */
    private async updateReplyCount(parentCommentId: string): Promise<void> {
        try {
            const { count } = await this.supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('parent_comment_id', parentCommentId);

            await this.supabase
                .from('comments')
                .update({ reply_count: count || 0 })
                .eq('id', parentCommentId);
        } catch (error) {
            console.error('Error updating reply count:', error);
        }
    }

    /**
     * Get comment count for a chapter
     */
    async getCommentCount(chapterId: string): Promise<number> {
        try {
            const { count, error } = await this.supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('chapter_id', chapterId);

            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error getting comment count:', error);
            return 0;
        }
    }
}

// Export singleton instance
const commentService = new CommentService();
export default commentService;
