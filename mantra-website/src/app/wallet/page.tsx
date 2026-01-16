'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Wallet {
    balance: number;
    total_earned: number;
    total_withdrawn: number;
}

interface Transaction {
    id: string;
    type: 'earning' | 'withdrawal';
    amount: number;
    status: string;
    created_at: string;
}

export default function WalletPage() {
    const [user, setUser] = useState<User | null>(null);
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }
        setUser(user);
        loadData(user.id);
    };

    const loadData = async (userId: string) => {
        // Load wallet
        const { data: walletData } = await supabase
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();

        setWallet(walletData);

        // Load transactions
        const { data: txData } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        setTransactions(txData || []);
        setIsLoading(false);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">💰 Wallet</h1>

            {/* Balance Card */}
            <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl p-6 text-white mb-8">
                <p className="text-white/80 text-sm">Current Balance</p>
                <p className="text-4xl font-bold my-2">
                    {wallet?.balance?.toLocaleString() || 0} <span className="text-xl">XLM</span>
                </p>
                <div className="flex gap-6 mt-4 text-sm text-white/80">
                    <div>
                        <p>Total Earned</p>
                        <p className="font-semibold text-white">{wallet?.total_earned?.toLocaleString() || 0} XLM</p>
                    </div>
                    <div>
                        <p>Total Withdrawn</p>
                        <p className="font-semibold text-white">{wallet?.total_withdrawn?.toLocaleString() || 0} XLM</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <Link
                    href="/wallet/withdraw"
                    className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl text-center hover:bg-[var(--background-secondary)] transition-colors"
                >
                    <span className="text-2xl mb-2 block">💸</span>
                    <span className="font-semibold text-[var(--foreground)]">Withdraw</span>
                </Link>
                <Link
                    href="/wallet/history"
                    className="p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl text-center hover:bg-[var(--background-secondary)] transition-colors"
                >
                    <span className="text-2xl mb-2 block">📊</span>
                    <span className="font-semibold text-[var(--foreground)]">History</span>
                </Link>
            </div>

            {/* Recent Transactions */}
            <div>
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">Recent Transactions</h2>
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                    {transactions.length > 0 ? (
                        <div className="divide-y divide-[var(--border)]">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'earning' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                            }`}>
                                            {tx.type === 'earning' ? '↗️' : '↙️'}
                                        </span>
                                        <div>
                                            <p className="font-medium text-[var(--foreground)] capitalize">{tx.type}</p>
                                            <p className="text-sm text-[var(--foreground-secondary)]">
                                                {new Date(tx.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${tx.type === 'earning' ? 'text-emerald-600' : 'text-amber-600'
                                            }`}>
                                            {tx.type === 'earning' ? '+' : '-'}{Math.abs(tx.amount)} XLM
                                        </p>
                                        <p className={`text-xs ${tx.status === 'successful' ? 'text-emerald-600' :
                                                tx.status === 'pending' ? 'text-amber-600' : 'text-red-600'
                                            }`}>
                                            {tx.status}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-[var(--foreground-secondary)]">
                            No transactions yet. Start writing to earn!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
