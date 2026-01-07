import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography, HOME_CATEGORIES, DEFAULT_IMAGES } from '../constants';
import { getNovelCover } from '../constants/defaultImages';
import { AppHeader, HorizontalSection, NovelCard, GenreTag } from './common';
import novelService from '../services/novelService';
import readingService from '../services/readingService';
import authService from '../services/authService';
import profileService from '../services/profileService';
import { useToast } from './ToastManager';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const { language, isLoading: isLanguageLoading } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState('All');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [trendingNovels, setTrendingNovels] = useState<any[]>([]);
  const [popularNovels, setPopularNovels] = useState<any[]>([]);
  const [recommendedNovels, setRecommendedNovels] = useState<any[]>([]);
  const [youMayLikeNovels, setYouMayLikeNovels] = useState<any[]>([]);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!isLanguageLoading) {
      loadHomeData(currentUserId, language, isMounted);
    }

    return () => {
      isMounted = false;
    };
  }, [language, isLanguageLoading]);

  // Reset selected category when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setSelectedCategory('All');
    });

    return unsubscribe;
  }, [navigation]);

  const initializeUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUserId(user?.id || null);
  };

  const loadHomeData = async (userId: string | null = currentUserId, language: string = 'All', isMounted: boolean = true) => {
    if (!isMounted) return;
    setIsLoading(true);
    try {
      let [trending, popular, recommended, editorsPicks] = await Promise.all([
        novelService.getTrendingNovels(6, language),
        novelService.getPopularNovels(6, language),
        novelService.getTopRatedNovels(6, language), // Using top rated as recommended
        novelService.getEditorsPicks(6, language), // Using editor's picks for "You may like this"
      ]);

      // Fallback logic: If no content found and language is not 'All', try 'All'
      const hasContent = trending.length > 0 || popular.length > 0;
      if (!hasContent && language !== 'All') {
        console.log(`No content found for ${language}, falling back to All`);
        // showToast('info', `No novels found in ${language}, showing English results`);

        [trending, popular, recommended, editorsPicks] = await Promise.all([
          novelService.getTrendingNovels(6, 'All'),
          novelService.getPopularNovels(6, 'All'),
          novelService.getTopRatedNovels(6, 'All'),
          novelService.getEditorsPicks(6, 'All'),
        ]);
      }

      console.log('Home data loaded:', {
        trending: trending.length,
        popular: popular.length,
        recommended: recommended.length,
        editorsPicks: editorsPicks.length,
      });

      // Collect all novel IDs for batch fetching interaction states
      const allNovels = [...trending, ...popular, ...recommended, ...editorsPicks];
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

      // Format novels with interaction states
      const formatNovelsWithStates = (novels: any[]) => {
        return novels.map((novel: any) => ({
          id: novel.id,
          title: novel.title,
          coverImage: getNovelCover(novel.cover_image_url),
          genre: novel.genres?.[0] || 'Unknown',
          rating: novel.average_rating || 0,
          chapters: novel.total_chapters || 0,
          views: formatViews(novel.total_views || 0),
          description: novel.description || '',
          hasVoted: userVotesSet.has(novel.id),
          isInLibrary: userLibrarySet.has(novel.id),
        }));
      };

      setTrendingNovels(formatNovelsWithStates(trending));
      setPopularNovels(formatNovelsWithStates(popular));
      setRecommendedNovels(formatNovelsWithStates(recommended));

      // Use editor's picks for "You may like this", fallback to popular if empty
      const youMayLike = editorsPicks.length > 0 ? editorsPicks : popular;
      setYouMayLikeNovels(formatNovelsWithStates(youMayLike));
    } catch (error) {
      console.error('Error loading home data:', error);
      showToast('error', 'Failed to load content');
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
    try {
      // Reload user data and refetch all home content
      const user = await authService.getCurrentUser();
      const userId = user?.id || null;
      setCurrentUserId(userId);
      await loadHomeData(userId, language);
    } catch (error) {
      console.error('Error refreshing home data:', error);
      showToast('error', 'Failed to refresh content');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleNovelPress = (novelId: string) => {
    (navigation.navigate as any)('NovelDetail', { novelId });
  };

  const handleSearchFocus = () => {
    (navigation.navigate as any)('RecentSearch');
  };

  const handleSeeAll = (section: string) => {
    (navigation.navigate as any)('SeeAll', { section });
  };

  const handleGenrePress = (genre: string) => {
    (navigation.navigate as any)('Genre', { genre });
  };

  const styles = getStyles(theme);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader
          onSearchPress={handleSearchFocus}
          onNotificationPress={() => (navigation.navigate as any)('Notification')}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* App Header */}
      <AppHeader
        onSearchPress={handleSearchFocus}
        onNotificationPress={() => (navigation.navigate as any)('Notification')}
      />

      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]} // Android
          />
        }
      >

        {/* Category Buttons */}
        <ScrollView horizontal style={styles.categoryButtonsContainer} showsHorizontalScrollIndicator={false}>
          {HOME_CATEGORIES.map((category: string) => (
            <GenreTag
              key={category}
              label={category}
              variant={selectedCategory === category ? 'primary' : 'default'}
              onPress={() => {
                setSelectedCategory(category);
                if (category !== 'All') {
                  handleGenrePress(category);
                }
              }}
            />
          ))}
        </ScrollView>

        {/* Featured Banner */}
        <View style={styles.featuredBannerContainer}>
          <TouchableOpacity
            style={styles.featuredBanner}
            activeOpacity={0.9}
            onPress={() => (navigation.navigate as any)('EditorsChoice')}
          >
            <Image
              source={{ uri: DEFAULT_IMAGES.featuredBanner }}
              style={styles.featuredBannerImage}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
              style={styles.featuredBannerGradient}
            />
            <View style={styles.featuredBannerTextContainer}>
              <Text style={styles.featuredBannerTitle}>Weekly Featured</Text>
              <Text style={styles.featuredBannerSubtitle}>Handpicked stories loved by editors</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Trending Section */}
        <HorizontalSection
          title="Trending"
          onSeeAll={() => handleSeeAll('trending')}
        >
          {trendingNovels.map((novel) => (
            <NovelCard
              key={novel.id}
              novel={novel}
              size="medium"
              onPress={() => handleNovelPress(novel.id)}
            />
          ))}
        </HorizontalSection>

        {/* Top Rankings Section - Using Popular Novels */}
        <HorizontalSection
          title="Top Rankings"
          onSeeAll={() => handleSeeAll('popular')}
        >
          {popularNovels.slice(0, 4).map((novel) => (
            <NovelCard
              key={novel.id}
              novel={novel}
              size="medium"
              onPress={() => handleNovelPress(novel.id)}
            />
          ))}
        </HorizontalSection>

        {/* Popular Section */}
        <HorizontalSection
          title="Popular"
          onSeeAll={() => handleSeeAll('popular')}
        >
          {popularNovels.map((novel) => (
            <NovelCard
              key={novel.id}
              novel={novel}
              size="medium"
              onPress={() => handleNovelPress(novel.id)}
            />
          ))}
        </HorizontalSection>

        {/* Recommended Section */}
        <HorizontalSection
          title="Recommended"
          onSeeAll={() => handleSeeAll('recommended')}
        >
          {recommendedNovels.map((novel) => (
            <NovelCard
              key={novel.id}
              novel={novel}
              size="medium"
              onPress={() => handleNovelPress(novel.id)}
            />
          ))}
        </HorizontalSection>

        {/* You May Like This Section */}
        {youMayLikeNovels.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>You May Like This</Text>
            </View>
            <View style={styles.youMayLikeContainer}>
              {youMayLikeNovels.slice(0, 3).map((novel) => (
                <TouchableOpacity
                  key={novel.id}
                  style={styles.youMayLikeItem}
                  onPress={() => handleNovelPress(novel.id)}
                >
                  <Image
                    source={{ uri: novel.coverImage }}
                    style={styles.youMayLikeImage}
                  />
                  <View style={styles.youMayLikeDetails}>
                    <Text style={styles.youMayLikeTitle}>{novel.title}</Text>
                    <Text style={styles.youMayLikeDescription}>
                      {novel.genre} · {novel.rating}★ · {novel.views} views
                    </Text>
                    <Text style={styles.youMayLikeSummary} numberOfLines={2}>
                      {novel.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentContainer: {
    paddingBottom: spacing[5],
  },
  categoryButtonsContainer: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    gap: spacing[2],
  },
  featuredBannerContainer: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
  },
  featuredBanner: {
    position: 'relative',
    height: 176,
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    backgroundColor: theme.card, // Fallback background
  },
  featuredBannerImage: {
    width: '100%',
    height: '100%',
  },
  featuredBannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'transparent',
  },
  featuredBannerTextContainer: {
    position: 'absolute',
    bottom: spacing[3],
    left: spacing[3],
    right: spacing[3],
  },
  featuredBannerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white, // Always white on banner image
    letterSpacing: -0.5,
  },
  featuredBannerSubtitle: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)', // Always light on banner image
    marginTop: 2,
    lineHeight: 14,
  },
  sectionContainer: {
    marginTop: spacing[6],
  },
  sectionHeader: {
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
    letterSpacing: -0.5,
  },
  youMayLikeContainer: {
    paddingHorizontal: spacing[4],
  },
  youMayLikeItem: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: spacing[3],
    backgroundColor: theme.card,
  },
  youMayLikeImage: {
    height: 80,
    width: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: theme.backgroundSecondary,
  },
  youMayLikeDetails: {
    flex: 1,
  },
  youMayLikeTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
    lineHeight: 20,
  },
  youMayLikeDescription: {
    fontSize: typography.fontSize.sm,
    color: theme.textSecondary,
    marginTop: spacing[1],
    lineHeight: 18,
  },
  youMayLikeSummary: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    marginTop: spacing[1],
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.sm,
    color: theme.textSecondary,
  },
});

export default HomeScreen;
