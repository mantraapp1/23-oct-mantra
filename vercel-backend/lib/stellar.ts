/**
 * Stellar SDK utilities - PRODUCTION GRADE
 * Supports testnet/mainnet switching via environment variable
 * 
 * Production features:
 * - Retry logic for network errors
 * - Balance verification before payments
 * - Transaction verification
 * - Proper error handling
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { StellarNetwork } from './types';
import { log, LogLevel } from './logger';

// Network configuration
const NETWORKS = {
    testnet: {
        server: 'https://horizon-testnet.stellar.org',
        passphrase: StellarSdk.Networks.TESTNET,
    },
    mainnet: {
        server: 'https://horizon.stellar.org',
        passphrase: StellarSdk.Networks.PUBLIC,
    },
};

// Environment configuration
const STELLAR_NETWORK = (process.env.STELLAR_NETWORK || 'testnet') as StellarNetwork;
const ADMIN_PUBLIC_KEY = process.env.ADMIN_WALLET_PUBLIC_KEY || '';
const ADMIN_SECRET_KEY = process.env.ADMIN_WALLET_SECRET_KEY || '';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Delay helper for retries
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get network configuration based on environment
 */
export function getNetworkConfig() {
    return NETWORKS[STELLAR_NETWORK] || NETWORKS.testnet;
}

/**
 * Get Stellar Horizon server instance
 */
export function getStellarServer(): StellarSdk.Horizon.Server {
    const config = getNetworkConfig();
    return new StellarSdk.Horizon.Server(config.server);
}

/**
 * Get admin keypair from environment
 */
export function getAdminKeypair(): StellarSdk.Keypair {
    if (!ADMIN_SECRET_KEY) {
        throw new Error('Admin wallet secret key not configured');
    }
    return StellarSdk.Keypair.fromSecret(ADMIN_SECRET_KEY);
}

/**
 * Get current network passphrase
 */
export function getNetworkPassphrase(): string {
    return getNetworkConfig().passphrase;
}

/**
 * Get current Stellar network name
 */
export function getCurrentNetwork(): StellarNetwork {
    return STELLAR_NETWORK;
}

/**
 * Validate Stellar address format
 */
export function validateStellarAddress(address: string): boolean {
    if (!address || typeof address !== 'string') return false;

    // Stellar addresses start with 'G' and are 56 characters
    const stellarRegex = /^G[A-Z2-7]{55}$/;

    if (!stellarRegex.test(address)) return false;

    // Validate using SDK
    try {
        StellarSdk.StrKey.decodeEd25519PublicKey(address);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if account exists on the network (with retry)
 */
export async function accountExists(address: string): Promise<boolean> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const server = getStellarServer();
            await server.loadAccount(address);
            return true;
        } catch (error: any) {
            if (error?.response?.status === 404) {
                return false;
            }
            if (attempt < MAX_RETRIES) {
                log(LogLevel.WARN, `Account check retry ${attempt}/${MAX_RETRIES}`, { address });
                await delay(RETRY_DELAY_MS * attempt);
            } else {
                throw error;
            }
        }
    }
    return false;
}

/**
 * Get account balance (with retry)
 */
export async function getAccountBalance(address: string): Promise<string> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const server = getStellarServer();
            const account = await server.loadAccount(address);

            const xlmBalance = account.balances.find(
                (b): b is StellarSdk.Horizon.HorizonApi.BalanceLineNative => b.asset_type === 'native'
            );

            return xlmBalance?.balance || '0';
        } catch (error: any) {
            if (attempt < MAX_RETRIES) {
                log(LogLevel.WARN, `Balance check retry ${attempt}/${MAX_RETRIES}`, { address });
                await delay(RETRY_DELAY_MS * attempt);
            } else {
                throw error;
            }
        }
    }
    return '0';
}

/**
 * Get admin wallet balance
 */
export async function getAdminBalance(): Promise<string> {
    if (!ADMIN_PUBLIC_KEY) {
        throw new Error('Admin wallet public key not configured');
    }
    return getAccountBalance(ADMIN_PUBLIC_KEY);
}

/**
 * Send XLM payment from admin wallet (with retry logic)
 */
