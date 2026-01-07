import React, { useState, useEffect } from 'react';
import {
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import profileService from '../../../services/profileService';
import socialService from '../../../services/socialService';
import novelService from '../../../services/novelService';
import authService from '../../../services/authService';
import { useToast } from '../../ToastManager';
import { useTheme } from '../../../context/ThemeContext';
import { getUserProfileImage } from '../../../utils/profileUtils';

interface OtherUserProfileScreenProps {
  navigation: any;
  route: {
    params: {
      userId: string;
    };
  };
}

const OtherUserProfileScreen: React.FC<OtherUserProfileScreenProps> = ({ navigation, route }) => {
  const { userId } = route.params;
  const { showToast } = useToast();
  const { theme, isDarkMode } = useTheme();

  const [isFollowing, setIsFollowing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [user, setUser] = useState({
    name: '',
    username: '',
    avatar: '',
    followers: '0',
    following: '0',
    novels: 0,
    bio: '',
  });

  const [novels, setNovels] = useState<any[]>([]);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadUserProfile();
    }
  }, [currentUserId, userId]);

  const initializeUser = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      // Load user profile
      const profile = await profileService.getProfile(userId);

      if (!profile) {
        showToast('error', 'User not found');
        setIsLoading(false);
        return;
      }

      // Fetch follow state, follower/following counts, and novels in parallel
      const [following, followers, followingList, userNovels] = await Promise.all([
        currentUserId ? socialService.isFollowing(currentUserId, userId) : Promise.resolve(false),
        socialService.getFollowers(userId),
        socialService.getFollowing(userId),
        novelService.getNovelsByAuthor(userId),
      ]);

      setUser({
        name: profile.display_name || profile.username,
        username: `@${profile.username}`,
        avatar: getUserProfileImage(profile),
        followers: formatCount(followers.length),
        following: formatCount(followingList.length),
        novels: userNovels.length,
        bio: profile.bio || 'No bio available',
      });

      // Set follow state from database
      setIsFollowing(following);

      const formattedNovels = userNovels.map((novel: any) => ({
        id: novel.id,
        title: novel.title,
        coverImage: novel.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80',
        genre: novel.genres?.[0] || 'Unknown',
        status: novel.status || 'Ongoing',
      }));

      setNovels(formattedNovels);
    } catch (error) {
      console.error('Error loading user profile:', error);
      showToast('error', 'Failed to load profile');
      // Set default state on error - show as not following
      setIsFollowing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUserProfile();
    setIsRefreshing(false);
  };

  const handleToggleFollow = async () => {
    if (!currentUserId) {
      showToast('info', 'Please login to follow users');
      return;
    }

    // Store previous state for potential reversion
    const previousFollowState = isFollowing;
    const previousFollowerCount = user.followers;

    try {
      // Optimistic UI update
      setIsFollowing(!isFollowing);

      // Update follower count optimistically
      const followerCountNum = parseFollowerCount(user.followers);
      const newCount = isFollowing ? followerCountNum - 1 : followerCountNum + 1;
      setUser(prev => ({
        ...prev,
        followers: formatCount(newCount),
      }));

      // Perform the actual follow/unfollow operation
      let result;
      if (previousFollowState) {
        result = await socialService.unfollowUser(currentUserId, userId);
      } else {
        result = await socialService.followUser(currentUserId, userId);
      }

      // Check if operation was successful
      if (!result.success) {
        throw new Error(result.message);
      }

      // Show success message
      showToast('success', result.message);
    } catch (error: any) {
      console.error('Error toggling follow:', error);

      // Revert optimistic updates on error
      setIsFollowing(previousFollowState);
      setUser(prev => ({
        ...prev,
        followers: previousFollowerCount,
      }));

      showToast('error', error.message || 'Failed to update follow status');
    }
  };

  // Helper function to parse follower count string back to number
  const parseFollowerCount = (countStr: string): number => {
    if (countStr.endsWith('M')) {
      return parseFloat(countStr) * 1000000;
    } else if (countStr.endsWith('k')) {
      return parseFloat(countStr) * 1000;
    }
    return parseInt(countStr) || 0;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header - NOT in SafeAreaView */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.7}
        >
          <Feather name="more-vertical" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading profile...</Text>
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
              colors={[theme.primary]}
            />
          }
        >
          {/* Profile Info */}
          <View style={styles.profileSection}>
            <Image source={{ uri: user.avatar }} style={[styles.avatar, { borderColor: theme.border }]} />
            <View style={styles.nameSection}>
              <Text style={[styles.name, { color: theme.text }]}>{user.name}</Text>
              <Text style={[styles.username, { color: theme.textSecondary }]}>{user.username}</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsContainer}>
              <TouchableOpacity
                style={styles.statButton}
                onPress={() => navigation.navigate('FollowList', { type: 'followers' })}
                activeOpacity={0.7}
              >
                <Text style={[styles.statValue, { color: theme.text }]}>{user.followers}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}> followers</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statButton}
                onPress={() => navigation.navigate('FollowList', { type: 'following' })}
                activeOpacity={0.7}
              >
                <Text style={[styles.statValue, { color: theme.text }]}>{user.following}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}> following</Text>
              </TouchableOpacity>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.text }]}>{user.novels}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}> novels</Text>
              </View>
            </View>

            {/* Follow Button */}
            <TouchableOpacity
              style={[
                styles.followButton,
                { backgroundColor: theme.primary },
                isFollowing && [styles.followingButton, { backgroundColor: theme.card, borderColor: theme.border }],
              ]}
              onPress={handleToggleFollow}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.followButtonText,
                  { color: colors.white },
                  isFollowing && [styles.followingButtonText, { color: theme.text }],
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bio */}
          <Text style={[styles.bio, { color: theme.textSecondary }]}>{user.bio}</Text>

          {/* Works */}
          <View style={styles.worksSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Works</Text>
            <View style={styles.novelsGrid}>
              {novels.map((novel, index) => (
                <TouchableOpacity
                  key={novel.id}
                  style={[
                    styles.novelCard,
                    (index + 1) % 3 !== 0 && styles.novelCardMargin,
                  ]}
                  onPress={() => navigation.navigate('NovelDetail', { novelId: novel.id })}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: novel.coverImage }} style={styles.novelCover} />
                  <Text style={[styles.novelTitle, { color: theme.text }]} numberOfLines={1}>
                    {novel.title}
                  </Text>
                  <Text style={[styles.novelGenre, { color: theme.textSecondary }]} numberOfLines={1}>
                    {novel.genre} · {novel.status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                // Share
              }}
              activeOpacity={0.7}
            >
              <Feather name="share-2" size={16} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                // Report
              }}
              activeOpacity={0.7}
            >
              <Feather name="flag" size={16} color={colors.red600} />
              <Text style={styles.menuItemTextDanger}>Report</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4], // Reduced from spacing[6]
    paddingBottom: spacing[4],
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
    borderRadius: borderRadius.lg,
  },
  menuButton: {
    padding: spacing[2],
    marginRight: -spacing[2],
    borderRadius: borderRadius.lg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[24],
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 96, // h-24 w-24
    height: 96,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.slate200,
  },
  nameSection: {
    marginTop: spacing[4],
    alignItems: 'center',
  },
  name: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.slate900,
  },
  username: {
    fontSize: typography.fontSize.sm,
    color: colors.slate500,
    marginTop: spacing[0.5],
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginTop: spacing[4],
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate800,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.slate500,
  },
  followButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.sky500,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  followingButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  followButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  followingButtonText: {
    color: colors.slate700,
  },
  bio: {
    fontSize: typography.fontSize.sm,
    color: colors.slate700,
    textAlign: 'center',
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
    lineHeight: 20,
  },
  worksSection: {
    marginTop: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    marginBottom: spacing[3],
  },
  novelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  novelCard: {
    width: '31%', // 3 cards per row
    marginBottom: spacing[4],
  },
  novelCardMargin: {
    marginRight: '3.5%', // Space between cards (not on every 3rd card)
  },
  novelCover: {
    width: '100%',
    aspectRatio: 3 / 4, // 3:4 ratio for book covers
    borderRadius: borderRadius.lg,
    backgroundColor: colors.slate100,
  },
  novelTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate900,
    marginTop: spacing[2],
  },
  novelGenre: {
    fontSize: typography.fontSize.xs,
    color: colors.slate500,
    marginTop: spacing[0.5],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: spacing[4],
  },
  menuDropdown: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.slate200,
    paddingVertical: spacing[2],
    minWidth: 192, // w-48
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
  },
  menuItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate700,
  },
  menuItemTextDanger: {
    fontSize: typography.fontSize.sm,
    color: colors.red600,
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
    color: colors.slate500,
  },
});

export default OtherUserProfileScreen;
