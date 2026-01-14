/**
 * Notification helper for Vercel backend
 * Creates notifications in Supabase for author earnings and withdrawal updates
 */

import { createNotification } from './supabase';
import { Notification } from './types';

/**
 * Notify author about earnings deposit
 */
export async function notifyAuthorEarnings(
    authorId: string,
    amount: number,
    adViewCount: number
): Promise<void> {
    const notification: Notification = {
        user_id: authorId,
        type: 'wallet_earnings',
        title: 'Earnings Deposited! 🎉',
        message: `You received ${amount.toFixed(7)} XLM for ${adViewCount} ad views on your novels. Check your wallet!`,
    };

    await createNotification(notification);
}

/**
 * Notify user about withdrawal status change
 */
export async function notifyWithdrawalStatus(
    userId: string,
    status: 'approved' | 'completed' | 'failed' | 'rejected',
    amount: number,
    transactionId?: string,
    reason?: string
): Promise<void> {
    let title: string;
    let message: string;
    let type: 'withdrawal_status' | 'withdrawal_completed' = 'withdrawal_status';

    switch (status) {
        case 'approved':
            title = 'Withdrawal Approved ✅';
            message = `Your withdrawal request for ${amount.toFixed(7)} XLM has been approved and is being processed.`;
            break;
        case 'completed':
            title = 'Withdrawal Complete! 💰';
            message = `${amount.toFixed(7)} XLM has been sent to your Stellar wallet.`;
            if (transactionId) {
                message += ` Transaction: ${transactionId.substring(0, 16)}...`;
            }
            type = 'withdrawal_completed';
            break;
        case 'failed':
            title = 'Withdrawal Failed ❌';
            message = `Your withdrawal of ${amount.toFixed(7)} XLM failed. ${reason || 'Please try again later.'}`;
            break;
        case 'rejected':
            title = 'Withdrawal Rejected';
            message = `Your withdrawal request was rejected. ${reason || 'Please contact support.'}`;
            break;
    }

    const notification: Notification = {
        user_id: userId,
        type,
        title,
        message,
        related_id: transactionId,
    };

    await createNotification(notification);
}

/**
 * Notify admin about large withdrawal requests
 */
export async function notifyAdminLargeWithdrawal(
    adminId: string,
    userId: string,
    amount: number,
    withdrawalId: string
): Promise<void> {
    const notification: Notification = {
        user_id: adminId,
        type: 'withdrawal_status',
        title: 'Large Withdrawal Request 🔔',
        message: `User requested ${amount.toFixed(7)} XLM withdrawal. Review required.`,
        related_id: withdrawalId,
    };

    await createNotification(notification);
}
