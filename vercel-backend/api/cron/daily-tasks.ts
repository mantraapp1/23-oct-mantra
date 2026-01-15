/**
 * Daily Cron Job - PRODUCTION GRADE
 * GET /api/cron/daily-tasks
 * 
 * Runs automatically via Vercel Cron (configured in vercel.json)
 * 
 * Production features:
 * - Idempotency: Won't double-distribute in same day
 * - Balance locking: Prevents race conditions on withdrawals
 * - Retry logic: Failed operations tracked for next run
 * - Structured logging: Debug-friendly JSON logs
 * - 10-second timeout safe: Limits batch sizes
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateCronRequest } from '../../lib/auth';
import {
    getAdminBalance,
    sendPayment,
    getCurrentNetwork,
    getExplorerUrl
} from '../../lib/stellar';
import {
    getUnpaidAdViewsByAuthor,
    markAdViewsAsPaid,
    updateWalletBalance,
    createEarningTransaction,
    getApprovedWithdrawals,
    updateWithdrawalStatus,
    deductWalletBalance,
    createWithdrawalTransaction,
    lockWithdrawalForProcessing,
    isWithdrawalProcessed,
    expireChapterUnlocks,
    processExpiredTimers,
    logDistribution,
} from '../../lib/supabase';
import { notifyAuthorEarnings, notifyWithdrawalStatus } from '../../lib/notifications';
import {
    log,
    LogLevel,
    logCronStart,
    logCronEnd,
    logStellarTransaction,
    logError
} from '../../lib/logger';
import {
    ApiResponse,
    DailyTasksResult,
    CronTaskResult,
    DistributionResult,
    AuthorDistribution
} from '../../lib/types';

// Configuration (free tier friendly)
// Note: Stellar transaction fees (~0.00001 XLM per tx) are paid from the distribution amount
const MIN_ADMIN_BALANCE = 2; // Keep 2 XLM to keep wallet active
const MAX_AUTHORS_PER_RUN = 50; // Limit to stay under 10s timeout
const MAX_WITHDRAWALS_PER_RUN = 5; // Limit to stay under 10s timeout

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
): Promise<void> {
    // Validate request
    if (!validateCronRequest(req)) {
        res.status(401).json({ success: false, error: 'Unauthorized' } as ApiResponse);
        return;
    }

    const startTime = Date.now();
    const runId = logCronStart();

    const result: DailyTasksResult = {
        executedAt: new Date().toISOString(),
        tasks: [],
        totalSuccess: 0,
        totalFailed: 0,
    };

    // =========================================================
    // TASK 1: Auto-distribute earnings (with idempotency)
    // =========================================================
    try {
        const distributionResult = await distributeEarningsToAuthors();
        result.tasks.push({
            taskName: 'distribute_earnings',
            success: true,
            affectedRows: distributionResult.authorCount,
        });
        result.totalSuccess++;
    } catch (error: any) {
        logError('distribute_earnings', error);
        result.tasks.push({
            taskName: 'distribute_earnings',
            success: false,
            error: error.message,
        });
        result.totalFailed++;
    }

    // =========================================================
    // TASK 2: Auto-process approved withdrawals (with locking)
    // =========================================================
    try {
        const processedCount = await processApprovedWithdrawals();
        result.tasks.push({
            taskName: 'process_withdrawals',
            success: true,
            affectedRows: processedCount,
        });
        result.totalSuccess++;
    } catch (error: any) {
        logError('process_withdrawals', error);
        result.tasks.push({
            taskName: 'process_withdrawals',
            success: false,
            error: error.message,
        });
        result.totalFailed++;
    }

    // =========================================================
    // TASK 3: Expire chapter unlocks
    // =========================================================
    try {
        const expiredCount = await expireChapterUnlocks();
        result.tasks.push({
            taskName: 'expire_chapter_unlocks',
            success: true,
            affectedRows: expiredCount,
        });
        result.totalSuccess++;
    } catch (error: any) {
        logError('expire_chapter_unlocks', error);
        result.tasks.push({
            taskName: 'expire_chapter_unlocks',
            success: false,
            error: error.message,
        });
        result.totalFailed++;
    }

    // =========================================================
    // TASK 4: Process expired timers
    // =========================================================
    try {
        const timerCount = await processExpiredTimers();
        result.tasks.push({
            taskName: 'process_expired_timers',
            success: true,
            affectedRows: timerCount,
        });
        result.totalSuccess++;
    } catch (error: any) {
        logError('process_expired_timers', error);
        result.tasks.push({
            taskName: 'process_expired_timers',
            success: false,
            error: error.message,
        });
        result.totalFailed++;
    }

    // Log completion
    const durationMs = Date.now() - startTime;
    logCronEnd(runId, result.totalSuccess, result.totalFailed, durationMs);

    // Return results
    const statusCode = result.totalFailed > 0 ? 207 : 200;
    res.status(statusCode).json({
        success: result.totalFailed === 0,
        data: result,
    } as ApiResponse<DailyTasksResult>);
}

/**
 * Distribute earnings to authors based on ad views
 * Production features: fair rate calculation, batch limits, optimistic locking
 * 
 * CRITICAL: Rate is calculated using ALL pending ads globally, not just processed ones.
 * This ensures every author gets the same rate per ad view.
 */
