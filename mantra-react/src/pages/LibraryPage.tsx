import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/DialogContext';
import { Bookmark, Clock, ArrowRight } from 'lucide-react';
import { useLibrary, useReadingHistory, useLibraryMutation } from '@/hooks/useLibrary';
import { formatTimeAgo } from '@/utils/dateUtils';
import readingService from '@/services/readingService';

export default function LibraryPage() {
    const { user, isLoading: authLoading } = useAuth(); // HMR Fix 
    const { toast } = useToast();
    const confirm = useConfirm();

    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');

    const {
        data: library = [],
        isLoading: libraryLoading,
    } = useLibrary(user?.id);
    const {
        data: history = [],
        isLoading: historyLoading,
        refetch: refetchHistory,
    } = useReadingHistory(user?.id);
    const libraryMutation = useLibraryMutation();

    if (authLoading) return null;
    if (!user) {
        navigate('/login');
        return null;
    }

    const handleRemove = async (novelId: string, novelTitle: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (await confirm(`Remove "${novelTitle}" from your library?`, { title: 'Remove Novel', variant: 'destructive', confirmText: 'Remove' })) {
            libraryMutation.mutate({ userId: user.id, novelId, action: 'remove' });
            toast.success('Novel removed from library');
        }
    };

    const handleClearHistory = async () => {
        if (history.length === 0) return;
        if (!await confirm('Clear your reading history?', { title: 'Clear History', variant: 'destructive', confirmText: 'Clear' })) return;

        const result = await readingService.clearReadingHistory(user.id);
        if (result.success) {
            refetchHistory();
            toast.success('Reading history cleared');
        } else {
            toast.error(result.message || 'Failed to clear history');
        }
    };

    const isLoading = activeTab === 'saved' ? libraryLoading : historyLoading;

    const emptySavedState = (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-background-secondary rounded-2xl border border-dashed border-border">
            <div className="w-20 h-20 bg-card rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Bookmark className="w-10 h-10 text-foreground-secondary opacity-50" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">No saved books yet</h3>
            <p className="text-sm text-foreground-secondary mb-8 max-w-[240px] leading-relaxed mx-auto font-medium">
                Start building your collection by saving your favorite novels.
            </p>
            <Link to="/ranking" className="px-8 py-3.5 bg-sky-500 text-white rounded-xl font-bold text-sm hover:bg-sky-600 transition shadow-lg shadow-sky-500/20 flex items-center gap-2 active:scale-95">
                Explore Novels <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );

    const emptyHistoryState = (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-background-secondary rounded-2xl border border-dashed border-border">
            <div className="w-20 h-20 bg-card rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Clock className="w-10 h-10 text-foreground-secondary opacity-50" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">No reading history</h3>
            <p className="text-sm text-foreground-secondary mb-8 max-w-[240px] leading-relaxed mx-auto font-medium">
                Your recently read novels will appear here. Start your next adventure today!
            </p>
            <Link to="/" className="px-8 py-3.5 bg-sky-500 text-white rounded-xl font-bold text-sm hover:bg-sky-600 transition shadow-lg shadow-sky-500/20 flex items-center gap-2 active:scale-95">
                Start Reading <ArrowRight className="w-4 h-4" />
            </Link>
        </div>
    );

    const renderProgressInfo = (item: any) => {
        const progress = item.progress?.[0];
        const percentage = Math.round(progress?.progress_percentage || 0);
        const isOngoing = item.novel?.status?.toLowerCase() === 'ongoing';
        const isUpToDate = isOngoing && percentage >= 100;

        return {
            percentage,
            isUpToDate,
            label: isUpToDate ? 'Up to date' : `${percentage}% read`,
        };
    };

    const formatViews = (views?: number) => {
        if (!views || views < 0) return '0';
        if (views >= 1000) {
            return `${Math.floor(views / 1000)}k`;
        }
        return views.toString();
    };

    return (
        <div className="max-w-5xl mx-auto bg-background min-h-screen pb-24 font-inter text-foreground">
            {/* Header */}
            <div className="sticky top-0 bg-background z-40 border-b border-border">
                <div className="px-6 py-4 flex flex-col gap-4">
                    <div className="flex items-center justify-start">
                        <h1 className="text-lg font-bold text-foreground tracking-tight">Library</h1>
                    </div>

                    {/* Mobile-Parity Tabs */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all border ${activeTab === 'saved'
                                ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/20'
                                : 'bg-card border-border text-foreground-secondary hover:border-sky-300 dark:hover:border-sky-700'
                                }`}
                        >
                            Saved
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all border ${activeTab === 'history'
                                ? 'bg-sky-500 border-sky-500 text-white shadow-lg shadow-sky-500/20'
                                : 'bg-card border-border text-foreground-secondary hover:border-sky-300 dark:hover:border-sky-700'
                                }`}
                        >
                            History
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-6 py-6">
                {isLoading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex gap-3 p-3 rounded-xl border border-border bg-card">
                                {/* Cover */}
                                <div className="h-20 w-14 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse flex-shrink-0" />
                                {/* Content */}
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                                    <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                                    <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activeTab === 'saved' ? (
                    <div className="space-y-4">
                        <p className="text-xs font-semibold text-foreground-secondary px-1">Your saved books</p>

                        {library.length > 0 ? (
                            <div className="space-y-3">
                                {library.map((item: any) => {
                                    const novel = item.novel;
                                    if (!novel) return null;
                                    const { percentage, isUpToDate, label } = renderProgressInfo(item);

                                    return (
                                        <Link
                                            to={`/novel/${novel.id}`}
                                            key={item.id}
                                            className="flex gap-4 p-4 rounded-2xl border border-border bg-card transition-transform active:scale-[0.98]"
                                        >
                                            <div className="relative w-16 h-20 flex-shrink-0">
                                                <img
                                                    src={novel.cover_image_url || '/placeholder.jpg'}
                                                    className="h-full w-full rounded-xl object-cover bg-background-secondary shadow-sm"
                                                    alt={novel.title}
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0 flex flex-col gap-2">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-sky-500 transition-colors">
                                                        {novel.title}
                                                    </h3>
                                                    <p className="text-[11px] text-foreground-secondary font-medium mt-0.5 line-clamp-1">
                                                        {novel.genres?.[0] || 'Uncategorized'} · {novel.average_rating || 0}★
                                                    </p>
                                                </div>

                                                <div className="space-y-2 pt-1">
                                                    <div className="w-full h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-white/15 shadow-inner">
                                                        <div
                                                            className="h-full bg-sky-500 dark:bg-sky-400 rounded-full transition-all duration-700"
                                                            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <span className={`text-[10px] font-semibold ${isUpToDate ? 'text-emerald-500 dark:text-emerald-400' : 'text-foreground-secondary'}`}>
                                                            {label}
                                                        </span>
                                                        <button
                                                            className="text-[10px] font-semibold text-red-500 hover:text-red-600"
                                                            onClick={(e) => handleRemove(novel.id, novel.title, e)}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            emptySavedState
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <p className="text-xs font-semibold text-foreground-secondary">Recently opened</p>
                            <button
                                className="text-[10px] font-semibold text-red-500 hover:text-red-600"
                                onClick={handleClearHistory}
                            >
                                Clear History
                            </button>
                        </div>

                        {history.length > 0 ? (
                            <div className="space-y-3">
                                {history.map((item: any) => {
                                    const novel = item.novel;
                                    if (!novel) return null;

                                    return (
                                        <Link
                                            to={`/novel/${novel.id}`}
                                            key={item.id}
                                            className="flex gap-4 p-4 rounded-2xl border border-border bg-card transition-transform active:scale-[0.98]"
                                        >
                                            <div className="w-16 h-20 flex-shrink-0">
                                                <img
                                                    src={novel.cover_image_url || '/placeholder.jpg'}
                                                    className="h-full w-full rounded-lg object-cover bg-background-secondary shadow-sm"
                                                    alt={novel.title}
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                                                        {novel.title}
                                                    </h3>
                                                    <p className="text-[11px] text-foreground-secondary font-medium mt-0.5 line-clamp-1">
                                                        {novel.genres?.[0] || 'Uncategorized'} · {novel.average_rating || 0}★ · {formatViews(novel.total_views)} views
                                                    </p>
                                                    <p className="text-xs text-foreground-secondary line-clamp-2 mt-1">
                                                        {novel.description || 'No description available.'}
                                                    </p>
                                                    <p className="text-[10px] text-foreground-secondary mt-2">
                                                        Read {formatTimeAgo(item.last_read_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ) : (
                            emptyHistoryState
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
