import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WalletSkeleton } from '@/components/ui/Skeleton';
import type { Wallet, Transaction } from '@/types/database';

export default function WalletPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const supabase = createClient();

    useEffect(() => {
        // Redirect if not authenticated
        if (!authLoading && !user) {
            navigate('/login');
            return;
        }

        if (user) {
            loadData(user.id);
        }
    }, [user, authLoading, navigate]);

    const loadData = async (userId: string) => {
        try {
            // Get or create wallet (matching mobile walletService behavior)
            let { data: walletData } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', userId)
                .single();

            // Create wallet if it doesn't exist
            if (!walletData) {
                const { data: newWallet } = await supabase
                    .from('wallets')
                    .insert({ user_id: userId })
                    .select('*')
                    .single();
                walletData = newWallet;
            }

            setWallet(walletData);

            // Load recent transactions (last 10, matching mobile)
            const { data: txData } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10);

            setTransactions(txData || []);
        } catch (error) {
            console.error('Error loading wallet data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <WalletSkeleton />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-inter text-[var(--foreground)]">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">💰 Wallet</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Balance Card */}
                <div className="md:col-span-2 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div>
                        <p className="text-white/80 text-sm font-medium mb-1">Current Balance</p>
                        <p className="text-4xl md:text-5xl font-bold">
                            {wallet?.balance?.toLocaleString() || 0} <span className="text-2xl md:text-3xl font-medium opacity-80">XLM</span>
                        </p>
                    </div>
                    <div className="flex gap-8 mt-8 text-sm text-white/90">
                        <div>
                            <p className="opacity-70 text-xs uppercase tracking-wider font-bold mb-0.5">Total Earned</p>
                            <p className="font-bold text-lg">{wallet?.total_earned?.toLocaleString() || 0} XLM</p>
                        </div>
                        <div>
                            <p className="opacity-70 text-xs uppercase tracking-wider font-bold mb-0.5">Total Withdrawn</p>
                            <p className="font-bold text-lg">{wallet?.total_withdrawn?.toLocaleString() || 0} XLM</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-4">
                    <Link
                        to="/wallet/withdraw"
                        className="flex-1 flex items-center justify-center flex-col p-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-center hover:bg-[var(--background-secondary)] transition-all shadow-sm group"
                    >
                        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">💸</span>
                        <span className="font-bold text-[var(--foreground)]">Withdraw Funds</span>
                        <span className="text-xs text-[var(--foreground-secondary)] mt-1">Transfer to external wallet</span>
                    </Link>
                    <Link
                        to="/wallet/history"
                        className="flex-1 flex items-center justify-center flex-col p-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-center hover:bg-[var(--background-secondary)] transition-all shadow-sm group"
                    >
                        <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📊</span>
                        <span className="font-bold text-[var(--foreground)]">Transaction History</span>
                        <span className="text-xs text-[var(--foreground-secondary)] mt-1">View all activity</span>
                    </Link>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                    <h2 className="text-lg font-bold text-[var(--foreground)]">Recent Activity</h2>
                    <Link to="/wallet/history" className="text-sm font-semibold text-sky-600 hover:text-sky-700">See All</Link>
                </div>

                {transactions.length > 0 ? (
                    <div className="divide-y divide-[var(--border)]">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-[var(--background-secondary)] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${tx.type === 'earning' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                                        }`}>
                                        {tx.type === 'earning' ? '↗️' : '↙️'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[var(--foreground)] capitalize">{tx.type}</p>
                                        <p className="text-xs text-[var(--foreground-secondary)] font-medium">
                                            {new Date(tx.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${tx.type === 'earning' ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--foreground)]'
                                        }`}>
                                        {tx.type === 'earning' ? '+' : '-'}{Math.abs(tx.amount)} XLM
                                    </p>
                                    <p className={`text-xs font-bold uppercase tracking-wide ${tx.status === 'successful' ? 'text-emerald-600 dark:text-emerald-400' :
                                        tx.status === 'pending' ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400'
                                        }`}>
                                        {tx.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="text-4xl mb-4">📜</div>
                        <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">No transactions yet</h3>
                        <p className="text-[var(--foreground-secondary)] text-sm">Your earning and withdrawal history will appear here.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
