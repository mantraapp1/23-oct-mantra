import { supabase } from '../config/supabase';
import { handleSupabaseError, paginateQuery } from '../utils/supabaseHelpers';
import { Comment, CommentWithUser } from '../types/supabase';
import { PAGINATION } from '../constants/supabase';
import { getUserDisplayName, getUserProfileImage } from '../utils/profileUtils';

export interface CreateCommentData {
  chapter_id: string;
  comment_text: string;
  parent_comment_id?: string;
}

/**
 * Deduplicate comments by user_id + comment_text
 * Keep the most recent comment for each unique combination
 * 
 * @param comments - Array of comments with user data
 * @returns Deduplicated array with one comment per user per unique text
 */
function deduplicateComments(comments: CommentWithUser[]): CommentWithUser[] {
  const commentMap = new Map<string, CommentWithUser>();
  
  comments.forEach(comment => {
    const key = `${comment.user_id}_${comment.comment_text}`;
    const existing = commentMap.get(key);
    if (!existing || new Date(comment.created_at) > new Date(existing.created_at)) {
      commentMap.set(key, comment);
    }
  });
  
  return Array.from(commentMap.values());
}

/**
 * Comment Service
 * Handles chapter comments and replies
 */
class CommentService {
  /**
   * Create a comment
   */
  async createComment(
    userId: string,
    data: CreateCommentData
  ): Promise<{ success: boolean; message: string; comment?: Comment }> {
    try {
      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          user_id: userId,
          ...data,
        })
        .select()
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
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Update a comment
   */
  async updateComment(
    commentId: string,
    commentText: string
  ): Promise<{ success: boolean; message: string; comment?: Comment }> {
    try {
      const { data: comment, error } = await supabase
        .from('comments')
        .update({ comment_text: commentText })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Comment updated successfully',
        comment,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get comment to check if it has a parent
      const { data: comment } = await supabase
        .from('comments')
        .select('parent_comment_id')
        .eq('id', commentId)
        .single();

      // Delete comment
      const { error } = await supabase
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
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Get comments for a chapter
   */
  async getChapterComments(
    chapterId: string,
    userId: string | null,
    page: number = 1,
    pageSize: number = PAGINATION.COMMENTS_PAGE_SIZE,
    sortBy: 'newest' | 'most_liked' = 'newest'
  ): Promise<CommentWithUser[]> {
    try {
      let query = supabase
        .from('comments')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('chapter_id', chapterId)
        .is('parent_comment_id', null); // Only top-level comments

      query = paginateQuery(query, page, pageSize);

      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('likes', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      // Deduplicate comments by user_id + comment_text (keep most recent)
      const uniqueComments = deduplicateComments(data as CommentWithUser[]);

      // If user is logged in, fetch their reaction status for each comment
      if (userId && uniqueComments.length > 0) {
        const commentIds = uniqueComments.map((c: any) => c.id);
        
        const { data: reactions } = await supabase
          .from('comment_reactions')
          .select('comment_id, reaction_type')
          .eq('user_id', userId)
          .in('comment_id', commentIds);

        // Create a map of comment_id -> reaction_type
        const reactionMap = new Map(
          reactions?.map(r => [r.comment_id, r.reaction_type]) || []
        );

        // Add user_has_liked, user_has_disliked, and consistent profile data to each comment
        return uniqueComments.map((comment: any) => {
          const reaction = reactionMap.get(comment.id);
          return {
            ...comment,
            user_has_liked: reaction === 'like',
            user_has_disliked: reaction === 'dislike',
            // Add consistent display name and profile image
            displayName: getUserDisplayName(comment.user),
            profileImage: getUserProfileImage(comment.user)
          };
        }) as CommentWithUser[];
      }

      // Add consistent profile data even when user is not logged in
      return uniqueComments.map((comment: any) => ({
        ...comment,
        displayName: getUserDisplayName(comment.user),
        profileImage: getUserProfileImage(comment.user)
      })) as CommentWithUser[];
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
    userId: string | null,
    page: number = 1,
    pageSize: number = PAGINATION.COMMENTS_PAGE_SIZE
  ): Promise<CommentWithUser[]> {
    try {
      let query = supabase
        .from('comments')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('parent_comment_id', parentCommentId);

      query = paginateQuery(query, page, pageSize);
      query = query.order('created_at', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      // Deduplicate replies by user_id + comment_text (keep most recent)
      const uniqueReplies = deduplicateComments(data as CommentWithUser[]);

      // If user is logged in, fetch their reaction status for each reply
      if (userId && uniqueReplies.length > 0) {
        const commentIds = uniqueReplies.map((c: any) => c.id);
        
        const { data: reactions } = await supabase
          .from('comment_reactions')
          .select('comment_id, reaction_type')
          .eq('user_id', userId)
          .in('comment_id', commentIds);

        // Create a map of comment_id -> reaction_type
        const reactionMap = new Map(
          reactions?.map(r => [r.comment_id, r.reaction_type]) || []
        );

        // Add user_has_liked, user_has_disliked, and consistent profile data to each reply
        return uniqueReplies.map((comment: any) => {
          const reaction = reactionMap.get(comment.id);
          return {
            ...comment,
            user_has_liked: reaction === 'like',
            user_has_disliked: reaction === 'dislike',
            // Add consistent display name and profile image
            displayName: getUserDisplayName(comment.user),
            profileImage: getUserProfileImage(comment.user)
          };
        }) as CommentWithUser[];
      }

      // Add consistent profile data even when user is not logged in
      return uniqueReplies.map((comment: any) => ({
        ...comment,
        displayName: getUserDisplayName(comment.user),
        profileImage: getUserProfileImage(comment.user)
      })) as CommentWithUser[];
    } catch (error) {
      console.error('Error getting comment replies:', error);
      return [];
    }
  }

  /**
   * React to a comment (like/dislike)
   */
  async reactToComment(
    userId: string,
    commentId: string,
    reactionType: 'like' | 'dislike'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user already reacted
      const { data: existingReaction } = await supabase
        .from('comment_reactions')
        .select('*')
        .eq('user_id', userId)
        .eq('comment_id', commentId)
        .maybeSingle();

      if (existingReaction) {
        // Update reaction if different
        if (existingReaction.reaction_type !== reactionType) {
          await supabase
            .from('comment_reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existingReaction.id);

          return {
            success: true,
            message: 'Reaction updated',
          };
        } else {
          // Remove reaction if same
          await supabase
            .from('comment_reactions')
            .delete()
            .eq('id', existingReaction.id);

          return {
            success: true,
            message: 'Reaction removed',
          };
        }
      }

      // Create new reaction
      const { error } = await supabase
        .from('comment_reactions')
        .insert({
          user_id: userId,
          comment_id: commentId,
          reaction_type: reactionType,
        });

      if (error) throw error;

      return {
        success: true,
        message: 'Reaction recorded',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Get user's reaction on a comment
   */
  async getUserReaction(userId: string, commentId: string): Promise<'like' | 'dislike' | null> {
    try {
      const { data, error } = await supabase
        .from('comment_reactions')
        .select('reaction_type')
        .eq('user_id', userId)
        .eq('comment_id', commentId)
        .maybeSingle();

      if (error) throw error;
      return data?.reaction_type || null;
    } catch (error) {
      console.error('Error getting user reaction:', error);
      return null;
    }
  }

  /**
   * Get user reactions for multiple comments (batch operation)
   * @param userId - Current user ID
   * @param commentIds - Array of comment IDs to check
   * @returns Map of comment ID to reaction type
   */
  async getUserReactions(
    userId: string | null | undefined,
    commentIds: string[]
  ): Promise<Map<string, 'like' | 'dislike'>> {
    // Handle unauthenticated users
    if (!userId || commentIds.length === 0) {
      return new Map();
    }

    try {
      const { data, error } = await supabase
        .from('comment_reactions')
        .select('comment_id, reaction_type')
        .eq('user_id', userId)
        .in('comment_id', commentIds);

      if (error) throw error;

      // Convert to Map for efficient lookups
      const reactionsMap = new Map<string, 'like' | 'dislike'>();
      if (data) {
        data.forEach((reaction) => {
          reactionsMap.set(reaction.comment_id, reaction.reaction_type);
        });
      }

      return reactionsMap;
    } catch (error: any) {
      console.error('[CommentService] Error fetching user reactions for comments:', {
        error,
        errorMessage: error?.message || 'Unknown error',
        errorCode: error?.code,
        userId,
        commentIdsCount: commentIds.length,
        timestamp: new Date().toISOString()
      });
      return new Map(); // Return empty map on error, don't crash UI
    }
  }

  /**
   * Get user reactions for all comments in a chapter
   * @param userId - Current user ID
   * @param chapterId - Chapter ID
   * @returns Map of comment ID to reaction type
   */
  async getUserReactionsForChapter(
    userId: string | null | undefined,
    chapterId: string
  ): Promise<Map<string, 'like' | 'dislike'>> {
    // Handle unauthenticated users
    if (!userId) {
      return new Map();
    }

    try {
      // First get all comment IDs for this chapter
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('id')
        .eq('chapter_id', chapterId);

      if (commentsError) throw commentsError;

      if (!comments || comments.length === 0) {
        return new Map();
      }

      const commentIds = comments.map((c) => c.id);

      // Then fetch user reactions for those comments
      const { data, error } = await supabase
        .from('comment_reactions')
        .select('comment_id, reaction_type')
        .eq('user_id', userId)
        .in('comment_id', commentIds);

      if (error) throw error;

      // Convert to Map for efficient lookups
      const reactionsMap = new Map<string, 'like' | 'dislike'>();
      if (data) {
        data.forEach((reaction) => {
          reactionsMap.set(reaction.comment_id, reaction.reaction_type);
        });
      }

      return reactionsMap;
    } catch (error: any) {
      console.error('[CommentService] Error fetching user reactions for chapter comments:', {
        error,
        errorMessage: error?.message || 'Unknown error',
        errorCode: error?.code,
        userId,
        chapterId,
        timestamp: new Date().toISOString()
      });
      return new Map(); // Return empty map on error, don't crash UI
    }
  }

  /**
   * Check if comment is from novel author
   */
  async isAuthorComment(commentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('is_novel_author_comment', {
          comment_id_param: commentId,
        });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking author comment:', error);
      return false;
    }
  }

  /**
   * Update reply count for a comment
   */
  private async updateReplyCount(parentCommentId: string): Promise<void> {
    try {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('parent_comment_id', parentCommentId);

      await supabase
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
      const { count, error } = await supabase
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

export default new CommentService();
