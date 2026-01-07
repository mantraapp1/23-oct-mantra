import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import { useTheme } from '../../../context/ThemeContext';
import { ThemeColors } from '../../../constants/theme';
import notificationService from '../../../services/notificationService';
import authService from '../../../services/authService';
import { useToast } from '../../ToastManager';
import { EmptyState } from '../../common';

interface NotificationScreenProps {
  navigation: any;
}

interface Notification {
  id: string;
  type: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  message: string;
  time: string;
  isUnread: boolean;
}

const NotificationScreen: React.FC<NotificationScreenProps> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadNotifications();
    }
  }, [currentUserId]);

  const initializeUser = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
    } else {
      setIsLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications(currentUserId);
      const formattedNotifications: Notification[] = data.map((notif: any) => ({
        id: notif.id,
        type: notif.type,
        icon: getNotificationIcon(notif.type),
        iconBg: getNotificationIconBg(notif.type),
        iconColor: getNotificationIconColor(notif.type),
        title: getNotificationTitle(notif.type),
        message: notif.message || getNotificationMessage(notif),
        time: formatTime(notif.created_at),
        isUnread: !notif.is_read,
      }));
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      showToast('error', 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

  const getNotificationIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      new_chapter: 'bell',
      new_follower: 'user-plus',
      new_comment: 'message-circle',
      comment_reply: 'message-circle',
      review_like: 'heart',
      comment_like: 'heart',
      wallet_earning: 'dollar-sign',
      withdrawal_status: 'credit-card',
    };
    return iconMap[type] || 'bell';
  };

  const getNotificationIconBg = (type: string): string => {
    const bgMap: Record<string, string> = {
      new_chapter: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : colors.sky100,
      new_follower: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : colors.amber100,
      new_comment: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : colors.sky100,
      comment_reply: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : colors.sky100,
      review_like: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : colors.emerald100,
      comment_like: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : colors.emerald100,
      wallet_earning: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : colors.emerald100,
      withdrawal_status: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : colors.sky100,
    };
    return bgMap[type] || (isDarkMode ? theme.border : colors.slate100);
  };

  const getNotificationIconColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      new_chapter: isDarkMode ? '#38bdf8' : colors.sky600,
      new_follower: isDarkMode ? '#fbbf24' : colors.amber500,
      new_comment: isDarkMode ? '#38bdf8' : colors.sky600,
      comment_reply: isDarkMode ? '#38bdf8' : colors.sky600,
      review_like: isDarkMode ? '#34d399' : colors.emerald600,
      comment_like: isDarkMode ? '#34d399' : colors.emerald600,
      wallet_earning: isDarkMode ? '#34d399' : colors.emerald600,
      withdrawal_status: isDarkMode ? '#38bdf8' : colors.sky600,
    };
    return colorMap[type] || theme.textSecondary;
  };

  const getNotificationTitle = (type: string): string => {
    const titleMap: Record<string, string> = {
      new_chapter: 'New chapter released',
      new_follower: 'New follower',
      new_comment: 'New comment',
      comment_reply: 'New reply',
      review_like: 'Review liked',
      comment_like: 'Comment liked',
      wallet_earning: 'New earning',
      withdrawal_status: 'Withdrawal update',
    };
    return titleMap[type] || 'Notification';
  };

  const getNotificationMessage = (notif: any): string => {
    // Construct message from notification data
    return notif.message || 'You have a new notification';
  };

  const formatTime = (timestamp: string): string => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now.getTime() - notifTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };



  const handleMarkAllRead = async () => {
    if (!currentUserId) return;

    try {
      const response = await notificationService.markAllAsRead(currentUserId);
      if (response.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, isUnread: false }))
        );
        showToast('success', 'All notifications marked as read');
      } else {
        showToast('error', response.message);
      }
    } catch (error) {
      showToast('error', 'Failed to mark notifications as read');
    }
  };

  const handleNotificationTap = async (notification: Notification) => {
    if (!currentUserId) return;

    // Mark as read
    if (notification.isUnread) {
      await notificationService.markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notification.id ? { ...notif, isUnread: false } : notif
        )
      );
    }

    // Navigate based on notification type
    // TODO: Implement navigation logic based on notification type
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllRead}
          activeOpacity={0.7}
        >
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="bell"
            title="No notifications"
            description="You're all caught up! Check back later for updates."
          />
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                notification.isUnread && styles.notificationCardUnread,
              ]}
              activeOpacity={0.7}
              onPress={() => handleNotificationTap(notification)}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: notification.iconBg },
                ]}
              >
                <Feather
                  name={notification.icon as any}
                  size={16}
                  color={notification.iconColor}
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.card,
  },
  backButton: {
    padding: spacing[2],
    borderRadius: borderRadius.lg,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  markAllButton: {
    marginLeft: 'auto',
  },
  markAllText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[24],
    gap: spacing[3],
  },
  notificationCard: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  notificationCardUnread: {
    backgroundColor: theme.inputBackground, // Slight contrast for unread
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  notificationMessage: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    marginTop: spacing[0.5],
  },
  notificationTime: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: spacing[1],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[20],
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.sm,
    color: theme.textSecondary,
  },
});

export default NotificationScreen;
