import { supabase } from '@/lib/supabase/client';

export interface SearchFilters {
    genres?: string[];
    status?: string;
    sortBy?: 'relavance' | 'popular' | 'newest' | 'rating';
}

export interface SearchResult {
    type: 'novel' | 'author';
    data: any;
    score?: number;
}

const SEARCH_HISTORY_KEY = 'mantra_search_history';

const searchService = {
    /**
     * Search for novels with filters
     */
    async searchNovels(query: string, filters: SearchFilters = {}) {
        try {
            let queryBuilder = supabase
                .from('novels')
                .select(`
          *,
          author:profiles(id, username, profile_image_url)
        `)
                .eq('is_published', true); // Only published novels

            // Text Search
            if (query.trim()) {
                const searchTerm = query.trim();
                // Use textSearch or ilike
                queryBuilder = queryBuilder.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
            }

            // Apply Filters
            if (filters.genres && filters.genres.length > 0) {
                queryBuilder = queryBuilder.contains('genres', filters.genres);
            }

            if (filters.status && filters.status !== 'all') {
                const status = filters.status.toLowerCase();
                // Handle map 'ongoing'/'completed' if needed, assuming DB stores lowercase
                queryBuilder = queryBuilder.eq('status', status);
            }

            // Apply Sorting
            switch (filters.sortBy) {
                case 'popular':
                    queryBuilder = queryBuilder.order('views_count', { ascending: false }); // Assuming views_count or popularity column
                    break;
                case 'rating':
                    queryBuilder = queryBuilder.order('rating_average', { ascending: false });
                    break;
                case 'newest':
                    queryBuilder = queryBuilder.order('created_at', { ascending: false });
                    break;
                case 'relavance':
                default:
                    // If query exists, maybe order by text match? Supabase doesn't support easy relevance sort without full text search config.
                    // Fallback to views or default db order
                    // If we use .textSearch(), Supabase handles rank. But here use ilike.
                    // Let's just default to popular for relevance proxy if query is empty.
                    if (!query.trim()) {
                        queryBuilder = queryBuilder.order('views_count', { ascending: false });
                    }
                    break;
            }

            // Limit results
            queryBuilder = queryBuilder.limit(50);

            const { data, error } = await queryBuilder;
            if (error) throw error;
            return data || [];

        } catch (error) {
            console.error('Error searching novels:', error);
            return [];
        }
    },

    /**
     * Search for authors
     */
    async searchAuthors(query: string) {
        if (!query.trim()) return [];
        try {
            const searchTerm = query.trim();
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .ilike('username', `%${searchTerm}%`)
                .limit(20);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error searching authors:', error);
            return [];
        }
    },

    /**
     * Combined search for "All" tab (Interleaved results)
     */
    async searchAll(query: string): Promise<SearchResult[]> {
        const [novels, authors] = await Promise.all([
            this.searchNovels(query),
            this.searchAuthors(query)
        ]);

        const results: SearchResult[] = [];

        // Strategy: Mix them. e.g. 1 Author, 3 Novels, 1 Author...
        // Or just append if simple.
        // Mobile parity: "Interleaved".

        let nIndex = 0;
        let aIndex = 0;

        // Add Top Author match first if precise
        if (authors.length > 0) {
            results.push({ type: 'author', data: authors[aIndex++] });
        }

        // Add 2 Novels
        if (novels.length > nIndex) results.push({ type: 'novel', data: novels[nIndex++] });
        if (novels.length > nIndex) results.push({ type: 'novel', data: novels[nIndex++] });

        // Add next Author
        if (authors.length > aIndex) results.push({ type: 'author', data: authors[aIndex++] });

        // Add rest mixed
        while (nIndex < novels.length || aIndex < authors.length) {
            // Add up to 3 novels
            for (let i = 0; i < 3 && nIndex < novels.length; i++) {
                results.push({ type: 'novel', data: novels[nIndex++] });
            }
            // Add 1 author
            if (aIndex < authors.length) {
                results.push({ type: 'author', data: authors[aIndex++] });
            }
        }

        return results;
    },

    // --- History Management ---

    getRecentSearches(): string[] {
        try {
            const history = localStorage.getItem(SEARCH_HISTORY_KEY);
            return history ? JSON.parse(history) : [];
        } catch {
            return [];
        }
    },

    addRecentSearch(query: string) {
        if (!query.trim()) return;
        const history = this.getRecentSearches();
        const newHistory = [query, ...history.filter(q => q !== query)].slice(0, 10);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    },

    clearHistory() {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
    },

    removeHistoryItem(query: string) {
        const history = this.getRecentSearches();
        const newHistory = history.filter(q => q !== query);
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    }
};

export default searchService;
