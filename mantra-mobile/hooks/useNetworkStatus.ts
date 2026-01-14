/**
 * useNetworkStatus Hook
 * React hook for monitoring network connectivity
 */

import { useState, useEffect, useCallback } from 'react';
import { OfflineManager } from '../utils/offlineManager';

interface NetworkStatus {
    /** Whether device is connected to internet */
    isConnected: boolean;
    /** Whether currently online (alias for isConnected) */
    isOnline: boolean;
    /** Whether currently offline */
    isOffline: boolean;
}

/**
 * Hook to monitor network connectivity status
 * Updates automatically when connection changes
 */
export function useNetworkStatus(): NetworkStatus {
    const [isConnected, setIsConnected] = useState(OfflineManager.getIsConnected());

    useEffect(() => {
        // Subscribe to connection changes
        const unsubscribe = OfflineManager.addListener((connected) => {
            setIsConnected(connected);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return {
        isConnected,
        isOnline: isConnected,
        isOffline: !isConnected,
    };
}

/**
 * Hook that executes callback when network status changes
 */
export function useNetworkChange(
    onOnline?: () => void,
    onOffline?: () => void
): void {
    const [wasConnected, setWasConnected] = useState<boolean | null>(null);
    const { isConnected } = useNetworkStatus();

    useEffect(() => {
        if (wasConnected === null) {
            // First render, just record state
            setWasConnected(isConnected);
            return;
        }

        if (wasConnected !== isConnected) {
            if (isConnected && onOnline) {
                onOnline();
            } else if (!isConnected && onOffline) {
                onOffline();
            }
            setWasConnected(isConnected);
        }
    }, [isConnected, wasConnected, onOnline, onOffline]);
}

/**
 * Hook that wraps an async function with offline support
 * Queues the action if offline, executes when back online
 */
export function useOfflineAction<T extends (...args: any[]) => Promise<any>>(
    action: T,
    options: {
        endpoint: string;
        type: 'POST' | 'PUT' | 'DELETE';
        priority?: 'high' | 'normal' | 'low';
        onQueued?: () => void;
        onOffline?: () => void;
    }
): T {
    const { isConnected } = useNetworkStatus();

    const wrappedAction = useCallback(
        async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
            if (isConnected) {
                // Online - execute normally
                return action(...args);
            } else {
                // Offline - queue for later
                options.onOffline?.();

                await OfflineManager.queueRequest({
                    endpoint: options.endpoint,
                    type: options.type,
                    payload: args,
                    priority: options.priority || 'normal',
                });

                options.onQueued?.();
                return null;
            }
        },
        [action, isConnected, options]
    ) as T;

    return wrappedAction;
}

export default useNetworkStatus;
