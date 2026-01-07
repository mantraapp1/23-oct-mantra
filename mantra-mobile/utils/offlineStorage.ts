import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Offline storage utility for caching data
 */
export class OfflineStorage {
  private static readonly PREFIX = '@mantra_';
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Save data to cache
   */
  static async set(key: string, data: any): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        `${this.PREFIX}${key}`,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  /**
   * Get data from cache
   */
  static async get<T>(key: string, maxAge?: number): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.PREFIX}${key}`);
      
      if (!cached) {
        return null;
      }

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      const maxCacheAge = maxAge || this.CACHE_DURATION;

      // Check if cache is expired
      if (age > maxCacheAge) {
        await this.remove(key);
        return null;
      }

      return data as T;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  /**
   * Remove data from cache
   */
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${this.PREFIX}${key}`);
    } catch (error) {
      console.error('Error removing from cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  static async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const mantraKeys = keys.filter(key => key.startsWith(this.PREFIX));
      await AsyncStorage.multiRemove(mantraKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Save user profile for offline access
   */
  static async cacheUserProfile(userId: string, profile: any): Promise<void> {
    await this.set(`profile_${userId}`, profile);
  }

  /**
   * Get cached user profile
   */
  static async getCachedUserProfile(userId: string): Promise<any | null> {
    return await this.get(`profile_${userId}`);
  }

  /**
   * Cache unlocked chapters for offline reading
   */
  static async cacheUnlockedChapter(
    chapterId: string,
    chapterData: any
  ): Promise<void> {
    await this.set(`chapter_${chapterId}`, chapterData);
  }

  /**
   * Get cached chapter
   */
  static async getCachedChapter(chapterId: string): Promise<any | null> {
    return await this.get(`chapter_${chapterId}`);
  }

  /**
   * Cache library data
   */
  static async cacheLibrary(userId: string, library: any[]): Promise<void> {
    await this.set(`library_${userId}`, library);
  }

  /**
   * Get cached library
   */
  static async getCachedLibrary(userId: string): Promise<any[] | null> {
    return await this.get(`library_${userId}`);
  }

  /**
   * Cache reading history
   */
  static async cacheReadingHistory(userId: string, history: any[]): Promise<void> {
    await this.set(`history_${userId}`, history);
  }

  /**
   * Get cached reading history
   */
  static async getCachedReadingHistory(userId: string): Promise<any[] | null> {
    return await this.get(`history_${userId}`);
  }

  /**
   * Queue pending actions for sync
   */
  static async queueAction(action: {
    type: string;
    data: any;
    timestamp: number;
  }): Promise<void> {
    try {
      const queue = await this.get<any[]>('pending_actions') || [];
      queue.push(action);
      await this.set('pending_actions', queue);
    } catch (error) {
      console.error('Error queuing action:', error);
    }
  }

  /**
   * Get pending actions
   */
  static async getPendingActions(): Promise<any[]> {
    return await this.get<any[]>('pending_actions') || [];
  }

  /**
   * Clear pending actions
   */
  static async clearPendingActions(): Promise<void> {
    await this.remove('pending_actions');
  }

  /**
   * Save authentication state
   */
  static async saveAuthState(authData: any): Promise<void> {
    await this.set('auth_state', authData);
  }

  /**
   * Get authentication state
   */
  static async getAuthState(): Promise<any | null> {
    return await this.get('auth_state', 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  /**
   * Clear authentication state
   */
  static async clearAuthState(): Promise<void> {
    await this.remove('auth_state');
  }
}

/**
 * Sync manager for offline actions
 */
export class SyncManager {
  private static isSyncing = false;

  /**
   * Sync pending actions when back online
   */
  static async syncPendingActions(): Promise<void> {
    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    try {
      const pendingActions = await OfflineStorage.getPendingActions();

      for (const action of pendingActions) {
        try {
          await this.processAction(action);
        } catch (error) {
          console.error('Error processing action:', error);
          // Keep action in queue if it fails
        }
      }

      // Clear successfully processed actions
      await OfflineStorage.clearPendingActions();
    } catch (error) {
      console.error('Error syncing actions:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Process a single action
   */
  private static async processAction(action: any): Promise<void> {
    // TODO: Implement action processing based on type
    console.log('Processing action:', action.type);
  }

  /**
   * Check if sync is needed
   */
  static async needsSync(): Promise<boolean> {
    const pendingActions = await OfflineStorage.getPendingActions();
    return pendingActions.length > 0;
  }
}
