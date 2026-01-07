import { supabase } from '../config/supabase';
import { handleSupabaseError } from '../utils/supabaseHelpers';
import { ChapterUnlock, ChapterTimer } from '../types/supabase';
import { UNLOCK_SETTINGS } from '../constants/supabase';

export interface UnlockStatus {
  isUnlocked: boolean;
  unlockMethod?: 'timer' | 'ad' | 'free';
  expiresAt?: string;
  hasActiveTimer?: boolean;
  timerExpiresAt?: string;
  remainingTime?: number; // in milliseconds
}

export interface UnlockResponse {
  success: boolean;
  message: string;
  unlock?: ChapterUnlock;
}

/**
 * Unlock Service
 * Handles chapter unlocking via timer or ads
 */
class UnlockService {
  /**
   * Check if a chapter is unlocked for a user
   */
  async checkUnlockStatus(userId: string, chapterId: string): Promise<UnlockStatus> {
    try {
      // Check for existing unlock
      const { data: unlock, error: unlockError } = await supabase
        .from('chapter_unlocks')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter_id', chapterId)
        .eq('is_expired', false)
        .maybeSingle();

      if (unlockError) throw unlockError;

      if (unlock) {
        return {
          isUnlocked: true,
          unlockMethod: unlock.unlock_method,
          expiresAt: unlock.expiration_timestamp || undefined,
        };
      }

      // Check for active timer
      const { data: timer, error: timerError } = await supabase
        .from('chapter_timers')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter_id', chapterId)
        .eq('is_active', true)
        .maybeSingle();

      if (timerError) throw timerError;

      if (timer) {
        const expiresAt = new Date(timer.timer_expiration_timestamp);
        const now = new Date();
        const remainingTime = expiresAt.getTime() - now.getTime();

        // If timer has expired, unlock the chapter
        if (remainingTime <= 0) {
          await this.unlockChapterFromTimer(timer);
          return {
            isUnlocked: true,
            unlockMethod: 'timer',
            expiresAt: new Date(Date.now() + UNLOCK_SETTINGS.UNLOCK_DURATION_HOURS * 60 * 60 * 1000).toISOString(),
          };
        }

        return {
          isUnlocked: false,
          hasActiveTimer: true,
          timerExpiresAt: timer.timer_expiration_timestamp,
          remainingTime,
        };
      }

      return {
        isUnlocked: false,
      };
    } catch (error) {
      console.error('Error checking unlock status:', error);
      return {
        isUnlocked: false,
      };
    }
  }

