/**
 * TypeScript interfaces for Vercel backend
 */

// Stellar network type
export type StellarNetwork = 'testnet' | 'mainnet';

// API Response wrapper
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// Distribution request payload
export interface DistributeRequest {
    depositTransactionId?: string;  // Optional: verify a specific deposit
    totalAmount?: number;           // Manual amount to distribute
}

// Distribution result for each author
export interface AuthorDistribution {
    authorId: string;
    adViewCount: number;
    shareAmount: number;
    walletUpdated: boolean;
    notificationSent: boolean;
}

// Full distribution response
export interface DistributionResult {
    totalDistributed: number;
    totalAdViews: number;
    authorCount: number;
    distributions: AuthorDistribution[];
    stellarTransactionId?: string;
}

// Withdrawal processing request
export interface ProcessWithdrawalRequest {
    withdrawalRequestId: string;
}

// Withdrawal processing result
export interface WithdrawalResult {
    withdrawalId: string;
    userId: string;
    amount: number;
    stellarAddress: string;
    stellarTransactionId: string;
    networkFee: number;
    status: 'completed' | 'failed';
}

// Cron job task result
export interface CronTaskResult {
    taskName: string;
    success: boolean;
    affectedRows?: number;
    error?: string;
}

// Full cron job response
export interface DailyTasksResult {
    executedAt: string;
    tasks: CronTaskResult[];
    totalSuccess: number;
    totalFailed: number;
}

// Author earnings stats
export interface AuthorEarningsStats {
    authorId: string;
    totalAdViews: number;
    unpaidAdViews: number;
    paidAdViews: number;
    totalEarnings: number;
    pendingEarnings: number;
    withdrawnAmount: number;
    currentBalance: number;
}

// Ad view record from Supabase
export interface AdViewRecord {
    id: string;
    user_id: string;
    novel_id: string;
    chapter_id: string;
    author_id: string;
    ad_unit_id: string;
    payment_status: 'pending' | 'paid';
    viewed_at: string;
    paid_at: string | null;
}

// Wallet from Supabase
export interface Wallet {
    id: string;
    user_id: string;
    balance: number;
    total_earned: number;
    total_withdrawn: number;
    total_ad_views: number;
    created_at: string;
    updated_at: string;
}

// Transaction from Supabase
export interface Transaction {
    id: string;
    user_id: string;
    type: 'earning' | 'withdrawal';
    amount: number;
    novel_id: string | null;
    novel_name: string | null;
    status: 'successful' | 'pending' | 'failed';
    stellar_transaction_id: string | null;
    error_message: string | null;
    created_at: string;
    completed_at: string | null;
}

// Withdrawal request from Supabase
export interface WithdrawalRequest {
    id: string;
    user_id: string;
    amount: number;
    stellar_address: string;
    network_fee: number;
    total_amount: number;
    status: 'pending' | 'approved' | 'completed' | 'failed' | 'rejected';
    rejection_reason: string | null;
    stellar_transaction_id: string | null;
    requested_at: string;
    approved_at: string | null;
    completed_at: string | null;
    approved_by: string | null;
}

// Notification from Supabase
export interface Notification {
    id?: string;
    user_id: string;
    type: 'wallet_earnings' | 'withdrawal_status' | 'withdrawal_completed';
    title: string;
    message: string;
    related_id?: string;
    is_read?: boolean;
    sent_by?: string;
}

// Stellar distribution log entry
export interface StellarDistributionLog {
    id?: string;
    total_deposited: number;
    total_distributed: number;
    total_ad_views: number;
    distribution_details: DistributionResult;
    distributed_at?: string;
}
