import { supabase } from '../config/supabase';
import { handleSupabaseError } from '../utils/supabaseHelpers';
import { Profile } from '../types/supabase';
import { VALIDATION } from '../constants/supabase';
import imageCacheService from './imageCacheService';

export interface UpdateProfileData {
  display_name?: string;
  bio?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  favorite_genres?: string[];
  preferred_language?: string;
  profile_picture_url?: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  profile?: Profile;
}

/**
 * Profile Service
 * Handles profile-related operations with caching
 */
class ProfileService {
  // In-memory cache for profiles
  private profileCache: Map<string, { profile: Profile | null; timestamp: number }> = new Map();

  // Cache TTL: 5 minutes
  private readonly CACHE_TTL = 5 * 60 * 1000;

  // Maximum cache size (LRU eviction)
  private readonly MAX_CACHE_SIZE = 100;

  /**
   * Get profile by user ID
   */
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting profile:', error);
      return null;
    }
  }

  /**
   * Get profile by username
   */
  async getProfileByUsername(username: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting profile by username:', error);
      return null;
    }
  }

  /**
   * Update profile
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<ProfileResponse> {
    try {
      // Validate data
      this.validateProfileData(data);

      const { data: profile, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Clear cache for this user
      this.clearProfileCache(userId);

      return {
        success: true,
        message: 'Profile updated successfully',
        profile,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Update profile picture
   */
  async updateProfilePicture(userId: string, imageUrl: string): Promise<ProfileResponse> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .update({ profile_picture_url: imageUrl })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Clear cache for this user
      this.clearProfileCache(userId);

      // Clear image cache as well
      await imageCacheService.clearCache(userId);

      return {
        success: true,
        message: 'Profile picture updated successfully',
        profile,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    userId: string,
    enabled: boolean
  ): Promise<ProfileResponse> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .update({ push_notifications_enabled: enabled })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Clear cache for this user
      this.clearProfileCache(userId);

      return {
        success: true,
        message: 'Notification settings updated',
        profile,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    try {
      // Get follower count
      const { count: followerCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      // Get following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      // Get novels count (authored novels)
      const { count: novelsCount } = await supabase
        .from('novels')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId);

      // Get library count (saved novels)
      const { count: libraryCount } = await supabase
        .from('library')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get wallet info
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance, total_earned')
        .eq('user_id', userId)
        .single();

      return {
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
        novelsCount: novelsCount || 0,
        libraryCount: libraryCount || 0,
        earnings: wallet?.total_earned || 0,
        balance: wallet?.balance || 0,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        followerCount: 0,
        followingCount: 0,
        novelsCount: 0,
        libraryCount: 0,
        earnings: 0,
        balance: 0,
      };
    }
  }

  /**
   * Search profiles by username or display name
   */
  async searchProfiles(query: string, limit: number = 20): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .eq('account_status', 'active')
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching profiles:', error);
      return [];
    }
  }

  /**
   * Get multiple profiles by IDs
   */
  async getProfilesByIds(userIds: string[]): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting profiles by IDs:', error);
      return [];
    }
  }

  /**
   * Get profile with caching
   * Cache profiles in memory for 5 minutes to reduce DB calls
   */
  async getProfileCached(userId: string): Promise<Profile | null> {
    try {
      // Check if profile is in cache and not expired
      const cached = this.profileCache.get(userId);
      const now = Date.now();

      if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
        return cached.profile;
      }

      // Fetch from database
      const profile = await this.getProfile(userId);

      // Store in cache
      this.setCacheEntry(userId, profile);

      return profile;
    } catch (error) {
      console.error('Error getting cached profile:', error);
      return null;
    }
  }

  /**
   * Batch get profiles with caching
   * Efficiently fetch multiple profiles at once
   */
  async getProfilesBatch(userIds: string[]): Promise<Map<string, Profile>> {
    try {
      const profileMap = new Map<string, Profile>();
      const uncachedIds: string[] = [];
      const now = Date.now();

      // Check cache for each user ID
      userIds.forEach(userId => {
        const cached = this.profileCache.get(userId);
        if (cached && (now - cached.timestamp) < this.CACHE_TTL && cached.profile) {
          profileMap.set(userId, cached.profile);
        } else {
          uncachedIds.push(userId);
        }
      });

      // Fetch uncached profiles from database
      if (uncachedIds.length > 0) {
        const profiles = await this.getProfilesByIds(uncachedIds);

        // Add to map and cache
        profiles.forEach(profile => {
          profileMap.set(profile.id, profile);
          this.setCacheEntry(profile.id, profile);
        });
      }

      return profileMap;
    } catch (error) {
      console.error('Error getting profiles batch:', error);
      return new Map();
    }
  }

  /**
   * Clear profile cache for a specific user
   * Call this after profile updates
   */
  clearProfileCache(userId: string): void {
    this.profileCache.delete(userId);
  }

  /**
   * Clear all profile cache
   */
  clearAllProfileCache(): void {
    this.profileCache.clear();
  }

  /**
   * Set cache entry with LRU eviction
   */
  private setCacheEntry(userId: string, profile: Profile | null): void {
    // If cache is full, remove oldest entry (simple LRU)
    if (this.profileCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.profileCache.keys().next().value;
      if (firstKey) {
        this.profileCache.delete(firstKey);
      }
    }

    this.profileCache.set(userId, {
      profile,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if user is following another user
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  /**
   * Validate profile data
   */
  private validateProfileData(data: UpdateProfileData): void {
    // Age validation
    if (data.age !== undefined) {
      if (data.age < VALIDATION.MIN_AGE || data.age > VALIDATION.MAX_AGE) {
        throw new Error(`Age must be between ${VALIDATION.MIN_AGE} and ${VALIDATION.MAX_AGE}`);
      }
    }

    // Favorite genres validation (max 3)
    if (data.favorite_genres && data.favorite_genres.length > 3) {
      throw new Error('You can select up to 3 favorite genres');
    }

    // Display name validation
    if (data.display_name !== undefined && data.display_name.trim().length === 0) {
      throw new Error('Display name cannot be empty');
    }
  }
}

export default new ProfileService();
