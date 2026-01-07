import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../../constants';
import { EmptyState } from '../common';
import { useToast } from '../ToastManager';
import readingService from '../../services/readingService';
import authService from '../../services/authService';
import { useTheme } from '../../context/ThemeContext';

interface SavedBook {
  id: string;
  title: string;
  genre: string;
  rating: number;
  coverImage: string;
  progress: number; // 0-100
  status?: string; // 'ongoing' | 'completed' | 'hiatus'
  totalChapters?: number;
  chaptersRead?: number;
}

interface HistoryBook {
  id: string;
  title: string;
  genre: string;
  rating: number;
  views: string;
  coverImage: string;
  description: string;
  readAt: string;
}

const LibraryScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'saved' | 'history'>('saved');
  const { showToast } = useToast();
  const { theme } = useTheme();

  const [savedBooksList, setSavedBooksList] = useState<SavedBook[]>([]);
  const [historyBooksList, setHistoryBooksList] = useState<HistoryBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      initializeUser();
    }, [])
  );

  useEffect(() => {
    if (currentUserId) {
      loadData();
    }
  }, [currentUserId, activeTab]);

  const initializeUser = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
    } else {
      setIsLoading(false);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'saved') {
        await loadLibrary();
      } else {
        await loadHistory();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadLibrary = async () => {
    if (!currentUserId) return;

    try {
      const libraryData = await readingService.getLibrary(currentUserId);

      const formattedBooks: SavedBook[] = libraryData.map((item: any) => {
        const novel = item.novel;
        return {
          id: novel.id,
          title: novel.title,
          genre: novel.genres?.[0] || 'Unknown',
          rating: novel.average_rating || 0,
          coverImage: novel.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80',
          progress: 0, // Will be updated with reading progress
          status: novel.status || 'ongoing', // Track novel status
          totalChapters: novel.total_chapters || 0,
          chaptersRead: 0,
        };
      });

      // Get reading progress for each novel
      for (const book of formattedBooks) {
        const progress = await readingService.getReadingProgress(currentUserId, book.id);
        if (progress) {
          book.progress = Math.round(progress.progress_percentage);
          book.chaptersRead = progress.chapters_read || 0;
        }
      }

      setSavedBooksList(formattedBooks);
    } catch (error) {
      console.error('Error loading library:', error);
      showToast('error', 'Failed to load library');
    }
  };

  const loadHistory = async () => {
    if (!currentUserId) return;

    try {
      const historyData = await readingService.getReadingHistory(currentUserId);

      const formattedHistory: HistoryBook[] = historyData.map((item: any) => {
        const novel = item.novel;
        const chapter = item.chapter;
        return {
          id: novel.id,
          title: novel.title,
          genre: novel.genres?.[0] || 'Unknown',
          rating: novel.average_rating || 0,
          views: `${Math.floor(novel.total_views / 1000)}k`,
          coverImage: novel.cover_image_url || 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?w=400&q=80',
          description: novel.description || 'No description available',
          readAt: formatReadTime(item.last_read_at),
        };
      });

      setHistoryBooksList(formattedHistory);
    } catch (error) {
      console.error('Error loading history:', error);
      showToast('error', 'Failed to load reading history');
    }
  };

  const formatReadTime = (timestamp: string): string => {
    const now = new Date();
    const readTime = new Date(timestamp);
    const diffMs = now.getTime() - readTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays === 1) {
      return 'yesterday';
    } else {
      return `${diffDays} days ago`;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleRemoveBook = async (bookId: string, bookTitle: string) => {
    if (!currentUserId) return;

    try {
      const response = await readingService.removeFromLibrary(currentUserId, bookId);

      if (response.success) {
        setSavedBooksList(prev => prev.filter(book => book.id !== bookId));
        showToast('success', `"${bookTitle}" removed from library`);
      } else {
        showToast('error', response.message);
      }
    } catch (error) {
      showToast('error', 'Failed to remove from library');
    }
  };

  const handleClearHistory = async () => {
    if (!currentUserId) return;

    if (historyBooksList.length === 0) {
      showToast('info', 'History is already empty');
      return;
    }

    try {
      const response = await readingService.clearReadingHistory(currentUserId);

      if (response.success) {
        setHistoryBooksList([]);
        showToast('success', 'Reading history cleared');
      } else {
        showToast('error', response.message);
      }
    } catch (error) {
      showToast('error', 'Failed to clear history');
    }
  };

  const handleFindNovels = () => {
    (navigation.navigate as any)('RecentSearch');
  };

  const handleBookPress = (bookId: string, isHistory: boolean) => {
    if (isHistory) {
      (navigation.navigate as any)('NovelDetail', { novelId: bookId });
    } else {
      // For saved books, go to novel detail to continue reading
      (navigation.navigate as any)('NovelDetail', { novelId: bookId });
    }
  };

  const handleExploreNovels = () => {
    (navigation.navigate as any)('Main');
  };

  const styles = getStyles(theme);

  const renderSavedBook = (book: SavedBook) => {
    // Check if novel is ongoing and user has read all available chapters
    const isOngoing = book.status?.toLowerCase() === 'ongoing';
    const isUpToDate = isOngoing && book.progress >= 100;

    // Display text for progress
    const progressText = isUpToDate ? 'Up to date' : `${book.progress}% read`;

    return (
      <TouchableOpacity
        key={book.id}
        style={styles.bookCard}
        activeOpacity={0.7}
        onPress={() => handleBookPress(book.id, false)}
      >
        <Image
          source={{ uri: book.coverImage }}
          style={styles.savedBookCover}
        />
        <View style={styles.bookDetails}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.bookMeta}>
            {book.genre} · {book.rating}★
          </Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${book.progress}%` }]} />
          </View>

          <View style={styles.bookFooter}>
            <Text style={[styles.progressText, isUpToDate && styles.upToDateText]}>
              {progressText}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={(e) => {
                if (e && e.stopPropagation) {
                  e.stopPropagation();
                }
                handleRemoveBook(book.id, book.title);
              }}
              style={styles.removeButtonContainer}
            >
              <Text style={styles.removeButton}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderHistoryBook = (book: HistoryBook) => (
    <TouchableOpacity
      key={book.id}
      style={styles.bookCard}
      activeOpacity={0.7}
      onPress={() => handleBookPress(book.id, true)}
    >
      <Image
        source={{ uri: book.coverImage }}
        style={styles.historyBookCover}
      />
      <View style={styles.bookDetails}>
        <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
        <Text style={styles.bookMeta}>
          {book.genre} · {book.rating}★ · {book.views} views
        </Text>
        <Text style={styles.bookDescription} numberOfLines={2}>
          {book.description}
        </Text>
        <Text style={styles.readAtText}>Read {book.readAt}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Library</Text>
          <TouchableOpacity onPress={handleFindNovels}>
            <Text style={styles.findNovelsButton}>Find novels</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
            onPress={() => setActiveTab('saved')}
          >
            <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
              Saved
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : activeTab === 'saved' ? (
          <View>
            <Text style={styles.sectionLabel}>Your saved books</Text>

            {savedBooksList.length === 0 ? (
              <EmptyState
                icon="bookmark"
                title="No saved books yet"
                description="Start building your collection by saving your favorite novels"
                actionText="Explore Novels"
                onActionPress={handleExploreNovels}
              />
            ) : (
              <View style={styles.booksList}>
                {savedBooksList.map(renderSavedBook)}
              </View>
            )}
          </View>
        ) : (
          <View>
            <View style={styles.historyHeader}>
              <Text style={styles.sectionLabel}>Recently opened</Text>
              <TouchableOpacity
                onPress={handleClearHistory}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.clearHistoryButtonContainer}
              >
                <Text style={styles.clearHistoryButton}>Clear History</Text>
              </TouchableOpacity>
            </View>

            {historyBooksList.length === 0 ? (
              <EmptyState
                icon="clock"
                title="No reading history"
                description="Your recently read novels will appear here"
                actionText="Start Reading"
                onActionPress={handleExploreNovels}
              />
            ) : (
              <View style={styles.booksList}>
                {historyBooksList.map(renderHistoryBook)}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  findNovelsButton: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  tab: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  tabActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.textSecondary,
  },
  tabTextActive: {
    color: theme.textInverse,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[24],
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    marginBottom: spacing[2],
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  clearHistoryButton: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.error,
  },
  booksList: {
    gap: spacing[3],
  },
  bookCard: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  savedBookCover: {
    width: 64,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: theme.backgroundSecondary,
  },
  historyBookCover: {
    width: 64,
    height: 80,
    borderRadius: borderRadius.lg,
    backgroundColor: theme.backgroundSecondary,
  },
  bookDetails: {
    flex: 1,
    minWidth: 0,
  },
  bookTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  bookMeta: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: spacing[0.5],
  },
  progressBarContainer: {
    width: '100%',
    height: 10, // h-2.5 from HTML (10px)
    backgroundColor: theme.backgroundSecondary,
    borderRadius: borderRadius.full,
    marginTop: spacing[2],
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: borderRadius.full,
  },
  bookFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  progressText: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  upToDateText: {
    color: theme.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  removeButtonContainer: {
    padding: spacing[1],
  },
  removeButton: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: theme.error,
  },
  clearHistoryButtonContainer: {
    padding: spacing[1],
  },
  bookDescription: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    marginTop: spacing[1],
    lineHeight: 16,
  },
  readAtText: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: spacing[1],
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

export default LibraryScreen;
