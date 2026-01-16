'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

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
        loadLibrary(user.id);
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
        setIsLoading(false);
    };

    const removeFromLibrary = async (id: string) => {
        await supabase.from('library').delete().eq('id', id);
        setLibrary(library.filter(l => l.id !== id));
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
            <h1 className="text-3xl font-bold text-[var(--foreground)] mb-8">📚 My Library</h1>

            {library.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {library.map((item) => (
                        <div key={item.id} className="group relative">
                            <Link
                                href={`/novel/${item.novel?.id}`}
                                className="block bg-[var(--card)] rounded-xl overflow-hidden border border-[var(--border)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className="aspect-[3/4] relative overflow-hidden bg-slate-200">
                                    {item.novel?.cover_image_url ? (
                                        <img
                                            src={item.novel.cover_image_url}
                                            alt={item.novel.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-500/20 to-indigo-500/20">
                                            <span className="text-4xl">📖</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <h3 className="font-semibold text-[var(--foreground)] line-clamp-2 text-sm group-hover:text-[var(--primary)] transition-colors">
                                        {item.novel?.title}
                                    </h3>
                                    <p className="text-xs text-[var(--foreground-secondary)] mt-1">
                                        {item.novel?.author?.username || 'Unknown'}
                                    </p>
                                </div>
                            </Link>
                            <button
                                onClick={() => removeFromLibrary(item.id)}
                                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <span className="text-6xl mb-4 block">📚</span>
                    <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">Your library is empty</h3>
                    <p className="text-[var(--foreground-secondary)] mb-6">
                        Start adding novels to your reading list!
                    </p>
                    <Link
                        href="/ranking"
                        className="inline-block px-6 py-3 bg-[var(--primary)] text-white rounded-lg font-semibold hover:bg-sky-600 transition-colors"
                    >
                        Browse Novels
                    </Link>
                </div>
            )}
        </div>
    );
}
