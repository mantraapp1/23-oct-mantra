import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { ChevronLeft, Plus, Sparkles } from 'lucide-react';
import novelService from '@/services/novelService';
import walletService from '@/services/walletService';
import type { Novel } from '@/types/supabase';

export default function AuthorDashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { goBack, navigate } = useAppNavigation();
    const [novels, setNovels] = useState<Novel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({ novels: 0, views: '0', earnings: '0.00' });
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) navigate('/login');
        if (user) loadDashboard(user.id);
    }, [user, authLoading, navigate]);

    const loadDashboard = async (userId: string) => {
        setIsLoading(true);
        try {
            const novelsData = await novelService.getNovelsByAuthor(userId);
            setNovels(novelsData);

            // Load wallet data
            const wallet = await walletService.getWallet(userId);

            // Calculate total views
            const totalViews = novelsData.reduce((sum, novel) => sum + (novel.total_views || 0), 0);

            setStats({
                novels: novelsData.length,
                views: formatViews(totalViews),
                earnings: wallet?.total_earned?.toFixed(2) || '0.00',
            });
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatViews = (count: number): string => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
        return count.toString();
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsDeleting(true);
        try {
            const result = await novelService.deleteNovel(deleteId);
            if (result.success) {
                setNovels(prev => prev.filter(n => n.id !== deleteId));
                setStats(prev => ({ ...prev, novels: prev.novels - 1 }));
            }
        } catch (error) {
            console.error('Error deleting novel:', error);
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="w-8 h-8 border-4 border-sky-500/90 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-foreground-secondary">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-inter">
            {/* Header */}
            <div className="sticky top-0 z-40 border-b border-border bg-background">
                <div className="px-4 sm:px-6 lg:px-8 py-3">
                    <div className="relative h-12 sm:h-14">
                        <button
                            onClick={() => navigate('/profile')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-border bg-card/70 flex items-center justify-center hover:bg-card transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <div className="flex h-full items-center justify-center">
                            <h1 className="text-sm sm:text-base font-semibold tracking-tight">Author Dashboard</h1>
                        </div>

                        <button
                            onClick={() => navigate('/novel/create')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-sky-500/25 hover:bg-sky-600 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
                {/* Stats */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground-secondary">Novels</p>
                        <p className="text-2xl font-bold text-foreground mt-3">{stats.novels}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground-secondary">Views</p>
                        <p className="text-2xl font-bold text-foreground mt-3">{stats.views}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground-secondary">Earnings</p>
                        <p className="text-2xl font-bold text-foreground mt-3">${stats.earnings}</p>
                    </div>
                </section>

                {/* Novel List */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Your novels</h2>
                        {novels.length > 0 && (
                            <button
                                onClick={() => navigate('/novel/create')}
                                className="text-xs font-semibold text-sky-500 hover:text-sky-600 transition-colors"
                            >
                                New novel
                            </button>
                        )}
                    </div>

                    {novels.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {novels.map((novel) => (
                                <div
                                    key={novel.id}
                                    className="group flex h-full gap-4 rounded-3xl border border-border/80 bg-card/95 p-4 shadow-sm transition-all hover:border-sky-200 hover:shadow-md dark:hover:border-sky-700"
                                >
                                    <button
                                        onClick={() => navigate(`/novel/manage/${novel.id}`)}
                                        className="relative h-28 w-24 overflow-hidden rounded-2xl border border-border bg-background-secondary flex-shrink-0"
                                    >
                                        <img
                                            src={novel.cover_image_url || '/placeholder.jpg'}
                                            alt={novel.title}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </button>

                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                                        <button
                                            onClick={() => navigate(`/novel/manage/${novel.id}`)}
                                            className="text-left"
                                        >
                                            <h3 className="text-base font-semibold text-foreground line-clamp-1 group-hover:text-sky-500 transition-colors">
                                                {novel.title}
                                            </h3>
                                            <p className="text-xs text-foreground-secondary mt-1">
                                                {novel.total_chapters || 0} chapters · {formatViews(novel.total_views || 0)} views
                                            </p>
                                        </button>

                                        <div className="flex flex-wrap gap-4 pt-3 text-xs font-semibold">
                                            <button
                                                onClick={() => navigate(`/novel/edit/${novel.id}`)}
                                                className="text-sky-500 hover:text-sky-600"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => navigate(`/novel/${novel.id}/create-chapter`)}
                                                className="text-sky-500 hover:text-sky-600"
                                            >
                                                + Chapter
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(novel.id)}
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-border bg-background-secondary py-16 px-6 text-center">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-card flex items-center justify-center shadow-md">
                                <Sparkles className="w-7 h-7 text-foreground-secondary" />
                            </div>
                            <h3 className="text-lg font-semibold mt-6">No novels yet</h3>
                            <p className="text-sm text-foreground-secondary mt-2 max-w-sm mx-auto">
                                Start your first story to unlock detailed analytics, earnings tracking, and more author tools.
                            </p>
                            <button
                                onClick={() => navigate('/novel/create')}
                                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-sky-500 text-white text-sm font-semibold shadow-lg shadow-sky-500/25 hover:bg-sky-600 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Create your first novel
                            </button>
                        </div>
                    )}
                </section>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
                    <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-foreground mb-3">Delete novel?</h3>
                        <p className="text-sm text-foreground-secondary leading-relaxed mb-6">
                            Are you sure you want to delete this novel? This will permanently remove all chapters, reviews, and analytics. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteId(null)}
                                disabled={isDeleting}
                                className="flex-1 h-11 rounded-full border border-border bg-background-secondary text-sm font-semibold text-foreground transition-colors hover:bg-background"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 h-11 rounded-full bg-red-500 text-sm font-semibold text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors flex items-center justify-center"
                            >
                                {isDeleting ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    'Delete'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
