import { supabase } from '../config/supabase';
import { handleSupabaseError } from '../utils/supabaseHelpers';

/**
 * Storage Service
 * Handles file uploads to Supabase Storage
 */
class StorageService {
  private readonly PROFILE_BUCKET = 'profile-pictures';
  private readonly NOVEL_BUCKET = 'novel-covers';
  private readonly BANNER_BUCKET = 'banners';

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(
    userId: string,
    fileUri: string,
    fileName: string
  ): Promise<{ success: boolean; message: string; url?: string }> {
    try {
      // Read file as blob
      const response = await fetch(fileUri);
      const blob = await response.blob();

      // Generate unique file name
      const fileExt = fileName.split('.').pop();
      const uniqueFileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${uniqueFileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.PROFILE_BUCKET)
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.PROFILE_BUCKET)
        .getPublicUrl(filePath);

      return {
        success: true,
        message: 'Profile picture uploaded successfully',
        url: urlData.publicUrl,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Upload novel cover image
   */
  async uploadNovelCover(
    novelId: string,
    fileUri: string,
    fileName: string
  ): Promise<{ success: boolean; message: string; url?: string }> {
    try {
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const fileExt = fileName.split('.').pop();
      const uniqueFileName = `${novelId}_${Date.now()}.${fileExt}`;
      const filePath = `${novelId}/${uniqueFileName}`;

      const { data, error } = await supabase.storage
        .from(this.NOVEL_BUCKET)
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(this.NOVEL_BUCKET)
        .getPublicUrl(filePath);

      return {
        success: true,
        message: 'Novel cover uploaded successfully',
        url: urlData.publicUrl,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Upload banner image
   */
  async uploadBanner(
    bannerId: string,
    fileUri: string,
    fileName: string
  ): Promise<{ success: boolean; message: string; url?: string }> {
    try {
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const fileExt = fileName.split('.').pop();
      const uniqueFileName = `${bannerId}_${Date.now()}.${fileExt}`;
      const filePath = `${bannerId}/${uniqueFileName}`;

      const { data, error } = await supabase.storage
        .from(this.BANNER_BUCKET)
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(this.BANNER_BUCKET)
        .getPublicUrl(filePath);

      return {
        success: true,
        message: 'Banner uploaded successfully',
        url: urlData.publicUrl,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(
    bucket: 'profile-pictures' | 'novel-covers' | 'banners',
    filePath: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;

      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Get file URL
   */
  getPublicUrl(
    bucket: 'profile-pictures' | 'novel-covers' | 'banners',
    filePath: string
  ): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Validate image file
   */
  validateImage(fileUri: string, maxSizeMB: number = 5): { valid: boolean; message: string } {
    // Check file extension
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const extension = fileUri.split('.').pop()?.toLowerCase();

    if (!extension || !validExtensions.includes(extension)) {
      return {
        valid: false,
        message: 'Invalid file type. Please use JPG, PNG, GIF, or WebP',
      };
    }

    // Note: Size validation would need to be done after fetching the file
    // This is a basic validation
    return {
      valid: true,
      message: 'File is valid',
    };
  }

  /**
   * Optimize image before upload (placeholder for future implementation)
   */
  async optimizeImage(fileUri: string): Promise<string> {
    // TODO: Implement image optimization/compression
    // For now, return the original URI
    return fileUri;
  }
}

export default new StorageService();
