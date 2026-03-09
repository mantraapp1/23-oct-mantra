import { supabase } from '@/lib/supabase/client';
import { handleSupabaseError, paginateQuery } from '@/utils/supabaseHelpers';
import type { Review, ReviewWithUser } from '@/types/supabase';

/**
 * Review Service
 * Handles novel reviews and interactions
 * EXACT 1:1 PORT FROM MOBILE APP
 */
class ReviewService {
    /**
     * Get reviews for a novel
     */
    async getNovelReviews(
        novelId: string,
        page: number = 1,
        pageSize: number = 20,
        sortBy: 'newest' | 'highest' | 'lowest' = 'newest'
    ): Promise<{ reviews: ReviewWithUser[]; total: number }> {
        try {
            // First get the reviews
            let query = supabase
                .from('reviews')
                .select(`
                    *,
                    user:profiles!user_id (*)
                `, { count: 'exact' })
                .eq('novel_id', novelId);

            // Apply sorting
            switch (sortBy) {
                case 'newest':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'highest':
                    query = query.order('rating', { ascending: false });
                    break;
                case 'lowest':
                    query = query.order('rating', { ascending: true });
                    break;
            }

            // Apply pagination
            query = paginateQuery(query, page, pageSize);

            const { data, error, count } = await query;

            if (error) throw error;

            let reviews = data as ReviewWithUser[];

            // If authenticated, fetch user interaction status (likes/dislikes)
            // Note: In mobile app using AsyncStorage "user_session", here using supabase auth
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const userId = session.user.id;
                const reviewIds = reviews.map(r => r.id);

                if (reviewIds.length > 0) {
                    const { data: reactions, error: reactionError } = await supabase
                        .from('review_reactions')
                        .select('*')
                        .in('review_id', reviewIds)
                        .eq('user_id', userId);

                    if (!reactionError && reactions) {
                        // Map reactions to reviews
                        reviews = reviews.map(review => {
                            const reaction = reactions.find(r => r.review_id === review.id);
                            return {
                                ...review,
                                user_has_liked: reaction?.reaction_type === 'like',
                                user_has_disliked: reaction?.reaction_type === 'dislike'
                            };
                        });
                    }
                }
            }

            return {
                reviews,
                total: count || 0
            };
        } catch (error) {
            throw new Error(handleSupabaseError(error as any));
        }
    }

    /**
     * Get a specific review
     */
    async getReview(reviewId: string): Promise<ReviewWithUser | null> {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select(`
                    *,
                    user:profiles!user_id (*)
                `)
                .eq('id', reviewId)
                .single();

            if (error) throw error;
            return data as ReviewWithUser;
        } catch {
            return null;
        }
    }

    /**
     * Create a review
     */
    async createReview(
        novelId: string,
        userId: string,
        rating: number,
        reviewText: string
    ): Promise<Review> {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .insert({
                    novel_id: novelId,
                    user_id: userId,
                    rating,
                    review_text: reviewText,
                    likes: 0,
                    dislikes: 0
                })
                .select()
                .single();

            if (error) throw error;
            return data as Review;
        } catch (error) {
            throw new Error(handleSupabaseError(error as any));
        }
    }

    /**
     * Update a review
     */
    async updateReview(
        reviewId: string,
        rating: number,
        reviewText: string
    ): Promise<Review> {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .update({
                    rating,
                    review_text: reviewText,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reviewId)
                .select()
                .single();

            if (error) throw error;
            return data as Review;
        } catch (error) {
            throw new Error(handleSupabaseError(error as any));
        }
    }

    /**
     * Delete a review
     */
    async deleteReview(reviewId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', reviewId);

            if (error) throw error;
        } catch (error) {
            throw new Error(handleSupabaseError(error as any));
        }
    }

    /**
     * Check if user has reviewed a novel
     */
    async hasUserReviewed(novelId: string, userId: string): Promise<boolean> {
        try {
            const { count, error } = await supabase
                .from('reviews')
                .select('*', { count: 'exact', head: true })
                .eq('novel_id', novelId)
                .eq('user_id', userId);

            if (error) throw error;
            return (count || 0) > 0;
        } catch {
            return false;
        }
    }

    /**
     * Vote on a review (like/dislike)
     * Handles toggle logic (like -> unlike, like -> dislike)
     */
    async voteReview(
        reviewId: string,
        userId: string,
        voteType: 'like' | 'dislike'
    ): Promise<{ success: boolean; newState: 'liked' | 'disliked' | 'none' }> {
        try {
            // 1. Check existing reaction
            const { data: existingReaction, error: fetchError } = await supabase
                .from('review_reactions')
                .select('*')
                .eq('review_id', reviewId)
                .eq('user_id', userId)
                .maybeSingle();

            if (fetchError) throw fetchError;

            let newState: 'liked' | 'disliked' | 'none' = 'none';

            if (existingReaction) {
                if (existingReaction.reaction_type === voteType) {
                    // Removing reaction (toggle off)
                    const { error: deleteError } = await supabase
                        .from('review_reactions')
                        .delete()
                        .eq('id', existingReaction.id);

                    if (deleteError) throw deleteError;
                    newState = 'none';

                    // Decrement counter
                    await this.updateReviewCounts(reviewId, voteType, -1);
                } else {
                    // Changing reaction (like -> dislike OR dislike -> like)
                    const { error: updateError } = await supabase
                        .from('review_reactions')
                        .update({ reaction_type: voteType })
                        .eq('id', existingReaction.id);

                    if (updateError) throw updateError;
                    newState = voteType === 'like' ? 'liked' : 'disliked';

                    // Update counters: decrement old, increment new
                    await this.updateReviewCounts(reviewId, existingReaction.reaction_type, -1);
                    await this.updateReviewCounts(reviewId, voteType, 1);
                }
            } else {
                // New reaction
                const { error: insertError } = await supabase
                    .from('review_reactions')
                    .insert({
                        review_id: reviewId,
                        user_id: userId,
                        reaction_type: voteType
                    });

                if (insertError) throw insertError;
                newState = voteType === 'like' ? 'liked' : 'disliked';

                // Increment counter
                await this.updateReviewCounts(reviewId, voteType, 1);
            }

            return { success: true, newState };
        } catch (error) {
            throw new Error(handleSupabaseError(error as any));
        }
    }

    /**
     * Helper to update like/dislike counts on the review table
     * Note: This is ideally handled by database triggers, but implemented client-side 
     * in mobile app for immediate optimistic UI updates or if triggers aren't set up.
     * We'll implement it via RPC or simple update if triggers exist, 
     * but matching mobile logic here implies direct update.
     */
    private async updateReviewCounts(reviewId: string, type: 'like' | 'dislike', change: number): Promise<void> {
        try {
            // Fetch the current review to get the most up-to-date counts
            const { data: currentReview, error: fetchError } = await supabase
                .from('reviews')
                .select('likes, dislikes')
                .eq('id', reviewId)
                .single();

            if (fetchError || !currentReview) {
                return;
            }

            // Calculate new count ensuring it doesn't go below 0
            const currentCount = type === 'like' ? (currentReview.likes || 0) : (currentReview.dislikes || 0);
            const newCount = Math.max(0, currentCount + change);

            // Prepare update payload
            const updates = type === 'like'
                ? { likes: newCount }
                : { dislikes: newCount };

            // Update the review
            const { error: updateError } = await supabase
                .from('reviews')
                .update(updates)
                .eq('id', reviewId);

            if (updateError) {
            }
        } catch {
        }
    }
}

export default new ReviewService();
