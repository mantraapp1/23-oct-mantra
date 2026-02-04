import { supabase } from '@/lib/supabase/client';
import { handleSupabaseError, paginateQuery } from '@/utils/supabaseHelpers';
import type { Novel, NovelWithAuthor, NovelFilters } from '@/types/supabase';

// Constants (inline or from PAGINATION constant if ported)
const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    SEARCH_PAGE_SIZE: 20,
};

export interface CreateNovelData {
    title: string;
    description?: string;
    cover_image_url?: string;
    // Note: banner_image_url does not exist in schema - use cover_image_url for both cover and banner
    genres?: string[];
    tags?: string[];
    language?: string;
    is_mature?: boolean;
    status?: 'ongoing' | 'completed' | 'hiatus';
}

export interface UpdateNovelData {
    title?: string;
    description?: string;
    cover_image_url?: string;
    // Note: banner_image_url does not exist in schema - use cover_image_url for both cover and banner
    genres?: string[];
    tags?: string[];
    language?: string;
    is_mature?: boolean;
    status?: 'ongoing' | 'completed' | 'hiatus';
}

export interface NovelResponse {
    success: boolean;
    message: string;
    novel?: Novel;
}

/**
 * Novel Service
 * Handles all novel-related operations
 * EXACT 1:1 PORT FROM MOBILE APP
 */
