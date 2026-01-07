/**
 * Image Cache Service
 * Caches profile images locally to avoid re-downloading them
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@image_cache_';
const CACHE_METADATA_PREFIX = '@image_cache_meta_';

interface ImageCacheMetadata {
  url: string;
  timestamp: number;
  userId: string;
}

class ImageCacheService {
  /**
   * Get cached image URL for a user
   * Returns null if not cached or cache is invalid
   */
  async getCachedImage(userId: string, currentUrl: string): Promise<string | null> {
    try {
      const metadataKey = `${CACHE_METADATA_PREFIX}${userId}`;
      const metadataJson = await AsyncStorage.getItem(metadataKey);
      
      if (!metadataJson) {
        return null;
      }
      
      const metadata: ImageCacheMetadata = JSON.parse(metadataJson);
      
      // Check if the cached URL matches the current URL
      if (metadata.url === currentUrl) {
        return currentUrl;
      }
      
      // URL has changed, clear old cache
      await this.clearCache(userId);
      return null;
    } catch (error) {
      console.error('Error getting cached image:', error);
      return null;
    }
  }

  /**
   * Cache an image URL for a user
   */
  async cacheImage(userId: string, imageUrl: string): Promise<void> {
    try {
      const metadata: ImageCacheMetadata = {
        url: imageUrl,
        timestamp: Date.now(),
        userId,
      };
      
      const metadataKey = `${CACHE_METADATA_PREFIX}${userId}`;
      await AsyncStorage.setItem(metadataKey, JSON.stringify(metadata));
    } catch (error) {
      console.error('Error caching image:', error);
    }
  }

  /**
   * Clear cached image for a specific user
   */
  async clearCache(userId: string): Promise<void> {
    try {
      const metadataKey = `${CACHE_METADATA_PREFIX}${userId}`;
      await AsyncStorage.removeItem(metadataKey);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Clear all cached images
   */
  async clearAllCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(
        key => key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_METADATA_PREFIX)
      );
      
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  /**
   * Check if an image is cached for a user
   */
  async isCached(userId: string, imageUrl: string): Promise<boolean> {
    try {
      const metadataKey = `${CACHE_METADATA_PREFIX}${userId}`;
      const metadataJson = await AsyncStorage.getItem(metadataKey);
      
      if (!metadataJson) {
        return false;
      }
      
      const metadata: ImageCacheMetadata = JSON.parse(metadataJson);
      return metadata.url === imageUrl;
    } catch (error) {
      console.error('Error checking cache:', error);
      return false;
    }
  }
}

export default new ImageCacheService();
