import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';
import { Dropdown } from '@/components/ui/Dropdown';

interface Transaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    description: string;
    created_at: string;
}

const FILTER_OPTIONS = ['All', 'Earning', 'Withdrawal'];

export default function WalletHistoryPage() {
    const navigate = useNavigate();
    const supabase = createClient();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/login');
            return;
        }

        const { data } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        setTransactions(data || []);
        setIsLoading(false);
    };

    const filteredTransactions = transactions.filter(t =>
        filter === 'All' || t.type.toLowerCase() === filter.toLowerCase()
    );

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 font-inter text-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link to="/wallet" className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900">Transaction History</h1>
                </div>
                <Dropdown
                    options={FILTER_OPTIONS}
                    value={filter}
                    onChange={setFilter}
                />
            </div>

            {/* Transactions List */}
            {filteredTransactions.length > 0 ? (
                <div className="space-y-3">
                    {filteredTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'earning' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                {tx.type === 'earning' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                                {tx.type === 'withdrawal' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 capitalize">{tx.type}</p>
                                <p className="text-xs text-slate-500 truncate">{tx.description || 'No description'}</p>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold ${tx.type === 'withdrawal' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {tx.type === 'withdrawal' ? '-' : '+'}{tx.amount.toFixed(2)} XLM
                                </p>
                                <p className="text-xs text-slate-400">
                                    {new Date(tx.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-slate-50 rounded-xl">
                    <span className="text-4xl mb-4 block">📋</span>
                    <h3 className="font-bold text-slate-900 mb-2">No transactions yet</h3>
                    <p className="text-slate-500 text-sm">Your transaction history will appear here</p>
                </div>
            )}
        </div>
    );
}
