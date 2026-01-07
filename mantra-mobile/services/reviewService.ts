import { supabase } from '../config/supabase';
import { handleSupabaseError, paginateQuery } from '../utils/supabaseHelpers';
import { Review, ReviewWithUser } from '../types/supabase';
import { PAGINATION, VALIDATION } from '../constants/supabase';
import { getUserDisplayName, getUserProfileImage } from '../utils/profileUtils';

export interface CreateReviewData {
  novel_id: string;
  rating: number;
  review_text?: string;
}

export interface UpdateReviewData {
  rating?: number;
  review_text?: string;
}

/**
 * Deduplicate reviews by user_id
 * Keep the most recent review for each user
 * 
 * @param reviews - Array of reviews with user data
 * @returns Deduplicated array with one review per user
 */
function deduplicateByUserId(reviews: ReviewWithUser[]): ReviewWithUser[] {
  const reviewMap = new Map<string, ReviewWithUser>();
  
  reviews.forEach(review => {
    const existing = reviewMap.get(review.user_id);
    if (!existing || new Date(review.created_at) > new Date(existing.created_at)) {
      reviewMap.set(review.user_id, review);
    }
  });
  
  return Array.from(reviewMap.values());
}

/**
 * Review Service
 * Handles novel reviews and ratings
 */
class ReviewService {
  /**
   * Create a review
   */
  async createReview(
    userId: string,
    data: CreateReviewData
  ): Promise<{ success: boolean; message: string; review?: Review }> {
    try {
      // Validate rating
      if (data.rating < VALIDATION.MIN_RATING || data.rating > VALIDATION.MAX_RATING) {
        return {
          success: false,
          message: `Rating must be between ${VALIDATION.MIN_RATING} and ${VALIDATION.MAX_RATING}`,
        };
      }

      // Check if user already reviewed this novel
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('novel_id', data.novel_id)
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          message: 'You have already reviewed this novel',
        };
      }

