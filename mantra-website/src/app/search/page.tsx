'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const supabase = createClient();

    useEffect(() => {
        // Load recent searches from localStorage
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved));
        }
    }, []);

    const handleSearch = async (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setQuery(searchQuery);

        // Save to recent searches
        const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));

        // Search novels
        const { data } = await supabase
            .from('novels')
            .select(`
        id, title, cover_image_url, synopsis, view_count, like_count,
        author:profiles!novels_author_id_fkey(username)
      `)
            .eq('is_published', true)
            .ilike('title', `%${searchQuery}%`)
            .limit(20);

        setResults(data?.map((n: any) => ({ ...n, author_name: (n.author as any)?.[0]?.username || n.author?.username })) || []);
        setIsLoading(false);
    };

    const clearRecent = (search: string) => {
        const updated = recentSearches.filter(s => s !== search);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Search Box */}
            <div className="mb-8">
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                        placeholder="Search novels by title..."
                        className="w-full px-4 py-3 pl-12 bg-[var(--card)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--foreground-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    />
                    <svg
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-secondary)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {query && (
                        <button
                            onClick={() => handleSearch(query)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-sky-600"
                        >
                            Search
                        </button>
                    )}
                </div>
            </div>

            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Recent Searches</h2>
                    <div className="flex flex-wrap gap-2">
                        {recentSearches.map((search) => (
                            <div
                                key={search}
                                className="flex items-center gap-2 px-3 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-full"
                            >
                                <button
                                    onClick={() => handleSearch(search)}
                                    className="text-[var(--foreground)] hover:text-[var(--primary)]"
                                >
                                    {search}
                                </button>
                                <button
                                    onClick={() => clearRecent(search)}
                                    className="text-[var(--foreground-secondary)] hover:text-red-500"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {/* Results */}
            {!isLoading && results.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                        Results ({results.length})
                    </h2>
                    <div className="space-y-4">
                        {results.map((novel) => (
                            <Link
                                key={novel.id}
                                href={`/novel/${novel.id}`}
                                className="flex gap-4 p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:shadow-lg transition-all"
                            >
                                <div className="w-20 h-28 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                                    {novel.cover_image_url ? (
                                        <img src={novel.cover_image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">📖</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-[var(--foreground)] mb-1">{novel.title}</h3>
                                    <p className="text-sm text-[var(--primary)] mb-2">{novel.author_name}</p>
                                    <p className="text-sm text-[var(--foreground-secondary)] line-clamp-2">
                                        {novel.synopsis || 'No description available'}
                                    </p>
                                    <div className="flex gap-4 mt-2 text-xs text-[var(--foreground-secondary)]">
                                        <span>👁️ {novel.view_count?.toLocaleString() || 0}</span>
                                        <span>❤️ {novel.like_count?.toLocaleString() || 0}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* No Results */}
            {!isLoading && query && results.length === 0 && (
                <div className="text-center py-12">
                    <span className="text-4xl mb-4 block">🔍</span>
                    <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">No results found</h3>
                    <p className="text-[var(--foreground-secondary)]">
                        Try a different search term
                    </p>
                </div>
            )}
        </div>
    );
}
