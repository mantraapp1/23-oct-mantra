'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { BookOpen, Bookmark, Clock, Search } from 'lucide-react';

interface LibraryNovel {
    id: string;
    novel: {
        id: string;
        title: string;
        cover_image_url: string;
        author: { username: string };
    };
    last_read_chapter_id: string | null;
    created_at: string;
}

export default function LibraryPage() {
    const [user, setUser] = useState<User | null>(null);
    const [library, setLibrary] = useState<LibraryNovel[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');
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
        await Promise.all([
            loadLibrary(user.id),
            loadHistory(user.id)
        ]);
        setIsLoading(false);
    };

    const loadLibrary = async (userId: string) => {
        const { data } = await supabase
            .from('library')
            .select(`
        id, last_read_chapter_id, created_at,
        novel:novels!library_novel_id_fkey(
          id, title, cover_image_url,
          author:profiles!novels_author_id_fkey(username)
        )
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        setLibrary(data as any || []);
    };

    const loadHistory = async (userId: string) => {
        const { data } = await supabase
            .from('reading_progress')
            .select(`
                id, updated_at,
                novel:novels!reading_progress_novel_id_fkey(
                    id, title, cover_image_url,
                     author:profiles!novels_author_id_fkey(username)
                )
            `)
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        setHistory(data as any || []);
    }

    const removeFromLibrary = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Remove this book from your library?')) {
            await supabase.from('library').delete().eq('id', id);
            setLibrary(library.filter(l => l.id !== id));
        }
    };

    const clearHistory = async () => {
        if (confirm('Clear all reading history?')) {
            // Implement clear history logic if backend supports it
            // For now just clear local state
            setHistory([]);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20 min-h-screen">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto bg-white min-h-screen pb-24 font-inter text-slate-800">
            <div className="sticky top-0 bg-white z-40 border-b border-slate-100">
                <div className="px-4 py-3 max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-base font-semibold text-slate-900">Library</div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeTab === 'saved' ? 'bg-sky-500 text-white' : 'border border-slate-200 text-slate-700'}`}
                        >
                            Saved
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeTab === 'history' ? 'bg-sky-500 text-white' : 'border border-slate-200 text-slate-700'}`}
                        >
                            History
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-4 pt-4 pb-24 max-w-7xl mx-auto">
                {activeTab === 'saved' ? (
                    <div id="library-saved" className="space-y-3">
                        <div className="text-xs text-slate-500 mb-2">Your saved books</div>
                        {library.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {library.map(item => (
                                    <Link
                                        href={`/novel/${item.novel?.id}`}
                                        key={item.id}
                                        className="flex gap-3 p-3 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition bg-white"
                                    >
                                        <img
                                            src={item.novel?.cover_image_url || '/placeholder.jpg'}
                                            className="h-20 w-16 rounded-lg object-cover bg-slate-200"
                                            alt=""
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-slate-900 line-clamp-1">{item.novel?.title}</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">{item.novel?.author?.username || 'Unknown'}</div>
                                            {/* Mock Progress Bar for Visual Parity */}
                                            <div className="mt-2 w-full bg-slate-100 rounded-full h-2.5">
                                                <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: '0%' }}></div>
                                            </div>
                                            <div className="flex justify-between text-[10px] mt-1 text-slate-500">
                                                <span>Start reading</span>
                                                <button
                                                    className="text-[10px] text-red-500 font-semibold hover:text-red-600"
                                                    onClick={(e) => removeFromLibrary(item.id, e)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                    <Bookmark className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-base font-semibold mb-1 text-slate-900">No saved books yet</h3>
                                <p className="text-xs text-slate-500 mb-4">Start building your collection by saving your favorite novels</p>
                                <Link href="/ranking" className="px-5 py-2 bg-sky-500 text-white rounded-full font-semibold text-xs hover:bg-sky-600 transition">
                                    Explore Novels
                                </Link>
                            </div>
                        )}
                    </div>
                ) : (
                    <div id="library-history" className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-xs text-slate-500">Recently opened</div>
                            {history.length > 0 && (
                                <button className="text-xs text-red-500 font-semibold hover:underline" onClick={clearHistory}>Clear History</button>
                            )}
                        </div>
                        {history.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {history.map(item => (
                                    <Link
                                        href={`/novel/${item.novel?.id}`}
                                        key={item.id}
                                        className="flex gap-3 p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow transition cursor-pointer bg-white"
                                    >
                                        <img
                                            src={item.novel?.cover_image_url || '/placeholder.jpg'}
                                            className="h-20 w-16 rounded-lg object-cover bg-slate-200"
                                            alt=""
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold line-clamp-1 text-slate-900">{item.novel?.title}</div>
                                            <div className="text-[11px] text-slate-500 mt-0.5">{item.novel?.author?.username || 'Unknown'}</div>
                                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">Continue reading where you left off.</p>
                                            <div className="text-[10px] text-slate-400 mt-1">
                                                Read {new Date(item.updated_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                    <Clock className="w-8 h-8 text-slate-400" />
                                </div>
                                <h3 className="text-base font-semibold mb-1 text-slate-900">No reading history</h3>
                                <p className="text-xs text-slate-500 mb-4">Your recently read novels will appear here</p>
                                <Link href="/ranking" className="px-5 py-2 bg-sky-500 text-white rounded-full font-semibold text-xs hover:bg-sky-600 transition">
                                    Start Reading
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
