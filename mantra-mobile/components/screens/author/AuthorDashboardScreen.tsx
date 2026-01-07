import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import { getNovelCover } from '../../../constants/defaultImages';
import { NoNovelCreated } from '../../empty-states';
import novelService from '../../../services/novelService';
import authService from '../../../services/authService';
import walletService from '../../../services/walletService';
import { useToast } from '../../ToastManager';
import { useTheme } from '../../../context/ThemeContext';

interface AuthorDashboardScreenProps {
  navigation: any;
}

const AuthorDashboardScreen: React.FC<AuthorDashboardScreenProps> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    novels: 0,
    views: '0',
    earnings: '0',
  });
  const [novels, setNovels] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [novelIdToDelete, setNovelIdToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      initializeAuthor();
    }, [])
  );

  const initializeAuthor = async () => {
    setIsLoading(true);
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
        await loadAuthorData(user.id);
      }
    } catch (error) {
      console.error('Error initializing author:', error);
      showToast('error', 'Failed to load author data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuthorData = async (authorId: string) => {
    try {
      // Load novels by author
      const authorNovels = await novelService.getNovelsByAuthor(authorId, 1, 100);

      // Load wallet data
      const wallet = await walletService.getWallet(authorId);

      // Calculate stats
      const totalViews = authorNovels.reduce((sum: number, novel: any) => sum + (novel.total_views || 0), 0);


      setStats({
        novels: authorNovels.length,
        views: formatViews(totalViews),
        earnings: wallet?.total_earned?.toFixed(2) || '0.00',
      });

      const formattedNovels = authorNovels.map((novel: any) => ({
        id: novel.id,
        title: novel.title,
        cover: getNovelCover(novel.cover_image_url),
        chapters: novel.total_chapters || 0,
        views: formatViews(novel.total_views || 0),
      }));

      setNovels(formattedNovels);
    } catch (error) {
      console.error('Error loading author data:', error);
      showToast('error', 'Failed to load novels');
    }
  };

  const formatViews = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleRefresh = async () => {
    if (!currentUserId) return;
    setIsRefreshing(true);
    await loadAuthorData(currentUserId);
    setIsRefreshing(false);
  };

  const handleCreateNovel = () => {
    navigation.navigate('CreateNovel');
  };

  const handleEditNovel = (novelId: string) => {
    navigation.navigate('EditNovel', { novelId });
  };

  const handleAddChapter = (novelId: string) => {
    navigation.navigate('CreateChapter', { novelId });
  };

  const handleDeleteNovel = (novelId: string) => {
    setNovelIdToDelete(novelId);
    setShowDeleteModal(true);
  };

  const confirmDeleteNovel = async () => {
    if (!novelIdToDelete) return;

    setIsDeleting(true);
    try {
      const result = await novelService.deleteNovel(novelIdToDelete);
      if (result.success) {
        showToast('success', 'Novel deleted successfully');
        if (currentUserId) {
          await loadAuthorData(currentUserId);
        }
      } else {
        showToast('error', result.message || 'Failed to delete novel');
      }
    } catch (error: any) {
      console.error('Error deleting novel:', error);
      showToast('error', error.message || 'Failed to delete novel');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setNovelIdToDelete(null);
    }
  };

  const handleNovelPress = (novelId: string) => {
    navigation.navigate('NovelManage', { novelId });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Author Dashboard</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateNovel}
          >
            <Text style={[styles.createButtonText, { color: '#ffffff' }]}>+ Novel</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.sky500} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state if no novels
  if (novels.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Author Dashboard</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateNovel}
          >
            <Text style={[styles.createButtonText, { color: '#ffffff' }]}>+ Novel</Text>
          </TouchableOpacity>
        </View>
        <NoNovelCreated onCreatePress={handleCreateNovel} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header - Matching HTML exactly */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Author Dashboard</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateNovel}
          >
            <Text style={[styles.createButtonText, { color: '#ffffff' }]}>+ Novel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: theme.background }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.sky500}
          />
        }
      >
        {/* Stats Grid - 3 columns matching HTML */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.novels}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Novels</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.views}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Views</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.earnings}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Earnings</Text>
          </View>
        </View>

        {/* Your Novels Section */}
        <View style={styles.novelsSection}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Novels</Text>
          <View style={styles.novelsList}>
            {novels.map((novel) => (
              <View key={novel.id} style={[styles.novelItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Image source={{ uri: novel.cover }} style={styles.novelCover} />
                <View style={styles.novelDetails}>
                  <TouchableOpacity
                    onPress={() => handleNovelPress(novel.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.novelTitle, { color: theme.text }]} numberOfLines={1}>{novel.title}</Text>
                    <Text style={[styles.novelStats, { color: theme.textSecondary }]}>
                      {novel.chapters} chapters · {novel.views} views
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.novelActions}>
                    <TouchableOpacity onPress={() => handleEditNovel(novel.id)}>
                      <Text style={[styles.actionButton, { color: theme.primary }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleAddChapter(novel.id)}>
                      <Text style={[styles.actionButton, { color: theme.primary }]}>+ Chapter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteNovel(novel.id)}>
                      <Text style={styles.deleteButton}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Delete Novel Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !isDeleting && setShowDeleteModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Delete Novel?</Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              Are you sure you want to delete this novel? This will permanently remove all chapters, reviews, and analytics. This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={confirmDeleteNovel}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
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
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    gap: spacing[2],
  },
  backButton: {
    padding: spacing[2],
    borderRadius: borderRadius.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    flex: 1,
  },
  headerRight: {
    marginLeft: 'auto',
  },
  createButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.sky500,
  },
  createButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[24],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate100,
    padding: spacing[3],
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  statLabel: {
    fontSize: 11,
    color: colors.slate500,
  },
  novelsSection: {
    marginTop: spacing[2],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate900,
    marginBottom: 16,
  },
  novelsList: {
    gap: 16,
  },
  novelItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate100,
    padding: 12,
    gap: 12,
  },
  novelCover: {
    width: 80,
    height: 110,
    borderRadius: 8,
  },
  novelDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  novelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate900,
    marginBottom: 4,
  },
  novelStats: {
    fontSize: 12,
    color: colors.slate500,
  },
  novelActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.sky500,
  },
  deleteButton: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.red500,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate900,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: colors.slate600,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.slate100,
  },
  modalButtonDelete: {
    backgroundColor: colors.red500,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate700,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.sm,
    color: colors.slate500,
  },
});

export default AuthorDashboardScreen;