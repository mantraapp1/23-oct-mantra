import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { FullScreenLoader } from '@/components/ui/LoadingSpinner';

// ============================================
// Types
// ============================================

export interface Profile {
    id: string;
    username: string;
    display_name: string | null;
    profile_picture_url: string | null;
    bio: string | null;
    gender: string | null;
    age: number | null;
    show_mature_content: boolean;
    preferred_language: string | null;
    favorite_genres: string[] | null;
    onboarding_completed: boolean | null; // Added field
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const queryClient = useQueryClient();

    // Fetch profile data for a user
    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        try {

            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, display_name, profile_picture_url, bio, gender, age, preferred_language, favorite_genres, onboarding_completed, created_at, updated_at')
                .eq('id', userId)
                .single();

            if (error) {

                return null;
            }


            return data as Profile;
        } catch {

            return null;
        }
    }, []); // supabase is static now

    // Refresh profile data
    const refreshProfile = useCallback(async () => {
        if (!user) return;
        const profileData = await fetchProfile(user.id);
        setProfile(profileData);
    }, [user, fetchProfile]);

    // Sign out
    const signOut = useCallback(async () => {
        try {

            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            setSession(null);

        } catch {

        }
    }, []);

    // Initialize auth state - use ONLY onAuthStateChange pattern
    // This is the production-grade approach recommended by Supabase
    useEffect(() => {
        let mounted = true;
        let initialized = false;



        // Safety timeout - guarantee loading clears after 3 seconds
        const timeoutId = setTimeout(() => {
            if (mounted && !initialized) {

                setIsLoading(false);
                setIsInitialLoad(false);
                initialized = true;
            }
        }, 3000);

        // Use onAuthStateChange as the SINGLE source of truth
        // This handles: initial session, sign in, sign out, token refresh
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                if (!mounted) return;



                // For any session-related event, update state
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                // Fetch profile if we have a user
                if (currentSession?.user) {
                    // Use setTimeout to avoid blocking the auth state update
                    // This is important for preventing race conditions
                    setTimeout(async () => {
                        if (!mounted) return;
                        try {
                            const profileData = await fetchProfile(currentSession.user.id);
                            if (mounted) setProfile(profileData);
                        } catch {

                        }
                    }, 0);
                } else {
                    setProfile(null);
                }

                // Mark initialization complete on first event
                if (!initialized) {

                    setIsLoading(false);
                    setIsInitialLoad(false);
                    initialized = true;
                    clearTimeout(timeoutId);
                }

                // Handle specific events
                if (event === 'SIGNED_OUT') {
                    setProfile(null);
                    queryClient.clear();
                }

                if (event === 'TOKEN_REFRESHED') {
                    queryClient.invalidateQueries();
                }
            }
        );

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, [fetchProfile, queryClient]);

    const value: AuthContextType = {
        user,
        profile,
        session,
        isLoading,
        isAuthenticated: !!user,
        signOut,
        refreshProfile,
    };

    // Only show full screen loader on initial load (first visit)
    // On page reloads after login, show content immediately while session loads in background
    if (isLoading && isInitialLoad) {
        return <FullScreenLoader />;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// ============================================
// Hook
// ============================================

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

// ============================================
// Higher-Order Components
// ============================================

/**
 * HOC to require authentication for a component
 * Redirects to login if not authenticated
 */
export function withAuth<P extends object>(
    WrappedComponent: React.ComponentType<P>
): React.FC<P> {
    return function AuthenticatedComponent(props: P) {
        const { isAuthenticated, isLoading } = useAuth();

        if (isLoading) {
            return <FullScreenLoader />;
        }

        if (!isAuthenticated) {
            // Redirect handled by component or router
            return null;
        }

        return <WrappedComponent {...props} />;
    };
}
