/**
 * App Initialization
 * Run once at app startup to initialize all services
 */

import { OfflineManager } from '../utils/offlineManager';
import { Logger } from '../utils/logger';
import { validateEnv, logConfig } from './env';

/**
 * Initialize all app services
 * Call this once in App.tsx before rendering
 */
export const initializeApp = async (): Promise<void> => {
    const startTime = Date.now();

    try {
        // 1. Validate environment
        const envValidation = validateEnv();
        if (!envValidation.isValid) {
            Logger.error('App', 'Environment validation failed', envValidation.errors);
            // In production, you might want to show an error screen
        }

        // 2. Log configuration (dev only)
        logConfig();

        // 3. Initialize offline manager
        await OfflineManager.initialize();
        Logger.info('App', 'Offline manager initialized');

        // 4. Process any queued offline requests
        await OfflineManager.processQueue();

        // Log initialization time
        const duration = Date.now() - startTime;
        Logger.info('App', `App initialized in ${duration}ms`);

    } catch (error) {
        Logger.error('App', 'App initialization failed', error);
        throw error;
    }
};

/**
 * Cleanup app services
 * Call this when app is closing
 */
export const cleanupApp = (): void => {
    OfflineManager.cleanup();
    Logger.info('App', 'App cleanup complete');
};

export default {
    initialize: initializeApp,
    cleanup: cleanupApp,
};
