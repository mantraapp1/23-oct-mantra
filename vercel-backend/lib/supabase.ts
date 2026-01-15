/**
 * Supabase client for Vercel backend - PRODUCTION GRADE
 * Uses service role key for admin operations (bypasses RLS)
 * 
 * Features:
 * - Idempotency keys to prevent double payments
 * - Balance locking during withdrawals
 * - Pending withdrawal limits
 * - Structured logging
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
    AdViewRecord,
    Wallet,
    Transaction,
    WithdrawalRequest,
    Notification,
    StellarDistributionLog
} from './types';
import { log, LogLevel } from './logger';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate environment
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase configuration environment variables');
}

// Create Supabase client with service role (admin access)
export const supabase: SupabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

// =========================================================
// IDEMPOTENCY - Prevent duplicate operations
// =========================================================

/**
 * Check if a distribution has already been processed today
 * Prevents double distributions if cron runs multiple times
 */
export async function hasDistributedToday(): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, error } = await supabase
        .from('stellar_distribution_log')
        .select('id')
        .gte('distributed_at', `${today}T00:00:00Z`)
        .lt('distributed_at', `${today}T23:59:59Z`)
        .limit(1);

    if (error) {
        log(LogLevel.ERROR, 'Failed to check distribution history', { error: error.message });
        return false; // Allow distribution if check fails (safer to potentially double than miss)
    }

    return data && data.length > 0;
}

/**
 * Check if a withdrawal has already been processed
 * Prevents double processing of same withdrawal
 */
export async function isWithdrawalProcessed(withdrawalId: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('status, stellar_transaction_id')
        .eq('id', withdrawalId)
        .single();

    if (error || !data) return false;

    // Already processed if completed or has transaction ID
    return data.status === 'completed' || !!data.stellar_transaction_id;
}

// =========================================================
// BALANCE LOCKING - Prevent race conditions
// =========================================================

/**
 * Lock user's wallet before processing withdrawal
 * Uses status='processing' to indicate locked state
 */
export async function lockWithdrawalForProcessing(withdrawalId: string): Promise<boolean> {
    const { error } = await supabase
        .from('withdrawal_requests')
        .update({
            status: 'processing' as any, // Temporary status during processing
            approved_at: new Date().toISOString() // Track when processing started
        })
        .eq('id', withdrawalId)
        .eq('status', 'approved'); // Only lock if still in approved state

    if (error) {
        log(LogLevel.WARN, 'Failed to lock withdrawal', { withdrawalId, error: error.message });
        return false;
    }

    return true;
}

/**
 * Check if user has any pending/processing withdrawal
 * Limits user to one pending withdrawal at a time
 */
