import { supabase } from '../config/supabase';
import { handleSupabaseError, paginateQuery } from '../utils/supabaseHelpers';
import { ReadingHistory, ReadingProgress, Library } from '../types/supabase';
import { PAGINATION } from '../constants/supabase';

/**
 * Reading Service
 * Handles reading history, progress, and library management
 */
class ReadingService {
  /**
   * Record a chapter as read
   */
  async recordChapterRead(
    userId: string,
    novelId: string,
    chapterId: string,
    chapterNumber: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Add to reading history
      await supabase
        .from('reading_history')
        .upsert({
          user_id: userId,
          novel_id: novelId,
          chapter_id: chapterId,
          last_read_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,novel_id,chapter_id'
        });

      // Update reading progress
      await this.updateReadingProgress(userId, novelId, chapterNumber);

      return {
        success: true,
        message: 'Reading progress updated',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Update reading progress for a novel
   */
  private async updateReadingProgress(
    userId: string,
    novelId: string,
    currentChapterNumber: number
  ): Promise<void> {
    try {
      // Get total chapters
      const { count: totalChapters } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .eq('novel_id', novelId);

      // Get chapters read count
      const { count: chaptersRead } = await supabase
        .from('reading_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('novel_id', novelId);

      const total = totalChapters || 1;
      const read = chaptersRead || 0;
      const progressPercentage = (read / total) * 100;

      // Upsert progress
      await supabase
        .from('reading_progress')
        .upsert({
          user_id: userId,
          novel_id: novelId,
          current_chapter_number: currentChapterNumber,
          chapters_read: read,
          progress_percentage: progressPercentage,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'user_id,novel_id'
        });
    } catch (error) {
      console.error('Error updating reading progress:', error);
    }
  }

  /**
   * Get reading progress for a novel
   */
  async getReadingProgress(userId: string, novelId: string): Promise<ReadingProgress | null> {
    try {
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('novel_id', novelId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting reading progress:', error);
      return null;
    }
  }

  /**
   * Get reading history
   */
  async getReadingHistory(
    userId: string,
    page: number = 1,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('reading_history')
        .select(`
          *,
          novel:novels(*),
          chapter:chapters(*)
        `)
        .eq('user_id', userId);

      query = paginateQuery(query, page, pageSize);
      query = query.order('last_read_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting reading history:', error);
      return [];
    }
  }

  /**
   * Clear reading history
   */
  async clearReadingHistory(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('reading_history')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true,
        message: 'Reading history cleared',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Add novel to library
   */
  async addToLibrary(userId: string, novelId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('library')
        .insert({
          user_id: userId,
          novel_id: novelId,
        });

      if (error) {
        if (error.code === '23505') {
          return {
            success: false,
            message: 'Novel already in library',
          };
        }
        throw error;
      }

      return {
        success: true,
        message: 'Added to library',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Remove novel from library
   */
  async removeFromLibrary(userId: string, novelId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('library')
        .delete()
        .eq('user_id', userId)
        .eq('novel_id', novelId);

      if (error) throw error;

      return {
        success: true,
        message: 'Removed from library',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Check if novel is in library
   */
  async isInLibrary(userId: string | null | undefined, novelId: string): Promise<boolean> {
    try {
      // Handle unauthenticated users
      if (!userId) {
        return false;
      }

      const { data, error } = await supabase
        .from('library')
        .select('id')
        .eq('user_id', userId)
        .eq('novel_id', novelId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error: any) {
      console.error('[ReadingService] Error checking library status:', {
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
   * Get library status for multiple novels (batch operation)
   * @param userId - Current user ID
   * @param novelIds - Array of novel IDs to check
   * @returns Set of novel IDs that are in user's library
   */
  async getLibraryNovels(userId: string | null | undefined, novelIds: string[]): Promise<Set<string>> {
    // Handle unauthenticated users
    if (!userId) {
      return new Set();
    }

    // Handle empty array
    if (!novelIds || novelIds.length === 0) {
      return new Set();
    }

    try {
      const { data, error } = await supabase
        .from('library')
        .select('novel_id')
        .eq('user_id', userId)
        .in('novel_id', novelIds);

      if (error) throw error;

      // Convert array of objects to Set of novel IDs
      return new Set(data?.map(item => item.novel_id) || []);
    } catch (error: any) {
      console.error('[ReadingService] Error fetching library novels:', {
        error,
        errorMessage: error?.message || 'Unknown error',
        errorCode: error?.code,
        userId,
        novelIdsCount: novelIds.length,
        timestamp: new Date().toISOString()
      });
      // Return empty Set on error to avoid crashing UI
      return new Set();
    }
  }

  /**
   * Get user's library
   */
  async getLibrary(
    userId: string,
    page: number = 1,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('library')
        .select(`
          *,
          novel:novels(*)
        `)
        .eq('user_id', userId);

      query = paginateQuery(query, page, pageSize);
      query = query.order('added_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting library:', error);
      return [];
    }
  }

  /**
   * Get continue reading list (novels with progress)
   */
  async getContinueReading(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('reading_progress')
        .select(`
          *,
          novel:novels(*)
        `)
        .eq('user_id', userId)
        .order('last_updated', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting continue reading:', error);
      return [];
    }
  }
}

export default new ReadingService();
