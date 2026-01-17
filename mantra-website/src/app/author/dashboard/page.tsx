'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Novel {
    id: string;
    title: string;
    cover_image_url: string;
    view_count: number;
    like_count: number;
    status: string;
    is_published: boolean;
    chapter_count?: number;
}

interface Stats {
    totalNovels: number;
    totalViews: number;
    totalLikes: number;
    totalEarnings: number;
}

export default function AuthorDashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [novels, setNovels] = useState<Novel[]>([]);
    const [stats, setStats] = useState<Stats>({ totalNovels: 0, totalViews: 0, totalLikes: 0, totalEarnings: 0 });
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
        setIsLoading(true);
        try {
            // Load all data in parallel
            const [profileResult, novelsResult, walletResult] = await Promise.all([
                // Load profile
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single(),

                // Load author's novels - FIXED column names
                supabase
                    .from('novels')
                    .select('id, title, cover_image_url, total_views, total_votes, status')
                    .eq('author_id', userId)
                    .order('created_at', { ascending: false }),

                // Load wallet for earnings
                supabase
                    .from('wallets')
                    .select('total_earned')
                    .eq('user_id', userId)
                    .single()
            ]);

            setProfile(profileResult.data);

            const novelsList = (novelsResult.data || []).map((n: any) => ({
                ...n,
                view_count: n.total_views, // Map to interface expected names
                like_count: n.total_votes,
                is_published: true // Default to true since column is missing in schema
            }));

            setNovels(novelsList);

            // Calculate stats
            const totalViews = novelsList.reduce((sum, n) => sum + (n.view_count || 0), 0);
            const totalLikes = novelsList.reduce((sum, n) => sum + (n.like_count || 0), 0);

            setStats({
                totalNovels: novelsList.length,
                totalViews,
                totalLikes,
                totalEarnings: walletResult.data?.total_earned || 0,
            });
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-inter text-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Author Dashboard</h1>
                    <p className="text-slate-500 mt-1">Welcome back, {profile?.username || 'Author'}!</p>
                </div>
                <Link
                    href="/author/novels/new"
                    className="px-6 py-3 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-colors shadow-sm active:scale-[0.98]"
                >
                    + New Novel
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium">Total Novels</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalNovels}</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium">Total Views</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalViews.toLocaleString()}</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
                    <p className="text-slate-500 text-sm font-medium">Total Likes</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalLikes.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-xl p-5 text-white shadow-md">
                    <p className="text-white/80 text-sm font-medium">Total Earnings</p>
                    <p className="text-2xl font-bold mt-1">{stats.totalEarnings.toFixed(2)} XLM</p>
                </div>
            </div>

            {/* Novels List */}
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Your Novels</h2>
                {novels.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {novels.map((novel) => (
                            <div
                                key={novel.id}
                                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-slate-200 transition-colors"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-16 h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
                                        {novel.cover_image_url ? (
                                            <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl text-slate-300">📖</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 truncate text-lg">{novel.title}</h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-2">
                                            <span className="flex items-center gap-1">👁️ {novel.view_count || 0}</span>
                                            <span className="flex items-center gap-1">❤️ {novel.like_count || 0}</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${novel.is_published
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {novel.is_published ? 'PUBLISHED' : 'DRAFT'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 sm:self-center mt-2 sm:mt-0">
                                    <Link
                                        href={`/author/novels/${novel.id}`}
                                        className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors text-sm text-center"
                                    >
                                        Manage
                                    </Link>
                                    <Link
                                        href={`/author/novels/${novel.id}/chapters`}
                                        className="flex-1 sm:flex-none px-4 py-2 bg-sky-500 text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors text-sm text-center"
                                    >
                                        Chapters
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white border border-slate-100 rounded-xl border-dashed">
                        <span className="text-4xl mb-4 block">✍️</span>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">No novels yet</h3>
                        <p className="text-slate-500 mb-6">Start your writing journey today and share your stories with the world.</p>
                        <Link
                            href="/author/novels/new"
                            className="inline-block px-6 py-3 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-colors"
                        >
                            Create Your First Novel
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
