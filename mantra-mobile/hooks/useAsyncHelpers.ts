import { useRef, useEffect, useCallback, useState } from 'react';

/**
 * Hook for managing cancellable async operations
 * Prevents memory leaks from setting state on unmounted components
 */
export const useCancellableRequest = () => {
    const abortControllerRef = useRef<AbortController | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            abortControllerRef.current?.abort();
        };
    }, []);

    /**
     * Execute a cancellable async function
     * @param fn - Async function that receives an AbortSignal
     * @returns Promise that resolves with the function result or rejects if aborted
     */
    const execute = useCallback(async <T>(
        fn: (signal: AbortSignal) => Promise<T>
    ): Promise<T> => {
        // Cancel any in-flight request
        abortControllerRef.current?.abort();
        abortControllerRef.current = new AbortController();

        return fn(abortControllerRef.current.signal);
    }, []);

    /**
     * Check if component is still mounted
     * Use this before setting state after async operations
     */
    const isMounted = useCallback(() => isMountedRef.current, []);

    /**
     * Cancel the current request
     */
    const cancel = useCallback(() => {
        abortControllerRef.current?.abort();
    }, []);

    return { execute, isMounted, cancel };
};

/**
 * Hook for debouncing values
 * Useful for search inputs, avoiding too many API calls
 */
export const useDebounce = <T>(value: T, delay: number = 300): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Hook for throttling function calls
 * Ensures a function is called at most once per specified interval
 */
export const useThrottle = <T extends (...args: any[]) => any>(
    fn: T,
    delay: number = 300
): T => {
    const lastCallRef = useRef<number>(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return useCallback(
        ((...args: Parameters<T>) => {
            const now = Date.now();
            const timeSinceLastCall = now - lastCallRef.current;

            if (timeSinceLastCall >= delay) {
                lastCallRef.current = now;
                return fn(...args);
            } else {
                // Schedule for later
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
                timeoutRef.current = setTimeout(() => {
                    lastCallRef.current = Date.now();
                    fn(...args);
                }, delay - timeSinceLastCall);
            }
        }) as T,
        [fn, delay]
    );
};

/**
 * Hook for managing loading states with minimum display time
 * Prevents flash of loading state for quick operations
 */
export const useLoadingState = (minimumLoadingTime: number = 300) => {
    const [isLoading, setIsLoading] = useState(false);
    const loadingStartRef = useRef<number | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const startLoading = useCallback(() => {
        loadingStartRef.current = Date.now();
        setIsLoading(true);
    }, []);

    const stopLoading = useCallback(() => {
        if (!loadingStartRef.current) {
            setIsLoading(false);
            return;
        }

        const elapsed = Date.now() - loadingStartRef.current;
        const remaining = minimumLoadingTime - elapsed;

        if (remaining <= 0) {
            setIsLoading(false);
        } else {
            // Ensure loading shows for minimum time
            timeoutRef.current = setTimeout(() => {
                setIsLoading(false);
            }, remaining);
        }
    }, [minimumLoadingTime]);

    return { isLoading, startLoading, stopLoading };
};

/**
 * Hook for safe async state updates
 * Only updates state if component is still mounted
 */
export const useSafeState = <T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void] => {
    const [state, setState] = useState<T>(initialValue);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const setSafeState = useCallback((value: T | ((prev: T) => T)) => {
        if (isMountedRef.current) {
            setState(value);
        }
    }, []);

    return [state, setSafeState];
};