      // Create review
      const { data: review, error } = await supabase
        .from('reviews')
        .insert({
          user_id: userId,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Review submitted successfully',
        review,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Update a review
   */
  async updateReview(
    reviewId: string,
    data: UpdateReviewData
  ): Promise<{ success: boolean; message: string; review?: Review }> {
    try {
      // Validate rating if provided
      if (data.rating && (data.rating < VALIDATION.MIN_RATING || data.rating > VALIDATION.MAX_RATING)) {
        return {
          success: false,
          message: `Rating must be between ${VALIDATION.MIN_RATING} and ${VALIDATION.MAX_RATING}`,
        };
      }

      const { data: review, error } = await supabase
        .from('reviews')
        .update(data)
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Review updated successfully',
        review,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      return {
        success: true,
        message: 'Review deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Get reviews for a novel
   */
  async getNovelReviews(
    novelId: string,
    userId: string | null,
    page: number = 1,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
    rating?: number
  ): Promise<ReviewWithUser[]> {
    try {
      let query = supabase
        .from('reviews')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('novel_id', novelId);

      // Filter by rating if specified
      if (rating) {
        query = query.eq('rating', rating);
      }

      query = paginateQuery(query, page, pageSize);
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        return [];
      }

      // Deduplicate reviews by user_id (keep most recent)
      const uniqueReviews = deduplicateByUserId(data as ReviewWithUser[]);

      // If user is logged in, fetch their reaction status for each review
      if (userId && uniqueReviews.length > 0) {
        const reviewIds = uniqueReviews.map((r: any) => r.id);
        
        const { data: reactions } = await supabase
          .from('review_reactions')
          .select('review_id, reaction_type')
          .eq('user_id', userId)
          .in('review_id', reviewIds);

        // Create a map of review_id -> reaction_type
        const reactionMap = new Map(
          reactions?.map(r => [r.review_id, r.reaction_type]) || []
        );

        // Add user_has_liked, user_has_disliked, and consistent profile data to each review
        return uniqueReviews.map((review: any) => {
          const reaction = reactionMap.get(review.id);
          return {
            ...review,
            user_has_liked: reaction === 'like',
            user_has_disliked: reaction === 'dislike',
            // Add consistent display name and profile image
            displayName: getUserDisplayName(review.user),
            profileImage: getUserProfileImage(review.user)
          };
        }) as ReviewWithUser[];
      }

      // Add consistent profile data even when user is not logged in
      return uniqueReviews.map((review: any) => ({
        ...review,
        displayName: getUserDisplayName(review.user),
        profileImage: getUserProfileImage(review.user)
      })) as ReviewWithUser[];
    } catch (error) {
      console.error('Error getting novel reviews:', error);
      return [];
    }
  }

  /**
   * Get user's review for a novel
   */
  async getUserReview(userId: string, novelId: string): Promise<Review | null> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', userId)
        .eq('novel_id', novelId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user review:', error);
      return null;
    }
  }

  /**
   * React to a review (like/dislike)
   */
  async reactToReview(
    userId: string,
    reviewId: string,
    reactionType: 'like' | 'dislike'
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if user already reacted
      const { data: existingReaction } = await supabase
        .from('review_reactions')
        .select('*')
        .eq('user_id', userId)
        .eq('review_id', reviewId)
        .maybeSingle();

      if (existingReaction) {
        // Update reaction if different
        if (existingReaction.reaction_type !== reactionType) {
          await supabase
            .from('review_reactions')
            .update({ reaction_type: reactionType })
            .eq('id', existingReaction.id);

          return {
            success: true,
            message: 'Reaction updated',
          };
        } else {
          // Remove reaction if same
          await supabase
            .from('review_reactions')
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
        .from('review_reactions')
        .insert({
          user_id: userId,
          review_id: reviewId,
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
   * Get user's reaction on a review
   */
  async getUserReaction(userId: string, reviewId: string): Promise<'like' | 'dislike' | null> {
    try {
      const { data, error } = await supabase
        .from('review_reactions')
        .select('reaction_type')
        .eq('user_id', userId)
        .eq('review_id', reviewId)
        .maybeSingle();

      if (error) throw error;
      return data?.reaction_type || null;
    } catch (error) {
      console.error('Error getting user reaction:', error);
      return null;
    }
  }

  /**
   * Get user reactions for multiple reviews (batch operation)
   * @param userId - Current user ID
   * @param reviewIds - Array of review IDs to check
   * @returns Map of review ID to reaction type
   */
  async getUserReactions(
    userId: string | null | undefined,
    reviewIds: string[]
  ): Promise<Map<string, 'like' | 'dislike'>> {
    // Handle unauthenticated users
    if (!userId || reviewIds.length === 0) {
      return new Map();
    }

    try {
      const { data, error } = await supabase
        .from('review_reactions')
        .select('review_id, reaction_type')
        .eq('user_id', userId)
        .in('review_id', reviewIds);

      if (error) throw error;

      // Convert to Map for efficient lookups
      const reactionsMap = new Map<string, 'like' | 'dislike'>();
      data?.forEach(reaction => {
        reactionsMap.set(reaction.review_id, reaction.reaction_type);
      });

      return reactionsMap;
    } catch (error: any) {
      console.error('[ReviewService] Error fetching user reactions:', {
        error,
        errorMessage: error?.message || 'Unknown error',
        errorCode: error?.code,
        userId,
        reviewIdsCount: reviewIds.length,
        timestamp: new Date().toISOString()
      });
      // Return empty map on error, don't crash UI
      return new Map();
    }
  }

  /**
   * Get user reactions for all reviews of a novel
   * @param userId - Current user ID
   * @param novelId - Novel ID
   * @returns Map of review ID to reaction type
   */
  async getUserReactionsForNovel(
    userId: string | null | undefined,
    novelId: string
  ): Promise<Map<string, 'like' | 'dislike'>> {
    // Handle unauthenticated users
    if (!userId) {
      return new Map();
    }

    try {
      // First get all review IDs for this novel
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('id')
        .eq('novel_id', novelId);

      if (reviewsError) throw reviewsError;

      if (!reviews || reviews.length === 0) {
        return new Map();
      }

      const reviewIds = reviews.map(r => r.id);

      // Then batch fetch user reactions for those reviews
      return await this.getUserReactions(userId, reviewIds);
    } catch (error: any) {
      console.error('[ReviewService] Error fetching user reactions for novel:', {
        error,
        errorMessage: error?.message || 'Unknown error',
        errorCode: error?.code,
        userId,
        novelId,
        timestamp: new Date().toISOString()
      });
      // Return empty map on error, don't crash UI
      return new Map();
    }
  }

  /**
   * Get rating distribution for a novel
   */
  async getRatingDistribution(novelId: string): Promise<{ [key: number]: number }> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('novel_id', novelId);

      if (error) throw error;

      const distribution: { [key: number]: number } = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      data?.forEach(review => {
        distribution[review.rating]++;
      });

      return distribution;
    } catch (error) {
      console.error('Error getting rating distribution:', error);
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }
  }

  /**
   * Get average rating for a novel
   */
  async getAverageRating(novelId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('novel_id', novelId);

      if (error) throw error;

      if (!data || data.length === 0) return 0;

      const sum = data.reduce((acc, review) => acc + review.rating, 0);
      return sum / data.length;
    } catch (error) {
      console.error('Error getting average rating:', error);
      return 0;
    }
  }
}

export default new ReviewService();
