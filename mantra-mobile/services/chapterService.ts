import { supabase } from '../config/supabase';
import { handleSupabaseError, paginateQuery } from '../utils/supabaseHelpers';
import { Chapter, ChapterWithNovel } from '../types/supabase';
import { PAGINATION } from '../constants/supabase';

export interface CreateChapterData {
  novel_id: string;
  chapter_number: number;
  title: string;
  content: string;
  is_locked?: boolean;
  wait_hours?: number;
}

export interface UpdateChapterData {
  title?: string;
  content?: string;
  is_locked?: boolean;
  wait_hours?: number;
}

export interface ChapterResponse {
  success: boolean;
  message: string;
  chapter?: Chapter;
}

/**
 * Chapter Service
 * Handles all chapter-related operations
 */
class ChapterService {
  /**
   * Create a new chapter
   */
  async createChapter(data: CreateChapterData): Promise<ChapterResponse> {
    try {
      // Calculate word count
      const wordCount = data.content.trim().split(/\s+/).length;

      const { data: chapter, error } = await supabase
        .from('chapters')
        .insert({
          ...data,
          word_count: wordCount,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Chapter created successfully',
        chapter,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Update a chapter
   */
  async updateChapter(chapterId: string, data: UpdateChapterData): Promise<ChapterResponse> {
    try {
      const updateData: any = { ...data };

      // Recalculate word count if content is updated
      if (data.content) {
        updateData.word_count = data.content.trim().split(/\s+/).length;
      }

      const { data: chapter, error } = await supabase
        .from('chapters')
        .update(updateData)
        .eq('id', chapterId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Chapter updated successfully',
        chapter,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Delete a chapter
   */
  async deleteChapter(chapterId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId);

      if (error) throw error;

      return {
        success: true,
        message: 'Chapter deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Get chapter by ID
   */
  async getChapter(chapterId: string): Promise<ChapterWithNovel | null> {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select(`
          *,
          novel:novels(*)
        `)
        .eq('id', chapterId)
        .single();

      if (error) throw error;
      return data as ChapterWithNovel;
    } catch (error) {
      console.error('Error getting chapter:', error);
      return null;
    }
  }

  /**
   * Get chapters by novel ID
   */
  async getChaptersByNovel(
    novelId: string,
    page: number = 1,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<Chapter[]> {
    try {
      let query = supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', novelId);

      query = paginateQuery(query, page, pageSize);
      query = query.order('chapter_number', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting chapters:', error);
      return [];
    }
  }

  /**
   * Get all chapters by novel ID (no pagination)
   */
  async getAllChaptersByNovel(novelId: string): Promise<Chapter[]> {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', novelId)
        .order('chapter_number', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all chapters:', error);
      return [];
    }
  }

  /**
   * Get chapter by novel ID and chapter number
   */
  async getChapterByNumber(novelId: string, chapterNumber: number): Promise<Chapter | null> {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', novelId)
        .eq('chapter_number', chapterNumber)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting chapter by number:', error);
      return null;
    }
  }

  /**
   * Get next chapter
   */
  async getNextChapter(novelId: string, currentChapterNumber: number): Promise<Chapter | null> {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', novelId)
        .gt('chapter_number', currentChapterNumber)
        .order('chapter_number', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting next chapter:', error);
      return null;
    }
  }

  /**
   * Get previous chapter
   */
  async getPreviousChapter(novelId: string, currentChapterNumber: number): Promise<Chapter | null> {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', novelId)
        .lt('chapter_number', currentChapterNumber)
        .order('chapter_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting previous chapter:', error);
      return null;
    }
  }

  /**
   * Get chapter content (checks unlock status)
   */
  async getChapterContent(chapterId: string, userId: string): Promise<{
    success: boolean;
    content?: string;
    isLocked: boolean;
    message?: string;
  }> {
    try {
      const chapter = await this.getChapter(chapterId);
      if (!chapter) {
        return {
          success: false,
          isLocked: true,
          message: 'Chapter not found',
        };
      }

      // Check if chapter is locked
      if (!chapter.is_locked) {
        return {
          success: true,
          content: chapter.content,
          isLocked: false,
        };
      }

      // Check if user has unlocked this chapter
      const { data: unlock, error } = await supabase
        .from('chapter_unlocks')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter_id', chapterId)
        .eq('is_expired', false)
        .maybeSingle();

      if (error) throw error;

      if (unlock) {
        return {
          success: true,
          content: chapter.content,
          isLocked: false,
        };
      }

      return {
        success: false,
        isLocked: true,
        message: 'Chapter is locked. Please unlock to read.',
      };
    } catch (error: any) {
      return {
        success: false,
        isLocked: true,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Increment chapter views
   */
  async incrementViews(chapterId: string): Promise<void> {
    try {
      // Use RPC function to increment views (also updates novel views via trigger)
      const { error } = await supabase.rpc('increment_chapter_views', { 
        chapter_id_param: chapterId 
      });

      if (error) {
        console.error('Error calling increment_chapter_views RPC:', error);
        // Fallback to manual update if RPC doesn't exist yet
        const chapter = await this.getChapter(chapterId);
        if (!chapter) return;

        const { error: updateError } = await supabase
          .from('chapters')
          .update({ views: chapter.views + 1 })
          .eq('id', chapterId);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Error incrementing chapter views:', error);
    }
  }

  // Note: Chapters do NOT have likes/dislikes in the database schema
  // Only comments and reviews have likes/dislikes
  // If you need to like/dislike content, use comments or reviews instead

  /**
   * Get chapter statistics
   */
  async getChapterStats(chapterId: string) {
    try {
      const chapter = await this.getChapter(chapterId);
      if (!chapter) return null;

      // Get comment count
      const { count: commentCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('chapter_id', chapterId);

      return {
        views: chapter.views,
        wordCount: chapter.word_count,
        commentCount: commentCount || 0,
        // Note: Chapters do not have likes/dislikes in the schema
      };
    } catch (error) {
      console.error('Error getting chapter stats:', error);
      return null;
    }
  }

  /**
   * Get latest chapters across all novels
   */
  async getLatestChapters(limit: number = 10): Promise<ChapterWithNovel[]> {
    try {
      const { data, error } = await supabase
        .from('chapters')
        .select(`
          *,
          novel:novels(*)
        `)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data as ChapterWithNovel[]) || [];
    } catch (error) {
      console.error('Error getting latest chapters:', error);
      return [];
    }
  }

  /**
   * Get total chapter count for a novel
   */
  async getChapterCount(novelId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .eq('novel_id', novelId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting chapter count:', error);
      return 0;
    }
  }
}

export default new ChapterService();
