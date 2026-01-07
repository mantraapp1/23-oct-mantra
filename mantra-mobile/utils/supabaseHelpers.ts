import { supabase } from '../config/supabase';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Handle Supabase errors and return user-friendly messages
 */
export const handleSupabaseError = (error: PostgrestError | Error | null): string => {
  if (!error) return 'An unknown error occurred';
  
  if ('code' in error) {
    // PostgrestError
    switch (error.code) {
      case '23505':
        return 'This record already exists';
      case '23503':
        return 'Referenced record not found';
      case '42501':
        return 'You do not have permission to perform this action';
      case 'PGRST116':
        return 'No data found';
      default:
        return error.message || 'Database error occurred';
    }
  }
  
  return error.message || 'An error occurred';
};

/**
 * Get the current authenticated user
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

/**
 * Get the current session
 */
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getCurrentSession();
  return !!session;
};

/**
 * Format Supabase timestamp to readable date
 */
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format Supabase timestamp to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

/**
 * Paginate query results
 */
export const paginateQuery = <T>(
  query: any,
  page: number = 1,
  pageSize: number = 20
) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return query.range(from, to);
};

/**
 * Upload file to Supabase Storage
 */
export const uploadFile = async (
  bucket: string,
  path: string,
  file: File | Blob,
  options?: { cacheControl?: string; upsert?: boolean }
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, options);
  
  if (error) throw error;
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);
  
  return publicUrl;
};

/**
 * Delete file from Supabase Storage
 */
export const deleteFile = async (bucket: string, path: string): Promise<void> => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
};

/**
 * Get public URL for a file in Supabase Storage
 */
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  return publicUrl;
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
};