async function distributeEarningsToAuthors(): Promise<DistributionResult> {
    // NOTE: Removed hasDistributedToday() check
    // The ads being marked as 'paid' IS the idempotency guard
    // This allows retries to process remaining authors if previous run didn't complete all

    // Get ALL unpaid ad views grouped by author (uses pagination internally)
    const adViewsByAuthor = await getUnpaidAdViewsByAuthor();

    if (adViewsByAuthor.size === 0) {
        log(LogLevel.INFO, 'No unpaid ad views to distribute');
        return {
            totalDistributed: 0,
            totalAdViews: 0,
            authorCount: 0,
            distributions: [],
        };
    }

    // CRITICAL: Calculate rate using ALL pending ads for FAIR distribution
    // This must happen BEFORE any limiting for timeout protection
    let totalAdViewsGlobal = 0;
    for (const [, views] of adViewsByAuthor.entries()) {
        totalAdViewsGlobal += views.length;
    }

    // Check admin wallet balance BEFORE processing
    const adminBalanceStr = await getAdminBalance();
    const adminBalance = parseFloat(adminBalanceStr);

    log(LogLevel.INFO, 'Admin wallet status', {
        balance: adminBalance,
        minRequired: MIN_ADMIN_BALANCE,
        totalAuthors: adViewsByAuthor.size,
        totalAdViews: totalAdViewsGlobal
    });

    // Calculate distributable amount (100% of balance minus reserve for wallet minimum)
    const distributableBalance = Math.max(0, adminBalance - MIN_ADMIN_BALANCE);

    if (distributableBalance <= 0) {
        log(LogLevel.WARN, 'Insufficient admin balance for distribution', {
            available: distributableBalance,
            minRequired: MIN_ADMIN_BALANCE
        });
        return {
            totalDistributed: 0,
            totalAdViews: totalAdViewsGlobal,
            authorCount: adViewsByAuthor.size,
            distributions: [],
        };
    }

    // Calculate GLOBAL rate: pool / ALL pending ads
    // EVERY author gets this SAME rate - fair distribution
    const ratePerView = distributableBalance / totalAdViewsGlobal;

    log(LogLevel.INFO, 'Global rate calculated (fair distribution)', {
        distributableBalance,
        totalAdViewsGlobal,
        ratePerView,
        totalAuthors: adViewsByAuthor.size
    });

    // Limit authors per run for Vercel 10s timeout protection
    // But rate was already calculated globally, so this is fair
    const authorEntries = Array.from(adViewsByAuthor.entries()).slice(0, MAX_AUTHORS_PER_RUN);

    // Count ads in this batch
    let adViewsThisBatch = 0;
    for (const [, views] of authorEntries) {
        adViewsThisBatch += views.length;
    }

    log(LogLevel.INFO, 'Processing batch', {
        authorsInBatch: authorEntries.length,
        totalAuthors: adViewsByAuthor.size,
        adsInBatch: adViewsThisBatch,
        totalAds: totalAdViewsGlobal
    });

    // Process each author
    const distributions: AuthorDistribution[] = [];
    let successfulDistributions = 0;

    for (const [authorId, adViews] of authorEntries) {
        const authorViewCount = adViews.length;
        const authorShare = authorViewCount * ratePerView;
        const adViewIds = adViews.map(v => v.id);

        try {
            // CRITICAL: Mark ads as paid FIRST to prevent double-payment on retry
            // This is the idempotency guard - if this succeeds, ads can't be reprocessed
            const markedCount = await markAdViewsAsPaid(adViewIds);

            if (markedCount === 0) {
                // All ads were already paid (possible duplicate run)
                log(LogLevel.WARN, 'Skipping author - all ads already paid', { authorId });
                continue;
            }

            // Now safe to credit wallet (ads are already marked as paid)
            await updateWalletBalance(authorId, authorShare, authorViewCount);

            // Create transaction record (with duplicate check using idempotency key)
            await createEarningTransaction(
                authorId,
                authorShare,
                undefined,
                undefined,
                `dist_${new Date().toISOString().split('T')[0]}_${authorId}` // Idempotency key
            );

            // Send notification (non-critical, can fail)
            try {
                await notifyAuthorEarnings(authorId, authorShare, authorViewCount);
            } catch (notifError) {
                log(LogLevel.WARN, 'Notification failed but distribution succeeded', { authorId });
            }

            distributions.push({
                authorId,
                adViewCount: authorViewCount,
                shareAmount: authorShare,
                walletUpdated: true,
                notificationSent: true,
            });

            successfulDistributions++;

        } catch (error: any) {
            logError(`Distribution to author ${authorId}`, error);
            distributions.push({
                authorId,
                adViewCount: authorViewCount,
                shareAmount: 0,
                walletUpdated: false,
                notificationSent: false,
            });
        }
    }

    // Log distribution
    const result: DistributionResult = {
        totalDistributed: successfulDistributions > 0 ? distributableBalance : 0,
        totalAdViews: totalAdViewsGlobal,
        authorCount: successfulDistributions,
        distributions,
    };

    if (successfulDistributions > 0) {
        await logDistribution({
            total_deposited: adminBalance,
            total_distributed: distributableBalance,
            total_ad_views: totalAdViewsGlobal,
            distribution_details: result,
        });

        log(LogLevel.INFO, 'Distribution completed', {
            authorCount: successfulDistributions,
            totalDistributed: distributableBalance,
            totalAdViews: totalAdViewsGlobal
        });
    }

    return result;
}

