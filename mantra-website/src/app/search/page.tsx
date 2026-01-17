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
        <div className="min-h-screen bg-white font-inter text-slate-800 pb-24">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-30 border-b border-slate-100 px-4 py-3">
                <div className="flex items-center gap-3 mb-3">
                    <Link href="/" className="p-2 rounded-lg hover:bg-slate-100 active:scale-95 transition-transform">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-600"><path d="m15 18-6-6 6-6" /></svg>
                    </Link>
                    <div className="relative flex-1">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                            placeholder="Search novels, authors, tags"
                            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 shadow-sm transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {['All', 'Novels', 'Authors', 'Genres', 'Tags'].map((filter) => (
                        <button
                            key={filter}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filter === 'All'
                                ? 'bg-sky-500 text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 pt-6">
                {/* Recent Searches */}
                {!query && recentSearches.length > 0 && (
                    <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-900">Recent Searches</h2>
                            <button onClick={() => { setRecentSearches([]); localStorage.removeItem('recentSearches'); }} className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors">Clear All</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {recentSearches.map((search) => (
                                <button
                                    key={search}
                                    onClick={() => handleSearch(search)}
                                    className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:border-sky-500 hover:text-sky-600 hover:shadow-sm transition-all flex items-center gap-2"
                                >
                                    <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span>{search}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Meta */}
                {!isLoading && query && (
                    <div className="text-xs text-slate-500 mb-4 animate-in fade-in">
                        Found <span className="font-bold text-slate-900">{results.length} results</span> for "{query}"
                    </div>
                )}

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {isLoading ? (
                        [...Array(8)].map((_, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl border border-slate-100 animate-pulse bg-white">
                                <div className="w-16 h-20 bg-slate-100 rounded-lg flex-shrink-0"></div>
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                    <div className="h-10 bg-slate-100 rounded w-full mt-2"></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        results.map((item) => (
                            <Link
                                key={item.id}
                                href={`/novel/${item.id}`}
                                className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all group h-full"
                            >
                                <div className="w-16 h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm relative group-hover:shadow-md transition-all">
                                    {item.cover_image_url ? (
                                        <img src={item.cover_image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">📖</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-sky-600 transition-colors mb-1">{item.title}</h3>

                                    <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mb-2">
                                        <span className="truncate max-w-[100px]">{item.author_name || 'Unknown'}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                        <span className="flex items-center text-amber-500 gap-0.5">
                                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                            4.8
                                        </span>
                                    </div>

                                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-auto">
                                        {item.synopsis || 'No description available.'}
                                    </p>

                                    <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            {item.view_count?.toLocaleString()}
                                        </span>
                                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                            Novel
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {/* No Results */}
                {!isLoading && query && results.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4 grayscale opacity-50">🔍</div>
                        <h3 className="text-sm font-bold text-slate-900 mb-1">No results found</h3>
                        <p className="text-xs text-slate-500">Try searching for a different keyword</p>
                    </div>
                )}
            </div>
        </div>
    );
}
