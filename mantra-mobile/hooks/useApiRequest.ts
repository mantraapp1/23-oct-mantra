/**
 * useApiRequest Hook
 * React hook for using the API Request Manager with automatic cleanup
 */

import { useCallback, useEffect, useRef } from 'react';
import { ApiRequestManager } from '../utils/apiRequestManager';

interface UseApiRequestOptions {
    /** Time-to-live for cached responses in milliseconds */
    cacheTtl?: number;
    /** Skip cache and always fetch fresh data */
    skipCache?: boolean;
    /** Persist cache to AsyncStorage for offline access */
    persist?: boolean;
    /** Endpoint name for rate limiting */
    rateLimitEndpoint?: string;
    /** Cancel pending requests when component unmounts */
    cancelOnUnmount?: boolean;
}

interface UseApiRequestResult<T> {
    /** Execute the API request */
    execute: (key: string, requestFn: () => Promise<T>) => Promise<T>;
    /** Invalidate cache entries matching a pattern */
    invalidate: (keyPattern: string) => Promise<void>;
    /** Cancel a specific pending request */
    cancel: (key: string) => void;
    /** Prefetch data into cache */
    prefetch: (key: string, requestFn: () => Promise<T>) => Promise<void>;
    /** Check how old cached data is */
    getCacheAge: (key: string) => number | null;
}

/**
 * Hook for making cached, deduplicated, rate-limited API requests
 * Automatically cancels pending requests on unmount
 */
export const useApiRequest = <T = any>(
    options: UseApiRequestOptions = {}
): UseApiRequestResult<T> => {
    const {
        cacheTtl,
        skipCache = false,
        persist = false,
        rateLimitEndpoint,
        cancelOnUnmount = true,
    } = options;

    // Track active request keys for cleanup
    const activeRequestsRef = useRef<Set<string>>(new Set());
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;

            // Cancel all active requests on unmount
            if (cancelOnUnmount) {
                activeRequestsRef.current.forEach(key => {
                    ApiRequestManager.cancelRequest(key);
                });
                activeRequestsRef.current.clear();
            }
        };
    }, [cancelOnUnmount]);

    const execute = useCallback(
        async (key: string, requestFn: () => Promise<T>): Promise<T> => {
            // Track this request
            activeRequestsRef.current.add(key);

            try {
                const result = await ApiRequestManager.fetch(
                    key,
                    async () => requestFn(), // Wrap to ignore signal for now
                    {
                        cacheTtl,
                        skipCache,
                        persist,
                        rateLimitEndpoint,
                    }
                );

                return result;
            } finally {
                activeRequestsRef.current.delete(key);
            }
        },
        [cacheTtl, skipCache, persist, rateLimitEndpoint]
    );

    const invalidate = useCallback(
        async (keyPattern: string): Promise<void> => {
            await ApiRequestManager.invalidate(keyPattern);
        },
        []
    );

    const cancel = useCallback((key: string): void => {
        ApiRequestManager.cancelRequest(key);
        activeRequestsRef.current.delete(key);
    }, []);

    const prefetch = useCallback(
        async (key: string, requestFn: () => Promise<T>): Promise<void> => {
            await ApiRequestManager.prefetch(
                key,
                async () => requestFn(),
                { cacheTtl, persist }
            );
        },
        [cacheTtl, persist]
    );

    const getCacheAge = useCallback((key: string): number | null => {
        return ApiRequestManager.getCacheAge(key);
    }, []);

    return {
        execute,
        invalidate,
        cancel,
        prefetch,
        getCacheAge,
    };
};

/**
 * Cache key generators for common patterns
 */
export const CacheKeys = {
    novel: (novelId: string) => `novel:${novelId}`,
    novelChapters: (novelId: string) => `novel:${novelId}:chapters`,
    novelReviews: (novelId: string) => `novel:${novelId}:reviews`,
    chapter: (chapterId: string) => `chapter:${chapterId}`,
    chapterComments: (chapterId: string) => `chapter:${chapterId}:comments`,
    userProfile: (userId: string) => `user:${userId}:profile`,
    userLibrary: (userId: string) => `user:${userId}:library`,
    userWallet: (userId: string) => `user:${userId}:wallet`,
    homeNovels: (category: string) => `home:${category}`,
    searchResults: (query: string) => `search:${query}`,
    rankings: (type: string) => `rankings:${type}`,
    genreNovels: (genre: string, page: number) => `genre:${genre}:${page}`,
};

/**
 * Cache TTL presets
 */
export const CacheTTL = {
    /** 1 minute - for frequently changing data */
    SHORT: 60 * 1000,
    /** 5 minutes - default */
    MEDIUM: 5 * 60 * 1000,
    /** 15 minutes - for relatively stable data */
    LONG: 15 * 60 * 1000,
    /** 1 hour - for rarely changing data */
    VERY_LONG: 60 * 60 * 1000,
    /** 24 hours - for static data */
    DAY: 24 * 60 * 60 * 1000,
};

export default useApiRequest;