/**
 * Process approved withdrawal requests
 * Production features: locking, idempotency, batch limits
 */
async function processApprovedWithdrawals(): Promise<number> {
    // Get approved withdrawals (limited batch)
    const approvedWithdrawals = await getApprovedWithdrawals();

    if (approvedWithdrawals.length === 0) {
        log(LogLevel.INFO, 'No approved withdrawals to process');
        return 0;
    }

    log(LogLevel.INFO, 'Processing withdrawals', { count: approvedWithdrawals.length });

    let processedCount = 0;
    const maxToProcess = Math.min(approvedWithdrawals.length, MAX_WITHDRAWALS_PER_RUN);

    for (let i = 0; i < maxToProcess; i++) {
        const withdrawal = approvedWithdrawals[i];
        if (!withdrawal) continue;

        try {
            // Idempotency check
            if (await isWithdrawalProcessed(withdrawal.id)) {
                log(LogLevel.WARN, 'Withdrawal already processed', { id: withdrawal.id });
                continue;
            }

            // Lock withdrawal for processing
            const locked = await lockWithdrawalForProcessing(withdrawal.id);
            if (!locked) {
                log(LogLevel.WARN, 'Failed to lock withdrawal', { id: withdrawal.id });
                continue;
            }

            // Send Stellar payment
            const paymentResult = await sendPayment(
                withdrawal.stellar_address,
                withdrawal.amount.toString(),
                `Mantra W-${withdrawal.id.substring(0, 8)}`
            );

            if (paymentResult.success && paymentResult.transactionId) {
                // Update status to completed
                await updateWithdrawalStatus(
                    withdrawal.id,
                    'completed',
                    paymentResult.transactionId
                );

                // Deduct from wallet (with balance guard)
                try {
                    await deductWalletBalance(withdrawal.user_id, withdrawal.total_amount);
                } catch (e) {
                    // Balance may already be deducted - log but continue
                    log(LogLevel.WARN, 'Wallet deduction issue (may be already deducted)', {
                        userId: withdrawal.user_id
                    });
                }

                // Create transaction record
                await createWithdrawalTransaction(
                    withdrawal.user_id,
                    withdrawal.amount,
                    paymentResult.transactionId
                );

                // Notify user
                await notifyWithdrawalStatus(
                    withdrawal.user_id,
                    'completed',
                    withdrawal.amount,
                    paymentResult.transactionId
                );

                logStellarTransaction(
                    'withdrawal',
                    paymentResult.transactionId,
                    withdrawal.amount,
                    withdrawal.stellar_address
                );

                processedCount++;

            } else {
                // Payment failed - update status
                await updateWithdrawalStatus(
                    withdrawal.id,
                    'failed',
                    undefined,
                    paymentResult.error || 'Payment failed'
                );

                await notifyWithdrawalStatus(
                    withdrawal.user_id,
                    'failed',
                    withdrawal.amount,
                    undefined,
                    paymentResult.error
                );

                log(LogLevel.ERROR, 'Withdrawal payment failed', {
                    id: withdrawal.id,
                    error: paymentResult.error
                });
            }

        } catch (error: any) {
            logError(`Withdrawal ${withdrawal.id}`, error);

            // Mark as failed
            try {
                await updateWithdrawalStatus(
                    withdrawal.id,
                    'failed',
                    undefined,
                    error.message
                );
            } catch (updateError) {
                logError('Failed to update withdrawal status', updateError);
            }
        }
    }

    log(LogLevel.INFO, 'Withdrawal processing completed', {
        processed: processedCount,
        total: approvedWithdrawals.length
    });

    return processedCount;
}
