import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';
import novelService from '../../services/novelService';
import { useToast } from '../ToastManager';
import { EmptyState, NovelCard } from '../common';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';

interface Novel {
  id: string;
  title: string;
  coverImage: string;
  genre: string;
  rating: number;
}

const EditorsChoiceScreen = () => {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { theme } = useTheme();

  const [novels, setNovels] = useState<Novel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadNovels();
  }, []);

  const loadNovels = async () => {
    setIsLoading(true);
    try {
      const editorsPicks = await novelService.getEditorsPicks(20);

      const formattedNovels: Novel[] = editorsPicks.map((novel: any) => ({
        id: novel.id,
        title: novel.title,
        coverImage: novel.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80',
        genre: novel.genres?.[0] || 'Unknown',
        rating: novel.average_rating || 0,
      }));

      setNovels(formattedNovels);
    } catch (error) {
      console.error('Error loading editor\'s picks:', error);
      showToast('error', 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNovels();
    setIsRefreshing(false);
  };

  const handleNovelPress = (novelId: string) => {
    (navigation.navigate as any)('NovelDetail', { novelId });
  };

  const styles = getStyles(theme);

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
          <Text style={styles.headerTitle}>Editor's Choice</Text>
          <Text style={styles.headerSubtitle}>Handpicked stories for you</Text>
        </View>
      </View>

      {/* Novels List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading curated stories...</Text>
        </View>
      ) : novels.length === 0 ? (
        <EmptyState
          icon="award"
          title="No stories found"
          description="Check back later for new editor picks"
          actionText="Go Home"
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
              colors={[theme.primary]}
            />
          }
        >
          <View style={styles.grid}>
            {novels.map((novel) => (
              <View key={novel.id} style={styles.cardWrapper}>
                <NovelCard
                  novel={novel}
                  size="medium" // Making them consistent with Popular section sizing
                  onPress={() => handleNovelPress(novel.id)}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
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
    backgroundColor: theme.headerBackground,
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
    padding: spacing[4],
    paddingBottom: spacing[24],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    justifyContent: 'space-between', // Try to space them evenly
  },
  cardWrapper: {
    marginBottom: spacing[4],
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

export default EditorsChoiceScreen;
