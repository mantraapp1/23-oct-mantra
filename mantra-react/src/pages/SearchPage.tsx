import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Loader2, X, ArrowLeft } from 'lucide-react';
import NovelListCard from '@/components/ui/NovelListCard';
import AuthorResultCard from '@/components/ui/AuthorResultCard';
import searchService from '@/services/searchService';
import type { SearchResult } from '@/services/searchService';

type TabType = 'all' | 'novels' | 'authors';

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('q') || '';

    // State
    const [searchTerm, setSearchTerm] = useState(query);
    const [results, setResults] = useState<SearchResult[]>([]); // For 'all'
    const [novelResults, setNovelResults] = useState<any[]>([]); // For 'novels'
    const [authorResults, setAuthorResults] = useState<any[]>([]); // For 'authors'
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>('all');
    const inputRef = useRef<HTMLInputElement>(null);

    // Load history on mount
    useEffect(() => {
        setHistory(searchService.getRecentSearches());
    }, []);

    // Perform search
    useEffect(() => {
        const fetchResults = async () => {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) {
                setResults([]);
                setNovelResults([]);
                setAuthorResults([]);
                return;
            }

            setLoading(true);
            try {
                // Add to history
                searchService.addRecentSearch(trimmedQuery);
                setHistory(searchService.getRecentSearches());

                // Fetch based on active tab or fetch all if 'all' (optimized: fetch only what's needed)
                // For 'all', we need mixed.
                // For tab switching smoothness, maybe just fetch based on current View.

                if (activeTab === 'all') {
                    const data = await searchService.searchAll(trimmedQuery);
                    setResults(data);
                } else if (activeTab === 'novels') {
                    const data = await searchService.searchNovels(trimmedQuery);
                    setNovelResults(data);
                } else if (activeTab === 'authors') {
                    const data = await searchService.searchAuthors(trimmedQuery);
                    setAuthorResults(data);
                }
            } catch {
            } finally {
                setLoading(false);
            }
        };

        // Debounce
        const timeoutId = setTimeout(fetchResults, 400);
        return () => clearTimeout(timeoutId);
    }, [query, activeTab]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        inputRef.current?.blur();
        if (searchTerm.trim()) {
            setSearchParams({ q: searchTerm });
        }
    };

    const handleClearHistory = () => {
        searchService.clearHistory();
        setHistory([]);
    };

    const handleRemoveHistoryItem = (term: string, e: React.MouseEvent) => {
        e.stopPropagation();
        searchService.removeHistoryItem(term);
        setHistory(searchService.getRecentSearches());
    };

    return (
        <div className="min-h-screen bg-background pb-10">
            {/* Search Header - Sticky */}
            <div className="sticky top-0 bg-background z-30 border-b border-border px-4 py-2">
                <div className="max-w-[1800px] mx-auto w-full">
                    <form onSubmit={handleSearch} className="relative flex items-center gap-3">
                        {/* Back Button (Mobile style) */}
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-full hover:bg-background-secondary text-foreground-secondary md:hidden"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        <div className="relative flex-1">
                            <input
                                ref={inputRef}
                                type="text"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    if (e.target.value === '') {
                                        setSearchParams({});
                                    }
                                }}
                                autoFocus={!query}
                                placeholder="Search novels, authors..."
                                className="w-full pl-11 pr-10 py-3 rounded-full border border-border bg-card shadow-sm text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-foreground-secondary text-foreground"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSearchParams({});
                                        inputRef.current?.focus();
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-background-secondary text-foreground-secondary"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Tabs (Only show if query exists) */}
                    {query.trim() && (
                        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
                            {(['all', 'novels', 'authors'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors ${activeTab === tab
                                        ? 'bg-sky-500 text-white'
                                        : 'bg-card border border-border text-foreground-secondary hover:bg-background-secondary'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-[1800px] mx-auto px-4 py-4">
                {query.trim() ? (
                    // Results State
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-[50vh]">
                        {loading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* ALL Tab */}
                                {activeTab === 'all' && (
                                    <div className="space-y-4">
                                        {results.length > 0 ? (
                                            results.map((item, index) => {
                                                if (item.type === 'novel') {
                                                    return <NovelListCard key={`novel-${item.data.id}-${index}`} novel={item.data} />;
                                                } else {
                                                    return <AuthorResultCard key={`author-${item.data.id}-${index}`} author={item.data} />;
                                                }
                                            })
                                        ) : (
                                            <EmptyState query={query} />
                                        )}
                                    </div>
                                )}

                                {/* Novels Tab */}
                                {activeTab === 'novels' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {novelResults.length > 0 ? (
                                            novelResults.map(novel => (
                                                <NovelListCard key={novel.id} novel={novel} />
                                            ))
                                        ) : (
                                            <div className="col-span-full"><EmptyState query={query} /></div>
                                        )}
                                    </div>
                                )}

                                {/* Authors Tab */}
                                {activeTab === 'authors' && (
                                    <div className="space-y-3">
                                        {authorResults.length > 0 ? (
                                            authorResults.map(author => (
                                                <AuthorResultCard key={author.id} author={author} />
                                            ))
                                        ) : (
                                            <EmptyState query={query} />
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    // History State
                    <div className="animate-in fade-in duration-300">
                        {history.length > 0 ? (
                            <div>
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <h2 className="text-sm font-semibold text-foreground-secondary">Recent Searches</h2>
                                    <button
                                        onClick={handleClearHistory}
                                        className="text-xs font-medium text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {history.map((term, index) => (
                                        <div
                                            key={`${term}-${index}`}
                                            onClick={() => {
                                                setSearchTerm(term);
                                                setSearchParams({ q: term });
                                            }}
                                            className="flex items-center gap-2 pl-4 pr-2 py-2 rounded-full bg-card border border-border hover:border-sky-200 dark:hover:border-sky-800 cursor-pointer group transition-all active:scale-[0.99]"
                                        >
                                            <span className="text-sm text-foreground font-medium">{term}</span>
                                            <button
                                                onClick={(e) => handleRemoveHistoryItem(term, e)}
                                                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground-secondary hover:text-red-500 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-24 text-foreground-secondary">
                                <Search className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                <p className="text-sm opacity-60">Search for stories, authors, and more</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyState({ query }: { query: string }) {
    return (
        <div className="text-center py-20 text-foreground-secondary">
            <p className="text-2xl mb-2">🤔</p>
            <p>No results found for "{query}"</p>
        </div>
    );
}
