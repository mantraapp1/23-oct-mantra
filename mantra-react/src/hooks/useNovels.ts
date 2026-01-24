import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Novel } from '@/types/database';

const supabase = createClient();

// Fetch functions encapsulated
const fetchTrending = async () => {
    console.log('Fetching trending novels...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
        const { data, error } = await supabase
            .from('novels')
            .select(`*, author:profiles!novels_author_id_fkey(username, display_name)`)
            .eq('is_mature', false) // Public safety
            .order('total_views', { ascending: false })
            .limit(8)
            .abortSignal(controller.signal);

        if (error) {
            console.error('Error fetching trending:', error);
            throw error;
        }
        return data as Novel[];
    } finally {
        clearTimeout(timeoutId);
    }
};

const fetchRanked = async () => {
    console.log('Fetching ranked novels...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
        const { data, error } = await supabase
            .from('novels')
            .select(`*, author:profiles!novels_author_id_fkey(username, display_name)`)
            .eq('is_mature', false)
            .order('total_votes', { ascending: false })
            .limit(8)
            .abortSignal(controller.signal);

        if (error) {
            console.error('Error fetching ranked:', error);
            throw error;
        }
        return data as Novel[];
    } finally {
        clearTimeout(timeoutId);
    }
};

const fetchLatest = async () => {
    console.log('Fetching latest novels...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
        const { data, error } = await supabase
            .from('novels')
            .select(`*, author:profiles!novels_author_id_fkey(username, display_name)`)
            .eq('is_mature', false)
            .order('updated_at', { ascending: false })
            .limit(5)
            .abortSignal(controller.signal);

        if (error) {
            console.error('Error fetching latest:', error);
            throw error;
        }
        return data as Novel[];
    } finally {
        clearTimeout(timeoutId);
    }
};

// React Query Hooks (Exported)
export const useTrendingNovels = () => {
    return useQuery({
        queryKey: ['novels', 'trending'],
        queryFn: fetchTrending,
    });
};

export const useTopRankedNovels = () => {
    return useQuery({
        queryKey: ['novels', 'ranked'],
        queryFn: fetchRanked,
    });
};

export const useLatestNovels = () => {
    return useQuery({
        queryKey: ['novels', 'latest'],
        queryFn: fetchLatest,
    });
};
