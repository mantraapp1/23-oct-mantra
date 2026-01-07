import { supabase } from '../config/supabase';
import { handleSupabaseError, paginateQuery } from '../utils/supabaseHelpers';
import { Novel, Profile } from '../types/supabase';
import { PAGINATION, QUERY_LIMITS } from '../constants/supabase';

/**
 * Search Service
 * Handles search and discovery features
 */
class SearchService {
  /**
   * Search novels by title or description
   */
  async searchNovels(
    query: string,
    page: number = 1,
    pageSize: number = PAGINATION.SEARCH_PAGE_SIZE
  ): Promise<Novel[]> {
    try {
      if (!query || query.trim().length === 0) return [];

      let searchQuery = supabase
        .from('novels')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

      searchQuery = paginateQuery(searchQuery, page, pageSize);
      searchQuery = searchQuery.order('total_views', { ascending: false });

      const { data, error } = await searchQuery;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching novels:', error);
      return [];
    }
  }

  /**
   * Search authors by username or display name
   */
  async searchAuthors(
    query: string,
    page: number = 1,
    pageSize: number = PAGINATION.SEARCH_PAGE_SIZE
  ): Promise<Profile[]> {
    try {
      if (!query || query.trim().length === 0) return [];

      let searchQuery = supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .eq('account_status', 'active');

      searchQuery = paginateQuery(searchQuery, page, pageSize);

      const { data, error } = await searchQuery;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching authors:', error);
      return [];
    }
  }

