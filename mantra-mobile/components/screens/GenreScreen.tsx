import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../constants/theme';
import { getNovelCover } from '../../constants/defaultImages';
import { supabase } from '../../config/supabase';
import { LoadingState, ErrorState } from '../common';
import novelService from '../../services/novelService';
import readingService from '../../services/readingService';
import authService from '../../services/authService';

interface GenreScreenProps {
  navigation: any;
  route: {
    params: {
      genre: string;
    };
  };
}

interface Novel {
  id: string;
  title: string;
  cover: string;
  rating: number;
  views: string;
  hasVoted?: boolean;
  isInLibrary?: boolean;
}

const GenreScreen: React.FC<GenreScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { genre } = route.params || { genre: 'Fantasy' };

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [trendingNovels, setTrendingNovels] = useState<Novel[]>([]);
  const [topRankings, setTopRankings] = useState<Novel[]>([]);
  const [popularNovels, setPopularNovels] = useState<Novel[]>([]);
  const [recommendedNovels, setRecommendedNovels] = useState<Novel[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [recentlyUpdated, setRecentlyUpdated] = useState<any[]>([]);
  const [totalNovels, setTotalNovels] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    initializeUser();
  }, [genre]);

  const initializeUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUserId(user?.id || null);
    loadGenreData(user?.id || null);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  const loadGenreData = async (userId: string | null = currentUserId) => {
    try {
      setLoading(true);
      setError(null);

      // Get total count for this genre
      const { count } = await supabase
        .from('novels')
        .select('*', { count: 'exact', head: true })
        .contains('genres', [genre]);

      setTotalNovels(count || 0);

      // Load trending novels (highest views in last 30 days)
      const { data: trendingData } = await supabase
        .from('novels')
        .select('id, title, cover_image_url, average_rating, total_views')
        .contains('genres', [genre])
        .order('total_views', { ascending: false })
        .limit(5);

      // Load top rankings (highest rated)
      const { data: topData } = await supabase
        .from('novels')
        .select('id, title, cover_image_url, average_rating, total_views')
        .contains('genres', [genre])
        .order('average_rating', { ascending: false })
        .limit(4);

      // Load popular novels (highest votes)
      const { data: popularData } = await supabase
        .from('novels')
        .select('id, title, cover_image_url, average_rating, total_votes, total_views')
        .contains('genres', [genre])
        .order('total_votes', { ascending: false })
        .limit(5);

      // Load recommended novels (mix of rating and views)
      const { data: recommendedData } = await supabase
        .from('novels')
        .select('id, title, cover_image_url, average_rating, total_views')
        .contains('genres', [genre])
        .gte('average_rating', 4.0)
        .limit(4);

      // Load new arrivals (recently created)
      const { data: newData } = await supabase
        .from('novels')
        .select('id, title, cover_image_url, description')
        .contains('genres', [genre])
        .order('created_at', { ascending: false })
        .limit(5);

      // Load recently updated (latest chapter updates)
      const { data: updatedData } = await supabase
        .from('novels')
        .select(`
          id,
          title,
          cover_image_url,
          total_chapters,
          updated_at,
          genres
        `)
        .contains('genres', [genre])
        .order('updated_at', { ascending: false })
        .limit(5);

      // Collect all novel IDs for batch fetching interaction states
      const allNovels = [
        ...(trendingData || []),
        ...(topData || []),
        ...(popularData || []),
        ...(recommendedData || []),
        ...(newData || []),
        ...(updatedData || []),
      ];
      const novelIds = allNovels.map(novel => novel.id);

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

      // Transform novels with interaction states
      if (trendingData) {
        setTrendingNovels(trendingData.map(novel => ({
          id: novel.id,
          title: novel.title,
          cover: getNovelCover(novel.cover_image_url),
          rating: novel.average_rating || 0,
          views: formatNumber(novel.total_views || 0),
          hasVoted: userVotesSet.has(novel.id),
          isInLibrary: userLibrarySet.has(novel.id),
        })));
      }

      if (topData) {
        setTopRankings(topData.map(novel => ({
          id: novel.id,
          title: novel.title,
          cover: getNovelCover(novel.cover_image_url),
          rating: novel.average_rating || 0,
          views: formatNumber(novel.total_views || 0),
          hasVoted: userVotesSet.has(novel.id),
          isInLibrary: userLibrarySet.has(novel.id),
        })));
      }

      if (popularData) {
        setPopularNovels(popularData.map(novel => ({
          id: novel.id,
          title: novel.title,
          cover: getNovelCover(novel.cover_image_url),
          rating: novel.average_rating || 0,
          views: formatNumber(novel.total_views || 0),
          hasVoted: userVotesSet.has(novel.id),
          isInLibrary: userLibrarySet.has(novel.id),
        })));
      }

      if (recommendedData) {
        setRecommendedNovels(recommendedData.map(novel => ({
          id: novel.id,
          title: novel.title,
          cover: getNovelCover(novel.cover_image_url),
          rating: novel.average_rating || 0,
          views: formatNumber(novel.total_views || 0),
          hasVoted: userVotesSet.has(novel.id),
          isInLibrary: userLibrarySet.has(novel.id),
        })));
      }

      if (newData) {
        setNewArrivals(newData.map(novel => ({
          id: novel.id,
          title: novel.title,
          cover: getNovelCover(novel.cover_image_url),
          description: novel.description || '',
          genre: genre, // Use the screen's genre or first from novel.genres
          hasVoted: userVotesSet.has(novel.id),
          isInLibrary: userLibrarySet.has(novel.id),
        })));
      }

      if (updatedData) {
        setRecentlyUpdated(updatedData.map(novel => ({
          id: novel.id,
          title: novel.title,
          cover: getNovelCover(novel.cover_image_url),
          label: `Ch ${novel.total_chapters || 0} · ${formatTimeAgo(novel.updated_at)} · ${novel.genres?.[0] || genre}`,
          hasVoted: userVotesSet.has(novel.id),
          isInLibrary: userLibrarySet.has(novel.id),
        })));
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading genre data:', err);
      setError('Failed to load novels');
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGenreData(currentUserId);
    setRefreshing(false);
  };

  const handleNovelPress = (novelId: string) => {
    (navigation.navigate as any)('NovelDetail', { novelId });
  };

  const handleSeeAll = (section: string) => {
    (navigation.navigate as any)('SeeAll', { section, genre });
  };

  if (loading) {
    return <LoadingState message="Loading novels..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadGenreData} title="Failed to load novels" />;
  }

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
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{genre}</Text>
          <Text style={styles.headerSubtitle}>{formatNumber(totalNovels)} novels</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        {/* Trending Section */}
        {trendingNovels.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending</Text>
              <TouchableOpacity onPress={() => handleSeeAll('Trending')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {trendingNovels.map((novel) => (
                <TouchableOpacity
                  key={novel.id}
                  style={styles.trendingCard}
                  onPress={() => handleNovelPress(novel.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.trendingImage}>
                    <Image source={{ uri: novel.cover }} style={styles.trendingImageInner} />
                  </View>
                  <View style={styles.trendingInfo}>
                    <Text style={styles.trendingTitle} numberOfLines={1}>{novel.title}</Text>
                    <Text style={styles.trendingMeta}>{novel.rating}★ · {novel.views} views</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Top Rankings Section */}
        {topRankings.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Rankings</Text>
              <TouchableOpacity onPress={() => handleSeeAll('Top Rankings')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {topRankings.map((novel) => (
                <TouchableOpacity
                  key={novel.id}
                  style={styles.trendingCard}
                  onPress={() => handleNovelPress(novel.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.trendingImage}>
                    <Image source={{ uri: novel.cover }} style={styles.trendingImageInner} />
                  </View>
                  <View style={styles.trendingInfo}>
                    <Text style={styles.trendingTitle} numberOfLines={1}>{novel.title}</Text>
                    <Text style={styles.trendingMeta}>{novel.rating}★ · {novel.views} views</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Popular Section */}
        {popularNovels.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular</Text>
              <TouchableOpacity onPress={() => handleSeeAll('Popular')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {popularNovels.map((novel) => (
                <TouchableOpacity
                  key={novel.id}
                  style={styles.trendingCard}
                  onPress={() => handleNovelPress(novel.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.trendingImage}>
                    <Image source={{ uri: novel.cover }} style={styles.trendingImageInner} />
                  </View>
                  <View style={styles.trendingInfo}>
                    <Text style={styles.trendingTitle} numberOfLines={1}>{novel.title}</Text>
                    <Text style={styles.trendingMeta}>{novel.rating}★ · {novel.views} views</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recommended Section */}
        {recommendedNovels.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommended</Text>
              <TouchableOpacity onPress={() => handleSeeAll('Recommended')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {recommendedNovels.map((novel) => (
                <TouchableOpacity
                  key={novel.id}
                  style={styles.trendingCard}
                  onPress={() => handleNovelPress(novel.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.trendingImage}>
                    <Image source={{ uri: novel.cover }} style={styles.trendingImageInner} />
                  </View>
                  <View style={styles.trendingInfo}>
                    <Text style={styles.trendingTitle} numberOfLines={1}>{novel.title}</Text>
                    <Text style={styles.trendingMeta}>{novel.rating}★ · {novel.views} views</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* New Arrivals Section */}
        {newArrivals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Arrivals</Text>
              <TouchableOpacity onPress={() => handleSeeAll('New Arrivals')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.listContainer}>
              {newArrivals.map((novel) => (
                <TouchableOpacity
                  key={novel.id}
                  style={styles.listCard}
                  onPress={() => handleNovelPress(novel.id)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: novel.cover }} style={styles.listImage} />
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle} numberOfLines={1}>{novel.title}</Text>
                    <View style={styles.listMetaContainer}>
                      <Text style={styles.newLabel}>New</Text>
                      <Text style={styles.listMetaDivider}> · </Text>
                      <Text style={styles.listGenre}>{novel.genre}</Text>
                    </View>
                    <Text style={styles.listDescription} numberOfLines={2}>
                      {novel.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Recently Updated Section */}
        {recentlyUpdated.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Updated</Text>
              <TouchableOpacity onPress={() => handleSeeAll('Recently Updated')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.listContainer}>
              {recentlyUpdated.map((novel) => (
                <TouchableOpacity
                  key={novel.id}
                  style={styles.listCard}
                  onPress={() => handleNovelPress(novel.id)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: novel.cover }} style={styles.listImage} />
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle} numberOfLines={1}>{novel.title}</Text>
                    <Text style={styles.listMeta}>{novel.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {trendingNovels.length === 0 && topRankings.length === 0 && popularNovels.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="book-open" size={48} color={theme.textSecondary} />
            <Text style={styles.emptyTitle}>No novels found</Text>
            <Text style={styles.emptyText}>
              There are no novels in the {genre} genre yet.
            </Text>
          </View>
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
    zIndex: 40,
  },
  backButton: {
    padding: spacing[2],
    borderRadius: borderRadius.lg,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing[24],
  },
  section: {
    marginTop: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  seeAllText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.primary,
  },
  horizontalScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    marginTop: spacing[3],
  },
  trendingCard: {
    width: 144, // w-36 = 144px
  },
  trendingImage: {
    height: 192, // h-48 = 192px
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  trendingImageInner: {
    width: '100%',
    height: '100%',
  },
  trendingInfo: {
    marginTop: spacing[2],
  },
  trendingTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  trendingMeta: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    marginTop: spacing[3],
  },
  gridCard: {
    width: '48%',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  gridImage: {
    height: 144, // h-36 = 144px
    width: '100%',
  },
  gridInfo: {
    padding: spacing[2.5],
  },
  gridTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  gridMeta: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
  },
  listContainer: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
    marginTop: spacing[3],
  },
  listCard: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listImage: {
    height: 64, // h-16 = 64px
    width: 48, // w-12 = 48px
    borderRadius: borderRadius.md,
  },
  listInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  listMeta: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
  },
  listMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  newLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.sky500,
  },
  listMetaDivider: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
  },
  listGenre: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
  },
  listDescription: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[6],
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});

export default GenreScreen;
