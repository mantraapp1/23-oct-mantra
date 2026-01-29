import { useQuery } from '@tanstack/react-query';
import novelService from '@/services/novelService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * PRODUCTION-GRADE NOVEL HOOKS
 * 
 * IMPORTANT: All queries wait for auth initialization to complete.
 * This prevents race conditions where queries fire while Supabase
 * is still restoring the session from localStorage.
 * 
 * Without this gate, queries can be aborted mid-flight when the
 * auth state changes, causing "signal aborted" errors on page reload.
 */

// Trending novels for home page - PUBLIC but waits for auth init
export const useTrendingNovels = () => {
    const { isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['novels', 'trending'],
        queryFn: () => novelService.getTrendingNovels(8),
        enabled: !authLoading, // Wait for auth to stabilize
    });
};

// Top ranked novels - PUBLIC but waits for auth init
export const useTopRankedNovels = () => {
    const { isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['novels', 'ranked'],
        queryFn: () => novelService.getPopularNovels(8),
        enabled: !authLoading,
    });
};

// Latest updated novels - PUBLIC but waits for auth init
export const useLatestNovels = () => {
    const { isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['novels', 'latest'],
        queryFn: () => novelService.getRecentlyUpdatedNovels(5),
        enabled: !authLoading,
    });
};

// Ranked novels with filters - PUBLIC but waits for auth init
export const useRankedNovels = (sortBy: string, filters: Record<string, unknown> = {}) => {
    const { isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['novels', 'ranked-page', sortBy, filters],
        queryFn: async () => {
            const limit = 20;

            switch (sortBy) {
                case 'Trending':
                case 'Most Viewed':
                    return novelService.getTrendingNovels(limit);
                case 'Most Voted':
                    return novelService.getPopularNovels(limit);
                case 'Highest Rated':
                    return novelService.getTopRatedNovels(limit);
                default:
                    return novelService.getNovels(filters, 1, limit);
            }
        },
        enabled: !authLoading,
    });
};

// Single novel by ID - PUBLIC but waits for auth init
export const useNovel = (novelId: string | undefined) => {
    const { isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['novel', novelId],
        queryFn: () => novelService.getNovel(novelId!),
        enabled: !authLoading && !!novelId,
    });
};

// Novels by author - PUBLIC but waits for auth init
export const useNovelsByAuthor = (authorId: string | undefined) => {
    const { isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['novels', 'author', authorId],
        queryFn: () => novelService.getNovelsByAuthor(authorId!),
        enabled: !authLoading && !!authorId,
    });
};

// Search novels - PUBLIC but waits for auth init
export const useSearchNovels = (query: string, page: number = 1) => {
    const { isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['novels', 'search', query, page],
        queryFn: () => novelService.searchNovels(query, page),
        enabled: !authLoading && query.length >= 2,
    });
};

// New arrivals - PUBLIC but waits for auth init
export const useNewArrivals = (limit: number = 10) => {
    const { isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['novels', 'new-arrivals', limit],
        queryFn: () => novelService.getNewArrivals(limit),
        enabled: !authLoading,
    });
};

// Editor's picks - PUBLIC but waits for auth init
export const useEditorsPicks = (limit: number = 10) => {
    const { isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['novels', 'editors-picks', limit],
        queryFn: () => novelService.getEditorsPicks(limit),
        enabled: !authLoading,
    });
};
