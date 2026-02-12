import { useNavigate, useLocation } from 'react-router-dom';
import { useNavigation } from '@/contexts/NavigationContext';

/**
 * Enhanced navigation hook providing smart back navigation.
 * 
 * Uses browser's native history.back() when available,
 * falls back to logical parent routes when user opened page directly.
 */
export function useAppNavigation() {
    const navigate = useNavigate();
    const location = useLocation();

    // Try to use NavigationContext, fallback to basic behavior if not available
    let navContext: ReturnType<typeof useNavigation> | null = null;
    try {
        navContext = useNavigation();
    } catch {
        // NavigationContext not available, will use fallback
    }

    /**
     * Smart back navigation:
     * - Uses browser history.back() if available
     * - Falls back to specified route or parent route
     */
    const goBack = (fallbackPath?: string) => {
        if (navContext) {
            navContext.goBack(fallbackPath);
        } else {
            // Fallback: use browser's native back
            if (window.history.length > 1) {
                window.history.back();
            } else {
                navigate(fallbackPath || '/', { replace: true });
            }
        }
    };

    const getParentRoute = (): string => {
        return navContext?.getParentRoute() || '/';
    };

    return { goBack, navigate, location, getParentRoute };
}
