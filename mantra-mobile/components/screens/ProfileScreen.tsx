import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';
import { getProfilePicture } from '../../constants/defaultImages';
import authService from '../../services/authService';
import profileService from '../../services/profileService';
import { useToast } from '../ToastManager';
import { getUserProfileImage } from '../../utils/profileUtils';
import { useTheme } from '../../context/ThemeContext';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { theme } = useTheme();

  const [user, setUser] = useState({
    name: '',
    username: '',
    memberSince: '',
    avatar: getProfilePicture(null),
    following: 0,
    followers: 0,
    earnings: 0,
    libraryCount: 0,
    authoredNovelsCount: 0,
    walletBalance: 0,
    unreadNotifications: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        navigation.navigate('Login' as never);
        return;
      }

      setCurrentUserId(currentUser.id);

      // Load profile
      const profile = await profileService.getProfile(currentUser.id);
      if (profile) {
        // Load user stats
        const stats = await profileService.getUserStats(currentUser.id);

        setUser({
          name: profile.display_name || profile.username,
          username: `@${profile.username}`,
          memberSince: new Date(profile.created_at).getFullYear().toString(),
          avatar: getUserProfileImage(profile),
          following: stats.followingCount,
          followers: stats.followerCount,
          earnings: stats.earnings,
          libraryCount: stats.libraryCount || 0,
          authoredNovelsCount: stats.novelsCount || 0,
          walletBalance: stats.balance || 0,
          unreadNotifications: 0, // TODO: Get from notification service
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      showToast('error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUserData();
    setIsRefreshing(false);
  };

  const menuItems = [
    {
      icon: 'bookmark',
      title: 'My Library',
      subtitle: `${user.libraryCount} novels`,
      onPress: () => navigation.navigate('Library' as never),
    },
    {
      icon: 'edit',
      title: 'Author Dashboard',
      subtitle: `${user.authoredNovelsCount} novels`,
      onPress: () => navigation.navigate('AuthorDashboard' as never),
    },
    {
      icon: 'credit-card',
      title: 'Wallet',
      subtitle: `$${user.walletBalance.toFixed(2)}`,
      onPress: () => navigation.navigate('Wallet' as never),
    },
    {
      icon: 'bell',
      title: 'Notifications',
      subtitle: `${user.unreadNotifications} unread`,
      onPress: () => navigation.navigate('Notification' as never),
    },
    {
      icon: 'settings',
      title: 'Settings',
      subtitle: 'Preferences',
      onPress: () => navigation.navigate('Settings' as never),
    },
    {
      icon: 'help-circle',
      title: 'FAQ',
      subtitle: 'Common questions',
      onPress: () => navigation.navigate('Faq' as never),
    },
    {
      icon: 'star',
      title: 'Rate the App',
      subtitle: 'Share your feedback',
      onPress: () => {
        // Open app store rating
        console.log('Open app store rating');
      },
    },
    {
      icon: 'mail',
      title: 'Contact Us',
      subtitle: 'Get in touch',
      onPress: () => navigation.navigate('ContactUs' as never),
    },
    {
      icon: 'flag',
      title: 'Report',
      subtitle: 'Report an issue',
      onPress: () => navigation.navigate('Report' as never),
    },
  ];

  const handleEditProfile = () => {
    navigation.navigate('EditProfile' as never);
  };

  const handleFollowing = () => {
    (navigation.navigate as any)('FollowList', { tab: 'following' });
  };

  const handleFollowers = () => {
    (navigation.navigate as any)('FollowList', { tab: 'followers' });
  };

  const handleEarnings = () => {
    navigation.navigate('Wallet' as never);
  };

  const styles = getStyles(theme);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={theme.primary}
          colors={[theme.primary]}
        />
      }
    >
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <>
            {/* Profile Header */}
            <View style={styles.header}>
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
              <View style={styles.userInfo}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.username}>{user.username}</Text>
                <Text style={styles.memberSince}>Member since {user.memberSince}</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <TouchableOpacity style={styles.statCard} onPress={handleFollowing}>
                <Text style={styles.statValue}>{user.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statCard} onPress={handleFollowers}>
                <Text style={styles.statValue}>
                  {user.followers >= 1000
                    ? `${(user.followers / 1000).toFixed(1)}k`
                    : user.followers}
                </Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statCard} onPress={handleEarnings}>
                <Text style={styles.statValue}>${user.earnings}</Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </TouchableOpacity>
            </View>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.onPress}
                >
                  <Feather name={item.icon as any} size={20} color={theme.textSecondary} />
                  <View style={styles.menuItemContent}>
                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                    <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[24],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: theme.border,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  username: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    marginTop: 2,
  },
  memberSince: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  editButtonText: {
    fontSize: typography.fontSize.xs,
    color: theme.text,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing[3],
    alignItems: 'center',
    backgroundColor: theme.card,
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  statLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  menuContainer: {
    marginTop: spacing[4],
    gap: spacing[2],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  menuItemSubtitle: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    marginTop: 2,
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

export default ProfileScreen;
