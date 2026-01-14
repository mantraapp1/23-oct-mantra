/**
 * API Request Manager
 * Prevents excessive/unwanted API requests through:
 * - Request deduplication (same request only runs once)
 * - Response caching (avoid re-fetching fresh data)
 * - Rate limiting (prevent API abuse)
 * - Request cancellation on navigation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

interface PendingRequest<T> {
    promise: Promise<T>;
    abortController: AbortController;
}

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

// Configuration
const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_RATE_LIMIT = 30; // requests per window
const DEFAULT_RATE_WINDOW = 60 * 1000; // 1 minute
const CACHE_PREFIX = '@api_cache:';

/**
 * In-memory cache for API responses
 */
class MemoryCache {
    private cache = new Map<string, CacheEntry<any>>();
    private maxSize = 100; // Max cached items

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Check expiration
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    set<T>(key: string, data: T, ttl: number = DEFAULT_CACHE_TTL): void {
        // Enforce max size (LRU eviction)
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        const now = Date.now();
        this.cache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + ttl,
        });
    }

    invalidate(keyPattern: string): void {
        for (const key of this.cache.keys()) {
            if (key.includes(keyPattern)) {
                this.cache.delete(key);
            }
        }
    }

    clear(): void {
        this.cache.clear();
    }

    getAge(key: string): number | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        return Date.now() - entry.timestamp;
    }
}

/**
 * Request deduplication - prevents same request from running multiple times
 */
class RequestDeduplicator {
    private pendingRequests = new Map<string, PendingRequest<any>>();

    async execute<T>(
        key: string,
        requestFn: (signal: AbortSignal) => Promise<T>
    ): Promise<T> {
        // If already pending, return existing promise
        const pending = this.pendingRequests.get(key);
        if (pending) {
            console.log(`[Dedup] Reusing pending request: ${key}`);
            return pending.promise;
        }

        // Create new request
        const abortController = new AbortController();
        const promise = requestFn(abortController.signal).finally(() => {
            this.pendingRequests.delete(key);
        });

        this.pendingRequests.set(key, { promise, abortController });
        return promise;
    }

    cancel(key: string): void {
        const pending = this.pendingRequests.get(key);
        if (pending) {
            pending.abortController.abort();
            this.pendingRequests.delete(key);
        }
    }

    cancelAll(): void {
        for (const [key, pending] of this.pendingRequests) {
            pending.abortController.abort();
        }
        this.pendingRequests.clear();
    }
}

/**
 * Rate limiter - prevents API abuse
 */
class RateLimiter {
    private limits = new Map<string, RateLimitEntry>();
    private maxRequests: number;
    private windowMs: number;

    constructor(maxRequests = DEFAULT_RATE_LIMIT, windowMs = DEFAULT_RATE_WINDOW) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    async checkLimit(endpoint: string): Promise<boolean> {
        const now = Date.now();
        let entry = this.limits.get(endpoint);

        // Reset if window expired
        if (!entry || now - entry.windowStart > this.windowMs) {
            entry = { count: 0, windowStart: now };
        }

        // Check limit
        if (entry.count >= this.maxRequests) {
            console.warn(`[RateLimit] Limit exceeded for: ${endpoint}`);
            return false;
        }

        // Increment and save
        entry.count++;
        this.limits.set(endpoint, entry);
        return true;
    }

    getRemainingRequests(endpoint: string): number {
        const entry = this.limits.get(endpoint);
        if (!entry) return this.maxRequests;
        return Math.max(0, this.maxRequests - entry.count);
    }

    reset(endpoint: string): void {
        this.limits.delete(endpoint);
    }
}

/**
 * Persistent cache using AsyncStorage
 */
class PersistentCache {
    async get<T>(key: string): Promise<T | null> {
        try {
            const stored = await AsyncStorage.getItem(CACHE_PREFIX + key);
            if (!stored) return null;

            const entry: CacheEntry<T> = JSON.parse(stored);

            // Check expiration
            if (Date.now() > entry.expiresAt) {
                await AsyncStorage.removeItem(CACHE_PREFIX + key);
                return null;
            }

            return entry.data;
        } catch (error) {
            console.error('[PersistentCache] Get error:', error);
            return null;
        }
    }

