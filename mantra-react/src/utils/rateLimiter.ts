/**
 * A simple in-memory rate limiter for frontend actions (e.g., login, signup).
 * Note: Frontend rate limiting is primarily for UX and deterring casual spam.
 * It does not replace robust backend rate limiting.
 */

interface RateLimitTracker {
    timestamps: number[];
}

const trackers: Record<string, RateLimitTracker> = {};

/**
 * Checks if an action should be rate limited and records the attempt.
 * 
 * @param actionKey - A unique identifier for the action (e.g., 'login-attempt', 'signup-attempt')
 * @param maxAttempts - The maximum number of allowed attempts within the time window
 * @param windowMs - The time window in milliseconds (e.g., 60000 for 1 minute)
 * @returns true if the action is allowed, false if rate limited
 */
export function checkRateLimit(actionKey: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();

    if (!trackers[actionKey]) {
        trackers[actionKey] = { timestamps: [] };
    }

    const tracker = trackers[actionKey];

    // Filter out timestamps outside the current window
    tracker.timestamps = tracker.timestamps.filter(timestamp => now - timestamp < windowMs);

    if (tracker.timestamps.length >= maxAttempts) {
        return false; // Rate limited
    }

    // Record this new attempt
    tracker.timestamps.push(now);
    return true; // Allowed
}

/**
 * Gets the remaining wait time in milliseconds before the next action is allowed.
 * Returns 0 if not currently rate limited.
 */
export function getRemainingWaitTimeMs(actionKey: string, maxAttempts: number, windowMs: number): number {
    const tracker = trackers[actionKey];
    if (!tracker || tracker.timestamps.length < maxAttempts) {
        return 0;
    }

    // Sort timestamps ascending (oldest first)
    const sortedTimestamps = [...tracker.timestamps].sort((a, b) => a - b);
    const oldestRelevantTimestamp = sortedTimestamps[0];

    const now = Date.now();
    const timeSinceOldest = now - oldestRelevantTimestamp;

    if (timeSinceOldest >= windowMs) {
        return 0;
    }

    return windowMs - timeSinceOldest;
}
