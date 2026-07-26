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
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingSpinner />
            </div>
        );
    }

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'successful':
                return {
                    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    icon: CheckCircle2,
                    text: 'text-emerald-600 dark:text-emerald-400'
                };
            case 'pending':
                return {
                    bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                    icon: Clock,
                    text: 'text-amber-600 dark:text-amber-400'
                };
            case 'failed':
                return {
                    bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                    icon: XCircle,
                    text: 'text-rose-600 dark:text-rose-400'
                };
            default:
                return {
                    bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
                    icon: Clock,
                    text: 'text-slate-600 dark:text-slate-400'
                };
        }
    };

    return (
        <div className="w-full mx-auto bg-background min-h-screen pb-24 font-sans text-foreground">
            {/* Header */}
            <div className="sticky top-0 bg-background/90 backdrop-blur-md z-40 border-b border-border">
                <div className="px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/profile')}
                        className="p-2 hover:bg-background-secondary rounded-xl transition-colors text-foreground-secondary hover:text-foreground"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-extrabold text-foreground">Wallet</h1>
                </div>
            </div>

            <div className="px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Balance + Actions */}
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                    {/* Balance Card - Matching website signature gradient */}
                    <div className="bg-gradient-to-br from-[#0ea5e9] to-[#4f46e5] rounded-[32px] p-7 md:p-8 text-white relative overflow-hidden shadow-xl shadow-sky-500/10 flex flex-col justify-between min-h-[240px]">
                        {/* Subtle Background Glows */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full -ml-24 -mb-24 blur-3xl pointer-events-none"></div>

                        <div className="relative z-10">
                            <p className="text-xs font-extrabold opacity-80 uppercase tracking-[0.2em] mb-2 px-0.5">Total Balance</p>
                            <div className="flex items-baseline gap-3">
                                <h2 className="text-4xl md:text-5xl font-black tracking-tight">
                                    {wallet?.balance?.toLocaleString() || '0.00'}
                                </h2>
                                <span className="text-xl font-extrabold text-sky-200">XLM</span>
                            </div>
                        </div>

                        <div className="relative z-10 grid grid-cols-2 gap-4 pt-6 border-t border-white/20 mt-6">
                            <div>
                                <p className="text-[10px] font-extrabold opacity-70 uppercase tracking-widest mb-1">Total Earned</p>
                                <p className="text-base font-extrabold">{wallet?.total_earned?.toLocaleString() || '0.00'} XLM</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-extrabold opacity-70 uppercase tracking-widest mb-1">Total Withdrawn</p>
                                <p className="text-base font-extrabold">{wallet?.total_withdrawn?.toLocaleString() || '0.00'} XLM</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            to="/wallet/history"
                            className="group bg-card border border-border hover:border-primary/40 p-4 rounded-[24px] flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-[0.98]"
                        >
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                                <History className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-foreground text-sm">History</span>
                        </Link>

                        <Link
                            to="/wallet/withdraw"
                            className="group bg-card border border-border hover:border-amber-400/50 p-4 rounded-[24px] flex flex-col items-center gap-2 hover:shadow-md transition-all active:scale-[0.98] relative overflow-hidden"
                        >
                            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-sm">
                                Paused
                            </span>
                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
                                <ArrowUpRight className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-foreground text-sm">Withdraw</span>
                        </Link>
                    </div>
                </div>

                {/* Right Column: Recent Transactions List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-extrabold text-foreground">Recent Transactions</h2>
                        <Link to="/wallet/history" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">See all</Link>
                    </div>

                    <div className="space-y-3">
                        {transactions.length > 0 ? (
                            transactions.map((tx: any) => {
                                const styles = getStatusStyles(tx.status);
                                const StatusIcon = styles.icon;
                                const isEarning = tx.type === 'earning';

                                return (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-4 sm:p-5 rounded-[24px] bg-card border border-border hover:border-border/80 transition-all hover:shadow-sm"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                                isEarning ? 'bg-emerald-500/10 text-emerald-500' : 'bg-background-secondary text-foreground-secondary'
                                            }`}>
                                                {isEarning ? <TrendingUp className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
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
                                            <p className={`font-bold text-base ${isEarning ? 'text-emerald-500' : 'text-foreground'}`}>
                                                {isEarning ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}
                                                <span className="text-xs font-bold text-foreground-secondary ml-1">XLM</span>
                                            </p>
                                            <p className="text-[10px] text-foreground-secondary font-bold uppercase tracking-wider mt-0.5">
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
                            <div className="flex flex-col items-center justify-center py-20 bg-background-secondary rounded-[32px] border border-dashed border-border text-center">
                                <div className="w-16 h-16 bg-card rounded-3xl flex items-center justify-center mb-4 shadow-sm text-foreground-secondary">
                                    <Coins className="w-8 h-8" />
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
