/**
 * Structured Logger for Vercel Backend
 * Production-grade logging with levels and context
 * Logs are visible in Vercel Dashboard → Logs
 */

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

interface LogContext {
    [key: string]: string | number | boolean | null | undefined;
}

/**
 * Log a message with structured context
 */
export function log(
    level: LogLevel,
    message: string,
    context?: LogContext
): void {
    const timestamp = new Date().toISOString();
    const network = process.env.STELLAR_NETWORK || 'testnet';

    const logEntry = {
        timestamp,
        level,
        network,
        message,
        ...(context || {}),
    };

    // Use appropriate console method based on level
    switch (level) {
        case LogLevel.ERROR:
            console.error(JSON.stringify(logEntry));
            break;
        case LogLevel.WARN:
            console.warn(JSON.stringify(logEntry));
            break;
        case LogLevel.DEBUG:
            if (process.env.NODE_ENV !== 'production') {
                console.log(JSON.stringify(logEntry));
            }
            break;
        default:
            console.log(JSON.stringify(logEntry));
    }
}

/**
 * Log the start of a cron job run
 */
export function logCronStart(): string {
    const runId = `cron_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    log(LogLevel.INFO, 'Cron job started', { runId });
    return runId;
}

/**
 * Log the end of a cron job run
 */
export function logCronEnd(
    runId: string,
    success: number,
    failed: number,
    durationMs: number
): void {
    log(LogLevel.INFO, 'Cron job completed', {
        runId,
        successCount: success,
        failedCount: failed,
        durationMs,
        status: failed === 0 ? 'success' : 'partial_failure',
    });
}

/**
 * Log a Stellar transaction
 */
export function logStellarTransaction(
    type: 'distribution' | 'withdrawal',
    transactionId: string,
    amount: number,
    destination?: string
): void {
    log(LogLevel.INFO, `Stellar ${type} completed`, {
        transactionId,
        amount,
        destination: destination || 'multiple',
        explorerUrl: getExplorerLogUrl(transactionId),
    });
}

function getExplorerLogUrl(txId: string): string {
    const network = process.env.STELLAR_NETWORK || 'testnet';
    const base = network === 'mainnet'
        ? 'https://stellar.expert/explorer/public/tx'
        : 'https://stellar.expert/explorer/testnet/tx';
    return `${base}/${txId}`;
}

/**
 * Log an error with stack trace
 */
export function logError(
    operation: string,
    error: Error | any,
    context?: LogContext
): void {
    log(LogLevel.ERROR, `${operation} failed`, {
        ...context,
        error: error?.message || String(error),
        stack: error?.stack?.substring(0, 500), // Limit stack trace length
    });
}
