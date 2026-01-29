import { useQuery } from '@tanstack/react-query';
import walletService from '@/services/walletService';
import { useAuth } from '@/contexts/AuthContext';

/**
 * PRODUCTION-GRADE WALLET HOOKS
 * 
 * All hooks wait for auth initialization before running to prevent
 * race condition where queries fire with stale auth state on reload.
 */

export const useWallet = (userId: string | undefined) => {
    const { isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['wallet', userId],
        queryFn: () => userId ? walletService.getWallet(userId) : null,
        enabled: !authLoading && !!userId,
    });
};

export const useTransactions = (userId: string | undefined, limit: number = 10) => {
    const { isLoading: authLoading } = useAuth();

    return useQuery({
        queryKey: ['transactions', userId, limit],
        queryFn: () => userId ? walletService.getRecentTransactions(userId) : [],
        enabled: !authLoading && !!userId,
    });
};
