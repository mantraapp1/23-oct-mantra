import { supabase } from '@/lib/supabase/client';
import { handleSupabaseError } from '@/utils/supabaseHelpers';
import type { Profile } from '@/types/supabase';

export interface UpdateProfileData {
    display_name?: string;
    username?: string;
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
 * Web Implementation (No Manual Caching - relies on React Query)
 */
class ProfileService {

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
        } catch {
            return null;
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
        } catch {
            // Return zeros if fails
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

    async updateProfile(userId: string, data: UpdateProfileData): Promise<ProfileResponse> {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .update(data)
                .eq('id', userId)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                message: 'Profile updated successfully',
                profile: profile as Profile,
            };
        } catch (error: any) {
            return {
                success: false,
                message: handleSupabaseError(error),
            };
        }
    }
}

export default new ProfileService();
