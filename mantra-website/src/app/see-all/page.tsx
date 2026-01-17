'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Dropdown } from '@/components/ui/Dropdown';

interface Novel {
    id: string;
    title: string;
    cover_image_url: string;
    view_count: number;
    like_count: number;
    author?: { username: string };
}

const SORT_OPTIONS = ['Trending', 'Popular', 'New', 'Completed'];

export default function SeeAllPage() {
    const searchParams = useSearchParams();
    const initialType = searchParams.get('type') || 'trending';
    const supabase = createClient();

    const [sortBy, setSortBy] = useState(initialType.charAt(0).toUpperCase() + initialType.slice(1));
    const [novels, setNovels] = useState<Novel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadNovels();
    }, [sortBy]);

    const loadNovels = async () => {
        setIsLoading(true);
        let query = supabase
            .from('novels')
            .select('id, title, cover_image_url, view_count, like_count, author:profiles!novels_author_id_fkey(username)')
            .eq('is_published', true);

        switch (sortBy.toLowerCase()) {
            case 'trending':
                query = query.order('view_count', { ascending: false });
                break;
            case 'popular':
                query = query.order('like_count', { ascending: false });
                break;
            case 'new':
                query = query.order('created_at', { ascending: false });
                break;
            case 'completed':
                query = query.eq('status', 'completed').order('view_count', { ascending: false });
                break;
            default:
                query = query.order('view_count', { ascending: false });
        }

        const { data } = await query.limit(50);
        setNovels((data || []).map((n: any) => ({
            ...n,
            author: Array.isArray(n.author) ? n.author[0] : n.author
        })));
        setIsLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 font-inter text-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">Browse Novels</h1>
                </div>
                <Dropdown
                    options={SORT_OPTIONS}
                    value={sortBy}
                    onChange={setSortBy}
                />
            </div>

            {/* Novels Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : novels.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {novels.map((novel) => (
                        <Link key={novel.id} href={`/novel/${novel.id}`} className="group">
                            <div className="aspect-[2/3] rounded-xl overflow-hidden bg-slate-100 mb-2 shadow-sm group-hover:shadow-md transition-all">
                                {novel.cover_image_url ? (
                                    <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl text-slate-300">📖</div>
                                )}
                            </div>
                            <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 group-hover:text-sky-600 transition-colors">{novel.title}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{novel.author?.username || 'Unknown'}</p>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <span className="text-4xl mb-4 block">📚</span>
                    <p className="text-slate-500">No novels found</p>
                </div>
            )}
        </div>
    );
}
