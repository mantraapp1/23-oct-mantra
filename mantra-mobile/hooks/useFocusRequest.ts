/**
 * useFocusRequest Hook
 * Ensures API requests ONLY fire when screen is focused
 * Prevents unwanted requests for screens user isn't viewing
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

interface UseFocusRequestOptions {
    /** Only load once per session (won't reload on refocus) */
    loadOnce?: boolean;
    /** Callback when screen loses focus */
    onBlur?: () => void;
}

interface UseFocusRequestResult<T> {
    /** Current data */
    data: T | null;
    /** Loading state */
    loading: boolean;
    /** Error message if any */
    error: string | null;
    /** Manually refresh data */
    refresh: () => Promise<void>;
    /** Whether screen has ever been focused */
    hasBeenFocused: boolean;
    /** Current focus state */
    isFocused: boolean;
}

/**
 * Hook that only loads data when screen is focused
 * Prevents API calls for screens user isn't viewing
 * 
 * @param fetchFn - Async function to fetch data (only called when focused)
 * @param dependencies - Array of deps that trigger refetch when changed
 * @param options - Configuration options
 */
export function useFocusRequest<T>(
    fetchFn: () => Promise<T>,
    dependencies: any[] = [],
    options: UseFocusRequestOptions = {}
): UseFocusRequestResult<T> {
    const { loadOnce = false, onBlur } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasBeenFocused, setHasBeenFocused] = useState(false);

    const isFocused = useIsFocused();
    const hasLoadedRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Load data function
    const loadData = useCallback(async () => {
        // Skip if loadOnce is true and we've already loaded
        if (loadOnce && hasLoadedRef.current) {
            return;
        }

        // Cancel any in-flight request
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        setLoading(true);
        setError(null);

        try {
            const result = await fetchFn();
            // Only update state if not aborted
            if (!abortControllerRef.current?.signal.aborted) {
                setData(result);
                hasLoadedRef.current = true;
            }
        } catch (err: any) {
            if (!abortControllerRef.current?.signal.aborted) {
                const errorMessage = err?.message || 'Failed to load data';
                setError(errorMessage);
                console.error('[useFocusRequest] Error:', errorMessage);
            }
        } finally {
            if (!abortControllerRef.current?.signal.aborted) {
                setLoading(false);
            }
        }
    }, [fetchFn, loadOnce]);

    // Refresh function (always reloads)
    const refresh = useCallback(async () => {
        hasLoadedRef.current = false;
        await loadData();
    }, [loadData]);

    // Focus effect - ONLY load when screen is focused
    useFocusEffect(
        useCallback(() => {
            console.log('[useFocusRequest] Screen focused - loading data');
            setHasBeenFocused(true);
            loadData();

            return () => {
                // Cancel request when losing focus
                console.log('[useFocusRequest] Screen blurred - cancelling requests');
                abortControllerRef.current?.abort();
                onBlur?.();
            };
        }, [...dependencies, loadData])
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    return {
        data,
        loading,
        error,
        refresh,
        hasBeenFocused,
        isFocused,
    };
}

/**
 * Hook that delays mounting until screen is focused
 * Use for heavy components that shouldn't render until visible
 */
export function useLazyMount(): boolean {
    const [shouldMount, setShouldMount] = useState(false);
    const isFocused = useIsFocused();

    useFocusEffect(
        useCallback(() => {
            if (!shouldMount) {
                setShouldMount(true);
            }
        }, [shouldMount])
    );

    return shouldMount;
}

/**
 * Hook to track if this is the first render after focus
 * Useful for deciding between full load vs refresh
 */
export function useIsFirstFocus(): boolean {
    const isFirstRef = useRef(true);

    useFocusEffect(
        useCallback(() => {
            // Will be true on first focus, false on subsequent
            const isFirst = isFirstRef.current;
            isFirstRef.current = false;
            return () => { };
        }, [])
    );

    return isFirstRef.current;
}

export default useFocusRequest;
