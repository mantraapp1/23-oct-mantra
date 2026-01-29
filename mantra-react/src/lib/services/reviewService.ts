import { supabase } from '@/lib/supabase/client';

// Types
export interface CreateReviewData {
    novel_id: string;
    rating: number;
    review_text?: string;
}

export interface UpdateReviewData {
    rating?: number;
    review_text?: string;
}

export interface ReviewWithUser {
    id: string;
    novel_id: string;
    user_id: string;
    rating: number;
    review_text: string | null;
    likes: number;
    dislikes: number;
    created_at: string;
    updated_at: string;
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
 * Review Service for Novel Reviews
 * Ported from mobile app's reviewService.ts
 */
class ReviewService {

    /**
     * Get reviews for a novel
     */
    async getNovelReviews(
        novelId: string,
        userId: string | null,
        page: number = 1,
        pageSize: number = 20,
        rating?: number
    ): Promise<ReviewWithUser[]> {
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from('reviews')
                .select(`
          *,
          user:profiles!reviews_user_id_fkey(id, username, display_name, profile_picture_url)
        `)
                .eq('novel_id', novelId)
                .range(from, to)
                .order('created_at', { ascending: false });

            if (rating) {
                query = query.eq('rating', rating);
            }

            const { data, error } = await query;

            if (error) throw error;
            if (!data || data.length === 0) return [];

            // Fetch user reactions if logged in
            if (userId && data.length > 0) {
                const reviewIds = data.map((r: any) => r.id);

                const { data: reactions } = await supabase
                    .from('review_reactions')
                    .select('review_id, reaction_type')
                    .eq('user_id', userId)
                    .in('review_id', reviewIds);

                const reactionMap = new Map(
                    reactions?.map(r => [r.review_id, r.reaction_type]) || []
                );

                return data.map((review: any) => {
                    const reaction = reactionMap.get(review.id);
                    return {
                        ...review,
                        user_has_liked: reaction === 'like',
                        user_has_disliked: reaction === 'dislike',
                    };
                }) as ReviewWithUser[];
            }

            return data as ReviewWithUser[];
        } catch (error) {
            console.error('Error getting novel reviews:', error);
            return [];
        }
    }

    /**
     * Get user's review for a novel
     */
    async getUserReview(userId: string, novelId: string): Promise<ReviewWithUser | null> {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
          *,
          user:profiles!reviews_user_id_fkey(id, username, display_name, profile_picture_url)
        `)
                .eq('user_id', userId)
                .eq('novel_id', novelId)
                .maybeSingle();

            if (error) throw error;
            return data as ReviewWithUser | null;
        } catch (error) {
            console.error('Error getting user review:', error);
            return null;
        }
    }

    /**
     * Create a new review
     */
    async createReview(
        userId: string,
        data: CreateReviewData
    ): Promise<{ success: boolean; message: string; review?: any }> {
        try {
            // Validate rating
            if (data.rating < 1 || data.rating > 5) {
                return {
                    success: false,
                    message: 'Rating must be between 1 and 5',
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
                .select(`
          *,
          user:profiles!reviews_user_id_fkey(id, username, display_name, profile_picture_url)
        `)
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
                message: error.message || 'Failed to submit review',
            };
        }
    }

    /**
     * Update a review
     */
    async updateReview(
        reviewId: string,
        data: UpdateReviewData
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Validate rating if provided
            if (data.rating && (data.rating < 1 || data.rating > 5)) {
                return {
                    success: false,
                    message: 'Rating must be between 1 and 5',
                };
            }

            const { error } = await supabase
                .from('reviews')
                .update(data)
                .eq('id', reviewId);

            if (error) throw error;

            return {
                success: true,
                message: 'Review updated successfully',
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to update review',
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
                message: error.message || 'Failed to delete review',
            };
        }
    }

    /**
     * React to a review (like/dislike)
     */
    async reactToReview(
        userId: string,
        reviewId: string,
        reactionType: 'like' | 'dislike'
    ): Promise<{ success: boolean; message: string; action: 'added' | 'removed' | 'updated' }> {
        try {
            // Check if user already reacted
            const { data: existingReaction } = await supabase
                .from('review_reactions')
                .select('*')
                .eq('user_id', userId)
                .eq('review_id', reviewId)
                .maybeSingle();

            if (existingReaction) {
                if (existingReaction.reaction_type !== reactionType) {
                    // Update reaction if different
                    await supabase
                        .from('review_reactions')
                        .update({ reaction_type: reactionType })
                        .eq('id', existingReaction.id);

                    return { success: true, message: 'Reaction updated', action: 'updated' };
                } else {
                    // Remove reaction if same (toggle off)
                    await supabase
                        .from('review_reactions')
                        .delete()
                        .eq('id', existingReaction.id);

                    return { success: true, message: 'Reaction removed', action: 'removed' };
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
                1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
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
     * Get average rating and count for a novel
     */
    async getAverageRating(novelId: string): Promise<{ average: number; count: number }> {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('rating')
                .eq('novel_id', novelId);

            if (error) throw error;

            if (!data || data.length === 0) return { average: 0, count: 0 };

            const sum = data.reduce((acc, review) => acc + review.rating, 0);
            return {
                average: sum / data.length,
                count: data.length,
            };
        } catch (error) {
            console.error('Error getting average rating:', error);
            return { average: 0, count: 0 };
        }
    }
}

// Export singleton instance
const reviewService = new ReviewService();
export default reviewService;
