import { supabase } from '../supabase';
import { Novel } from '../types';

export async function searchNovels(
  query: string,
  genres?: string[],
  page: number = 1,
  pageSize: number = 10
): Promise<{ data: Novel[]; error: any }> {
  try {
    const { data, error } = await supabase
      .rpc('search_novels', {
        search_query: query,
        genre_filter: genres,
        page_number: page,
        page_size: pageSize
      });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error searching novels:', error);
    return { data: [], error };
  }
}