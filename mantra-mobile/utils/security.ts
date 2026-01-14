/**
 * Security Utilities
 * Input sanitization, XSS prevention, and secure storage helpers
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// Sensitive data keys that should be encrypted
const SENSITIVE_KEYS = ['auth_token', 'refresh_token', 'user_credentials'];

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
    if (!input || typeof input !== 'string') return '';

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
    isValid: boolean;
    errors: string[];
} => {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain an uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain a lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain a number');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Validate username
 */
export const validateUsername = (username: string): {
    isValid: boolean;
    error?: string;
} => {
    if (!username || username.length < 3) {
        return { isValid: false, error: 'Username must be at least 3 characters' };
    }
    if (username.length > 20) {
        return { isValid: false, error: 'Username must be less than 20 characters' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { isValid: false, error: 'Username can only contain letters, numbers, and underscores' };
    }
    return { isValid: true };
};

/**
 * Generate a secure random string
 */
export const generateSecureId = async (length: number = 32): Promise<string> => {
    try {
        const randomBytes = await Crypto.getRandomBytesAsync(length);
        return Array.from(randomBytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
            .slice(0, length);
    } catch {
        // Fallback if crypto not available
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
};

/**
 * Hash sensitive data
 */
export const hashData = async (data: string): Promise<string> => {
    try {
        return await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            data
        );
    } catch {
        // Basic fallback (not secure, just for compatibility)
        return btoa(data);
    }
};

/**
 * Secure storage wrapper with obfuscation for sensitive data
 * 
 * SECURITY WARNING: This uses Base64 encoding which is NOT encryption.
 * Base64 is easily reversible and provides no security against anyone
 * with access to the storage. For truly sensitive data (API keys, tokens),
 * consider using expo-secure-store or platform-specific secure storage.
 * 
 * This is primarily useful for:
 * - Preventing casual inspection of data
 * - Adding a layer of obfuscation
 * 
 * NOT suitable for:
 * - Storing passwords, API keys, or truly sensitive credentials
 * - Protecting against malicious access
 */
export const SecureStorage = {
    /**
     * Store data securely
     */
    async setItem(key: string, value: string): Promise<void> {
        const isSensitive = SENSITIVE_KEYS.some(sk => key.includes(sk));

        if (isSensitive) {
            // For sensitive data, hash the key and encode the value
            const hashedKey = await hashData(key);
            await AsyncStorage.setItem(`@secure:${hashedKey}`, btoa(value));
        } else {
            await AsyncStorage.setItem(key, value);
        }
    },

    /**
     * Retrieve data securely
     */
    async getItem(key: string): Promise<string | null> {
        const isSensitive = SENSITIVE_KEYS.some(sk => key.includes(sk));

        if (isSensitive) {
            const hashedKey = await hashData(key);
            const encoded = await AsyncStorage.getItem(`@secure:${hashedKey}`);
            return encoded ? atob(encoded) : null;
        }

        return AsyncStorage.getItem(key);
    },

    /**
     * Remove data securely
     */
    async removeItem(key: string): Promise<void> {
        const isSensitive = SENSITIVE_KEYS.some(sk => key.includes(sk));

        if (isSensitive) {
            const hashedKey = await hashData(key);
            await AsyncStorage.removeItem(`@secure:${hashedKey}`);
        } else {
            await AsyncStorage.removeItem(key);
        }
    },

    /**
     * Clear all secure storage
     */
    async clear(): Promise<void> {
        await AsyncStorage.clear();
    },
};

/**
 * Rate limit tracker for client-side protection
 */
export class RateLimitTracker {
    private attempts: Map<string, number[]> = new Map();
    private maxAttempts: number;
    private windowMs: number;

    constructor(maxAttempts: number = 5, windowMs: number = 60000) {
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }

    /**
     * Check if action is allowed
     */
    isAllowed(action: string): boolean {
        const now = Date.now();
        const attempts = this.attempts.get(action) || [];

        // Filter out old attempts
        const recentAttempts = attempts.filter(t => now - t < this.windowMs);

        if (recentAttempts.length >= this.maxAttempts) {
            return false;
        }

        recentAttempts.push(now);
        this.attempts.set(action, recentAttempts);
        return true;
    }

    /**
     * Get remaining attempts
     */
    getRemainingAttempts(action: string): number {
        const now = Date.now();
        const attempts = this.attempts.get(action) || [];
        const recentAttempts = attempts.filter(t => now - t < this.windowMs);
        return Math.max(0, this.maxAttempts - recentAttempts.length);
    }

    /**
     * Get time until reset
     */
    getTimeUntilReset(action: string): number {
        const attempts = this.attempts.get(action) || [];
        if (attempts.length === 0) return 0;

        const oldestAttempt = Math.min(...attempts);
        const resetTime = oldestAttempt + this.windowMs;
        return Math.max(0, resetTime - Date.now());
    }

    /**
     * Reset attempts for an action
     */
    reset(action: string): void {
        this.attempts.delete(action);
    }
}

// Login rate limiter instance
export const loginRateLimiter = new RateLimitTracker(5, 5 * 60 * 1000); // 5 attempts per 5 minutes

export default {
    sanitizeInput,
    isValidEmail,
    validatePassword,
    validateUsername,
    generateSecureId,
    hashData,
    SecureStorage,
    RateLimitTracker,
    loginRateLimiter,
};