    async set<T>(key: string, data: T, ttl: number = DEFAULT_CACHE_TTL): Promise<void> {
        try {
            const now = Date.now();
            const entry: CacheEntry<T> = {
                data,
                timestamp: now,
                expiresAt: now + ttl,
            };
            await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
        } catch (error) {
            console.error('[PersistentCache] Set error:', error);
        }
    }

    async invalidate(keyPattern: string): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const matchingKeys = keys.filter(k => k.startsWith(CACHE_PREFIX) && k.includes(keyPattern));
            if (matchingKeys.length > 0) {
                await AsyncStorage.multiRemove(matchingKeys);
            }
        } catch (error) {
            console.error('[PersistentCache] Invalidate error:', error);
        }
    }

    async clear(): Promise<void> {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
            if (cacheKeys.length > 0) {
                await AsyncStorage.multiRemove(cacheKeys);
            }
        } catch (error) {
            console.error('[PersistentCache] Clear error:', error);
        }
    }
}

// Singleton instances
const memoryCache = new MemoryCache();
const deduplicator = new RequestDeduplicator();
const rateLimiter = new RateLimiter();
const persistentCache = new PersistentCache();

/**
 * Main API Request Manager
 */
export const ApiRequestManager = {
    /**
     * Execute a cached API request
     * @param key Unique cache key for this request
     * @param requestFn The actual fetch function
     * @param options Configuration options
     */
    async fetch<T>(
        key: string,
        requestFn: (signal: AbortSignal) => Promise<T>,
        options: {
            cacheTtl?: number;
            skipCache?: boolean;
            persist?: boolean;
            rateLimitEndpoint?: string;
        } = {}
    ): Promise<T> {
        const {
            cacheTtl = DEFAULT_CACHE_TTL,
            skipCache = false,
            persist = false,
            rateLimitEndpoint,
        } = options;

        // Check rate limit if specified
        if (rateLimitEndpoint) {
            const allowed = await rateLimiter.checkLimit(rateLimitEndpoint);
            if (!allowed) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }
        }

        // Check memory cache first
        if (!skipCache) {
            const cached = memoryCache.get<T>(key);
            if (cached !== null) {
                console.log(`[Cache] Memory hit: ${key}`);
                return cached;
            }

            // Check persistent cache if enabled
            if (persist) {
                const persisted = await persistentCache.get<T>(key);
                if (persisted !== null) {
                    console.log(`[Cache] Persistent hit: ${key}`);
                    // Also store in memory for faster access
                    memoryCache.set(key, persisted, cacheTtl);
                    return persisted;
                }
            }
        }

        // Execute with deduplication
        const result = await deduplicator.execute(key, requestFn);

        // Cache the result
        memoryCache.set(key, result, cacheTtl);
        if (persist) {
            await persistentCache.set(key, result, cacheTtl);
        }

        return result;
    },

    /**
     * Invalidate cache entries matching a pattern
     */
    invalidate: async (keyPattern: string): Promise<void> => {
        memoryCache.invalidate(keyPattern);
        await persistentCache.invalidate(keyPattern);
    },

    /**
     * Clear all caches
     */
    clearAll: async (): Promise<void> => {
        memoryCache.clear();
        deduplicator.cancelAll();
        await persistentCache.clear();
    },

    /**
     * Cancel a specific pending request
     */
    cancelRequest: (key: string): void => {
        deduplicator.cancel(key);
    },

    /**
     * Cancel all pending requests (useful on logout or screen unmount)
     */
    cancelAllRequests: (): void => {
        deduplicator.cancelAll();
    },

    /**
     * Check if data is cached and how fresh it is
     */
    getCacheAge: (key: string): number | null => {
        return memoryCache.getAge(key);
    },

    /**
     * Pre-fetch data into cache
     */
    prefetch: async <T>(
        key: string,
        requestFn: (signal: AbortSignal) => Promise<T>,
        options?: { cacheTtl?: number; persist?: boolean }
    ): Promise<void> => {
        try {
            await ApiRequestManager.fetch(key, requestFn, options);
        } catch (error) {
            // Prefetch failures are silent
            console.log(`[Prefetch] Failed for ${key}:`, error);
        }
    },

    /**
     * Get remaining rate limit for an endpoint
     */
    getRemainingRateLimit: (endpoint: string): number => {
        return rateLimiter.getRemainingRequests(endpoint);
    },
};

// Export for direct access
export { memoryCache, deduplicator, rateLimiter, persistentCache };
export default ApiRequestManager;
