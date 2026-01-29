import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';
import { withTimeout, SUPABASE_TIMEOUT } from '../utils';

export async function createReview(data: {
  novel_id: string;
  user_id: string;
  content: string;
  rating: number;
}) {
  try {
    const { error } = await withTimeout(
      supabase
        .from('Reviews')
        .insert([{
          ...data,
          created_at: new Date().toISOString()
        }]),
      SUPABASE_TIMEOUT,
      'Creating review'
    );

    if (error) throw error;
    toast.success('Review posted successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating review:', error);
    toast.error(error.message || 'Failed to post review');
    return { success: false, error: error.message };
  }
}