class NovelService {
    /**
     * Upload a novel cover image
     */
    async uploadCoverImage(file: File, authorId: string): Promise<{ success: boolean; url?: string; message: string }> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${authorId}_${Date.now()}.${fileExt}`;
            const filePath = `${authorId}/${fileName}`;

            // Debug: Check session before upload
            const { data: { session } } = await supabase.auth.getSession();
            console.log("Upload Debug: ", {
                hasSession: !!session,
                sessionUserId: session?.user?.id,
                passedAuthorId: authorId,
                filePath: filePath,
                bucket: 'novel-covers'
            });

            const { error } = await supabase.storage
                .from('novel-covers')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error("Upload Error Details:", error);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('novel-covers')
                .getPublicUrl(filePath);

            return {
                success: true,
                url: publicUrl,
                message: 'Cover image uploaded successfully'
            };
        } catch (error: any) {
            return {
                success: false,
                message: handleSupabaseError(error)
            };
        }
    }

    /**
     * Create a new novel
     */
    async createNovel(authorId: string, data: CreateNovelData): Promise<NovelResponse> {
        try {
            // Validate data
            this.validateNovelData(data);

            const { data: { user } } = await supabase.auth.getUser();
            console.log("CreateNovel Debug: ", {
                passedAuthorId: authorId,
                supabaseAuthUserId: user?.id,
                match: authorId === user?.id
            });

            const { data: novel, error } = await supabase
                .from('novels')
                .insert({
                    author_id: authorId,
                    ...data,
                })
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                message: 'Novel created successfully',
                novel,
            };
        } catch (error: any) {
            return {
                success: false,
                message: handleSupabaseError(error),
            };
        }
    }

    /**
     * Update a novel
     */
    async updateNovel(novelId: string, data: UpdateNovelData): Promise<NovelResponse> {
        try {
            // Validate data
            if (data.genres || data.tags) {
                this.validateNovelData(data as CreateNovelData);
            }

            const { data: novel, error } = await supabase
                .from('novels')
                .update(data)
                .eq('id', novelId)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                message: 'Novel updated successfully',
                novel,
            };
        } catch (error: any) {
            return {
                success: false,
                message: handleSupabaseError(error),
            };
        }
    }

    /**
     * Delete a novel
     */
    async deleteNovel(novelId: string): Promise<{ success: boolean; message: string }> {
        try {
            const { error } = await supabase
                .from('novels')
                .delete()
                .eq('id', novelId);

            if (error) throw error;

            return {
                success: true,
                message: 'Novel deleted successfully',
            };
        } catch (error: any) {
            return {
                success: false,
                message: handleSupabaseError(error),
            };
        }
    }

    /**
     * Get novel by ID
     */
    async getNovel(novelId: string): Promise<NovelWithAuthor | null> {
        try {
            const { data, error } = await supabase
                .from('novels')
                .select(`
          *,
          author:profiles(*)
        `)
                .eq('id', novelId)
                .single();

            if (error) throw error;
            return data as NovelWithAuthor;
        } catch (error) {
            console.error('Error getting novel:', error);
            return null;
        }
    }

    /**
     * Get novels with filters and pagination
     */
    async getNovels(
        filters: NovelFilters = {},
        page: number = 1,
        pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
    ): Promise<NovelWithAuthor[]> {
        try {
            let query = supabase
                .from('novels')
                .select(`
          *,
          author:profiles(*)
        `);

            // Apply filters
            if (filters.genres && filters.genres.length > 0) {
                query = query.contains('genres', filters.genres);
            }

            if (filters.tags && filters.tags.length > 0) {
                query = query.contains('tags', filters.tags);
            }

            if (filters.language) {
                query = query.eq('language', filters.language);
            }

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            if (filters.is_mature !== undefined) {
                query = query.eq('is_mature', filters.is_mature);
            }

            if (filters.search) {
                query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
            }

            // Apply pagination
            query = paginateQuery(query, page, pageSize);

            // Order by created date
            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;
            return (data as NovelWithAuthor[]) || [];
        } catch (error) {
            console.error('Error getting novels:', error);
            return [];
        }
    }

    /**
     * Get novels by author
     */
    async getNovelsByAuthor(
        authorId: string,
        page: number = 1,
        pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
    ): Promise<Novel[]> {
        try {
            let query = supabase
                .from('novels')
                .select('*')
                .eq('author_id', authorId);

            query = paginateQuery(query, page, pageSize);
            query = query.order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting novels by author:', error);
            return [];
        }
    }

    /**
     * Get trending novels
     */
    async getTrendingNovels(limit: number = 10, language?: string): Promise<NovelWithAuthor[]> {
        try {
            let query = supabase
                .from('novels')
                .select(`
          *,
          author:profiles(*)
        `)
                .order('total_views', { ascending: false });

            if (language && language !== 'All') {
                query = query.eq('language', language);
            }

            const { data, error } = await query.limit(limit);

            if (error) throw error;
            return (data as NovelWithAuthor[]) || [];
        } catch (error) {
            console.error('Error getting trending novels:', error);
            return [];
        }
    }

    /**
     * Get popular novels (by votes)
     */
    async getPopularNovels(limit: number = 10, language?: string): Promise<NovelWithAuthor[]> {
        try {
            let query = supabase
                .from('novels')
                .select(`
          *,
          author:profiles(*)
        `)
                .order('total_votes', { ascending: false });

            if (language && language !== 'All') {
                query = query.eq('language', language);
            }

            const { data, error } = await query.limit(limit);

            if (error) throw error;
            return (data as NovelWithAuthor[]) || [];
        } catch (error) {
            console.error('Error getting popular novels:', error);
            return [];
        }
    }

    /**
     * Get top rated novels
     */
    async getTopRatedNovels(limit: number = 10, language?: string): Promise<NovelWithAuthor[]> {
        try {
            let query = supabase
                .from('novels')
                .select(`
          *,
          author:profiles(*)
        `)
                .gte('total_reviews', 5) // At least 5 reviews
                .order('average_rating', { ascending: false });

            if (language && language !== 'All') {
                query = query.eq('language', language);
            }

            const { data, error } = await query.limit(limit);

            if (error) throw error;
            return (data as NovelWithAuthor[]) || [];
        } catch (error) {
            console.error('Error getting top rated novels:', error);
            return [];
        }
    }

    /**
     * Get recently updated novels
     */
    async getRecentlyUpdatedNovels(limit: number = 10, language?: string): Promise<NovelWithAuthor[]> {
        try {
            let query = supabase
                .from('novels')
                .select(`
          *,
          author:profiles(*)
        `)
                .order('updated_at', { ascending: false });

            if (language && language !== 'All') {
                query = query.eq('language', language);
            }

            const { data, error } = await query.limit(limit);

            if (error) throw error;
            return (data as NovelWithAuthor[]) || [];
        } catch (error) {
            console.error('Error getting recently updated novels:', error);
            return [];
        }
    }

    /**
     * Get new arrivals
     */
    async getNewArrivals(limit: number = 10, language?: string): Promise<NovelWithAuthor[]> {
        try {
            let query = supabase
                .from('novels')
                .select(`
          *,
          author:profiles(*)
        `)
                .order('created_at', { ascending: false });

            if (language && language !== 'All') {
                query = query.eq('language', language);
            }

            const { data, error } = await query.limit(limit);

            if (error) throw error;
            return (data as NovelWithAuthor[]) || [];
        } catch (error) {
            console.error('Error getting new arrivals:', error);
            return [];
        }
    }

    /**
     * Get editor's picks
     */
    async getEditorsPicks(limit: number = 10, language?: string): Promise<NovelWithAuthor[]> {
        try {
            let query = supabase
                .from('novels')
                .select(`
          *,
          author:profiles(*)
        `)
                .eq('is_editors_pick', true)
                .order('created_at', { ascending: false });

            if (language && language !== 'All') {
                query = query.eq('language', language);
            }

            const { data, error } = await query.limit(limit);

            if (error) throw error;
            return (data as NovelWithAuthor[]) || [];
        } catch (error) {
            console.error('Error getting editor\'s picks:', error);
            return [];
        }
    }

    /**
     * Search novels
     */
    async searchNovels(
        query: string,
        page: number = 1,
        pageSize: number = PAGINATION.SEARCH_PAGE_SIZE
    ): Promise<NovelWithAuthor[]> {
        try {
            let searchQuery = supabase
                .from('novels')
                .select(`
          *,
          author:profiles(*)
        `)
                .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

            searchQuery = paginateQuery(searchQuery, page, pageSize);
            searchQuery = searchQuery.order('total_views', { ascending: false });

            const { data, error } = await searchQuery;

            if (error) throw error;
            return (data as NovelWithAuthor[]) || [];
        } catch (error) {
            console.error('Error searching novels:', error);
            return [];
        }
    }

    /**
     * Increment novel views
     */
    async incrementViews(novelId: string): Promise<void> {
        try {
            const { error } = await supabase.rpc('increment_novel_views', { novel_id_param: novelId });
            if (error) {
                console.warn('View increment failed:', error.message);
            }
        } catch (error) {
            console.error('Error incrementing views:', error);
        }
    }

    /**
     * Vote for a novel
     */
    async voteNovel(userId: string, novelId: string): Promise<{ success: boolean; message: string }> {
        try {
            // Check if already voted
            const { data: existingVote } = await supabase
                .from('novel_votes')
                .select('id')
                .eq('user_id', userId)
                .eq('novel_id', novelId)
                .maybeSingle();

            if (existingVote) {
                return {
                    success: false,
                    message: 'You have already voted for this novel',
                };
            }

            // Create vote
            const { error } = await supabase
                .from('novel_votes')
                .insert({
                    user_id: userId,
                    novel_id: novelId,
                });

            if (error) throw error;

            return {
                success: true,
                message: 'Vote added successfully',
            };
        } catch (error: any) {
            return {
                success: false,
                message: handleSupabaseError(error),
            };
        }
    }

    /**
     * Toggle vote for a novel - checks actual DB state first
     * This prevents issues when local state doesn't match database
     */
    async toggleVote(userId: string, novelId: string): Promise<{ success: boolean; message: string; hasVoted: boolean }> {
        try {
            // Always check actual DB state first to prevent race conditions
            const { data: existingVote } = await supabase
                .from('novel_votes')
                .select('id')
                .eq('user_id', userId)
                .eq('novel_id', novelId)
                .maybeSingle();

            if (existingVote) {
                // User has voted, so remove the vote
                const { error } = await supabase
                    .from('novel_votes')
                    .delete()
                    .eq('user_id', userId)
                    .eq('novel_id', novelId);

                if (error) throw error;

                // Decrement votes count
                // await supabase.rpc('decrement_votes', { novel_id_param: novelId });
                console.log('Vote decrement skipped (RPC not available)');

                return {
                    success: true,
                    message: 'Vote removed',
                    hasVoted: false,
                };
            } else {
                // User hasn't voted, so add the vote
                const { error } = await supabase
                    .from('novel_votes') // Ensure this is novel_votes
                    .insert({
                        user_id: userId,
                        novel_id: novelId,
                    });

                if (error) throw error;

                // Increment votes count
                // await supabase.rpc('increment_votes', { novel_id_param: novelId });
                console.log('Vote increment skipped (RPC not available)');

                return {
                    success: true,
                    message: 'Vote added',
                    hasVoted: true,
                };
            }
        } catch (error: any) {
            return {
                success: false,
                message: handleSupabaseError(error),
                hasVoted: false, // Will be corrected when data reloads
            };
        }
    }

    /**
     * Remove vote from a novel
     */
    async unvoteNovel(userId: string, novelId: string): Promise<{ success: boolean; message: string }> {
        try {
            const { error } = await supabase
                .from('novel_votes')
                .delete()
                .eq('user_id', userId)
                .eq('novel_id', novelId);

            if (error) throw error;

            return {
                success: true,
                message: 'Vote removed successfully',
            };
        } catch (error: any) {
            return {
                success: false,
                message: handleSupabaseError(error),
            };
        }
    }

    /**
     * Check if user has voted for a novel
     */
    async hasVoted(userId: string | null | undefined, novelId: string): Promise<boolean> {
        try {
            // Handle unauthenticated users
            if (!userId) {
                return false;
            }

            const { data, error } = await supabase
                .from('novel_votes')
                .select('id')
                .eq('user_id', userId)
                .eq('novel_id', novelId)
                .maybeSingle();

            if (error) throw error;
            return !!data;
        } catch (error: any) {
            console.error('[NovelService] Error checking vote status:', {
                error,
                errorMessage: error?.message || 'Unknown error',
                errorCode: error?.code,
                userId,
                novelId,
                timestamp: new Date().toISOString()
            });
            return false;
        }
    }

    /**
     * Get user votes for multiple novels (batch operation)
     * @param userId - Current user ID
     * @param novelIds - Array of novel IDs to check
     * @returns Set of novel IDs that user has voted for
     */
    async getUserVotes(userId: string | null | undefined, novelIds: string[]): Promise<Set<string>> {
        try {
            // Handle unauthenticated users
            if (!userId) {
                return new Set();
            }

            // Handle empty array
            if (!novelIds || novelIds.length === 0) {
                return new Set();
            }

            const { data, error } = await supabase
                .from('novel_votes')
                .select('novel_id')
                .eq('user_id', userId)
                .in('novel_id', novelIds);

            if (error) throw error;

            // Convert array of objects to Set of novel IDs
            return new Set(data?.map(vote => vote.novel_id) || []);
        } catch (error: any) {
            console.error('[NovelService] Error fetching user votes:', {
                error,
                errorMessage: error?.message || 'Unknown error',
                errorCode: error?.code,
                userId,
                novelIdsCount: novelIds.length,
                timestamp: new Date().toISOString()
            });
            // Return empty Set on error to prevent UI crashes
            return new Set();
        }
    }

    /**
     * Get novel statistics
     */
    async getNovelStats(novelId: string) {
        try {
            const novel = await this.getNovel(novelId);
            if (!novel) return null;

            return {
                totalChapters: novel.total_chapters,
                totalViews: novel.total_views,
                totalVotes: novel.total_votes,
                averageRating: novel.average_rating,
                totalReviews: novel.total_reviews,
            };
        } catch (error) {
            console.error('Error getting novel stats:', error);
            return null;
        }
    }

    /**
     * Get library count for a novel
     */
    async getLibraryInfo(novelId: string): Promise<{ count: number }> {
        try {
            const { count, error } = await supabase
                .from('library')
                .select('*', { count: 'exact', head: true })
                .eq('novel_id', novelId);

            if (error) throw error;
            return { count: count || 0 };
        } catch (error) {
            console.error('Error getting library count:', error);
            return { count: 0 };
        }
    }

    /**
     * Validate novel data
     */
    private validateNovelData(data: CreateNovelData): void {
        if (!data.title || data.title.trim().length === 0) {
            throw new Error('Title is required');
        }

        if (data.genres && data.genres.length > 3) {
            throw new Error('Maximum 3 genres allowed');
        }

        if (data.tags && data.tags.length > 10) {
            throw new Error('Maximum 10 tags allowed');
        }
    }
}

export default new NovelService();