  /**
   * Search novels by genre
   */
  async searchByGenre(
    genre: string,
    page: number = 1,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
    language?: string
  ): Promise<Novel[]> {
    try {
      let query = supabase
        .from('novels')
        .select('*')
        .contains('genres', [genre]);

      if (language && language !== 'All') {
        query = query.eq('language', language);
      }

      query = paginateQuery(query, page, pageSize);
      query = query.order('total_views', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching by genre:', error);
      return [];
    }
  }

  /**
   * Search novels by tag
   */
  async searchByTag(
    tag: string,
    page: number = 1,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
    language?: string
  ): Promise<Novel[]> {
    try {
      let query = supabase
        .from('novels')
        .select('*')
        .contains('tags', [tag]);

      if (language && language !== 'All') {
        query = query.eq('language', language);
      }

      query = paginateQuery(query, page, pageSize);
      query = query.order('total_views', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching by tag:', error);
      return [];
    }
  }

  /**
   * Search novels by language
   */
  async searchByLanguage(
    language: string,
    page: number = 1,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<Novel[]> {
    try {
      let query = supabase
        .from('novels')
        .select('*')
        .eq('language', language);

      query = paginateQuery(query, page, pageSize);
      query = query.order('total_views', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching by language:', error);
      return [];
    }
  }

  /**
   * Advanced search with multiple filters
   */
  async advancedSearch(filters: {
    query?: string;
    genres?: string[];
    tags?: string[];
    language?: string;
    status?: string;
    minRating?: number;
  }, page: number = 1, pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE): Promise<Novel[]> {
    try {
      let query = supabase.from('novels').select('*');

      // Text search
      if (filters.query && filters.query.trim().length > 0) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }

      // Genre filter
      if (filters.genres && filters.genres.length > 0) {
        query = query.overlaps('genres', filters.genres);
      }

      // Tag filter
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      // Language filter
      if (filters.language) {
        query = query.eq('language', filters.language);
      }

      // Status filter
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Rating filter
      if (filters.minRating) {
        query = query.gte('average_rating', filters.minRating);
      }

      query = paginateQuery(query, page, pageSize);
      query = query.order('total_views', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in advanced search:', error);
      return [];
    }
  }

  /**
   * Get recent searches for a user
   * Returns search history items with id, query, and timestamp
   */
  async getRecentSearches(userId: string, limit: number = 10): Promise<Array<{ id: string; query: string; searched_at: string }>> {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('id, search_query, searched_at')
        .eq('user_id', userId)
        .order('searched_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Return formatted data with consistent naming
      return (data || []).map(item => ({
        id: item.id,
        query: item.search_query,
        searched_at: item.searched_at,
      }));
    } catch (error) {
      console.error('Error getting recent searches:', error);
      return [];
    }
  }

  /**
   * Save a search query to history
   */
  async saveSearch(userId: string, query: string): Promise<void> {
    try {
      if (!query || query.trim().length === 0) return;

      await supabase
        .from('search_history')
        .insert({
          user_id: userId,
          search_query: query.trim(),
        });
    } catch (error) {
      console.error('Error saving search:', error);
      throw error;
    }
  }

  /**
   * Delete a specific search history item by ID
   */
  async deleteSearch(searchId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', searchId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting search:', error);
      throw error;
    }
  }

  /**
   * Clear all search history for a user
   */
  async clearSearchHistory(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing search history:', error);
      throw error;
    }
  }

  /**
   * Get trending searches (popular across all users)
   */
  async getTrendingSearches(limit: number = 10): Promise<Array<{ id: string; query: string; count: number }>> {
    try {
      // Get recent searches from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('search_history')
        .select('search_query')
        .gte('searched_at', sevenDaysAgo.toISOString())
        .order('searched_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Count occurrences
      const queryCounts: { [key: string]: number } = {};
      data?.forEach(item => {
        const query = item.search_query.trim();
        if (query.length > 0) {
          queryCounts[query] = (queryCounts[query] || 0) + 1;
        }
      });

      // Sort by count and return top queries
      const sortedQueries = Object.entries(queryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([query, count], index) => ({
          id: `trending-${index}`,
          query,
          count,
        }));

      return sortedQueries;
    } catch (error) {
      console.error('Error getting trending searches:', error);
      return [];
    }
  }

  // Legacy methods for backward compatibility
  /**
   * @deprecated Use saveSearch instead
   */
  async saveSearchHistory(userId: string, searchQuery: string): Promise<void> {
    return this.saveSearch(userId, searchQuery);
  }

  /**
   * @deprecated Use getRecentSearches instead
   */
  async getSearchHistory(userId: string): Promise<string[]> {
    try {
      const searches = await this.getRecentSearches(userId, QUERY_LIMITS.MAX_RECENT_SEARCHES);
      return searches.map(s => s.query);
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }

  /**
   * @deprecated Use deleteSearch instead
   */
  async deleteSearchHistoryItem(
    userId: string,
    searchQuery: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', userId)
        .eq('search_query', searchQuery);

      if (error) throw error;

      return {
        success: true,
        message: 'Search history item deleted',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * @deprecated Use getTrendingSearches instead
   */
  async getPopularSearches(limit: number = 10): Promise<string[]> {
    try {
      const trending = await this.getTrendingSearches(limit);
      return trending.map(t => t.query);
    } catch (error) {
      console.error('Error getting popular searches:', error);
      return [];
    }
  }

  /**
   * Get all available genres
   */
  async getAllGenres(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('novels')
        .select('genres');

      if (error) throw error;

      // Extract and flatten all genres
      const allGenres = new Set<string>();
      data?.forEach(novel => {
        novel.genres?.forEach((genre: string) => allGenres.add(genre));
      });

      return Array.from(allGenres).sort();
    } catch (error) {
      console.error('Error getting all genres:', error);
      return [];
    }
  }

  /**
   * Get all available tags
   */
  async getAllTags(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('novels')
        .select('tags');

      if (error) throw error;

      // Extract and flatten all tags
      const allTags = new Set<string>();
      data?.forEach(novel => {
        novel.tags?.forEach((tag: string) => allTags.add(tag));
      });

      return Array.from(allTags).sort();
    } catch (error) {
      console.error('Error getting all tags:', error);
      return [];
    }
  }
}

export default new SearchService();
