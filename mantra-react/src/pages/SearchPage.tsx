import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';
import NovelListCard from '@/components/ui/NovelListCard';
import { Search, Loader2 } from 'lucide-react';

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [searchTerm, setSearchTerm] = useState(query);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const { data } = await supabase
                    .from('novels')
                    .select('*, author:profiles(username)')
                    .ilike('title', `%${query}%`)
                    .limit(20);
                setResults(data || []);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchParams({ q: searchTerm });
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Search Novels</h1>

            <form onSubmit={handleSearch} className="mb-8 relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setSearchParams({ q: e.target.value });
                    }}
                    placeholder="Search by title..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 shadow-sm text-lg outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all placeholder:text-slate-400"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            </form>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map(novel => (
                        <NovelListCard key={novel.id} novel={novel} />
                    ))}
                    {query && results.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            No novels found matching "{query}"
                        </div>
                    )}
                    {!query && (
                        <div className="col-span-full text-center py-12 text-slate-400">
                            Type to start searching...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
