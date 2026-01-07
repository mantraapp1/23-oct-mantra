import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../../constants';
import novelService from '../../services/novelService';
import readingService from '../../services/readingService';
import searchService from '../../services/searchService';
import authService from '../../services/authService';
import profileService from '../../services/profileService';
import { useToast } from '../ToastManager';
import { useTheme } from '../../context/ThemeContext';

interface RankingItem {
  id: string;
  rank: number;
  title: string;
  genre: string;
  rating: number;
  views: string;
  coverImage: string;
  change?: number; // Positive for up, negative for down
  hasVoted?: boolean;
  isInLibrary?: boolean;
}

const RankingScreen = () => {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { theme } = useTheme();

  const [sortBy, setSortBy] = useState('Trending');
  const [timeRange, setTimeRange] = useState('Today');
  const [genre, setGenre] = useState('All Genres');

  const [activeDropdown, setActiveDropdown] = useState<'sort' | 'time' | 'genre' | null>(null);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const sortOptions = ['Trending', 'Most Viewed', 'Most Voted', 'Highest Rated'];
  const timeOptions = ['Today', 'Weekly', 'Monthly', 'Yearly'];
  const genreOptions = ['All Genres', 'Fantasy', 'Romance', 'Adventure', 'Thriller', 'Slice of Life'];

  useEffect(() => {
    initializeUser();
  }, [sortBy, genre]);

  const initializeUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUserId(user?.id || null);
    loadRankings(user?.id || null);
  };

  const loadRankings = async (userId: string | null = currentUserId) => {
    setIsLoading(true);
    try {
      let novelsData: any[] = [];
      let language = 'All';

      if (userId) {
        const profile = await profileService.getProfile(userId);
        language = profile?.preferred_language || 'All';
      }

      const fetchRankings = async (lang: string) => {
        if (genre !== 'All Genres') {
          return await searchService.searchByGenre(genre, 1, 20, lang);
        } else {
          switch (sortBy) {
            case 'Trending':
              return await novelService.getTrendingNovels(20, lang);
            case 'Most Viewed':
              return await novelService.getPopularNovels(20, lang);
            case 'Highest Rated':
              return await novelService.getTopRatedNovels(20, lang);
            case 'Most Voted':
              return await novelService.getTopRatedNovels(20, lang); // Using top rated as proxy
            default:
              return await novelService.getTrendingNovels(20, lang);
          }
        }
      };

      novelsData = await fetchRankings(language);

      // Fallback logic: If no content found and language is not 'All', try 'All'
      if (novelsData.length === 0 && language !== 'All') {
        console.log(`No results for ${language} in Ranking, falling back to All`);
        novelsData = await fetchRankings('All');
      }

      // Extract novel IDs for batch fetching interaction states
      const novelIds = novelsData.map(novel => novel.id);

      // Batch fetch user interaction states if user is logged in
      let userVotesSet = new Set<string>();
      let userLibrarySet = new Set<string>();

      if (userId && novelIds.length > 0) {
        try {
          [userVotesSet, userLibrarySet] = await Promise.all([
            novelService.getUserVotes(userId, novelIds),
            readingService.getLibraryNovels(userId, novelIds),
          ]);
        } catch (error) {
          console.error('Error fetching user interaction states:', error);
          // Continue with empty sets if fetching fails
        }
      }

      const formattedRankings: RankingItem[] = novelsData.map((novel: any, index: number) => ({
        id: novel.id,
        rank: index + 1,
        title: novel.title,
        genre: novel.genres?.[0] || 'Unknown',
        rating: novel.average_rating || 0,
        views: formatViews(novel.total_views || 0),
        coverImage: novel.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80',
        hasVoted: userVotesSet.has(novel.id),
        isInLibrary: userLibrarySet.has(novel.id),
      }));

      setRankings(formattedRankings);
    } catch (error) {
      console.error('Error loading rankings:', error);
      showToast('error', 'Failed to load rankings');
    } finally {
      setIsLoading(false);
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
    setIsRefreshing(true);
    await loadRankings(currentUserId);
    setIsRefreshing(false);
  };

  const handleNovelPress = (novelId: string) => {
    (navigation.navigate as any)('NovelDetail', { novelId });
  };

  const renderRankBadge = (rank: number) => {
    const isTopThree = rank <= 3;
    return (
      <View style={[
        styles.rankBadge,
        isTopThree ? styles.rankBadgeTop : styles.rankBadgeNormal
      ]}>
        <Text style={[
          styles.rankText,
          isTopThree ? styles.rankTextTop : styles.rankTextNormal
        ]}>
          {rank}
        </Text>
      </View>
    );
  };

  const renderChangeBadge = (change?: number) => {
    if (change === undefined) {
      // Show "-" for no change
      return (
        <View style={[styles.changeBadge, styles.changeBadgeNeutral]}>
          <Text style={[styles.changeText, styles.changeTextNeutral]}>
            -
          </Text>
        </View>
      );
    }

    const isPositive = change > 0;
    return (
      <View style={[
        styles.changeBadge,
        isPositive ? styles.changeBadgeUp : styles.changeBadgeDown
      ]}>
        <Text style={[
          styles.changeText,
          isPositive ? styles.changeTextUp : styles.changeTextDown
        ]}>
          {isPositive ? '+' : ''}{change}
        </Text>
      </View>
    );
  };

  const renderFilterWithDropdown = (
    type: 'sort' | 'time' | 'genre',
    label: string,
    options: string[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => {
    const isOpen = activeDropdown === type;

    return (
      <View style={styles.filterWrapper}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setActiveDropdown(isOpen ? null : type)}
        >
          <Text style={styles.filterText}>{label}</Text>
          <Feather
            name="chevron-down"
            size={14}
            color={theme.textSecondary}
            style={isOpen && { transform: [{ rotate: '180deg' }] }}
          />
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.dropdownMenu}>
            <ScrollView
              style={styles.dropdownScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.dropdownOption,
                    selectedValue === option && styles.dropdownOptionSelected
                  ]}
                  onPress={() => {
                    onSelect(option);
                    setActiveDropdown(null);
                  }}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    selectedValue === option && styles.dropdownOptionTextSelected
                  ]}>
                    {option}
                  </Text>
                  {selectedValue === option && (
                    <Feather name="check" size={16} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      {/* Header with Filters */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rankings</Text>

        <View style={styles.filtersContainer}>
          {renderFilterWithDropdown('sort', sortBy, sortOptions, sortBy, setSortBy)}
          {renderFilterWithDropdown('time', timeRange, timeOptions, timeRange, setTimeRange)}
          {renderFilterWithDropdown('genre', genre, genreOptions, genre, setGenre)}
        </View>
      </View>

      {/* Overlay to close dropdown when tapping outside */}
      {activeDropdown && (
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setActiveDropdown(null)}
        />
      )}

      {/* Rankings List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      ) : rankings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="book" size={48} color={theme.textSecondary} />
          <Text style={styles.emptyText}>No novels found</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.listContainer}
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
          {rankings.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.rankingItem}
              activeOpacity={0.7}
              onPress={() => handleNovelPress(item.id)}
            >
              {renderRankBadge(item.rank)}

              <Image
                source={{ uri: item.coverImage }}
                style={styles.coverImage}
              />

              <View style={styles.itemDetails}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.itemMeta}>
                  {item.genre} · {item.rating}★ · {item.views} views
                </Text>
              </View>

              {renderChangeBadge(item.change)}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
    zIndex: 1000,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
    marginBottom: spacing[3],
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    position: 'relative',
    zIndex: 1001,
  },
  filterWrapper: {
    position: 'relative',
    zIndex: 1002,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  filterText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.textSecondary,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    marginTop: spacing[1],
    minWidth: 180,
    maxHeight: 240,
    backgroundColor: theme.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1003,
  },
  dropdownScroll: {
    maxHeight: 240,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  dropdownOptionSelected: {
    backgroundColor: theme.backgroundSecondary,
  },
  dropdownOptionText: {
    fontSize: typography.fontSize.sm,
    color: theme.text,
  },
  dropdownOptionTextSelected: {
    color: theme.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[24],
    gap: spacing[2],
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeTop: {
    backgroundColor: theme.primaryLight,
  },
  rankBadgeNormal: {
    backgroundColor: theme.backgroundSecondary,
  },
  rankText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  rankTextTop: {
    color: theme.primary, // Primary color for top rank
  },
  rankTextNormal: {
    color: theme.textSecondary,
  },
  coverImage: {
    width: 40,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: theme.backgroundSecondary,
  },
  itemDetails: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
    marginBottom: spacing[0.5],
  },
  itemMeta: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  changeBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  changeBadgeUp: {
    backgroundColor: theme.success + '15',
  },
  changeBadgeDown: {
    backgroundColor: theme.error + '15',
  },
  changeBadgeNeutral: {
    backgroundColor: theme.backgroundSecondary,
  },
  changeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
  changeTextUp: {
    color: theme.success,
  },
  changeTextDown: {
    color: theme.error,
  },
  changeTextNeutral: {
    color: theme.textSecondary,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[10],
  },
  emptyText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.sm,
    color: theme.textSecondary,
  },
});

export default RankingScreen;