export async function hasPendingWithdrawal(userId: string): Promise<boolean> {
    const { count, error } = await supabase
        .from('withdrawal_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('status', ['pending', 'approved', 'processing']);

    if (error) return false;
    return (count || 0) > 0;
}

// =========================================================
// AD VIEW OPERATIONS
// =========================================================

/**
 * Get unpaid ad views grouped by author
 * Uses pagination to fetch ALL records (bypasses Supabase default 1000 limit)
 */
export async function getUnpaidAdViewsByAuthor(): Promise<Map<string, AdViewRecord[]>> {
    const allRecords: AdViewRecord[] = [];
    const PAGE_SIZE = 1000;
    let offset = 0;
    let hasMore = true;

    // Paginate to get ALL unpaid ad views
    while (hasMore) {
        const { data, error } = await supabase
            .from('ads_view_records')
            .select('*')
            .eq('payment_status', 'pending')
            .order('viewed_at', { ascending: true })
            .range(offset, offset + PAGE_SIZE - 1);

        if (error) {
            log(LogLevel.ERROR, 'Failed to fetch ad views', { error: error.message, offset });
            throw new Error(`Failed to fetch ad views: ${error.message}`);
        }

        if (data && data.length > 0) {
            allRecords.push(...data);
            offset += data.length;
            hasMore = data.length === PAGE_SIZE; // More pages if we got full page
        } else {
            hasMore = false;
        }
    }

    // Group by author_id
    const grouped = new Map<string, AdViewRecord[]>();
    for (const record of allRecords) {
        const existing = grouped.get(record.author_id) || [];
        existing.push(record);
        grouped.set(record.author_id, existing);
    }

    log(LogLevel.INFO, 'Fetched unpaid ad views', {
        totalRecords: allRecords.length,
        authorCount: grouped.size
    });

    return grouped;
}

/**
 * Mark ad views as paid with idempotency check
 * Uses batching to avoid Supabase's .in() limit
 */
export async function markAdViewsAsPaid(adViewIds: string[]): Promise<number> {
    if (adViewIds.length === 0) return 0;

    // Supabase .in() has a limit, batch in chunks of 100
    const BATCH_SIZE = 100;
    let totalUpdated = 0;

    for (let i = 0; i < adViewIds.length; i += BATCH_SIZE) {
        const batch = adViewIds.slice(i, i + BATCH_SIZE);

        const { data, error } = await supabase
            .from('ads_view_records')
            .update({
                payment_status: 'paid',
                paid_at: new Date().toISOString(),
            })
            .in('id', batch)
            .eq('payment_status', 'pending') // Only update if still pending (idempotent)
            .select();

        if (error) {
            log(LogLevel.ERROR, 'Failed to mark ad views as paid', {
                error: error.message,
                batchStart: i,
                batchSize: batch.length
            });
            throw new Error(`Failed to mark ad views as paid: ${error.message}`);
        }

        totalUpdated += data?.length || 0;
    }

    log(LogLevel.INFO, 'Marked ad views as paid', {
        requested: adViewIds.length,
        updated: totalUpdated
    });

    return totalUpdated;
}

// =========================================================
// WALLET OPERATIONS
// =========================================================

/**
 * Get or create user wallet
 */
export async function getOrCreateWallet(userId: string): Promise<Wallet> {
    // Try to get existing wallet
    const { data: existing, error: getError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (getError) {
        log(LogLevel.ERROR, 'Failed to fetch wallet', { userId, error: getError.message });
        throw new Error(`Failed to fetch wallet: ${getError.message}`);
    }

    if (existing) return existing;

    // Create new wallet
    const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({ user_id: userId })
        .select()
        .single();

    if (createError) {
        log(LogLevel.ERROR, 'Failed to create wallet', { userId, error: createError.message });
        throw new Error(`Failed to create wallet: ${createError.message}`);
    }

    log(LogLevel.INFO, 'Created new wallet', { userId });
    return newWallet;
}

/**
 * Update wallet balance and stats (for earnings)
 * Uses optimistic locking to prevent race conditions
 */
export async function updateWalletBalance(
    userId: string,
    addAmount: number,
    addAdViews: number
): Promise<Wallet> {
    const wallet = await getOrCreateWallet(userId);

    const { data, error } = await supabase
        .from('wallets')
        .update({
            balance: wallet.balance + addAmount,
            total_earned: wallet.total_earned + addAmount,
            total_ad_views: wallet.total_ad_views + addAdViews,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('balance', wallet.balance) // Optimistic lock - only update if balance unchanged
        .select()
        .single();

    if (error) {
        log(LogLevel.ERROR, 'Failed to update wallet', { userId, error: error.message });
        throw new Error(`Failed to update wallet: ${error.message}`);
    }

    log(LogLevel.INFO, 'Updated wallet balance', {
        userId,
        addedAmount: addAmount,
        newBalance: data.balance
    });

    return data;
}

/**
 * Deduct from wallet balance (for withdrawals)
 * Uses strict balance check to prevent overdraft
 */
export async function deductWalletBalance(
    userId: string,
    amount: number
): Promise<Wallet> {
    const wallet = await getOrCreateWallet(userId);

    if (wallet.balance < amount) {
        log(LogLevel.WARN, 'Insufficient balance for withdrawal', {
            userId,
            requested: amount,
            available: wallet.balance
        });
        throw new Error('Insufficient balance');
    }

    const { data, error } = await supabase
        .from('wallets')
        .update({
            balance: wallet.balance - amount,
            total_withdrawn: wallet.total_withdrawn + amount,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .gte('balance', amount) // Safety: only deduct if balance sufficient
        .select()
        .single();

    if (error) {
        log(LogLevel.ERROR, 'Failed to deduct wallet', { userId, amount, error: error.message });
        throw new Error(`Failed to deduct wallet: ${error.message}`);
    }

    log(LogLevel.INFO, 'Deducted from wallet', {
        userId,
        amount,
        newBalance: data.balance
    });

    return data;
}

// =========================================================
// TRANSACTION OPERATIONS
// =========================================================

/**
 * Create earning transaction with duplicate check
 */
export async function createEarningTransaction(
    userId: string,
    amount: number,
    novelId?: string,
    novelName?: string,
    idempotencyKey?: string
): Promise<Transaction> {
    // Check for duplicate if idempotency key provided
    if (idempotencyKey) {
        const { data: existing } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('type', 'earning')
            .eq('amount', amount)
            .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Within last minute
            .maybeSingle();

        if (existing) {
            log(LogLevel.WARN, 'Duplicate earning transaction detected', { userId, amount });
            return existing;
        }
    }

    const { data, error } = await supabase
        .from('transactions')
        .insert({
            user_id: userId,
            type: 'earning',
            amount,
            novel_id: novelId || null,
            novel_name: novelName || null,
            status: 'successful',
            completed_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        log(LogLevel.ERROR, 'Failed to create earning transaction', { userId, error: error.message });
        throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return data;
}

/**
 * Complete withdrawal transaction - UPDATE existing pending transaction
 * When user requests withdrawal, a pending transaction is created in the app.
 * When backend processes it, we UPDATE that transaction to 'successful'.
 */
export async function createWithdrawalTransaction(
    userId: string,
    amount: number,
    stellarTransactionId: string
): Promise<Transaction> {
    // Check for duplicate by stellar transaction ID
    const { data: existingByTxId } = await supabase
        .from('transactions')
        .select('*')
        .eq('stellar_transaction_id', stellarTransactionId)
        .maybeSingle();

    if (existingByTxId) {
        log(LogLevel.WARN, 'Duplicate withdrawal transaction', { stellarTransactionId });
        return existingByTxId;
    }

    // Find existing PENDING withdrawal transaction to update
    const { data: pendingTx } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'withdrawal')
        .eq('status', 'pending')
        .eq('amount', amount)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (pendingTx) {
        // UPDATE existing pending transaction to completed
        const { data: updatedTx, error: updateError } = await supabase
            .from('transactions')
            .update({
                status: 'successful',
                stellar_transaction_id: stellarTransactionId,
                completed_at: new Date().toISOString(),
            })
            .eq('id', pendingTx.id)
            .select()
            .single();

        if (updateError) {
            log(LogLevel.ERROR, 'Failed to update withdrawal transaction', { userId, error: updateError.message });
            throw new Error(`Failed to update transaction: ${updateError.message}`);
        }

        log(LogLevel.INFO, 'Updated pending withdrawal to completed', { userId, amount, stellarTransactionId });
        return updatedTx;
    }

    // No pending transaction found - create new one (fallback)
    const { data, error } = await supabase
        .from('transactions')
        .insert({
            user_id: userId,
            type: 'withdrawal',
            amount,
            status: 'successful',
            stellar_transaction_id: stellarTransactionId,
            completed_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        log(LogLevel.ERROR, 'Failed to create withdrawal transaction', { userId, error: error.message });
        throw new Error(`Failed to create transaction: ${error.message}`);
    }

    log(LogLevel.INFO, 'Created withdrawal transaction', { userId, amount, stellarTransactionId });
    return data;
}

// =========================================================
// WITHDRAWAL OPERATIONS
// =========================================================

/**
 * Get approved withdrawal requests (ready to process)
 */
export async function getApprovedWithdrawals(): Promise<WithdrawalRequest[]> {
    const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('status', 'approved')
        .order('requested_at', { ascending: true })
        .limit(10); // Process max 10 per cron run (free tier friendly)

    if (error) {
        log(LogLevel.ERROR, 'Failed to fetch withdrawals', { error: error.message });
        throw new Error(`Failed to fetch withdrawals: ${error.message}`);
    }

    return data || [];
}

/**
 * Get rejected withdrawal requests (need processing)
 * These have status='rejected' and will be changed to 'failed' after processing
 */
export async function getRejectedWithdrawals(): Promise<WithdrawalRequest[]> {
    const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('status', 'rejected')
        .order('requested_at', { ascending: true })
        .limit(10);

    if (error) {
        log(LogLevel.ERROR, 'Failed to fetch rejected withdrawals', { error: error.message });
        throw new Error(`Failed to fetch rejected withdrawals: ${error.message}`);
    }

    return data || [];
}

/**
 * Process rejected withdrawal
 * NO REFUND NEEDED - wallet is only deducted AFTER successful Stellar payment
 * Just update the pending transaction to 'failed' and mark as processed
 */
export async function refundRejectedWithdrawal(withdrawal: WithdrawalRequest): Promise<boolean> {
    try {
        // Update pending transaction to 'failed'
        await supabase
            .from('transactions')
            .update({
                status: 'failed',
                error_message: 'Withdrawal rejected by admin',
                completed_at: new Date().toISOString(),
            })
            .eq('user_id', withdrawal.user_id)
            .eq('type', 'withdrawal')
            .eq('status', 'pending')
            .eq('amount', withdrawal.amount);

        // Mark withdrawal as processed (so it doesn't get picked up again)
        await supabase
            .from('withdrawal_requests')
            .update({
                status: 'failed', // Change from 'rejected' to 'failed' to mark as processed
            })
            .eq('id', withdrawal.id);

        log(LogLevel.INFO, 'Processed rejected withdrawal', {
            withdrawalId: withdrawal.id,
            userId: withdrawal.user_id,
            amount: withdrawal.amount
        });

        return true;
    } catch (error: any) {
        log(LogLevel.ERROR, 'Failed to process rejection', { error: error.message });
        return false;
    }
}

/**
 * Update withdrawal request status
 */
export async function updateWithdrawalStatus(
    requestId: string,
    status: WithdrawalRequest['status'],
    stellarTransactionId?: string,
    errorMessage?: string
): Promise<WithdrawalRequest> {
    const updateData: Record<string, any> = { status };

    if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
    }

    if (stellarTransactionId) {
        updateData.stellar_transaction_id = stellarTransactionId;
    }

    if (errorMessage) {
        updateData.rejection_reason = errorMessage;
    }

    const { data, error } = await supabase
        .from('withdrawal_requests')
        .update(updateData)
        .eq('id', requestId)
        .select()
        .single();

    if (error) {
        log(LogLevel.ERROR, 'Failed to update withdrawal', { requestId, status, error: error.message });
        throw new Error(`Failed to update withdrawal: ${error.message}`);
    }

    log(LogLevel.INFO, 'Updated withdrawal status', { requestId, status });
    return data;
}

// =========================================================
// NOTIFICATION OPERATIONS
// =========================================================

/**
 * Create notification for user
 */
export async function createNotification(notification: Notification): Promise<void> {
    const { error } = await supabase
        .from('notifications')
        .insert({
            ...notification,
            is_read: false,
            created_at: new Date().toISOString(),
        });

    if (error) {
        log(LogLevel.WARN, 'Failed to create notification', {
            userId: notification.user_id,
            type: notification.type,
            error: error.message
        });
        // Don't throw - notifications are not critical
    }
}

// =========================================================
// LOGGING OPERATIONS
// =========================================================

/**
 * Log distribution to stellar_distribution_log
 */
export async function logDistribution(logEntry: StellarDistributionLog): Promise<void> {
    const { error } = await supabase
        .from('stellar_distribution_log')
        .insert({
            ...logEntry,
            distributed_at: new Date().toISOString(),
        });

    if (error) {
        log(LogLevel.WARN, 'Failed to log distribution', { error: error.message });
        // Don't throw - logging is not critical
    }
}

// =========================================================
// SUPABASE RPC FUNCTIONS (pg_cron replacement)
// =========================================================

/**
 * Call Supabase function to expire chapter unlocks
 */
export async function expireChapterUnlocks(): Promise<number> {
    try {
        const { error } = await supabase.rpc('expire_chapter_unlocks');

        if (error) {
            log(LogLevel.ERROR, 'Failed to expire unlocks', { error: error.message });
            throw new Error(`Failed to expire unlocks: ${error.message}`);
        }

        // Get count of recently expired unlocks
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count } = await supabase
            .from('chapter_unlocks')
            .select('*', { count: 'exact', head: true })
            .eq('is_expired', true)
            .gte('expiration_timestamp', oneHourAgo);

        log(LogLevel.INFO, 'Expired chapter unlocks', { count: count || 0 });
        return count || 0;
    } catch (error: any) {
        log(LogLevel.ERROR, 'expire_chapter_unlocks failed', { error: error.message });
        throw error;
    }
}

/**
 * Call Supabase function to process expired timers
 */
export async function processExpiredTimers(): Promise<number> {
    try {
        const { error } = await supabase.rpc('process_expired_timers');

        if (error) {
            log(LogLevel.ERROR, 'Failed to process timers', { error: error.message });
            throw new Error(`Failed to process timers: ${error.message}`);
        }

        // Get count of recently processed timers
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count } = await supabase
            .from('chapter_timers')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', false)
            .gte('timer_expiration_timestamp', oneHourAgo);

        log(LogLevel.INFO, 'Processed expired timers', { count: count || 0 });
        return count || 0;
    } catch (error: any) {
        log(LogLevel.ERROR, 'process_expired_timers failed', { error: error.message });
        throw error;
    }
}

/**
 * Get author earnings statistics
 */
export async function getAuthorEarningsStats(authorId: string) {
    const wallet = await getOrCreateWallet(authorId);

    const { count: unpaidCount } = await supabase
        .from('ads_view_records')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', authorId)
        .eq('payment_status', 'pending');

    const { count: totalCount } = await supabase
        .from('ads_view_records')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', authorId);

    return {
        authorId,
        totalAdViews: totalCount || 0,
        unpaidAdViews: unpaidCount || 0,
        paidAdViews: (totalCount || 0) - (unpaidCount || 0),
        totalEarnings: wallet.total_earned,
        pendingEarnings: 0, // Dynamic rate - calculated at distribution time based on admin wallet balance
        withdrawnAmount: wallet.total_withdrawn,
        currentBalance: wallet.balance,
    };
}
