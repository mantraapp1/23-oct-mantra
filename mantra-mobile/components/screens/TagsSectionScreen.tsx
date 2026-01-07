import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../constants';
import novelService from '../../services/novelService';
import { useToast } from '../ToastManager';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../constants/theme';

interface TagsSectionScreenProps {
  navigation: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SECTION_WIDTH = SCREEN_WIDTH * 0.85;

const TagsSectionScreen: React.FC<TagsSectionScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { showToast } = useToast();
  const [activeTagIndex, setActiveTagIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const tagsScrollRef = useRef<ScrollView>(null);
  const novelsScrollRef = useRef<ScrollView>(null);

  const [tags, setTags] = useState([
    { key: 'romance', label: '#ROMANCE' },
    { key: 'reincarnation', label: '#REINCARNATION' },
    { key: 'system', label: '#SYSTEM' },
    { key: 'cultivation', label: '#CULTIVATION' },
    { key: 'action', label: '#ACTION' },
  ]);

  const [novelsByTag, setNovelsByTag] = useState<Record<string, any[]>>({});

  useEffect(() => {
    loadTagsData();
  }, []);

  const loadTagsData = async () => {
    setIsLoading(true);
    try {
      const tagData: Record<string, any[]> = {};

      for (const tag of tags) {
        const novels = await novelService.getNovels({ tags: [tag.key] });
        tagData[tag.key] = novels.slice(0, 5).map((novel: any) => ({
          id: novel.id,
          title: novel.title,
          genre: novel.genres?.[0] || 'Unknown',
          coverImage: novel.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80',
        }));
      }

      setNovelsByTag(tagData);
    } catch (error) {
      console.error('Error loading tags data:', error);
      showToast('error', 'Failed to load novels by tags');
      // Fallback to empty data
      const emptyData: Record<string, any[]> = {};
      tags.forEach(tag => {
        emptyData[tag.key] = [];
      });
      setNovelsByTag(emptyData);
    } finally {
      setIsLoading(false);
    }
  };

  const mockNovelsByTag = {
    romance: [
      {
        id: '1',
        title: 'Shadow Slave',
        genre: 'Fantasy',
        coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '2',
        title: "Mated to My Fiancé's Alpha King Brother",
        genre: 'Fantasy',
        coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '3',
        title: 'Cultivation Online',
        genre: 'Games',
        coverImage: 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '4',
        title: 'Weakest Beast Tamer Gets All SSS Dragons',
        genre: 'Fantasy',
        coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '5',
        title: 'Evolving My Undead Legion In A Game-Like World',
        genre: 'Games',
        coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=200&auto=format&fit=crop',
      },
    ],
    reincarnation: [
      {
        id: '6',
        title: 'Demon System: Tamer Or Tampered',
        genre: 'Fantasy',
        coverImage: 'https://images.unsplash.com/photo-1635151227785-429f420c6b9d?w=1080&q=80',
      },
      {
        id: '7',
        title: "Prime Originator's Second Slave",
        genre: 'Fantasy',
        coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '8',
        title: "Reborn As The Daemon's Son",
        genre: 'Fantasy',
        coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '9',
        title: 'Second Life Chronicles',
        genre: 'Fantasy',
        coverImage: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '10',
        title: 'Reincarnated Emperor',
        genre: 'Fantasy',
        coverImage: 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?q=80&w=200&auto=format&fit=crop',
      },
    ],
    system: [
      {
        id: '11',
        title: 'Cultivation Online',
        genre: 'Games',
        coverImage: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=400&auto=format&fit=crop',
      },
      {
        id: '12',
        title: 'Weakest Beast Tamer Gets All SSS Dragons',
        genre: 'Fantasy',
        coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '13',
        title: 'Evolving My Undead Legion In A Game-Like World',
        genre: 'Games',
        coverImage: 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '14',
        title: 'Supreme System Master',
        genre: 'Fantasy',
        coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '15',
        title: 'Leveling System God',
        genre: 'Fantasy',
        coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=200&auto=format&fit=crop',
      },
    ],
    cultivation: [
      {
        id: '16',
        title: 'Immortal Cultivation Path',
        genre: 'Fantasy',
        coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '17',
        title: 'Heavenly Dao Master',
        genre: 'Cultivation',
        coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '18',
        title: 'Martial Peak Chronicles',
        genre: 'Cultivation',
        coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '19',
        title: 'Nine Stars Heaven Path',
        genre: 'Cultivation',
        coverImage: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '20',
        title: 'Divine Cultivation Realm',
        genre: 'Cultivation',
        coverImage: 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?q=80&w=200&auto=format&fit=crop',
      },
    ],
    action: [
      {
        id: '21',
        title: 'Battle Frenzy',
        genre: 'Action',
        coverImage: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=400&auto=format&fit=crop',
      },
      {
        id: '22',
        title: 'Star Rank Hunter',
        genre: 'Fantasy',
        coverImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '23',
        title: 'Extermination of Mankind',
        genre: 'Action',
        coverImage: 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '24',
        title: 'War God Asura',
        genre: 'Action',
        coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=200&auto=format&fit=crop',
      },
      {
        id: '25',
        title: 'Ultimate Fighter',
        genre: 'Action',
        coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=200&auto=format&fit=crop',
      },
    ],
  };

  const handleNovelsScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollLeft = event.nativeEvent.contentOffset.x;
    const sectionWidth = SECTION_WIDTH + 16; // width + gap
    const currentIndex = Math.round(scrollLeft / sectionWidth);

    if (currentIndex !== activeTagIndex && currentIndex >= 0 && currentIndex < tags.length) {
      setActiveTagIndex(currentIndex);
    }
  };

