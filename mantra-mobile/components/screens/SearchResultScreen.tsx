import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Image, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';
import { getProfilePicture, getNovelCover } from '../../constants/defaultImages';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { EmptyState } from '../common';
import searchService from '../../services/searchService';
import socialService from '../../services/socialService';
import authService from '../../services/authService';
import { useToast } from '../ToastManager';

type FilterType = 'all' | 'novels' | 'authors';

interface NovelResult {
  id: string;
  title: string;
  cover: string;
  genre: string;
  rating: number;
  views: string;
  votes: string;
  description: string;
}

interface AuthorResult {
  id: string;
  name: string;
  username: string;
  avatar: string;
  novelCount: number;
  followers: string;
  isFollowing: boolean;
}

const SearchResultScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const route = useRoute();
  const { showToast } = useToast();
  const initialQuery = (route.params as any)?.query || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [novels, setNovels] = useState<NovelResult[]>([]);
  const [authors, setAuthors] = useState<AuthorResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const initializeUser = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const performSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      // Search novels and authors separately
      const [novels, authors] = await Promise.all([
        searchService.searchNovels(query),
        searchService.searchAuthors(query)
      ]);
      const results = { novels, authors };

      // Format novels
      const formattedNovels: NovelResult[] = (results.novels || []).map((novel: any) => ({
        id: novel.id,
        title: novel.title,
        cover: getNovelCover(novel.cover_image_url),
        genre: novel.genres?.[0] || 'Unknown',
        rating: novel.average_rating || 0,
        views: formatCount(novel.total_views || 0),
        votes: formatCount(novel.total_votes || 0),
        description: novel.description || 'No description available',
      }));

      // Format authors
      const formattedAuthors: AuthorResult[] = await Promise.all(
        (results.authors || []).map(async (author: any) => {
          let isFollowing = false;
          if (currentUserId) {
            try {
              isFollowing = await socialService.isFollowing(currentUserId, author.id);
            } catch (error) {
              console.error('Error checking follow status:', error);
            }
          }

          return {
            id: author.id,
            name: author.display_name || author.username,
            username: `@${author.username}`,
            avatar: getProfilePicture(author.profile_picture_url, author.display_name || author.username),
            novelCount: 0, // TODO: Calculate from novels table
            followers: formatCount(0), // TODO: Calculate from follows table
            isFollowing,
          };
        })
      );

      setNovels(formattedNovels);
      setAuthors(formattedAuthors);
    } catch (error) {
      console.error('Error performing search:', error);
      showToast('error', 'Failed to search');
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

  const totalResults = novels.length + authors.length;

  const handleSearch = () => {
    performSearch(searchQuery);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const handleNovelPress = (novelId: string) => {
    (navigation.navigate as any)('NovelDetail', { novelId });
  };

  const handleAuthorPress = (authorId: string) => {
    (navigation.navigate as any)('OtherUserProfile', { userId: authorId });
  };

  const toggleFollow = async (authorId: string) => {
    if (!currentUserId) {
      showToast('info', 'Please login to follow authors');
      return;
    }

    const author = authors.find(a => a.id === authorId);
    if (!author) return;

    try {
      if (author.isFollowing) {
        await socialService.unfollowUser(currentUserId, authorId);
        showToast('success', `Unfollowed ${author.name}`);
      } else {
        await socialService.followUser(currentUserId, authorId);
        showToast('success', `Following ${author.name}`);
      }

      setAuthors(prevAuthors =>
        prevAuthors.map(a =>
          a.id === authorId
            ? { ...a, isFollowing: !a.isFollowing }
            : a
        )
      );
    } catch (error) {
      console.error('Error toggling follow:', error);
      showToast('error', 'Failed to update follow status');
    }
  };

  const getFilteredResults = () => {
    switch (activeFilter) {
      case 'novels':
        return { novels, authors: [] };
      case 'authors':
        return { novels: [], authors };
      case 'all':
      default:
        return { novels, authors };
    }
  };

  const { novels: filteredNovels, authors: filteredAuthors } = getFilteredResults();
  const hasResults = filteredNovels.length > 0 || filteredAuthors.length > 0;

  // Interleave novels and authors for "all" filter
  const renderResults = () => {
    if (!hasResults) {
      return (
        <EmptyState
          icon="search"
          title="No results found"
          description={`We couldn't find anything matching "${searchQuery}"`}
          actionText="Try different keywords"
          onActionPress={() => { }}
        />
      );
    }

    const results: React.ReactElement[] = [];
    let novelIndex = 0;
    let authorIndex = 0;

    if (activeFilter === 'all') {
      // Interleave: 2 novels, 1 author pattern
      while (novelIndex < filteredNovels.length || authorIndex < filteredAuthors.length) {
        // Add 2 novels
        for (let i = 0; i < 2 && novelIndex < filteredNovels.length; i++) {
          const novel = filteredNovels[novelIndex];
          results.push(
            <TouchableOpacity
              key={`novel-${novel.id}`}
              style={styles.novelItem}
              onPress={() => handleNovelPress(novel.id)}
            >
              <Image source={{ uri: novel.cover }} style={styles.novelCover} />
              <View style={styles.novelInfo}>
                <Text style={styles.novelTitle} numberOfLines={1}>{novel.title}</Text>
                <Text style={styles.novelMeta}>
                  {novel.genre} · {novel.rating}★ · {novel.views} views · {novel.votes} votes
                </Text>
                <Text style={styles.novelDescription} numberOfLines={2}>
                  {novel.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
          novelIndex++;
        }

        // Add 1 author
        if (authorIndex < filteredAuthors.length) {
          const author = filteredAuthors[authorIndex];
          results.push(
            <TouchableOpacity
              key={`author-${author.id}`}
              style={styles.authorItem}
              onPress={() => handleAuthorPress(author.id)}
            >
              <Image source={{ uri: author.avatar }} style={styles.authorAvatar} />
              <View style={styles.authorInfo}>
                <Text style={styles.authorName} numberOfLines={1}>{author.name}</Text>
                <Text style={styles.authorMeta}>
                  {author.username} · {author.novelCount} novels · {author.followers} followers
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  author.isFollowing && styles.followingButton
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  toggleFollow(author.id);
                }}
              >
                <Text style={[
                  styles.followButtonText,
                  author.isFollowing && styles.followingButtonText
                ]}>
                  {author.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
          authorIndex++;
        }
      }
    } else if (activeFilter === 'novels') {
      filteredNovels.forEach(novel => {
        results.push(
          <TouchableOpacity
            key={`novel-${novel.id}`}
            style={styles.novelItem}
            onPress={() => handleNovelPress(novel.id)}
          >
            <Image source={{ uri: novel.cover }} style={styles.novelCover} />
            <View style={styles.novelInfo}>
              <Text style={styles.novelTitle} numberOfLines={1}>{novel.title}</Text>
              <Text style={styles.novelMeta}>
                {novel.genre} · {novel.rating}★ · {novel.views} views · {novel.votes} votes
              </Text>
              <Text style={styles.novelDescription} numberOfLines={2}>
                {novel.description}
              </Text>
            </View>
          </TouchableOpacity>
        );
      });
    } else if (activeFilter === 'authors') {
      filteredAuthors.forEach(author => {
        results.push(
          <TouchableOpacity
            key={`author-${author.id}`}
            style={styles.authorItem}
            onPress={() => handleAuthorPress(author.id)}
          >
            <Image source={{ uri: author.avatar }} style={styles.authorAvatar} />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName} numberOfLines={1}>{author.name}</Text>
              <Text style={styles.authorMeta}>
                {author.username} · {author.novelCount} novels · {author.followers} followers
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.followButton,
                author.isFollowing && styles.followingButton
              ]}
              onPress={(e) => {
                e.stopPropagation();
                toggleFollow(author.id);
              }}
            >
              <Text style={[
                styles.followButtonText,
                author.isFollowing && styles.followingButtonText
              ]}>
                {author.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        );
      });
    }

    return results;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
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
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity onPress={handleSearch}>
            <Text style={styles.searchButton}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {(['all', 'novels', 'authors'] as FilterType[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.filterButtonActive
              ]}
              onPress={() => handleFilterChange(filter)}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === filter && styles.filterButtonTextActive
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.resultsCount}>
            Found <Text style={styles.resultsCountBold}>{totalResults} results</Text> for "{searchQuery}"
          </Text>

          <View style={styles.resultsContainer}>
            {renderResults()}
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
    backgroundColor: theme.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  searchRow: {
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
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: theme.inputBackground,
  },
  searchIcon: {
    marginRight: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: theme.text,
  },
  searchButton: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.primary,
  },
  filtersContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  filtersContent: {
    gap: spacing[2],
  },
  filterButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  filterButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  filterButtonTextActive: {
    color: colors.white, // Keep white on primary
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[24],
  },
  resultsCount: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    marginBottom: spacing[4],
  },
  resultsCountBold: {
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  resultsContainer: {
    gap: spacing[3],
  },
  novelItem: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  novelCover: {
    width: 64,
    height: 80,
    borderRadius: borderRadius.lg,
  },
  novelInfo: {
    flex: 1,
  },
  novelTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  novelMeta: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  novelDescription: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    marginTop: spacing[1],
  },
  authorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  authorInfo: {
    flex: 1,
    minWidth: 0,
  },
  authorName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  authorMeta: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
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

export default SearchResultScreen;
