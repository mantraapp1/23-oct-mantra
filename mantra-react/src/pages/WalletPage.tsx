import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
    Coins,
    TrendingUp,
    ArrowUpRight,
    History,
    ChevronLeft,
    CheckCircle2,
    Clock,
    XCircle
} from 'lucide-react';
import { useWallet, useTransactions } from '@/hooks/useWallet';

export default function WalletPage() {
    const { user, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const { data: wallet, isLoading: walletLoading } = useWallet(user?.id);
    const { data: transactions = [], isLoading: txLoading } = useTransactions(user?.id);

    if (authLoading) return null;
    if (!user) {
        navigate('/login');
        return null;
    }

    if (walletLoading || txLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'successful':
                return {
                    bg: 'bg-emerald-50',
                    text: 'text-emerald-600',
                    icon: CheckCircle2,
                    border: 'border-emerald-100'
                };
            case 'pending':
                return {
                    bg: 'bg-amber-50',
                    text: 'text-amber-600',
                    icon: Clock,
                    border: 'border-amber-100'
                };
            case 'failed':
                return {
                    bg: 'bg-red-50',
                    text: 'text-red-600',
                    icon: XCircle,
                    border: 'border-red-100'
                };
            default:
                return {
                    bg: 'bg-slate-50',
                    text: 'text-slate-600',
                    icon: Clock,
                    border: 'border-slate-100'
                };
        }
    };

    return (
        <div className="w-full mx-auto bg-background min-h-screen pb-24 font-inter text-foreground">
            {/* Header */}
            <div className="sticky top-0 bg-background z-40 border-b border-border">
                <div className="px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/profile')}
                        className="p-2 hover:bg-background-secondary rounded-xl transition-colors text-foreground-secondary hover:text-foreground"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-foreground">Wallet</h1>
                </div>
            </div>

            <div className="px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Balance + Actions */}
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                    {/* Balance Card - Gradient identical to App */}
                    <div className="bg-gradient-to-br from-[#0ea5e9] to-[#4f46e5] rounded-[40px] p-8 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-sky-100 flex flex-col justify-between min-h-[240px]">
                        {/* Abstract Decorations */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full -ml-24 -mb-24 blur-3xl"></div>

                        <div className="relative z-10">
                            <p className="text-sm font-bold opacity-80 uppercase tracking-[0.2em] mb-2 px-1">Total Balance</p>
                            <div className="flex items-baseline gap-3">
                                <h2 className="text-5xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter">
                                    {wallet?.balance?.toLocaleString() || '0.00'}
                                </h2>
                                <span className="text-2xl font-bold text-sky-200">XLM</span>
                            </div>
                        </div>

                        <div className="relative z-10 grid grid-cols-2 gap-4 pt-8 border-t border-white/10 mt-8">
                            <div>
                                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Total Earned</p>
                                <p className="text-lg font-bold">{wallet?.total_earned?.toLocaleString() || '0.00'} XLM</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Total Withdrawn</p>
                                <p className="text-lg font-bold">{wallet?.total_withdrawn?.toLocaleString() || '0.00'} XLM</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            to="/wallet/history"
                            className="group bg-card border border-border p-4 rounded-[24px] flex flex-col items-center gap-2 hover:border-primary/30 hover:shadow-xl transition-all active:scale-[0.98]"
                        >
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <History className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-foreground text-sm">History</span>
                        </Link>

                        <Link
                            to="/wallet/withdraw"
                            className="group bg-card border border-border p-4 rounded-[24px] flex flex-col items-center gap-2 hover:border-purple-300 hover:shadow-xl transition-all active:scale-[0.98]"
                        >
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                <ArrowUpRight className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-foreground text-sm">Withdraw</span>
                        </Link>
                    </div>
                </div>

                {/* Right Column: Recent Transactions List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-lg font-bold text-foreground">Recent Transactions</h2>
                        <Link to="/wallet/history" className="text-xs font-bold text-primary hover:text-primary/80">See all</Link>
                    </div>

                    <div className="space-y-3">
                        {transactions.length > 0 ? (
                            transactions.map((tx: any) => {
                                const styles = getStatusStyles(tx.status);
                                const StatusIcon = styles.icon;

                                return (
                                    <div
                                        key={tx.id}
                                        className={`flex items-center justify-between p-5 rounded-[32px] border transition-all hover:shadow-md ${tx.status === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
                                            tx.status === 'failed' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                                                'bg-card border-border'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'earning' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500' : 'bg-background-secondary text-foreground-secondary'
                                                }`}>
                                                {tx.type === 'earning' ? <TrendingUp className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground text-sm capitalize">{tx.type === 'earning' ? 'Novel Earnings' : 'Withdrawal'}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <StatusIcon className={`w-3 h-3 ${styles.text}`} />
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${styles.text}`}>
                                                        {tx.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${tx.type === 'earning' ? 'text-emerald-500' : 'text-foreground'}`}>
                                                {tx.type === 'earning' ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}
                                                <span className="text-[10px] ml-1">XLM</span>
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                                {new Date(tx.created_at).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-background-secondary rounded-[40px] border border-dashed border-border">
                                <div className="w-16 h-16 bg-card rounded-3xl flex items-center justify-center mb-4 shadow-sm">
                                    <Coins className="w-8 h-8 text-foreground-secondary" />
                                </div>
                                <p className="text-sm font-bold text-foreground">No activity yet</p>
                                <p className="text-xs text-foreground-secondary mt-1">Your earnings will show up here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
