/**
 * Production-Safe Console
 * Wrap console methods to only log in development
 */

const isDev = __DEV__;

/**
 * Production-safe logging utility
 * Only logs in development, silent in production
 */
export const devLog = {
    log: (...args: any[]) => {
        if (isDev) console.log(...args);
    },

    warn: (...args: any[]) => {
        if (isDev) console.warn(...args);
    },

    error: (...args: any[]) => {
        // Always log errors, but could also send to crash reporting
        console.error(...args);
    },

    info: (...args: any[]) => {
        if (isDev) console.info(...args);
    },

    debug: (...args: any[]) => {
        if (isDev) console.debug(...args);
    },

    /** Log with a tag prefix */
    tagged: (tag: string, ...args: any[]) => {
        if (isDev) console.log(`[${tag}]`, ...args);
    },

    /** Log timing for performance */
    time: (label: string) => {
        if (isDev) console.time(label);
    },

    timeEnd: (label: string) => {
        if (isDev) console.timeEnd(label);
    },

    /** Group logs together */
    group: (label: string) => {
        if (isDev) console.group(label);
    },

    groupEnd: () => {
        if (isDev) console.groupEnd();
    },

    /** Log a table */
    table: (data: any) => {
        if (isDev) console.table(data);
    },
};

export default devLog;
