'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Novel {
    id: string;
    title: string;
    cover_image_url: string;
    view_count: number;
    author?: { username: string };
}

export default function TagDetailPage() {
    const params = useParams();
    const tag = params.slug as string;
    const supabase = createClient();

    const [novels, setNovels] = useState<Novel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadNovels();
    }, [tag]);

    const loadNovels = async () => {
        const { data } = await supabase
            .from('novels')
            .select('id, title, cover_image_url, view_count, tags, author:profiles!novels_author_id_fkey(username)')
            .eq('is_published', true)
            .contains('tags', [tag])
            .order('view_count', { ascending: false })
            .limit(50);

        setNovels((data || []).map((n: any) => ({
            ...n,
            author: Array.isArray(n.author) ? n.author[0] : n.author
        })));
        setIsLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 font-inter text-slate-800">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/tags" className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
                <div>
                    <p className="text-sm text-slate-500">Tag</p>
                    <h1 className="text-xl font-bold text-slate-900">#{tag}</h1>
                </div>
            </div>

            {/* Novels Grid */}
            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : novels.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
                    <span className="text-4xl mb-4 block">🏷️</span>
                    <h3 className="font-bold text-slate-900 mb-2">No novels found</h3>
                    <p className="text-slate-500 text-sm">No novels with this tag yet</p>
                </div>
            )}
        </div>
    );
}
