/**
 * usePagination Hook
 * Reusable pagination with infinite scroll support
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';

interface PaginationState<T> {
    /** Current page data */
    items: T[];
    /** Current page number */
    page: number;
    /** Whether there are more pages to load */
    hasMore: boolean;
    /** Whether currently loading */
    loading: boolean;
    /** Whether loading more (subsequent pages) */
    loadingMore: boolean;
    /** Error message if any */
    error: string | null;
    /** Total items count (if available from API) */
    totalCount: number | null;
}

interface UsePaginationOptions<T> {
    /** Initial page size */
    pageSize?: number;
    /** Initial page number (typically 1) */
    initialPage?: number;
    /** Key extractor for deduplication */
    keyExtractor?: (item: T) => string;
    /** Whether to reset on screen focus */
    resetOnFocus?: boolean;
}

interface UsePaginationResult<T> extends PaginationState<T> {
    /** Load next page */
    loadMore: () => Promise<void>;
    /** Refresh from page 1 */
    refresh: () => Promise<void>;
    /** Reset to initial state */
    reset: () => void;
    /** Whether list is empty (no items after loading) */
    isEmpty: boolean;
    /** Whether this is initial load */
    isInitialLoad: boolean;
}

/**
 * Hook for paginated data fetching with infinite scroll
 * 
 * @param fetchFn - Function to fetch a page of data
 * @param dependencies - Array of deps that trigger refetch when changed
 * @param options - Configuration options
 */
export function usePagination<T>(
    fetchFn: (page: number, pageSize: number) => Promise<{ items: T[]; totalCount?: number }>,
    dependencies: any[] = [],
    options: UsePaginationOptions<T> = {}
): UsePaginationResult<T> {
    const {
        pageSize = 20,
        initialPage = 1,
        keyExtractor,
        resetOnFocus = false,
    } = options;

    const [state, setState] = useState<PaginationState<T>>({
        items: [],
        page: initialPage,
        hasMore: true,
        loading: true,
        loadingMore: false,
        error: null,
        totalCount: null,
    });

    const isMountedRef = useRef(true);
    const isLoadingRef = useRef(false);

    // Load a specific page
    const loadPage = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;

        setState(prev => ({
            ...prev,
            loading: isRefresh || pageNum === initialPage,
            loadingMore: !isRefresh && pageNum > initialPage,
            error: null,
        }));

        try {
            const result = await fetchFn(pageNum, pageSize);

            if (!isMountedRef.current) return;

            const newItems = result.items || [];
            const hasMore = newItems.length === pageSize;

            setState(prev => {
                let items: T[];

                if (isRefresh || pageNum === initialPage) {
                    items = newItems;
                } else {
                    // Append new items, deduplicate if keyExtractor provided
                    if (keyExtractor) {
                        const existingKeys = new Set(prev.items.map(keyExtractor));
                        const uniqueNewItems = newItems.filter(item => !existingKeys.has(keyExtractor(item)));
                        items = [...prev.items, ...uniqueNewItems];
                    } else {
                        items = [...prev.items, ...newItems];
                    }
                }

                return {
                    items,
                    page: pageNum,
                    hasMore,
                    loading: false,
                    loadingMore: false,
                    error: null,
                    totalCount: result.totalCount ?? prev.totalCount,
                };
            });
        } catch (err: any) {
            if (!isMountedRef.current) return;

            setState(prev => ({
                ...prev,
                loading: false,
                loadingMore: false,
                error: err?.message || 'Failed to load data',
            }));
        } finally {
            isLoadingRef.current = false;
        }
    }, [fetchFn, pageSize, initialPage, keyExtractor]);

    // Load next page
    const loadMore = useCallback(async () => {
        if (!state.hasMore || state.loading || state.loadingMore) return;
        await loadPage(state.page + 1);
    }, [state.hasMore, state.loading, state.loadingMore, state.page, loadPage]);

    // Refresh from page 1
    const refresh = useCallback(async () => {
        await loadPage(initialPage, true);
    }, [loadPage, initialPage]);

    // Reset to initial state
    const reset = useCallback(() => {
        setState({
            items: [],
            page: initialPage,
            hasMore: true,
            loading: true,
            loadingMore: false,
            error: null,
            totalCount: null,
        });
        loadPage(initialPage, true);
    }, [initialPage, loadPage]);

    // Initial load on mount and when dependencies change
    useEffect(() => {
        isMountedRef.current = true;
        loadPage(initialPage, true);

        return () => {
            isMountedRef.current = false;
        };
    }, [...dependencies]);

    // Optional reset on focus
    useFocusEffect(
        useCallback(() => {
            if (resetOnFocus) {
                refresh();
            }
        }, [resetOnFocus, refresh])
    );

    return {
        ...state,
        loadMore,
        refresh,
        reset,
        isEmpty: !state.loading && state.items.length === 0,
        isInitialLoad: state.loading && state.items.length === 0,
    };
}

/**
 * Hook for cursor-based pagination (for APIs that use cursor instead of page)
 */
export function useCursorPagination<T>(
    fetchFn: (cursor: string | null, limit: number) => Promise<{ items: T[]; nextCursor: string | null }>,
    dependencies: any[] = [],
    options: { limit?: number; keyExtractor?: (item: T) => string } = {}
) {
    const { limit = 20, keyExtractor } = options;

    const [items, setItems] = useState<T[]>([]);
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isMountedRef = useRef(true);
    const isLoadingRef = useRef(false);

    const loadPage = useCallback(async (currentCursor: string | null, isRefresh: boolean) => {
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;

        if (isRefresh) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
            const result = await fetchFn(isRefresh ? null : currentCursor, limit);

            if (!isMountedRef.current) return;

            const newItems = result.items || [];

            if (isRefresh) {
                setItems(newItems);
            } else if (keyExtractor) {
                setItems(prev => {
                    const existingKeys = new Set(prev.map(keyExtractor));
                    const unique = newItems.filter(item => !existingKeys.has(keyExtractor(item)));
                    return [...prev, ...unique];
                });
            } else {
                setItems(prev => [...prev, ...newItems]);
            }

            setCursor(result.nextCursor);
            setHasMore(!!result.nextCursor);
        } catch (err: any) {
            if (isMountedRef.current) {
                setError(err?.message || 'Failed to load');
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
                setLoadingMore(false);
            }
            isLoadingRef.current = false;
        }
    }, [fetchFn, limit, keyExtractor]);

    const loadMore = useCallback(() => {
        if (hasMore && !loading && !loadingMore) {
            loadPage(cursor, false);
        }
    }, [hasMore, loading, loadingMore, cursor, loadPage]);

    const refresh = useCallback(() => {
        loadPage(null, true);
    }, [loadPage]);

    useEffect(() => {
        isMountedRef.current = true;
        loadPage(null, true);
        return () => { isMountedRef.current = false; };
    }, [...dependencies]);

    return {
        items,
        loading,
        loadingMore,
        hasMore,
        error,
        loadMore,
        refresh,
        isEmpty: !loading && items.length === 0,
    };
}

export default usePagination;
