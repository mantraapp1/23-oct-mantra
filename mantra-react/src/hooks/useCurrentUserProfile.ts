import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
    id: string;
    username: string;
    display_name: string | null;
    profile_picture_url: string | null;
    bio?: string | null;
    website?: string | null;
}

export function useCurrentUserProfile() {
    const { user } = useAuth();

    // Initialize with metadata if available to prevent "Anonymous" flash
    const [profile, setProfile] = useState<UserProfile | null>(() => {
        if (!user) return null;
        const metadata = user.user_metadata || {};
        // Only return if we have at least some info, otherwise null is safer? 
        // Actually, returning a constructed object is better than null for UI.
        return {
            id: user.id,
            username: metadata.username || user.email?.split('@')[0] || 'user',
            display_name: metadata.display_name || metadata.full_name || null,
            profile_picture_url: metadata.profile_picture_url || metadata.avatar_url || null,
            bio: null,
            website: null
        };
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setProfile(null);
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                // Don't set loading true here if we already have initial data from metadata
                // This prevents UI flickering
                // But we do want to indicate background sync if needed? 
                // For now, let's keep loading=true ONLY if we didn't have metadata?
                // Actually, just let it run in background.

                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, username, display_name, profile_picture_url, bio, website')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    // If error (e.g. no profile row), keep metadata version if it exists
                    console.error('Error fetching profile:', error);
                } else {
                    setProfile(data);
                }
            } catch (err) {
                console.error('Failed to fetch profile', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();

        // Subscribe to realtime changes for this profile
        const channel = supabase
            .channel(`profile:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${user.id}`,
                },
                (payload) => {
                    setProfile(payload.new as UserProfile);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return { profile, loading };
}
