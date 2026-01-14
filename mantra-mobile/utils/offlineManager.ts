/**
 * Offline Manager
 * Handles offline detection, request queueing, and graceful degradation
 */

import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const OFFLINE_QUEUE_KEY = '@offline_queue';
const MAX_QUEUE_SIZE = 50;
const MAX_RETRY_ATTEMPTS = 3;

// Types
interface QueuedRequest {
    id: string;
    type: 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    payload: any;
    timestamp: number;
    retryCount: number;
    priority: 'high' | 'normal' | 'low';
}

type ConnectionCallback = (isConnected: boolean) => void;

/**
 * Offline Manager Singleton
 * Monitors network state and manages offline request queue
 */
class OfflineManagerClass {
    private isConnected: boolean = true;
    private subscription: NetInfoSubscription | null = null;
    private listeners: Set<ConnectionCallback> = new Set();
    private isProcessingQueue: boolean = false;

    /**
     * Initialize the offline manager
     * Call this once at app startup
     */
    async initialize(): Promise<void> {
        // Get initial state
        const state = await NetInfo.fetch();
        this.isConnected = state.isConnected ?? true;
        console.log('[OfflineManager] Initialized, connected:', this.isConnected);

        // Subscribe to changes
        this.subscription = NetInfo.addEventListener(this.handleConnectionChange);
    }

    /**
     * Cleanup subscriptions
     */
    cleanup(): void {
        if (this.subscription) {
            this.subscription();
            this.subscription = null;
        }
        this.listeners.clear();
    }

    /**
     * Handle connection state changes
     */
    private handleConnectionChange = (state: NetInfoState): void => {
        const wasConnected = this.isConnected;
        this.isConnected = state.isConnected ?? false;

        console.log('[OfflineManager] Connection changed:', {
            wasConnected,
            isConnected: this.isConnected,
            type: state.type,
        });

        // Notify listeners
        this.listeners.forEach(callback => {
            try {
                callback(this.isConnected);
            } catch (error) {
                console.error('[OfflineManager] Listener error:', error);
            }
        });

        // Process queue when coming back online
        if (!wasConnected && this.isConnected) {
            console.log('[OfflineManager] Back online - processing queue');
            this.processQueue();
        }
    };

    /**
     * Check if currently online
     */
    getIsConnected(): boolean {
        return this.isConnected;
    }

    /**
     * Subscribe to connection changes
     */
    addListener(callback: ConnectionCallback): () => void {
        this.listeners.add(callback);
        // Immediately call with current state
        callback(this.isConnected);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(callback);
        };
    }

    /**
     * Queue a request for later execution when offline
     */
    async queueRequest(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
        const queue = await this.getQueue();

        // Enforce max queue size
        if (queue.length >= MAX_QUEUE_SIZE) {
            // Remove oldest low-priority items first
            const lowPriorityIndex = queue.findIndex(r => r.priority === 'low');
            if (lowPriorityIndex !== -1) {
                queue.splice(lowPriorityIndex, 1);
            } else {
                queue.shift(); // Remove oldest
            }
        }

        const queuedRequest: QueuedRequest = {
            ...request,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            retryCount: 0,
        };

        queue.push(queuedRequest);
        await this.saveQueue(queue);

        console.log('[OfflineManager] Request queued:', queuedRequest.id);
        return queuedRequest.id;
    }

    /**
     * Get the current queue
     */
    async getQueue(): Promise<QueuedRequest[]> {
        try {
            const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('[OfflineManager] Error getting queue:', error);
            return [];
        }
    }

    /**
     * Save the queue
     */
    private async saveQueue(queue: QueuedRequest[]): Promise<void> {
        try {
            await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        } catch (error) {
            console.error('[OfflineManager] Error saving queue:', error);
        }
    }

    /**
     * Process queued requests when back online
     */
    async processQueue(): Promise<void> {
        if (this.isProcessingQueue || !this.isConnected) {
            return;
        }

        this.isProcessingQueue = true;
        console.log('[OfflineManager] Processing queue...');

        try {
            const queue = await this.getQueue();
            if (queue.length === 0) {
                console.log('[OfflineManager] Queue is empty');
                return;
            }

            // Sort by priority (high first) then by timestamp (oldest first)
            queue.sort((a, b) => {
                const priorityOrder = { high: 0, normal: 1, low: 2 };
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                return a.timestamp - b.timestamp;
            });

            const failedRequests: QueuedRequest[] = [];

            for (const request of queue) {
                if (!this.isConnected) {
                    // Lost connection during processing
                    failedRequests.push(request);
                    continue;
                }

                try {
                    // Execute the request (you would implement actual API call here)
                    await this.executeRequest(request);
                    console.log('[OfflineManager] Request processed:', request.id);
                } catch (error) {
                    console.error('[OfflineManager] Request failed:', request.id, error);

                    request.retryCount++;
                    if (request.retryCount < MAX_RETRY_ATTEMPTS) {
                        failedRequests.push(request);
                    } else {
                        console.warn('[OfflineManager] Request exceeded max retries:', request.id);
                    }
                }
            }

            // Save remaining failed requests
            await this.saveQueue(failedRequests);
            console.log('[OfflineManager] Queue processing complete, remaining:', failedRequests.length);

        } finally {
            this.isProcessingQueue = false;
        }
    }

    /**
     * Execute a queued request
     * Override this in your implementation
     */
    private async executeRequest(request: QueuedRequest): Promise<void> {
        // This is a placeholder - implement actual API calls based on your needs
        console.log('[OfflineManager] Executing request:', request.endpoint, request.type);

        // Example implementation:
        // const response = await fetch(request.endpoint, {
        //   method: request.type,
        //   body: JSON.stringify(request.payload),
        // });
        // if (!response.ok) throw new Error('Request failed');
    }

    /**
     * Clear the queue
     */
    async clearQueue(): Promise<void> {
        await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
        console.log('[OfflineManager] Queue cleared');
    }

    /**
     * Get queue size
     */
    async getQueueSize(): Promise<number> {
        const queue = await this.getQueue();
        return queue.length;
    }
}

// Export singleton instance
export const OfflineManager = new OfflineManagerClass();
export default OfflineManager;
