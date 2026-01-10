import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import { useTheme } from '../../../context/ThemeContext';
import { ThemeColors } from '../../../constants/theme';
import socialService from '../../../services/socialService';
import authService from '../../../services/authService';
import { useToast } from '../../ToastManager';
import { UserAvatar } from '../../common';
import { getProfilePicture } from '../../../constants/defaultImages';

interface FollowListScreenProps {
  navigation?: any;
  route?: {
    params: {
      type: 'followers' | 'following';
      userId?: string;
    };
  };
}

const FollowListScreen = ({ navigation, route }: FollowListScreenProps) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(route?.params?.type || 'followers');
  const [removeModalVisible, setRemoveModalVisible] = useState(false);
  const [userToRemove, setUserToRemove] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadFollowData();
    }
  }, [currentUserId, activeTab]);

  const initializeUser = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
      // Use provided userId or current user's id
      setTargetUserId(route?.params?.userId || user.id);
    }
  };

  const loadFollowData = async () => {
    if (!targetUserId) return;

    setIsLoading(true);
    try {
      if (activeTab === 'followers') {
        await loadFollowers();
      } else {
        await loadFollowing();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadFollowers = async () => {
    if (!targetUserId || !currentUserId) return;

    try {
      const followersList = await socialService.getFollowers(targetUserId);

      const formattedFollowers = await Promise.all(
        followersList.map(async (follower: any) => {
          const isFollowing = await socialService.isFollowing(currentUserId, follower.id);
          const displayName = follower.display_name || follower.username || 'User';
          return {
            id: follower.id,
            name: displayName,
            username: `@${follower.username}`,
            avatar: getProfilePicture(follower.profile_picture_url, displayName),
            isFollowing,
          };
        })
      );

      setFollowers(formattedFollowers);
    } catch (error) {
      console.error('Error loading followers:', error);
      showToast('error', 'Failed to load followers');
    }
  };

  const loadFollowing = async () => {
    if (!targetUserId) return;

    try {
      const followingList = await socialService.getFollowing(targetUserId);

      const formattedFollowing = followingList.map((user: any) => {
        const displayName = user.display_name || user.username || 'User';
        return {
          id: user.id,
          name: displayName,
          username: `@${user.username}`,
          avatar: getProfilePicture(user.profile_picture_url, displayName),
          isFollowing: true, // They're in the following list, so always true
        };
      });

      setFollowing(formattedFollowing);
    } catch (error) {
      console.error('Error loading following:', error);
      showToast('error', 'Failed to load following');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFollowData();
    setIsRefreshing(false);
  };

  const handleToggleFollow = async (userId: string, listType: 'followers' | 'following') => {
    if (!currentUserId) {
      showToast('info', 'Please login to follow users');
      return;
    }

    try {
      const user = listType === 'followers'
        ? followers.find(f => f.id === userId)
        : following.find(f => f.id === userId);

      if (!user) return;

      if (user.isFollowing) {
        await socialService.unfollowUser(currentUserId, userId);
        showToast('success', `Unfollowed ${user.name}`);
      } else {
        await socialService.followUser(currentUserId, userId);
        showToast('success', `Following ${user.name}`);
      }

      // Update local state
      if (listType === 'followers') {
        setFollowers(followers.map(f =>
          f.id === userId ? { ...f, isFollowing: !f.isFollowing } : f
        ));
      } else {
        setFollowing(following.map(f =>
          f.id === userId ? { ...f, isFollowing: !f.isFollowing } : f
        ));
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      showToast('error', 'Failed to update follow status');
    }
  };

  const handleRemoveClick = (user: any) => {
    setUserToRemove(user);
    setRemoveModalVisible(true);
  };

  const handleConfirmRemove = async () => {
    if (!userToRemove || !currentUserId) return;

    try {
      // Remove follower by having them unfollow you
      await socialService.unfollowUser(userToRemove.id, currentUserId);
      setFollowers(followers.filter(user => user.id !== userToRemove.id));
      showToast('success', 'Follower removed');
      setRemoveModalVisible(false);
      setUserToRemove(null);
    } catch (error) {
      console.error('Error removing follower:', error);
      showToast('error', 'Failed to remove follower');
    }
  };

  const renderUserCard = (user: any, listType: 'followers' | 'following') => (
    <View key={user.id} style={styles.userCard}>
      <TouchableOpacity
        style={styles.userInfo}
        onPress={() => navigation.navigate('OtherUserProfile', { userId: user.id })}
        activeOpacity={0.7}
      >
        <UserAvatar uri={user.avatar} name={user.name} size={40} />
        <View style={styles.userDetails}>
          <Text style={styles.userName} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={styles.userUsername} numberOfLines={1}>
            {user.username}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.followButton,
          user.isFollowing && styles.followingButton,
        ]}
        onPress={() => handleToggleFollow(user.id, listType)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.followButtonText,
            user.isFollowing && styles.followingButtonText,
          ]}
        >
          {user.isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
      {listType === 'followers' && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveClick(user)}
          activeOpacity={0.7}
        >
          <Feather name="x" size={16} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {activeTab === 'followers' ? 'Followers' : 'Following'}
          </Text>
        </View>
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'followers' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('followers')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'followers' && styles.activeTabText,
              ]}
            >
              Followers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'following' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('following')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'following' && styles.activeTabText,
              ]}
            >
              Following
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
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
          {activeTab === 'followers' ? (
            followers.length > 0 ? (
              followers.map(user => renderUserCard(user, 'followers'))
            ) : (
              <Text style={styles.emptyText}>You don't have any followers yet.</Text>
            )
          ) : (
            following.length > 0 ? (
              following.map(user => renderUserCard(user, 'following'))
            ) : (
              <Text style={styles.emptyText}>You aren't following anyone yet.</Text>
            )
          )}
        </ScrollView>
      )}

      {/* Remove Modal */}
      <Modal
        visible={removeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRemoveModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Remove follower?</Text>
            <Text style={styles.modalText}>
              Are you sure you want to remove{' '}
              <Text style={styles.modalUsername}>{userToRemove?.name}</Text>?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonRemove}
                onPress={handleConfirmRemove}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonRemoveText}>Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setRemoveModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  backButton: {
    padding: spacing[2],
    borderRadius: borderRadius.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  tab: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: theme.border,
  },
  activeTab: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    color: theme.text,
  },
  activeTabText: {
    color: colors.white, // Keep white on primary
    fontWeight: typography.fontWeight.semibold,
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: theme.inputBackground,
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  userUsername: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
  },
  followButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.lg,
    backgroundColor: theme.primary,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.border,
  },
  followButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white, // Keep white on primary
  },
  followingButtonText: {
    color: theme.text,
  },
  removeButton: {
    padding: spacing[1.5],
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    color: theme.textSecondary,
    paddingVertical: spacing[8],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.card,
    borderRadius: borderRadius.lg,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    width: 256,
    marginHorizontal: 'auto',
    padding: spacing[4],
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
    marginBottom: spacing[2],
  },
  modalText: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  modalUsername: {
    fontWeight: typography.fontWeight.bold,
    color: theme.text,
  },
  modalButtons: {
    width: '100%',
    gap: spacing[2],
  },
  modalButtonRemove: {
    width: '100%',
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  modalButtonRemoveText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.error,
  },
  modalButtonCancel: {
    width: '100%',
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[10],
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.sm,
    color: theme.textSecondary,
  },
});

export default FollowListScreen;
