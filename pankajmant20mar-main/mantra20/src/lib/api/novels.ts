import { supabase } from '../supabase';
import { uploadNovelCover } from '../storage';
import { toast } from 'react-hot-toast';
import { Novel } from '../types';

export const createNovel = async (
  novelData: any,
  coverImage: File | null
): Promise<{ success: boolean; error?: string }> => {
  try {
    let novel_coverpage = null;

    if (coverImage) {
      try {
        novel_coverpage = await uploadNovelCover(coverImage);
      } catch (uploadError: any) {
        throw new Error(`Failed to upload cover image: ${uploadError.message}`);
      }
    }

    const { error } = await supabase
      .from('Novels')
      .insert([{
        ...novelData,
        novel_coverpage,
        views: 0,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;

    toast.success('Novel created successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating novel:', error);
    const message = error.message || 'Failed to create novel';
    toast.error(message);
    return { success: false, error: message };
  }
};

export const updateNovel = async (
  novelId: string,
  novelData: Partial<Novel>,
  coverImage?: File | null
): Promise<{ success: boolean; error?: string }> => {
  try {
    let novel_coverpage = novelData.novel_coverpage;

    if (coverImage) {
      try {
        novel_coverpage = await uploadNovelCover(coverImage);
      } catch (uploadError: any) {
        throw new Error(`Failed to upload cover image: ${uploadError.message}`);
      }
    }

    const { error } = await supabase
      .from('Novels')
      .update({
        ...novelData,
        novel_coverpage,
        updated_at: new Date().toISOString()
      })
      .eq('novel_id', novelId);

    if (error) throw error;

    toast.success('Novel updated successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating novel:', error);
    const message = error.message || 'Failed to update novel';
    toast.error(message);
    return { success: false, error: message };
  }
};

export const deleteNovel = async (
  novelId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('Novels')
      .delete()
      .eq('novel_id', novelId);

    if (error) throw error;

    toast.success('Novel deleted successfully!');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting novel:', error);
    const message = error.message || 'Failed to delete novel';
    toast.error(message);
    return { success: false, error: message };
  }
};