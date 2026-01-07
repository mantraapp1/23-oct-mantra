import { supabase } from '../config/supabase';
import { handleSupabaseError, paginateQuery } from '../utils/supabaseHelpers';
import { Notification } from '../types/supabase';
import { PAGINATION } from '../constants/supabase';

/**
 * Notification Service
 * Handles user notifications
 */
class NotificationService {
  /**
   * Get user notifications
   */
  async getNotifications(
    userId: string,
    page: number = 1,
    pageSize: number = PAGINATION.NOTIFICATIONS_PAGE_SIZE
  ): Promise<Notification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);

      query = paginateQuery(query, page, pageSize);
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;

      return {
        success: true,
        message: 'Notification marked as read',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return {
        success: true,
        message: 'All notifications marked as read',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Create notification
   */
  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    relatedId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          related_id: relatedId,
        });

      if (error) throw error;

      return {
        success: true,
        message: 'Notification created',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribeFromNotifications(channel: any) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }

  /**
   * Send notification to followers when new chapter is released
   */
  async notifyFollowersNewChapter(
    authorId: string,
    novelId: string,
    novelTitle: string,
    chapterNumber: number
  ): Promise<void> {
    try {
      // Get all followers
      const { data: followers } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', authorId);

      if (!followers || followers.length === 0) return;

      // Create notifications for all followers
      const notifications = followers.map(follower => ({
        user_id: follower.follower_id,
        type: 'new_chapter',
        title: 'New Chapter Released',
        message: `${novelTitle} - Chapter ${chapterNumber} is now available`,
        related_id: novelId,
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Error notifying followers:', error);
    }
  }

  /**
   * Notify user of new follower
   */
  async notifyNewFollower(
    userId: string,
    followerUsername: string,
    followerId: string
  ): Promise<void> {
    try {
      await this.createNotification(
        userId,
        'new_follower',
        'New Follower',
        `${followerUsername} started following you`,
        followerId
      );
    } catch (error) {
      console.error('Error notifying new follower:', error);
    }
  }

  /**
   * Notify author of new comment
   */
  async notifyNewComment(
    authorId: string,
    commenterUsername: string,
    novelTitle: string,
    chapterNumber: number,
    commentId: string
  ): Promise<void> {
    try {
      await this.createNotification(
        authorId,
        'new_comment',
        'New Comment',
        `${commenterUsername} commented on ${novelTitle} - Chapter ${chapterNumber}`,
        commentId
      );
    } catch (error) {
      console.error('Error notifying new comment:', error);
    }
  }

  /**
   * Notify user of comment like
   */
  async notifyCommentLiked(
    userId: string,
    likerUsername: string,
    commentId: string
  ): Promise<void> {
    try {
      await this.createNotification(
        userId,
        'comment_liked',
        'Comment Liked',
        `${likerUsername} liked your comment`,
        commentId
      );
    } catch (error) {
      console.error('Error notifying comment liked:', error);
    }
  }

  /**
   * Notify author of new review
   */
  async notifyNewReview(
    authorId: string,
    reviewerUsername: string,
    novelTitle: string,
    rating: number,
    reviewId: string
  ): Promise<void> {
    try {
      await this.createNotification(
        authorId,
        'new_review',
        'New Review',
        `${reviewerUsername} gave ${novelTitle} ${rating} stars`,
        reviewId
      );
    } catch (error) {
      console.error('Error notifying new review:', error);
    }
  }

  /**
   * Notify author of novel vote
   */
  async notifyNovelVoted(
    authorId: string,
    voterUsername: string,
    novelTitle: string,
    novelId: string
  ): Promise<void> {
    try {
      await this.createNotification(
        authorId,
        'novel_voted',
        'Novel Voted',
        `${voterUsername} voted for ${novelTitle}`,
        novelId
      );
    } catch (error) {
      console.error('Error notifying novel voted:', error);
    }
  }

  /**
   * Notify user of wallet earnings
   */
  async notifyWalletEarnings(
    userId: string,
    amount: number,
    novelTitle: string
  ): Promise<void> {
    try {
      await this.createNotification(
        userId,
        'wallet_earnings',
        'Earnings Received',
        `You earned ${amount} XLM from ${novelTitle}`,
        undefined
      );
    } catch (error) {
      console.error('Error notifying wallet earnings:', error);
    }
  }

  /**
   * Notify user of withdrawal status change
   */
  async notifyWithdrawalStatus(
    userId: string,
    status: string,
    amount: number,
    withdrawalId: string
  ): Promise<void> {
    try {
      const statusMessages: { [key: string]: string } = {
        approved: `Your withdrawal of ${amount} XLM has been approved`,
        completed: `Your withdrawal of ${amount} XLM has been completed`,
        failed: `Your withdrawal of ${amount} XLM has failed`,
        rejected: `Your withdrawal of ${amount} XLM has been rejected`,
      };

      await this.createNotification(
        userId,
        'withdrawal_status',
        'Withdrawal Update',
        statusMessages[status] || `Withdrawal status: ${status}`,
        withdrawalId
      );
    } catch (error) {
      console.error('Error notifying withdrawal status:', error);
    }
  }
}

export default new NotificationService();
