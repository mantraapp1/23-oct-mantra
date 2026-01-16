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
        // Load profile
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        setProfile(profileData);

        // Load author's novels
        const { data: novelsData } = await supabase
            .from('novels')
            .select('id, title, cover_image_url, view_count, like_count, status, is_published')
            .eq('author_id', userId)
            .order('created_at', { ascending: false });

        const novelsList = novelsData || [];
        setNovels(novelsList);

        // Calculate stats
        const totalViews = novelsList.reduce((sum, n) => sum + (n.view_count || 0), 0);
        const totalLikes = novelsList.reduce((sum, n) => sum + (n.like_count || 0), 0);

        // Load wallet for earnings
        const { data: walletData } = await supabase
            .from('wallets')
            .select('total_earned')
            .eq('user_id', userId)
            .single();

        setStats({
            totalNovels: novelsList.length,
            totalViews,
            totalLikes,
            totalEarnings: walletData?.total_earned || 0,
        });

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)]">Author Dashboard</h1>
                    <p className="text-[var(--foreground-secondary)]">Welcome back, {profile?.username || 'Author'}!</p>
                </div>
                <Link
                    href="/author/novels/new"
                    className="px-6 py-3 bg-[var(--primary)] text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors"
                >
                    + New Novel
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
                    <p className="text-[var(--foreground-secondary)] text-sm">Total Novels</p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">{stats.totalNovels}</p>
                </div>
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
                    <p className="text-[var(--foreground-secondary)] text-sm">Total Views</p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">{stats.totalViews.toLocaleString()}</p>
                </div>
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4">
                    <p className="text-[var(--foreground-secondary)] text-sm">Total Likes</p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">{stats.totalLikes.toLocaleString()}</p>
                </div>
                <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-xl p-4 text-white">
                    <p className="text-white/80 text-sm">Total Earnings</p>
                    <p className="text-2xl font-bold">{stats.totalEarnings.toFixed(2)} XLM</p>
                </div>
            </div>

            {/* Novels List */}
            <div>
                <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">Your Novels</h2>
                {novels.length > 0 ? (
                    <div className="space-y-4">
                        {novels.map((novel) => (
                            <div
                                key={novel.id}
                                className="flex items-center gap-4 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl"
                            >
                                <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                                    {novel.cover_image_url ? (
                                        <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xl">📖</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-[var(--foreground)] truncate">{novel.title}</h3>
                                    <div className="flex gap-4 text-sm text-[var(--foreground-secondary)] mt-1">
                                        <span>👁️ {novel.view_count || 0}</span>
                                        <span>❤️ {novel.like_count || 0}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${novel.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {novel.is_published ? 'Published' : 'Draft'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Link
                                        href={`/author/novels/${novel.id}`}
                                        className="px-4 py-2 border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors text-sm"
                                    >
                                        Manage
                                    </Link>
                                    <Link
                                        href={`/author/novels/${novel.id}/chapters`}
                                        className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-sky-600 transition-colors text-sm"
                                    >
                                        Chapters
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-[var(--card)] border border-[var(--border)] rounded-xl">
                        <span className="text-4xl mb-4 block">✍️</span>
                        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No novels yet</h3>
                        <p className="text-[var(--foreground-secondary)] mb-4">Start your writing journey today!</p>
                        <Link
                            href="/author/novels/new"
                            className="inline-block px-6 py-3 bg-[var(--primary)] text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors"
                        >
                            Create Your First Novel
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
