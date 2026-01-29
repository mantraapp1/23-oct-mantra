import { supabase } from '../supabase';
import { toast } from 'react-hot-toast';
import { withTimeout, SUPABASE_TIMEOUT } from '../utils';

export async function updateReadingProgress(
  userId: string,
  novelId: string,
  chapterId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First get the chapter number
    const { data: chapterData, error: chapterError } = await supabase
      .from('Chapters')
      .select('chapter_number')
      .eq('chapter_id', chapterId)
      .single();

    if (chapterError) throw chapterError;
    if (!chapterData) throw new Error('Chapter not found');

    const { error } = await withTimeout(
      supabase
        .from('Reading_Progress')
        .upsert({
          user_id: userId,
          novel_id: novelId,
          chapter_id: chapterId,
          chapter_number: chapterData.chapter_number,
          lastread_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,novel_id,chapter_id'
        }),
      SUPABASE_TIMEOUT,
      'Updating reading progress'
    );

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error updating reading progress:', error);
    const message = error.message || 'Failed to update reading progress';
    toast.error(message);
    return { success: false, error: message };
  }
}