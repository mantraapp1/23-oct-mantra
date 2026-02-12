import React, { createContext, useContext, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Navigation Service - Simple and Reliable
 * 
 * Uses browser's native navigate(-1) for ALL back navigation.
 * Only uses fallback if user opened page directly via URL (no referrer).
 */

// Define logical parent routes for fallback navigation ONLY when there's no history
const PARENT_ROUTES: Record<string, string | ((path: string) => string)> = {
    // Chapter reader -> Novel page
    '/novel/:novelId/chapter/:chapterId': (path) => {
        const match = path.match(/\/novel\/([^/]+)/);
        return match ? `/novel/${match[1]}` : '/';
    },

    // Edit chapter -> Novel manage page
    '/novel/:novelId/chapter/:chapterId/edit': (path) => {
        const match = path.match(/\/novel\/([^/]+)/);
        return match ? `/novel/manage/${match[1]}` : '/dashboard';
    },

    // Create chapter -> Novel manage page
    '/novel/:novelId/create-chapter': (path) => {
        const match = path.match(/\/novel\/([^/]+)/);
        return match ? `/novel/manage/${match[1]}` : '/dashboard';
    },

    // Edit novel -> Novel manage page
    '/novel/edit/:novelId': (path) => {
        const match = path.match(/\/novel\/edit\/([^/]+)/);
        return match ? `/novel/manage/${match[1]}` : '/dashboard';
    },

    // Novel manage -> Dashboard
    '/novel/manage/:novelId': '/dashboard',

    // Create novel -> Dashboard
    '/novel/create': '/dashboard',

    // Profile edit -> Profile
    '/profile/edit': '/profile',

    // Settings pages
    '/settings/account': '/settings',
    '/settings': '/',

    // Contact/FAQ -> Settings as fallback
    '/contact': '/settings',
    '/faq': '/settings',

    // Report -> Home as fallback
    '/report': '/',

    // Wallet pages
    '/wallet/history': '/wallet',
    '/wallet/withdraw': '/wallet',

    // User profile -> Home
    '/user/:userId': '/',

    // Discovery pages -> Home
    '/search': '/',
    '/ranking': '/',
    '/library': '/',
    '/notifications': '/',
    '/see-all/:type': '/',
    '/dashboard': '/',

    // Legal pages -> Home
    '/terms': '/',
    '/privacy': '/',
    '/cookies': '/',
    '/refund-policy': '/',
    '/risk-disclosure': '/',
    '/moderation-policy': '/',
    '/grievance-redressal': '/',
    '/dmca': '/',
    '/data-retention': '/',
    '/creator-monetization': '/',
    '/cookie-policy': '/',
    '/content-policy': '/',
    '/child-safety': '/',
    '/acceptable-use': '/',
};

interface NavigationContextType {
    goBack: (fallback?: string) => void;
    getParentRoute: () => string;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

// Match a path pattern to a route pattern
function matchRoute(path: string, pattern: string): boolean {
    const pathParts = path.split('/').filter(Boolean);
    const patternParts = pattern.split('/').filter(Boolean);

    if (pathParts.length !== patternParts.length) return false;

    return patternParts.every((part, i) =>
        part.startsWith(':') || part === pathParts[i]
    );
}

// Find parent route for a given path
function findParentRoute(path: string): string {
    for (const [pattern, parent] of Object.entries(PARENT_ROUTES)) {
        if (matchRoute(path, pattern)) {
            return typeof parent === 'function' ? parent(path) : parent;
        }
    }
    return '/';
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();

    // Get parent route for current path
    const getParentRoute = useCallback((): string => {
        return findParentRoute(location.pathname);
    }, [location.pathname]);

    // Simple and reliable back navigation
    const goBack = useCallback((fallback?: string): void => {
        // Check if browser has history we can go back to
        // history.length > 1 means there's at least one page to go back to
        if (window.history.length > 1) {
            // Use browser's native back - this ALWAYS works correctly
            window.history.back();
        } else {
            // No history at all - user opened page directly via URL
            // Use fallback or parent route
            const targetRoute = fallback || findParentRoute(location.pathname);
            navigate(targetRoute, { replace: true });
        }
    }, [navigate, location.pathname]);

    return (
        <NavigationContext.Provider value={{ goBack, getParentRoute }}>
            {children}
        </NavigationContext.Provider>
    );
}

export function useNavigation(): NavigationContextType {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
}

export default NavigationContext;
