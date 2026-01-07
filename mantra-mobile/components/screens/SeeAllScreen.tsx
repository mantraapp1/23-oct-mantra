import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../constants/theme';
import novelService from '../../services/novelService';
import searchService from '../../services/searchService';
import { useToast } from '../ToastManager';
import { EmptyState } from '../common';

interface SeeAllScreenProps {
  navigation?: any;
  route?: {
    params: {
      section: string;
      genre?: string;
      tag?: string;
    };
  };
}

interface Novel {
  id: string;
  title: string;
  coverImage: string;
  genre: string;
  rating: number;
  views: string;
  description: string;
}

const SeeAllScreen = ({ navigation, route }: SeeAllScreenProps) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { section, genre, tag } = route?.params || { section: 'Trending' };
  const { showToast } = useToast();

  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadNovels();
  }, [section, genre, tag]);

  const loadNovels = async () => {
    setIsLoading(true);
    try {
      let novelsData: any[] = [];
      let language = 'All';

      const user = await authService.getCurrentUser();
      if (user) {
        const profile = await profileService.getProfile(user.id);
        language = profile?.preferred_language || 'All';
      }

      const fetchNovelsData = async (lang: string) => {
        if (genre) {
          return await searchService.searchByGenre(genre, 1, 20, lang);
        } else if (tag) {
          return await searchService.searchByTag(tag, 1, 20, lang);
        } else {
          switch (section.toLowerCase()) {
            case 'trending':
              return await novelService.getTrendingNovels(20, lang);
            case 'popular':
              return await novelService.getPopularNovels(20, lang);
            case 'new releases':
              return await novelService.getNewArrivals(20, lang);
            default:
              return await novelService.getTrendingNovels(20, lang);
          }
        }
      };

      novelsData = await fetchNovelsData(language);

      // Fallback logic
      if (novelsData.length === 0 && language !== 'All') {
        console.log(`No results for ${language} in SeeAll, falling back to All`);
        novelsData = await fetchNovelsData('All');
      }

      const formattedNovels: Novel[] = novelsData.map((novel: any) => ({
        id: novel.id,
        title: novel.title,
        coverImage: novel.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80',
        genre: novel.genres?.[0] || 'Unknown',
        rating: novel.average_rating || 0,
        views: formatViews(novel.total_views || 0),
        description: novel.description || 'No description available',
      }));

      setNovels(formattedNovels);
    } catch (error) {
      console.error('Error loading novels:', error);
      showToast('error', 'Failed to load novels');
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
    await loadNovels();
    setIsRefreshing(false);
  };

  const handleNovelPress = (novelId: string) => {
    navigation.navigate('NovelDetail', { novelId });
  };

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
          <Text style={styles.headerTitle}>{section}</Text>
          <Text style={styles.headerSubtitle}>{novels.length} results</Text>
        </View>
      </View>

      {/* Novels List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading novels...</Text>
        </View>
      ) : novels.length === 0 ? (
        <EmptyState
          icon="book"
          title="No novels found"
          description="We couldn't find any novels in this section"
          actionText="Go Back"
          onActionPress={() => navigation.goBack()}
        />
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
          {novels.map((novel) => (
            <TouchableOpacity
              key={novel.id}
              style={styles.novelCard}
              onPress={() => handleNovelPress(novel.id)}
              activeOpacity={0.7}
            >
              <Image source={{ uri: novel.coverImage }} style={styles.novelImage} />
              <View style={styles.novelInfo}>
                <Text style={styles.novelTitle} numberOfLines={1}>
                  {novel.title}
                </Text>
                <Text style={styles.novelMeta}>
                  {novel.genre} · {novel.rating}★ · {novel.views} views
                </Text>
                <Text style={styles.novelDescription} numberOfLines={2}>
                  {novel.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[24],
    gap: spacing[3],
  },
  novelCard: {
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
  novelImage: {
    height: 80, // h-20
    width: 64, // w-16
    borderRadius: borderRadius.lg,
  },
  novelInfo: {
    flex: 1,
    minWidth: 0,
  },
  novelTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  novelMeta: {
    fontSize: 11, // text-[11px]
    color: theme.textSecondary,
    marginTop: spacing[0.5],
  },
  novelDescription: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    marginTop: spacing[1],
    lineHeight: 16,
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

export default SeeAllScreen;
