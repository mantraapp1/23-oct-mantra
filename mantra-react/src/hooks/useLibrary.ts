import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import readingService from '@/services/readingService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * PRODUCTION-GRADE LIBRARY HOOKS
 * 
 * All hooks wait for auth initialization before running to prevent
 * race condition where queries fire with stale auth state on reload.
 */

export const useLibrary = (userId: string | undefined) => {
    const { isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['library', userId],
        queryFn: () => userId ? readingService.getLibrary(userId) : [],
        enabled: !authLoading && !!userId,
    });
};

export const useReadingHistory = (userId: string | undefined) => {
    const { isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['reading-history', userId],
        queryFn: () => userId ? readingService.getReadingHistory(userId) : [],
        enabled: !authLoading && !!userId,
    });
};

export const useLibraryMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, novelId, action }: { userId: string, novelId: string, action: 'add' | 'remove' }) => {
            if (action === 'add') {
                return readingService.addToLibrary(userId, novelId);
            } else {
                return readingService.removeFromLibrary(userId, novelId);
            }
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['library', variables.userId] });
            queryClient.invalidateQueries({ queryKey: ['novel-library-status', variables.novelId] });
        },
    });
};
