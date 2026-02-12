import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Dropdown } from '@/components/ui/Dropdown';
import { ChevronLeft, TrendingUp, ArrowUpRight } from 'lucide-react';

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
            <div className="min-h-screen bg-background flex justify-center items-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-8 font-inter text-foreground">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link to="/wallet" className="p-2 -ml-2 rounded-lg hover:bg-background-secondary transition-colors text-foreground-secondary hover:text-foreground">
                            <ChevronLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-xl font-bold text-foreground">Transaction History</h1>
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
                            <div key={tx.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'earning' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'}`}>
                                    {tx.type === 'earning' ? <TrendingUp className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-foreground capitalize">{tx.type}</p>
                                    <p className="text-xs text-foreground-secondary truncate">{tx.description || 'No description'}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${tx.type === 'withdrawal' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {tx.type === 'withdrawal' ? '-' : '+'}{tx.amount.toFixed(2)} XLM
                                    </p>
                                    <p className="text-xs text-foreground-secondary">
                                        {new Date(tx.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-background-secondary rounded-xl border border-border">
                        <span className="text-4xl mb-4 block">📋</span>
                        <h3 className="font-bold text-foreground mb-2">No transactions yet</h3>
                        <p className="text-foreground-secondary text-sm">Your transaction history will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
}
