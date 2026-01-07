import { supabase } from '../config/supabase';
import { handleSupabaseError, paginateQuery } from '../utils/supabaseHelpers';
import { Profile } from '../types/supabase';
import { PAGINATION } from '../constants/supabase';

/**
 * Social Service
 * Handles social features like following, followers, etc.
 */
class SocialService {
  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if already following
      const { data: existing } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          message: 'Already following this user',
        };
      }

      // Create follow relationship
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId,
        });

      if (error) throw error;

      return {
        success: true,
        message: 'Successfully followed user',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw error;

      return {
        success: true,
        message: 'Successfully unfollowed user',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Check if user is following another user
   */
  async isFollowing(followerId: string | null | undefined, followingId: string): Promise<boolean> {
    try {
      // Handle unauthenticated users
      if (!followerId || !followingId) {
        return false;
      }

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error: any) {
      console.error('[SocialService] Error checking follow status:', {
        error,
        errorMessage: error?.message || 'Unknown error',
        errorCode: error?.code,
        followerId,
        followingId,
        timestamp: new Date().toISOString()
      });
      return false;
    }
  }

  /**
   * Get following status for multiple users (batch operation)
   * @param userId - Current user ID
   * @param targetUserIds - Array of user IDs to check
   * @returns Set of user IDs that current user is following
   */
  async getFollowingStatus(userId: string | null | undefined, targetUserIds: string[]): Promise<Set<string>> {
    try {
      // Handle unauthenticated users
      if (!userId) {
        return new Set();
      }

      // Handle empty array
      if (!targetUserIds || targetUserIds.length === 0) {
        return new Set();
      }

      // Batch fetch follows using IN clause
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
        .in('following_id', targetUserIds);

      if (error) throw error;

      // Convert to Set for efficient lookups
      const followingSet = new Set<string>();
      data?.forEach((follow: any) => {
        followingSet.add(follow.following_id);
      });

      return followingSet;
    } catch (error: any) {
      console.error('[SocialService] Error fetching following status:', {
        error,
        errorMessage: error?.message || 'Unknown error',
        errorCode: error?.code,
        userId,
        targetUserIdsCount: targetUserIds.length,
        timestamp: new Date().toISOString()
      });
      // Return empty Set on error, don't crash UI
      return new Set();
    }
  }

  /**
   * Get followers of a user
   */
  async getFollowers(
    userId: string,
    page: number = 1,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<Profile[]> {
    try {
      let query = supabase
        .from('follows')
        .select(`
          follower_id,
          follower:profiles!follows_follower_id_fkey(*)
        `)
        .eq('following_id', userId);

      query = paginateQuery(query, page, pageSize);
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Extract follower profiles
      return data?.map((item: any) => item.follower) || [];
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  }

  /**
   * Get users that a user is following
   */
  async getFollowing(
    userId: string,
    page: number = 1,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<Profile[]> {
    try {
      let query = supabase
        .from('follows')
        .select(`
          following_id,
          following:profiles!follows_following_id_fkey(*)
        `)
        .eq('follower_id', userId);

      query = paginateQuery(query, page, pageSize);
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Extract following profiles
      return data?.map((item: any) => item.following) || [];
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  }

  /**
   * Get follower count
   */
  async getFollowerCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting follower count:', error);
      return 0;
    }
  }

  /**
   * Get following count
   */
  async getFollowingCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting following count:', error);
      return 0;
    }
  }

  /**
   * Get mutual followers (users who follow each other)
   */
  async getMutualFollowers(userId: string): Promise<Profile[]> {
    try {
      // Get users that the current user follows
      const { data: following, error: followingError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (followingError) throw followingError;

      const followingIds = following?.map(f => f.following_id) || [];

      if (followingIds.length === 0) return [];

      // Get users who also follow the current user
      const { data: mutuals, error: mutualsError } = await supabase
        .from('follows')
        .select(`
          follower_id,
          follower:profiles!follows_follower_id_fkey(*)
        `)
        .eq('following_id', userId)
        .in('follower_id', followingIds);

      if (mutualsError) throw mutualsError;

      return mutuals?.map((item: any) => item.follower) || [];
    } catch (error) {
      console.error('Error getting mutual followers:', error);
      return [];
    }
  }

  /**
   * Get suggested users to follow (based on mutual connections)
   */
  async getSuggestedUsers(userId: string, limit: number = 10): Promise<Profile[]> {
    try {
      // Get users that people you follow also follow
      // This is a simplified version - in production you'd want more sophisticated recommendations
      
      // Get users the current user follows
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      const followingIds = following?.map(f => f.following_id) || [];

      if (followingIds.length === 0) {
        // If not following anyone, return popular users
        const { data: popular } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', userId)
          .limit(limit);

        return popular || [];
      }

      // Get users that your following also follow
      const { data: suggestions } = await supabase
        .from('follows')
        .select(`
          following_id,
          following:profiles!follows_following_id_fkey(*)
        `)
        .in('follower_id', followingIds)
        .neq('following_id', userId)
        .limit(limit);

      if (!suggestions) return [];

      // Filter out users already followed
      const suggestedProfiles = suggestions
        .map((item: any) => item.following)
        .filter((profile: Profile) => !followingIds.includes(profile.id));

      // Remove duplicates
      const uniqueProfiles = Array.from(
        new Map(suggestedProfiles.map((p: Profile) => [p.id, p])).values()
      );

      return uniqueProfiles.slice(0, limit);
    } catch (error) {
      console.error('Error getting suggested users:', error);
      return [];
    }
  }
}

export default new SocialService();
