import { supabase } from '@/lib/supabase/client';
import { handleSupabaseError } from '@/utils/supabaseHelpers';

export interface Notification {
    id: string;
    type: 'system' | 'new_chapter' | 'new_follower' | 'new_comment' | 'comment_reply' | 'comment_liked' | 'review_like' | 'comment_like' | 'new_review' | 'novel_voted' | 'admin_message' | 'wallet_earning' | 'wallet_earnings' | 'withdrawal_status' | 'withdrawal_completed' | 'custom';
    title?: string;
    message: string;
    is_read: boolean;
    created_at: string;
    data?: any; // JSON data for navigation/details
}

export interface NotificationResponse {
    success: boolean;
    message: string;
    notifications?: Notification[];
}

class NotificationService {
    /**
     * Get notifications for a user
     */
    async getNotifications(userId: string, page = 1, limit = 20): Promise<Notification[]> {
        try {
            const start = (page - 1) * limit;
            const end = start + limit - 1;

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .range(start, end);

            if (error) throw error;
            return data as Notification[];
        } catch {
            return [];
        }
    }

    /**
     * Mark a single notification as read
     */
    async markAsRead(notificationId: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<{ success: boolean; message: string }> {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
            return { success: true, message: 'All notifications marked as read' };
        } catch (error: any) {
            return { success: false, message: handleSupabaseError(error) };
        }
    }

    /**
     * Get unread count
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
        } catch {
            return 0;
        }
    }
}

export default new NotificationService();