  const handleTagPress = (index: number) => {
    setActiveTagIndex(index);
    const sectionWidth = SECTION_WIDTH + 16;
    novelsScrollRef.current?.scrollTo({
      x: sectionWidth * index,
      animated: true,
    });
  };

  const handleSeeAll = (tag: string) => {
    navigation.navigate('SeeAll', { title: tag.toUpperCase(), type: 'tag' });
  };

  const renderNovelItem = (novel: any) => (
    <TouchableOpacity
      key={novel.id}
      style={styles.novelItem}
      onPress={() => navigation.navigate('NovelDetail', { novelId: novel.id })}
      activeOpacity={0.7}
    >
      <Image source={{ uri: novel.coverImage }} style={styles.novelImage} />
      <View style={styles.novelInfo}>
        <Text style={styles.novelTitle} numberOfLines={2}>
          {novel.title}
        </Text>
        <Text style={styles.novelGenre}>{novel.genre}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderNovelSection = (tag: string, index: number) => {
    const novels = novelsByTag[tag as keyof typeof novelsByTag] || [];

    return (
      <View key={tag} style={styles.novelSection}>
        <View style={styles.novelsList}>
          {novels.map((novel) => renderNovelItem(novel))}
        </View>

        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={() => handleSeeAll(tag)}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>See All →</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading tags...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Tags Header */}
      <View style={styles.tagsHeader}>
        <ScrollView
          ref={tagsScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tagsContent}
        >
          {tags.map((tag, index) => (
            <TouchableOpacity
              key={tag.key}
              style={[
                styles.tagButton,
                activeTagIndex === index && styles.tagButtonActive,
              ]}
              onPress={() => handleTagPress(index)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tagText,
                  activeTagIndex === index && styles.tagTextActive,
                ]}
              >
                {tag.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Horizontal Scrolling Novels by Tags */}
      <ScrollView
        ref={novelsScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleNovelsScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SECTION_WIDTH + 16}
        snapToAlignment="start"
        contentContainerStyle={styles.novelsScrollContent}
      >
        {tags.map((tag, index) => renderNovelSection(tag.key, index))}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  tagsHeader: {
    backgroundColor: theme.card,
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tagsContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  tagButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  tagButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  tagText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.textSecondary,
  },
  tagTextActive: {
    color: colors.white,
  },
  novelsScrollContent: {
    paddingHorizontal: spacing[4],
    gap: 16,
    paddingBottom: spacing[24],
  },
  novelSection: {
    width: SECTION_WIDTH,
  },
  novelsList: {
    gap: spacing[2],
  },
  novelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2.5],
  },
  novelImage: {
    width: 48, // w-12
    height: 64, // h-16
    borderRadius: borderRadius.md,
    backgroundColor: theme.inputBackground,
  },
  novelInfo: {
    flex: 1,
    minWidth: 0,
  },
  novelTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
    lineHeight: 16,
  },
  novelGenre: {
    fontSize: 10, // text-[10px]
    color: theme.textSecondary,
    marginTop: spacing[0.5],
  },
  seeAllButton: {
    width: '100%',
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing[3],
  },
  seeAllText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.primary,
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

export default TagsSectionScreen;
