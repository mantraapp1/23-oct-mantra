import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

export interface Profile {
    id: string;
    username: string;
    display_name: string | null;
    profile_picture_url: string | null;
    bio: string | null;
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

    const supabase = createClient();

    // Fetch profile data for a user
    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, display_name, profile_picture_url, bio, created_at, updated_at')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error.message);
                return null;
            }

            return data as Profile;
        } catch (error) {
            console.error('Error in fetchProfile:', error);
            return null;
        }
    }, [supabase]);

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
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }, [supabase]);

    // Initialize auth state
    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            try {
                // Get initial session
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('Error getting session:', error.message);
                    if (mounted) setIsLoading(false);
                    return;
                }

                if (mounted && initialSession) {
                    setSession(initialSession);
                    setUser(initialSession.user);

                    // Fetch profile
                    const profileData = await fetchProfile(initialSession.user.id);
                    if (mounted) setProfile(profileData);
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    console.error('Error initializing auth:', error);
                }
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, currentSession) => {
                if (!mounted) return;

                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    // Fetch profile on auth change
                    const profileData = await fetchProfile(currentSession.user.id);
                    if (mounted) setProfile(profileData);
                } else {
                    setProfile(null);
                }

                // Handle specific events
                if (event === 'SIGNED_OUT') {
                    setProfile(null);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase, fetchProfile]);

    const value: AuthContextType = {
        user,
        profile,
        session,
        isLoading,
        isAuthenticated: !!user,
        signOut,
        refreshProfile,
    };

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
            return (
                <div className="flex justify-center items-center min-h-screen">
                    <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
            );
        }

        if (!isAuthenticated) {
            // Redirect handled by component or router
            return null;
        }

        return <WrappedComponent {...props} />;
    };
}