export async function sendPayment(
    destinationAddress: string,
    amount: string | number,
    memo?: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Pre-flight checks
    if (!validateStellarAddress(destinationAddress)) {
        return { success: false, error: 'Invalid destination address format' };
    }

    if (!ADMIN_PUBLIC_KEY || !ADMIN_SECRET_KEY) {
        return { success: false, error: 'Admin wallet not configured' };
    }

    const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(amountNum) || amountNum <= 0) {
        return { success: false, error: 'Invalid payment amount' };
    }

    // Check admin balance before sending
    try {
        const adminBalance = await getAdminBalance();
        const available = parseFloat(adminBalance);
        const required = amountNum + 1; // Include buffer for fees

        if (available < required) {
            log(LogLevel.ERROR, 'Insufficient admin balance for payment', {
                available,
                required,
                destination: destinationAddress
            });
            return { success: false, error: `Insufficient admin balance: ${available} XLM available, ${required} XLM required` };
        }
    } catch (error: any) {
        return { success: false, error: `Failed to check admin balance: ${error.message}` };
    }

    // Check destination exists
    try {
        const destExists = await accountExists(destinationAddress);
        if (!destExists) {
            return { success: false, error: 'Destination account does not exist on Stellar network. User must create and fund their wallet first.' };
        }
    } catch (error: any) {
        return { success: false, error: `Failed to verify destination: ${error.message}` };
    }

    // Send payment with retry
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const server = getStellarServer();
            const keypair = getAdminKeypair();
            const sourceAccount = await server.loadAccount(ADMIN_PUBLIC_KEY);

            // Build transaction
            let txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: StellarSdk.BASE_FEE,
                networkPassphrase: getNetworkPassphrase(),
            })
                .addOperation(
                    StellarSdk.Operation.payment({
                        destination: destinationAddress,
                        asset: StellarSdk.Asset.native(),
                        amount: amountNum.toFixed(7),
                    })
                )
                .setTimeout(30);

            // Add memo if provided (max 28 chars)
            if (memo) {
                txBuilder = txBuilder.addMemo(StellarSdk.Memo.text(memo.substring(0, 28)));
            }

            const transaction = txBuilder.build();
            transaction.sign(keypair);

            // Submit to network
            const result = await server.submitTransaction(transaction);

            log(LogLevel.INFO, 'Stellar payment successful', {
                transactionId: result.hash,
                destination: destinationAddress,
                amount: amountNum
            });

            return {
                success: true,
                transactionId: result.hash,
            };

        } catch (error: any) {
            const isRetryable = isRetryableError(error);

            if (isRetryable && attempt < MAX_RETRIES) {
                log(LogLevel.WARN, `Payment retry ${attempt}/${MAX_RETRIES}`, {
                    destination: destinationAddress,
                    error: error.message
                });
                await delay(RETRY_DELAY_MS * attempt);
                continue;
            }

            // Extract error details
            let errorMessage = 'Payment failed';
            if (error?.response?.data?.extras?.result_codes) {
                const codes = error.response.data.extras.result_codes;
                errorMessage = formatStellarError(codes);
            } else if (error?.message) {
                errorMessage = error.message;
            }

            log(LogLevel.ERROR, 'Stellar payment failed', {
                destination: destinationAddress,
                amount: amountNum,
                error: errorMessage,
                attempt
            });

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    return { success: false, error: 'Max retries exceeded' };
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any): boolean {
    // Network errors are retryable
    if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
        return true;
    }
    // 5xx server errors are retryable
    if (error?.response?.status >= 500) {
        return true;
    }
    // Rate limiting is retryable
    if (error?.response?.status === 429) {
        return true;
    }
    return false;
}

/**
 * Format Stellar error codes to human-readable message
 */
function formatStellarError(resultCodes: any): string {
    const txCode = resultCodes.transaction;
    const opCodes = resultCodes.operations || [];

    const errorMap: Record<string, string> = {
        'tx_insufficient_balance': 'Admin wallet has insufficient balance',
        'tx_bad_seq': 'Transaction sequence error - please retry',
        'tx_failed': 'Transaction failed',
        'op_underfunded': 'Not enough funds to complete payment',
        'op_no_destination': 'Destination account does not exist',
        'op_no_trust': 'Destination cannot receive this asset',
    };

    if (txCode && errorMap[txCode]) {
        return errorMap[txCode];
    }

    for (const opCode of opCodes) {
        if (errorMap[opCode]) {
            return errorMap[opCode];
        }
    }

    return `Stellar error: ${txCode || 'unknown'} - ${opCodes.join(', ') || 'no details'}`;
}

/**
 * Verify a transaction exists on the network
 */
export async function verifyTransaction(transactionId: string): Promise<{
    exists: boolean;
    amount?: string;
    from?: string;
    to?: string;
}> {
    try {
        const server = getStellarServer();
        await server.transactions().transaction(transactionId).call();

        const operations = await server
            .operations()
            .forTransaction(transactionId)
            .call();

        const paymentOp = operations.records.find(
            (op: any) => op.type === 'payment' && op.asset_type === 'native'
        ) as any;

        return {
            exists: true,
            amount: paymentOp?.amount,
            from: paymentOp?.from,
            to: paymentOp?.to,
        };
    } catch (error: any) {
        if (error?.response?.status === 404) {
            return { exists: false };
        }
        log(LogLevel.ERROR, 'Transaction verification failed', { transactionId, error: error.message });
        throw error;
    }
}

/**
 * Get Stellar explorer URL for a transaction
 */
export function getExplorerUrl(transactionId: string): string {
    const baseUrl = STELLAR_NETWORK === 'mainnet'
        ? 'https://stellar.expert/explorer/public/tx'
        : 'https://stellar.expert/explorer/testnet/tx';
    return `${baseUrl}/${transactionId}`;
}