  /**
   * Start a timer to unlock a chapter
   */
  async startTimer(
    userId: string,
    novelId: string,
    chapterId: string,
    durationHours: number = UNLOCK_SETTINGS.DEFAULT_TIMER_HOURS
  ): Promise<UnlockResponse> {
    try {
      // Check if chapter is already unlocked
      const status = await this.checkUnlockStatus(userId, chapterId);
      if (status.isUnlocked) {
        return {
          success: false,
          message: 'Chapter is already unlocked',
        };
      }

      // Check if there's already an active timer for this novel
      const { data: existingTimer, error: checkError } = await supabase
        .from('chapter_timers')
        .select('*')
        .eq('user_id', userId)
        .eq('novel_id', novelId)
        .eq('is_active', true)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingTimer) {
        return {
          success: false,
          message: 'You already have an active timer for this novel',
        };
      }

      // Create timer
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

      const { data: timer, error: timerError } = await supabase
        .from('chapter_timers')
        .insert({
          user_id: userId,
          novel_id: novelId,
          chapter_id: chapterId,
          timer_duration_hours: durationHours,
          timer_expiration_timestamp: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (timerError) throw timerError;

      return {
        success: true,
        message: `Timer started. Chapter will unlock in ${durationHours} hours.`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Unlock chapter with ad view
   */
  async unlockWithAd(
    userId: string,
    novelId: string,
    chapterId: string,
    authorId: string,
    adUnitId: string
  ): Promise<UnlockResponse> {
    try {
      // Check if chapter is already unlocked
      const status = await this.checkUnlockStatus(userId, chapterId);
      if (status.isUnlocked) {
        return {
          success: false,
          message: 'Chapter is already unlocked',
        };
      }

      // Check if user has already watched an ad for this chapter recently
      const { data: recentAdView, error: adCheckError } = await supabase
        .from('ads_view_records')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter_id', chapterId)
        .gte('viewed_at', new Date(Date.now() - UNLOCK_SETTINGS.UNLOCK_DURATION_HOURS * 60 * 60 * 1000).toISOString())
        .maybeSingle();

      if (adCheckError) throw adCheckError;

      if (recentAdView) {
        return {
          success: false,
          message: 'You have already watched an ad for this chapter recently',
        };
      }

      // Record ad view
      const { error: adError } = await supabase
        .from('ads_view_records')
        .insert({
          user_id: userId,
          novel_id: novelId,
          chapter_id: chapterId,
          author_id: authorId,
          ad_unit_id: adUnitId,
        });

      if (adError) throw adError;

      // Create unlock
      const expiresAt = new Date(Date.now() + UNLOCK_SETTINGS.UNLOCK_DURATION_HOURS * 60 * 60 * 1000);

      const { data: unlock, error: unlockError } = await supabase
        .from('chapter_unlocks')
        .insert({
          user_id: userId,
          novel_id: novelId,
          chapter_id: chapterId,
          unlock_method: 'ad',
          expiration_timestamp: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (unlockError) throw unlockError;

      return {
        success: true,
        message: 'Chapter unlocked successfully!',
        unlock,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Unlock chapter from expired timer
   */
  private async unlockChapterFromTimer(timer: ChapterTimer): Promise<void> {
    try {
      // Create unlock
      const expiresAt = new Date(Date.now() + UNLOCK_SETTINGS.UNLOCK_DURATION_HOURS * 60 * 60 * 1000);

      await supabase
        .from('chapter_unlocks')
        .insert({
          user_id: timer.user_id,
          novel_id: timer.novel_id,
          chapter_id: timer.chapter_id,
          unlock_method: 'timer',
          expiration_timestamp: expiresAt.toISOString(),
        });

      // Deactivate timer
      await supabase
        .from('chapter_timers')
        .update({ is_active: false })
        .eq('id', timer.id);
    } catch (error) {
      console.error('Error unlocking chapter from timer:', error);
    }
  }

  /**
   * Get active timer for a novel
   */
  async getActiveTimer(userId: string, novelId: string): Promise<ChapterTimer | null> {
    try {
      const { data, error } = await supabase
        .from('chapter_timers')
        .select('*')
        .eq('user_id', userId)
        .eq('novel_id', novelId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting active timer:', error);
      return null;
    }
  }

  /**
   * Get all active timers for a user
   */
  async getAllActiveTimers(userId: string): Promise<ChapterTimer[]> {
    try {
      const { data, error } = await supabase
        .from('chapter_timers')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('timer_expiration_timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting active timers:', error);
      return [];
    }
  }

  /**
   * Cancel an active timer
   */
  async cancelTimer(timerId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('chapter_timers')
        .update({ is_active: false })
        .eq('id', timerId);

      if (error) throw error;

      return {
        success: true,
        message: 'Timer cancelled successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Get unlocked chapters for a novel
   */
  async getUnlockedChapters(userId: string, novelId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('chapter_unlocks')
        .select('chapter_id')
        .eq('user_id', userId)
        .eq('novel_id', novelId)
        .eq('is_expired', false);

      if (error) throw error;
      return data?.map(u => u.chapter_id) || [];
    } catch (error) {
      console.error('Error getting unlocked chapters:', error);
      return [];
    }
  }

  /**
   * Process expired unlocks (should be called periodically)
   */
  async processExpiredUnlocks(): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Mark expired unlocks
      await supabase
        .from('chapter_unlocks')
        .update({ is_expired: true })
        .lt('expiration_timestamp', now)
        .eq('is_expired', false);

      // Deactivate expired timers
      await supabase
        .from('chapter_timers')
        .update({ is_active: false })
        .lt('timer_expiration_timestamp', now)
        .eq('is_active', true);
    } catch (error) {
      console.error('Error processing expired unlocks:', error);
    }
  }

  /**
   * Get remaining time for a timer (in milliseconds)
   */
  getRemainingTime(expirationTimestamp: string): number {
    const expiresAt = new Date(expirationTimestamp);
    const now = new Date();
    return Math.max(0, expiresAt.getTime() - now.getTime());
  }

  /**
   * Format remaining time as human-readable string
   */
  formatRemainingTime(milliseconds: number): string {
    if (milliseconds <= 0) return 'Unlocked';

    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

export default new UnlockService();
