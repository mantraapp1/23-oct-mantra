import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import searchService from '../../services/searchService';
import authService from '../../services/authService';
import { useToast } from '../ToastManager';

interface RecentSearch {
  id: string;
  query: string;
}

interface TrendingSearch {
  id: string;
  rank: number;
  query: string;
  isHot: boolean;
}

const RecentSearchScreen = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<TrendingSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);



  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    setIsLoading(true);
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
        await loadRecentSearches(user.id);
      } else {
        // User not logged in - clear recent searches
        setRecentSearches([]);
      }
      await loadTrendingSearches();
    } catch (error) {
      console.error('Error initializing data:', error);
      showToast('error', 'Failed to load search data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentSearches = async (userId: string) => {
    try {
      const searches = await searchService.getRecentSearches(userId, 10);
      const formattedSearches: RecentSearch[] = searches.map((search) => ({
        id: search.id,
        query: search.query,
      }));
      setRecentSearches(formattedSearches);
    } catch (error) {
      console.error('Error loading recent searches:', error);
      showToast('error', 'Failed to load recent searches');
      setRecentSearches([]);
    }
  };

  const loadTrendingSearches = async () => {
    try {
      const trending = await searchService.getTrendingSearches(10);
      const formattedTrending: TrendingSearch[] = trending.map((item, index) => ({
        id: item.id,
        rank: index + 1,
        query: item.query,
        isHot: index < 3,
      }));
      setTrendingSearches(formattedTrending);
    } catch (error) {
      console.error('Error loading trending searches:', error);
      showToast('error', 'Failed to load trending searches');
      setTrendingSearches([]);
    }
  };

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (searchTerm.trim()) {
      // Save search to history if user is logged in
      if (currentUserId) {
        try {
          await searchService.saveSearch(currentUserId, searchTerm.trim());
          // Reload recent searches to show the new one
          await loadRecentSearches(currentUserId);
        } catch (error) {
          console.error('Error saving search:', error);
          // Don't show error toast - search still works, just not saved
        }
      }
      (navigation.navigate as any)('SearchResult', { query: searchTerm.trim() });
    }
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleRemoveRecentSearch = async (id: string) => {
    if (!currentUserId) {
      showToast('error', 'Please log in to manage search history');
      return;
    }

    try {
      await searchService.deleteSearch(id);
      // Update local state immediately for better UX
      setRecentSearches(prev => prev.filter(item => item.id !== id));
      showToast('success', 'Search removed');
    } catch (error) {
      console.error('Error removing search:', error);
      showToast('error', 'Failed to remove search');
      // Reload to ensure consistency
      await loadRecentSearches(currentUserId);
    }
  };

  const handleClearAll = async () => {
    if (!currentUserId) {
      showToast('error', 'Please log in to manage search history');
      return;
    }

    if (recentSearches.length === 0) {
      return;
    }

    try {
      await searchService.clearSearchHistory(currentUserId);
      setRecentSearches([]);
      showToast('success', 'Search history cleared');
    } catch (error) {
      console.error('Error clearing history:', error);
      showToast('error', 'Failed to clear history');
      // Reload to ensure consistency
      await loadRecentSearches(currentUserId);
    }
  };

  const handleTrendingPress = (query: string) => {
    handleSearch(query);
  };

  const handleTagPress = (tag: string) => {
    handleSearch(tag);
  };

  const getRankGradient = (rank: number): [string, string] => {
    if (rank === 1) return ['#ef4444', '#f97316'];
    if (rank === 2) return ['#f97316', '#eab308'];
    if (rank === 3) return ['#eab308', '#22c55e'];
    return [theme.border, theme.border];
  };

  const getTrendingIconColor = (rank: number): string => {
    if (rank === 1) return '#ef4444';
    if (rank === 2) return '#f97316';
    if (rank === 3) return '#eab308';
    if (rank <= 5) return theme.success;
    return theme.textSecondary;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={16} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search novels, authors, tags"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch()}
          />
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
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Recent Searches */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent searches</Text>
              {recentSearches.length > 0 && (
                <TouchableOpacity onPress={handleClearAll}>
                  <Text style={styles.clearButton}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            {recentSearches.length > 0 ? (
              <View style={styles.recentList}>
                {recentSearches.map((item) => (
                  <View key={item.id} style={styles.recentItem}>
                    <TouchableOpacity
                      style={styles.recentItemButton}
                      onPress={() => handleRecentSearchPress(item.query)}
                    >
                      <Feather name="clock" size={16} color={theme.textSecondary} />
                      <Text style={styles.recentItemText}>{item.query}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveRecentSearch(item.id)}
                    >
                      <Feather name="x" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No recent searches</Text>
              </View>
            )}
          </View>

          {/* Trending Searches */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending searches</Text>
            <View style={styles.trendingList}>
              {trendingSearches.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.trendingItem}
                  onPress={() => handleTrendingPress(item.query)}
                >
                  <View style={styles.trendingLeft}>
                    {item.rank <= 3 ? (
                      <LinearGradient
                        colors={getRankGradient(item.rank)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.rankBadgeGradient}
                      >
                        <Text style={styles.rankBadgeText}>{item.rank}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankBadgeTextDark}>{item.rank}</Text>
                      </View>
                    )}
                    <Text style={[
                      styles.trendingText,
                      item.rank <= 3 && styles.trendingTextBold
                    ]}>
                      {item.query}
                    </Text>
                  </View>
                  <Feather
                    name="trending-up"
                    size={16}
                    color={getTrendingIconColor(item.rank)}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>


        </ScrollView>
      )}
    </View>
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
    paddingVertical: spacing[2], // Reduced from 3
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.card,
  },
  backButton: {
    padding: spacing[2],
    borderRadius: borderRadius.lg,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    height: 40, // Fixed height
    backgroundColor: theme.inputBackground,
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: theme.text,
    height: '100%',
    paddingVertical: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[24],
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  clearButton: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.primary,
  },
  recentList: {
    gap: spacing[2],
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: theme.card,
  },
  recentItemButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  recentItemText: {
    fontSize: typography.fontSize.sm,
    color: theme.text,
  },
  removeButton: {
    padding: spacing[1.5],
    borderRadius: borderRadius.lg,
  },
  emptyState: {
    paddingVertical: spacing[8],
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: typography.fontSize.sm,
    color: theme.textSecondary,
  },
  trendingList: {
    gap: spacing[2],
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: borderRadius.lg,
    backgroundColor: theme.card,
  },
  trendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  rankBadgeGradient: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: theme.text,
  },
  rankBadgeTextDark: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: theme.text,
  },
  trendingText: {
    fontSize: typography.fontSize.sm,
    color: theme.text,
    flex: 1,
  },
  trendingTextBold: {
    fontWeight: typography.fontWeight.medium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  tag: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
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

export default RecentSearchScreen;
