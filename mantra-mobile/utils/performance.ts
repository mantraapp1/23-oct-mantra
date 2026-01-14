/**
 * Performance Monitoring Utilities
 * Track and optimize app performance
 */

import { InteractionManager } from 'react-native';

// Types
interface PerformanceMetric {
    name: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
}

interface ScreenLoadMetric {
    screenName: string;
    loadTime: number;
    timestamp: number;
    isInitialLoad: boolean;
}

/**
 * Performance Monitor for tracking app metrics
 */
class PerformanceMonitor {
    private metrics: Map<string, PerformanceMetric> = new Map();
    private screenLoadTimes: ScreenLoadMetric[] = [];
    private maxStoredMetrics = 100;
    private enabled = __DEV__; // Only enabled in development by default

    /**
     * Enable/disable performance monitoring
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    /**
     * Start measuring a performance metric
     */
    startMeasure(name: string, metadata?: Record<string, any>): void {
        if (!this.enabled) return;

        this.metrics.set(name, {
            name,
            startTime: performance.now(),
            metadata,
        });
    }

    /**
     * End measuring a performance metric
     */
    endMeasure(name: string): number | null {
        if (!this.enabled) return null;

        const metric = this.metrics.get(name);
        if (!metric) {
            console.warn(`[Performance] No metric found for: ${name}`);
            return null;
        }

        const endTime = performance.now();
        const duration = endTime - metric.startTime;

        metric.endTime = endTime;
        metric.duration = duration;

        // Log slow operations
        if (duration > 100) {
            console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`, metric.metadata);
        }

        return duration;
    }

    /**
     * Measure an async operation
     */
    async measureAsync<T>(
        name: string,
        operation: () => Promise<T>,
        metadata?: Record<string, any>
    ): Promise<T> {
        this.startMeasure(name, metadata);
        try {
            const result = await operation();
            this.endMeasure(name);
            return result;
        } catch (error) {
            this.endMeasure(name);
            throw error;
        }
    }

    /**
     * Track screen load time
     */
    trackScreenLoad(
        screenName: string,
        loadTime: number,
        isInitialLoad: boolean = false
    ): void {
        if (!this.enabled) return;

        const metric: ScreenLoadMetric = {
            screenName,
            loadTime,
            timestamp: Date.now(),
            isInitialLoad,
        };

        this.screenLoadTimes.push(metric);

        // Trim old metrics
        if (this.screenLoadTimes.length > this.maxStoredMetrics) {
            this.screenLoadTimes = this.screenLoadTimes.slice(-this.maxStoredMetrics);
        }

        // Log slow screens
        if (loadTime > 500) {
            console.warn(`[Performance] Slow screen load: ${screenName} (${loadTime.toFixed(2)}ms)`);
        }
    }

    /**
     * Get average screen load time
     */
    getAverageScreenLoadTime(screenName?: string): number {
        const relevantMetrics = screenName
            ? this.screenLoadTimes.filter(m => m.screenName === screenName)
            : this.screenLoadTimes;

        if (relevantMetrics.length === 0) return 0;

        const total = relevantMetrics.reduce((sum, m) => sum + m.loadTime, 0);
        return total / relevantMetrics.length;
    }

    /**
     * Get all metrics summary
     */
    getSummary(): {
        totalMeasurements: number;
        screenLoadTimes: ScreenLoadMetric[];
        slowOperations: PerformanceMetric[];
    } {
        const slowOperations = Array.from(this.metrics.values()).filter(
            m => m.duration && m.duration > 100
        );

        return {
            totalMeasurements: this.metrics.size,
            screenLoadTimes: [...this.screenLoadTimes],
            slowOperations,
        };
    }

    /**
     * Clear all metrics
     */
    clear(): void {
        this.metrics.clear();
        this.screenLoadTimes = [];
    }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook for measuring component render time
 */
export const useRenderTime = (componentName: string) => {
    const startTime = performance.now();

    // Use InteractionManager to measure after render is complete
    InteractionManager.runAfterInteractions(() => {
        const duration = performance.now() - startTime;
        if (duration > 16) { // More than one frame (60fps)
            console.log(`[Performance] ${componentName} render: ${duration.toFixed(2)}ms`);
        }
    });
};

/**
 * Decorator for measuring function execution time
 */
export const measureTime = (name: string) => {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            return performanceMonitor.measureAsync(
                `${name}.${propertyKey}`,
                () => originalMethod.apply(this, args)
            );
        };

        return descriptor;
    };
};

/**
 * Run expensive operation after interactions
 */
export const runAfterInteractions = <T>(
    operation: () => T | Promise<T>
): Promise<T> => {
    return new Promise((resolve, reject) => {
        InteractionManager.runAfterInteractions(async () => {
            try {
                const result = await operation();
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    });
};

/**
 * Debounce expensive operations
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => func(...args), wait);
    };
};

/**
 * Throttle expensive operations
 */
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

export default {
    performanceMonitor,
    useRenderTime,
    measureTime,
    runAfterInteractions,
    debounce,
    throttle,
};
