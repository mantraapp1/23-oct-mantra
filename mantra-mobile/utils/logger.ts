/**
 * Application Logger
 * Centralized logging with levels, formatting, and optional remote reporting
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    tag: string;
    message: string;
    data?: any;
    stackTrace?: string;
}

interface LoggerConfig {
    /** Minimum level to log (debug < info < warn < error) */
    minLevel: LogLevel;
    /** Whether to log to console */
    consoleEnabled: boolean;
    /** Whether to persist logs to storage */
    persistEnabled: boolean;
    /** Max number of logs to persist */
    maxPersistedLogs: number;
    /** Whether to send errors to remote service */
    remoteEnabled: boolean;
    /** Remote endpoint for error reporting */
    remoteEndpoint?: string;
}

// Constants
const LOG_STORAGE_KEY = '@app_logs';
const LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// Default config (adjust for production vs development)
const DEFAULT_CONFIG: LoggerConfig = {
    minLevel: __DEV__ ? 'debug' : 'warn',
    consoleEnabled: __DEV__,
    persistEnabled: true,
    maxPersistedLogs: 100,
    remoteEnabled: !__DEV__,
};

/**
 * Logger class for centralized logging
 */
class AppLogger {
    private config: LoggerConfig;
    private sessionLogs: LogEntry[] = [];

    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Update logger configuration
     */
    configure(config: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Core logging function
     */
    private async log(level: LogLevel, tag: string, message: string, data?: any): Promise<void> {
        // Check if level meets minimum threshold
        if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[this.config.minLevel]) {
            return;
        }

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            tag,
            message,
            data: data ? this.sanitizeData(data) : undefined,
        };

        // Add stack trace for errors
        if (level === 'error' && data instanceof Error) {
            entry.stackTrace = data.stack;
        }

        // Console logging
        if (this.config.consoleEnabled) {
            this.logToConsole(entry);
        }

        // Session log
        this.sessionLogs.push(entry);

        // Persist log
        if (this.config.persistEnabled) {
            await this.persistLog(entry);
        }

        // Remote reporting for errors
        if (this.config.remoteEnabled && level === 'error') {
            this.sendToRemote(entry);
        }
    }

    /**
     * Sanitize data for logging (remove sensitive info, circular refs)
     */
    private sanitizeData(data: any): any {
        try {
            // Handle Error objects
            if (data instanceof Error) {
                return {
                    name: data.name,
                    message: data.message,
                    stack: data.stack,
                };
            }

            // Simple JSON serialization check
            const serialized = JSON.stringify(data, this.getCircularReplacer(), 2);
            const parsed = JSON.parse(serialized);

            // Remove sensitive keys
            return this.removeSensitiveKeys(parsed);
        } catch {
            return String(data);
        }
    }

    /**
     * Get replacer for circular references
     */
    private getCircularReplacer(): (key: string, value: any) => any {
        const seen = new WeakSet();
        return (key: string, value: any) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return '[Circular]';
                }
                seen.add(value);
            }
            return value;
        };
    }

    /**
     * Remove sensitive keys from logged data
     */
    private removeSensitiveKeys(obj: any): any {
        const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'auth', 'credential'];

        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.removeSensitiveKeys(item));
        }

        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                cleaned[key] = '[REDACTED]';
            } else {
                cleaned[key] = this.removeSensitiveKeys(value);
            }
        }
        return cleaned;
    }

    /**
     * Log to console with formatting
     */
    private logToConsole(entry: LogEntry): void {
        const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.tag}]`;
        const consoleMethod = entry.level === 'error' ? 'error' : entry.level === 'warn' ? 'warn' : 'log';

        if (entry.data) {
            console[consoleMethod](prefix, entry.message, entry.data);
        } else {
            console[consoleMethod](prefix, entry.message);
        }
    }

    /**
     * Persist log to AsyncStorage
     */
    private async persistLog(entry: LogEntry): Promise<void> {
        try {
            const existing = await AsyncStorage.getItem(LOG_STORAGE_KEY);
            let logs: LogEntry[] = existing ? JSON.parse(existing) : [];

            logs.push(entry);

            // Trim to max size
            if (logs.length > this.config.maxPersistedLogs) {
                logs = logs.slice(-this.config.maxPersistedLogs);
            }

            await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
        } catch (err) {
            // Silent fail for logging
        }
    }

    /**
     * Send error to remote service
     */
    private async sendToRemote(entry: LogEntry): Promise<void> {
        if (!this.config.remoteEndpoint) return;

        try {
            // Implement your remote logging here (e.g., Sentry, Crashlytics)
            // await fetch(this.config.remoteEndpoint, {
            //   method: 'POST',
            //   body: JSON.stringify(entry),
            // });
        } catch {
            // Silent fail
        }
    }

    // Public logging methods
    debug(tag: string, message: string, data?: any): void {
        this.log('debug', tag, message, data);
    }

    info(tag: string, message: string, data?: any): void {
        this.log('info', tag, message, data);
    }

    warn(tag: string, message: string, data?: any): void {
        this.log('warn', tag, message, data);
    }

    error(tag: string, message: string, error?: any): void {
        this.log('error', tag, message, error);
    }

    /**
     * Get session logs
     */
    getSessionLogs(): LogEntry[] {
        return [...this.sessionLogs];
    }

    /**
     * Get persisted logs
     */
    async getPersistedLogs(): Promise<LogEntry[]> {
        try {
            const stored = await AsyncStorage.getItem(LOG_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    /**
     * Clear all persisted logs
     */
    async clearLogs(): Promise<void> {
        this.sessionLogs = [];
        await AsyncStorage.removeItem(LOG_STORAGE_KEY);
    }

    /**
     * Export logs for debugging
     */
    async exportLogs(): Promise<string> {
        const logs = await this.getPersistedLogs();
        return JSON.stringify(logs, null, 2);
    }
}

// Export singleton instance
export const Logger = new AppLogger();
export default Logger;

// Convenience functions
export const logDebug = (tag: string, message: string, data?: any) => Logger.debug(tag, message, data);
export const logInfo = (tag: string, message: string, data?: any) => Logger.info(tag, message, data);
export const logWarn = (tag: string, message: string, data?: any) => Logger.warn(tag, message, data);
export const logError = (tag: string, message: string, error?: any) => Logger.error(tag, message, error);
