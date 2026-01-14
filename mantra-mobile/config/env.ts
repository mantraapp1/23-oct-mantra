/**
 * Environment Configuration
 * Centralized environment-aware settings for production/development
 */

// Detect environment
const isDevelopment = __DEV__;
const isProduction = !__DEV__;

/**
 * App configuration based on environment
 */
export const ENV = {
    isDevelopment,
    isProduction,

    // API Configuration
    api: {
        /** Base URL for Supabase */
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
        /** Supabase anonymous key */
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
        /** Request timeout in ms */
        timeout: 30000,
        /** Max retries for failed requests */
        maxRetries: 3,
    },

    // Feature Flags
    features: {
        /** Enable analytics tracking */
        analytics: isProduction,
        /** Enable crash reporting */
        crashReporting: isProduction,
        /** Enable performance monitoring */
        performanceMonitoring: isProduction,
        /** Enable debug logging */
        debugLogging: isDevelopment,
        /** Enable network request logging */
        networkLogging: isDevelopment,
        /** Enable offline mode */
        offlineMode: true,
        /** Enable haptic feedback */
        haptics: true,
        /** Enable push notifications */
        pushNotifications: true,
    },

    // Cache Settings
    cache: {
        /** Memory cache TTL in ms */
        memoryTtl: 5 * 60 * 1000, // 5 minutes
        /** Persistent cache TTL in ms */
        persistentTtl: 24 * 60 * 60 * 1000, // 24 hours
        /** Max memory cache entries */
        maxMemoryEntries: 100,
        /** Max persistent cache entries */
        maxPersistentEntries: 500,
    },

    // Rate Limiting
    rateLimit: {
        /** Max requests per minute */
        requestsPerMinute: 60,
        /** Max login attempts per 5 minutes */
        loginAttemptsPerWindow: 5,
        /** Login window in ms */
        loginWindow: 5 * 60 * 1000,
    },

    // Pagination
    pagination: {
        /** Default page size */
        defaultPageSize: 20,
        /** Max page size */
        maxPageSize: 100,
        /** Prefetch threshold (0-1) */
        prefetchThreshold: 0.5,
    },

    // Timeouts
    timeouts: {
        /** Splash screen minimum duration */
        splash: isDevelopment ? 1000 : 2000,
        /** Toast auto-hide duration */
        toast: 3000,
        /** Alert auto-hide duration */
        alert: 5000,
        /** Debounce delay for search */
        searchDebounce: 300,
        /** Throttle delay for scroll events */
        scrollThrottle: 100,
    },

    // App Info
    app: {
        name: 'Mantra',
        version: '1.0.0',
        buildNumber: 1,
        bundleId: 'com.mantra.mobile',
        supportEmail: 'support@mantra.app',
        privacyUrl: 'https://mantra.app/privacy',
        termsUrl: 'https://mantra.app/terms',
    },

    // Limits
    limits: {
        /** Max image upload size in bytes */
        maxImageSize: 5 * 1024 * 1024, // 5MB
        /** Max description length */
        maxDescriptionLength: 5000,
        /** Max title length */
        maxTitleLength: 200,
        /** Max genres per novel */
        maxGenres: 3,
        /** Max tags per novel */
        maxTags: 10,
        /** Max chapters per query */
        maxChaptersPerQuery: 100,
    },
};

/**
 * Validate required environment variables
 */
export const validateEnv = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!ENV.api.supabaseUrl) {
        errors.push('EXPO_PUBLIC_SUPABASE_URL is required');
    }

    if (!ENV.api.supabaseAnonKey) {
        errors.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is required');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

/**
 * Log configuration (only in development)
 */
export const logConfig = (): void => {
    if (isDevelopment) {
        console.log('[ENV] Configuration loaded:', {
            environment: isDevelopment ? 'development' : 'production',
            features: ENV.features,
            supabaseConfigured: !!ENV.api.supabaseUrl,
        });
    }
};

export default ENV;
