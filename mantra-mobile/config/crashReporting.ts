/**
 * Crash Reporting Service
 * Centralized error/crash reporting for production monitoring
 */

import { Logger } from '../utils/logger';
import ENV from './env';

// Types
interface CrashContext {
    userId?: string;
    screen?: string;
    action?: string;
    metadata?: Record<string, any>;
}

interface ErrorReport {
    error: Error;
    context: CrashContext;
    timestamp: string;
    appVersion: string;
    platform: string;
}

/**
 * Crash Reporting Service
 * Replace with actual service (Sentry, Crashlytics, etc.) in production
 */
class CrashReporter {
    private isInitialized = false;
    private userId: string | null = null;
    private pendingReports: ErrorReport[] = [];

    /**
     * Initialize crash reporting
     * Call this once at app startup
     */
    async initialize(): Promise<void> {
        if (!ENV.features.crashReporting) {
            Logger.info('CrashReporter', 'Crash reporting disabled in development');
            return;
        }

        try {
            // TODO: Initialize actual crash reporting service
            // Example with Sentry:
            // Sentry.init({
            //   dsn: 'YOUR_SENTRY_DSN',
            //   enableAutoSessionTracking: true,
            // });

            this.isInitialized = true;
            Logger.info('CrashReporter', 'Crash reporting initialized');

            // Send any pending reports
            await this.flushPendingReports();
        } catch (error) {
            Logger.error('CrashReporter', 'Failed to initialize crash reporting', error);
        }
    }

    /**
     * Set user for crash context
     */
    setUser(userId: string | null, metadata?: Record<string, any>): void {
        this.userId = userId;

        if (ENV.features.crashReporting && this.isInitialized) {
            // TODO: Set user in actual service
            // Sentry.setUser({ id: userId, ...metadata });
        }
    }

    /**
     * Report a non-fatal error
     */
    captureError(error: Error, context?: Partial<CrashContext>): void {
        const report = this.createReport(error, context);

        Logger.error('CrashReporter', `Error captured: ${error.message}`, {
            stack: error.stack,
            context,
        });

        if (ENV.features.crashReporting && this.isInitialized) {
            // TODO: Send to actual service
            // Sentry.captureException(error, { extra: context });
            this.sendReport(report);
        } else {
            this.pendingReports.push(report);
        }
    }

    /**
     * Report a fatal crash
     */
    captureFatalError(error: Error, context?: Partial<CrashContext>): void {
        const report = this.createReport(error, context);
        report.context.metadata = { ...report.context.metadata, fatal: true };

        Logger.error('CrashReporter', `FATAL: ${error.message}`, {
            stack: error.stack,
            context,
        });

        if (ENV.features.crashReporting && this.isInitialized) {
            // TODO: Send to actual service with fatal flag
            // Sentry.captureException(error, { level: 'fatal', extra: context });
            this.sendReport(report);
        }
    }

    /**
     * Add breadcrumb for debugging
     */
    addBreadcrumb(
        category: string,
        message: string,
        data?: Record<string, any>
    ): void {
        if (ENV.features.crashReporting && this.isInitialized) {
            // TODO: Add to actual service
            // Sentry.addBreadcrumb({ category, message, data });
        }

        Logger.debug('CrashReporter', `[${category}] ${message}`, data);
    }

    /**
     * Set current screen for context
     */
    setScreen(screenName: string): void {
        this.addBreadcrumb('navigation', `Viewed ${screenName}`);

        if (ENV.features.crashReporting && this.isInitialized) {
            // TODO: Set in actual service
            // Sentry.setTag('screen', screenName);
        }
    }

    /**
     * Create error report
     */
    private createReport(error: Error, context?: Partial<CrashContext>): ErrorReport {
        return {
            error,
            context: {
                userId: this.userId || undefined,
                ...context,
            },
            timestamp: new Date().toISOString(),
            appVersion: ENV.app.version,
            platform: 'react-native',
        };
    }

    /**
     * Send report to service
     */
    private async sendReport(report: ErrorReport): Promise<void> {
        // Placeholder for actual implementation
        Logger.debug('CrashReporter', 'Report would be sent:', report);
    }

    /**
     * Flush pending reports
     */
    private async flushPendingReports(): Promise<void> {
        if (this.pendingReports.length === 0) return;

        for (const report of this.pendingReports) {
            await this.sendReport(report);
        }

        this.pendingReports = [];
        Logger.info('CrashReporter', `Flushed ${this.pendingReports.length} pending reports`);
    }
}

// Export singleton
export const crashReporter = new CrashReporter();
export default crashReporter;
