/**
 * Analytics Service
 * Track user events for product insights
 */

import ENV from './env';
import { Logger } from '../utils/logger';

// Event types
type EventCategory = 'navigation' | 'interaction' | 'content' | 'auth' | 'error' | 'performance';

interface AnalyticsEvent {
    name: string;
    category: EventCategory;
    properties?: Record<string, any>;
    timestamp: number;
}

interface UserProperties {
    userId?: string;
    isPremium?: boolean;
    accountAge?: number;
    preferredLanguage?: string;
    [key: string]: any;
}

/**
 * Analytics Service
 * Replace with actual service (Amplitude, Mixpanel, Firebase, etc.)
 */
class AnalyticsService {
    private isInitialized = false;
    private userProperties: UserProperties = {};
    private eventQueue: AnalyticsEvent[] = [];
    private flushInterval: ReturnType<typeof setInterval> | null = null;

    /**
     * Initialize analytics
     */
    async initialize(): Promise<void> {
        if (!ENV.features.analytics) {
            Logger.info('Analytics', 'Analytics disabled in development');
            return;
        }

        try {
            // TODO: Initialize actual analytics service
            // Example: await Analytics.init('YOUR_API_KEY');

            this.isInitialized = true;

            // Start periodic flush
            this.flushInterval = setInterval(() => this.flush(), 30000);

            Logger.info('Analytics', 'Analytics initialized');
        } catch (error) {
            Logger.error('Analytics', 'Failed to initialize analytics', error);
        }
    }

    /**
     * Cleanup
     */
    cleanup(): void {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
        this.flush();
    }

    /**
     * Identify user
     */
    identify(userId: string, properties?: UserProperties): void {
        this.userProperties = { userId, ...properties };

        if (this.isInitialized) {
            // TODO: Send to actual service
            // Analytics.identify(userId, properties);
            Logger.debug('Analytics', `User identified: ${userId}`);
        }
    }

    /**
     * Track event
     */
    track(
        name: string,
        category: EventCategory,
        properties?: Record<string, any>
    ): void {
        const event: AnalyticsEvent = {
            name,
            category,
            properties: {
                ...properties,
                ...this.userProperties,
            },
            timestamp: Date.now(),
        };

        this.eventQueue.push(event);

        if (this.isInitialized) {
            Logger.debug('Analytics', `Event tracked: ${name}`, properties);
        }

        // Flush if queue is getting large
        if (this.eventQueue.length >= 10) {
            this.flush();
        }
    }

    /**
     * Pre-built tracking methods
     */
    readonly events = {
        // Navigation
        screenView: (screenName: string) =>
            this.track(`view_${screenName}`, 'navigation', { screen: screenName }),

        // Content
        novelView: (novelId: string, title: string) =>
            this.track('novel_view', 'content', { novelId, title }),

        chapterRead: (novelId: string, chapterId: string, chapterNumber: number) =>
            this.track('chapter_read', 'content', { novelId, chapterId, chapterNumber }),

        searchPerformed: (query: string, resultsCount: number) =>
            this.track('search', 'content', { query, resultsCount }),

        // Interactions
        novelAddedToLibrary: (novelId: string) =>
            this.track('library_add', 'interaction', { novelId }),

        novelVoted: (novelId: string) =>
            this.track('novel_vote', 'interaction', { novelId }),

        reviewSubmitted: (novelId: string, rating: number) =>
            this.track('review_submit', 'interaction', { novelId, rating }),

        shareContent: (contentType: string, contentId: string) =>
            this.track('share', 'interaction', { contentType, contentId }),

        // Auth
        login: (method: string) =>
            this.track('login', 'auth', { method }),

        signup: (method: string) =>
            this.track('signup', 'auth', { method }),

        logout: () =>
            this.track('logout', 'auth'),

        // Errors
        error: (errorType: string, message: string) =>
            this.track('error', 'error', { errorType, message }),

        // Performance
        screenLoadTime: (screenName: string, loadTimeMs: number) =>
            this.track('screen_load', 'performance', { screenName, loadTimeMs }),
    };

    /**
     * Flush event queue
     */
    private async flush(): Promise<void> {
        if (this.eventQueue.length === 0) return;

        const events = [...this.eventQueue];
        this.eventQueue = [];

        if (this.isInitialized) {
            try {
                // TODO: Send to actual service
                // await Analytics.trackBatch(events);
                Logger.debug('Analytics', `Flushed ${events.length} events`);
            } catch (error) {
                // Put events back in queue
                this.eventQueue = [...events, ...this.eventQueue];
                Logger.error('Analytics', 'Failed to flush events', error);
            }
        }
    }
}

// Export singleton
export const analytics = new AnalyticsService();
export default analytics;
