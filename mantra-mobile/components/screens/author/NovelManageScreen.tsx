import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  SafeAreaView,
  ImageBackground,
  Dimensions,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Feather, AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import { getProfilePicture } from '../../../constants/defaultImages';
import { ThemeColors } from '../../../constants/theme';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { RatingStars, LoadingState, ErrorState, EmptyState } from '../../common';
import { supabase } from '../../../config/supabase';
import authService from '../../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import reviewService from '../../../services/reviewService';
import chapterService from '../../../services/chapterService';
import novelService from '../../../services/novelService';
import { useToast } from '../../ToastManager';
import { useTheme } from '../../../context/ThemeContext';

// Additional colors not in constants
const indigo500 = '#6366f1';
const emerald500 = '#10b981';

const NovelManageScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const { novelId } = (route.params as any) || { novelId: '1' };
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState('all');
  const [reviewInteractions, setReviewInteractions] = useState<Record<string, { isLiked: boolean; isDisliked: boolean; likes: number; dislikes: number }>>({});
  const [openReviewMenu, setOpenReviewMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const menuButtonRefs = useRef<Record<string, any>>({});
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '1m' | '3m' | '1y' | 'all'>('7d');
  const [showDeleteNovelModal, setShowDeleteNovelModal] = useState(false);
  const [demographicsData, setDemographicsData] = useState<any[]>([]);
  // Professional Interaction State
  const [selectedDataPoint, setSelectedDataPoint] = useState<{ value: number; label: string; x: number; y: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [chartContainerWidth, setChartContainerWidth] = useState(0);

  // Analytics data for different periods
  const [analyticsData, setAnalyticsData] = useState<Record<string, { labels: string[]; datasets: { data: number[] }[]; avgReading: string; completion: string; commentRate: string; percentChange: number }>>({
    '7d': { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }], avgReading: '0 min', completion: '0%', commentRate: '0%', percentChange: 0 },
    '1m': { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], datasets: [{ data: [0, 0, 0, 0] }], avgReading: '0 min', completion: '0%', commentRate: '0%', percentChange: 0 },
    '3m': { labels: ['Month 1', 'Month 2', 'Month 3'], datasets: [{ data: [0, 0, 0] }], avgReading: '0 min', completion: '0%', commentRate: '0%', percentChange: 0 },
    '1y': { labels: ['Q1', 'Q2', 'Q3', 'Q4'], datasets: [{ data: [0, 0, 0, 0] }], avgReading: '0 min', completion: '0%', commentRate: '0%', percentChange: 0 },
    'all': { labels: ['2024'], datasets: [{ data: [0] }], avgReading: '0 min', completion: '0%', commentRate: '0%', percentChange: 0 }
  });

  // Real data state
  const [novel, setNovel] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load novel data from Supabase
  const fetchHistoricalAnalytics = async (novelId: string, currentTotalViews: number, completion: number, commentRate: number) => {
    try {
      // Call RPC instead of manual filtering - Much more efficient
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_novel_views_by_period', {
          novel_id_param: novelId,
          period_param: analyticsPeriod
        });

      if (rpcError) throw rpcError;
      if (!rpcData || !Array.isArray(rpcData)) return;

      const labels = rpcData.map(d => d.label);
      const data = rpcData.map(d => d.views);

      // Handle trend calculation (approximate or wait for second RPC if needed)
      // For now, use existing percentage calculation or set to 0 if data is too small
      let percentChange = 0;
      if (data.length >= 2) {
        const current = data[data.length - 1];
        const previous = data[data.length - 2];
        if (previous > 0) {
          percentChange = ((current - previous) / previous) * 100;
        }
      }

      setAnalyticsData(prev => ({
        ...prev,
        [analyticsPeriod]: {
          labels: labels.length > 0 ? labels : prev[analyticsPeriod].labels,
          datasets: [{ data: data.length > 0 ? data : prev[analyticsPeriod].datasets[0].data }],
          completion: `${completion.toFixed(0)}%`,
          commentRate: `${commentRate.toFixed(1)}%`,
          percentChange: percentChange,
          avgReading: prev[analyticsPeriod].avgReading // Preserved from market analytics RPC
        }
      }));

    } catch (err) {
      console.error('Error fetching historical analytics via RPC:', err);
    }
  };

  const loadNovelData = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = await authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      setCurrentUserId(user.id);

      // Load novel details
      const { data: novelData, error: novelError } = await supabase
        .from('novels')
        .select('*')
        .eq('id', novelId)
        .eq('author_id', user.id)
        .single();

      if (novelError) throw novelError;

      // Format novel data
      const formattedNovel = {
        title: novelData.title,
        coverImage: novelData.cover_image_url || 'https://images.unsplash.com/photo-1529651737248-dad5e287768e?q=80&w=300',
        bannerImage: novelData.cover_image_url || 'https://images.unsplash.com/photo-1529651737248-dad5e287768e?q=80&w=1200',
        genres: novelData.genres || [],
        status: novelData.status?.toUpperCase() || 'ONGOING',
        description: novelData.description || '',
        tags: novelData.tags || [],
        stats: {
          views: formatNumber(novelData.total_views || 0),
          viewsGrowth: '+0% this week', // TODO: Calculate from analytics
          votes: formatNumber(novelData.total_votes || 0),
          votesGrowth: '+0% this week', // TODO: Calculate from analytics
          chapters: novelData.total_chapters || 0,
          lastUpdate: formatTimeAgo(novelData.updated_at),
          rating: novelData.average_rating || 0,
          ratingsCount: `${novelData.total_reviews || 0} ratings`,
        },
        performance: {
          bookmarks: { value: formatNumber(0), percentage: 0 },
          comments: { value: formatNumber(0), percentage: 0 },
          completionRate: { value: '0%', percentage: 0 },
        },
        earnings: {
          total: '$0.00', // TODO: Calculate from transactions
          thisMonth: '$0.00', // TODO: Calculate from transactions
        },
      };

      // Load bookmark count from library table
      const { count: bookmarkCount } = await supabase
        .from('library')
        .select('*', { count: 'exact', head: true })
        .eq('novel_id', novelId);

      formattedNovel.performance.bookmarks.value = formatNumber(bookmarkCount || 0);
      formattedNovel.performance.bookmarks.percentage = Math.min(100, ((bookmarkCount || 0) / 100) * 100);

      // Load comment count from comments table (all chapters)
      const { count: commentCount } = await supabase
        .from('comments')
        .select('c.*, chapters!inner(novel_id)', { count: 'exact', head: true })
        .eq('chapters.novel_id', novelId);

      formattedNovel.performance.comments.value = formatNumber(commentCount || 0);
      formattedNovel.performance.comments.percentage = Math.min(100, ((commentCount || 0) / 100) * 100);

      setNovel(formattedNovel);

      // Load analytics-specific real data
      const { data: progressData } = await supabase
        .from('reading_progress')
        .select('current_chapter_number')
        .eq('novel_id', novelId);

      const totalReaders = progressData?.length || 0;
      const completedReaders = progressData?.filter(p => p.current_chapter_number >= novelData.total_chapters).length || 0;
      const completionRateVal = totalReaders > 0 ? (completedReaders / totalReaders * 100) : 0;
      const commentRateVal = novelData.total_views > 0 ? (commentCount || 0) / novelData.total_views * 100 : 0;

      // Update analytics data with real values for Engagement Metrics
      const totalViews = novelData.total_views || 0;
      const newAnalyticsData = {
        '7d': {
          labels: Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
          }),
          datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }], // Initialize with zeros
          avgReading: '0 min',
          completion: `${completionRateVal.toFixed(0)}%`,
          commentRate: `${commentRateVal.toFixed(1)}%`,
          percentChange: 0
        },
        '1m': {
          labels: ['W1', 'W2', 'W3', 'W4'],
          datasets: [{ data: [0, 0, 0, 0] }],
          avgReading: '8.2 min',
          completion: `${completionRateVal.toFixed(0)}%`,
          commentRate: `${commentRateVal.toFixed(1)}%`,
          percentChange: 0
        },
        '3m': {
          labels: ['Month 1', 'Month 2', 'Month 3'],
          datasets: [{ data: [0, 0, 0] }],
          avgReading: '8.5 min',
          completion: `${completionRateVal.toFixed(0)}%`,
          commentRate: `${commentRateVal.toFixed(1)}%`,
          percentChange: 0
        },
        '1y': {
          labels: ['Month 1', 'Month 2', 'Month 3'],
          datasets: [{ data: [0, 0, 0] }],
          avgReading: '8.8 min',
          completion: `${completionRateVal.toFixed(0)}%`,
          commentRate: `${commentRateVal.toFixed(1)}%`,
          percentChange: 0
        },
        'all': {
          labels: [new Date().getFullYear().toString()],
          datasets: [{ data: [totalViews] }],
          avgReading: '9.5 min',
          completion: `${completionRateVal.toFixed(0)}%`,
          commentRate: `${commentRateVal.toFixed(1)}%`,
          percentChange: 0
        }
      };

      // Reset selection when data updates
      setSelectedDataPoint(null);

      setAnalyticsData(newAnalyticsData);

      // Load Backend Analytics (Demographics & Reading Time) via SQL RPC
      try {
        const { data: marketData, error: marketError } = await supabase
          .rpc('get_novel_market_analytics', { novel_id_param: novelId });

        if (!marketError && marketData) {
          console.log('Successfully fetched market analytics:', marketData);
          if (marketData.demographics && marketData.demographics.length > 0) {
            setDemographicsData(marketData.demographics);
          }

          if (marketData.avg_reading_time !== undefined) {
            const avgTimeStr = `${marketData.avg_reading_time.toFixed(1)} min`;
            setAnalyticsData(prev => {
              const updated = { ...prev };
              Object.keys(updated).forEach(key => {
                updated[key] = {
                  ...updated[key],
                  avgReading: avgTimeStr
                };
              });
              return updated;
            });
          }
        } else if (marketError) {
          console.error('RPC Error (get_novel_market_analytics):', marketError);
        }
      } catch (err) {
        console.error('Error fetching market analytics:', err);
      }

      // Fetch real historical data from novel_views
      fetchHistoricalAnalytics(novelId, totalViews, completionRateVal, commentRateVal);

      // Load chapters from Supabase (load all chapters, not just 10)
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', novelId)
        .order('chapter_number', { ascending: false });

      if (chaptersError) throw chaptersError;

      console.log('Loaded chapters from Supabase:', chaptersData?.length || 0);

      // Load comment counts for all chapters
      const formattedChapters = await Promise.all((chaptersData || []).map(async (chapter: any) => {
        // Get comment count for this chapter
        const { count: commentCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('chapter_id', chapter.id);

        return {
          id: chapter.id,
          number: chapter.chapter_number,
          title: chapter.title,
          views: formatNumber(chapter.views || 0),
          comments: formatNumber(commentCount || 0),
          date: new Date(chapter.published_at).toLocaleDateString(),
          status: 'Published', // All chapters in DB are published
          is_draft: false,
        };
      }));

      // Load drafts from AsyncStorage
      const draftKey = `chapter_draft_${novelId}`;
      const draftsJson = await AsyncStorage.getItem(draftKey);
      const drafts = draftsJson ? JSON.parse(draftsJson) : [];

      const formattedDrafts = drafts.map((draft: any) => ({
        id: draft.id,
        number: draft.chapter_number,
        title: draft.title,
        views: '0',
        comments: '0',
        date: new Date(draft.created_at).toLocaleDateString(),
        status: 'Draft',
        is_draft: true,
        draft_data: draft, // Store full draft data for editing
      }));

      // Combine published chapters and drafts
      const allChapters = [...formattedDrafts, ...formattedChapters];

      // Sort by chapter number descending
      allChapters.sort((a, b) => b.number - a.number);

      console.log('Total chapters (including drafts):', allChapters.length);
      console.log('Chapters:', allChapters.map(c => ({ number: c.number, title: c.title, status: c.status })));

      setChapters(allChapters);

      // Load reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          profiles:user_id (username, display_name, profile_picture_url)
        `)
        .eq('novel_id', novelId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsError) throw reviewsError;

      const formattedReviews = (reviewsData || []).map((review: any) => {
        const user = review.profiles?.display_name || review.profiles?.username || 'Anonymous';
        return {
          id: review.id,
          user: user,
          avatar: getProfilePicture(review.profiles?.profile_picture_url, user),
          rating: review.rating,
          time: formatTimeAgo(review.created_at),
          text: review.review_text,
          likes: review.likes || 0,
          dislikes: review.dislikes || 0,
        };
      });

      setReviews(formattedReviews);

      // Calculate rating distribution
      const distribution = [
        { stars: 5, percentage: 0, color: '#10b981' },
        { stars: 4, percentage: 0, color: '#34d399' },
        { stars: 3, percentage: 0, color: '#fbbf24' },
        { stars: 2, percentage: 0, color: '#fb923c' },
        { stars: 1, percentage: 0, color: '#ef4444' },
      ];

      const totalReviews = reviewsData?.length || 0;
      if (totalReviews > 0) {
        reviewsData?.forEach((review: any) => {
          const rating = Math.floor(review.rating);
          if (rating >= 1 && rating <= 5) {
            const index = 5 - rating;
            distribution[index].percentage = Math.round(((distribution[index].percentage * totalReviews + 1) / totalReviews) * 100);
          }
        });
      }

      setRatingDistribution(distribution);

    } catch (error: any) {
      console.error('Error loading novel data:', error);
      setError(error.message || 'Failed to load novel data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `Last ${diffDays} days ago`;
  };

  // Load data on mount
  // Replace useEffect with useFocusEffect to refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (novelId) {
        loadNovelData();
      }
    }, [novelId])
  );

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNovelData();
    setRefreshing(false);
  };

  // Handler functions
  const handleLikeReview = async (reviewId: string, currentLikes: number, currentDislikes: number) => {
    if (!currentUserId) {
      showToast('error', 'Please log in to react to reviews');
      return;
    }

    try {
      const result = await reviewService.reactToReview(currentUserId, reviewId, 'like');
      if (result.success) {
        // Update local state optimistically
        setReviewInteractions((prev) => {
          const current = prev[reviewId] || { isLiked: false, isDisliked: false, likes: currentLikes, dislikes: currentDislikes };
          return {
            ...prev,
            [reviewId]: {
              isLiked: !current.isLiked,
              isDisliked: false,
              likes: current.isLiked ? current.likes - 1 : current.likes + 1,
              dislikes: current.isDisliked ? current.dislikes - 1 : current.dislikes,
            },
          };
        });

        // Reload reviews to get updated counts
        await loadNovelData();
      }
    } catch (error) {
      console.error('Error liking review:', error);
      showToast('error', 'Failed to update reaction');
    }
  };

  const handleDislikeReview = async (reviewId: string, currentLikes: number, currentDislikes: number) => {
    if (!currentUserId) {
      showToast('error', 'Please log in to react to reviews');
      return;
    }

    try {
      const result = await reviewService.reactToReview(currentUserId, reviewId, 'dislike');
      if (result.success) {
        // Update local state optimistically
        setReviewInteractions((prev) => {
          const current = prev[reviewId] || { isLiked: false, isDisliked: false, likes: currentLikes, dislikes: currentDislikes };
          return {
            ...prev,
            [reviewId]: {
              isLiked: false,
              isDisliked: !current.isDisliked,
              likes: current.isLiked ? current.likes - 1 : current.likes,
              dislikes: current.isDisliked ? current.dislikes - 1 : current.dislikes + 1,
            },
          };
        });

        // Reload reviews to get updated counts
        await loadNovelData();
      }
    } catch (error) {
      console.error('Error disliking review:', error);
      showToast('error', 'Failed to update reaction');
    }
  };

  const handleDeleteNovel = () => {
    setShowSettingsMenu(false);
    setShowDeleteNovelModal(true);
  };

  const confirmDeleteNovel = async () => {
    if (!novelId) return;

    setIsDeleting(true);
    try {
      const result = await novelService.deleteNovel(novelId);
      if (result.success) {
        showToast('success', 'Novel deleted successfully');
        setShowDeleteNovelModal(false);
        navigation.navigate('AuthorDashboard' as never);
      } else {
        showToast('error', result.message || 'Failed to delete novel');
      }
    } catch (error) {
      console.error('Error deleting novel:', error);
      showToast('error', 'An unexpected error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and sort chapters
  const getFilteredChapters = () => {
    let filtered = chapters.filter((chapter) =>
      chapter.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        // Newest first - higher chapter number = newer
        return b.number - a.number;
      }
      if (sortBy === 'oldest') {
        // Oldest first - lower chapter number = older
        return a.number - b.number;
      }
      if (sortBy === 'most-views') return parseInt(b.views.replace(/,/g, '')) - parseInt(a.views.replace(/,/g, ''));
      return 0;
    });
  };

  // Filter reviews
  const getFilteredReviews = () => {
    if (filterRating === 'all') return reviews;
    return reviews.filter((review) => review.rating === parseInt(filterRating));
  };

  // Handle review menu
  const handleReviewMenuToggle = (reviewId: string) => {
    setOpenReviewMenu(openReviewMenu === reviewId ? null : reviewId);
  };

  const handleReportReview = (reviewId: string) => {
    setOpenReviewMenu(null);
    // Navigate to report screen or show report modal
    (navigation.navigate as any)('Report', { type: 'review', id: reviewId });
  };

  const handlePublishDraft = async (draft: any) => {
    try {
      setLoading(true);
      const result = await chapterService.createChapter({
        novel_id: novelId,
        chapter_number: draft.number,
        title: draft.title,
        content: draft.draft_data.content,
        is_locked: draft.number > 7,
      });

      if (result.success) {
        // Remove from AsyncStorage
        const draftKey = `chapter_draft_${novelId}`;
        const draftsJson = await AsyncStorage.getItem(draftKey);
        if (draftsJson) {
          const drafts = JSON.parse(draftsJson);
          const updatedDrafts = drafts.filter((d: any) => d.id !== draft.id);
          await AsyncStorage.setItem(draftKey, JSON.stringify(updatedDrafts));
        }

        showToast('success', 'Chapter published successfully!');
        await loadNovelData();
      } else {
        showToast('error', result.message || 'Failed to publish draft');
      }
    } catch (error: any) {
      console.error('Error publishing draft:', error);
      showToast('error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Line Chart Component - Matches HTML Chart.js design
  const renderLineChart = () => {
    if (chartContainerWidth === 0) return null; // Wait for measurement

    const data = analyticsData[analyticsPeriod];
    // Calculate total for the period for the default view
    const periodTotal = data?.datasets[0]?.data.reduce((a: number, b: number) => a + b, 0) || 0;

    // Widen chart by reducing padding
    const chartWidth = chartContainerWidth - 16;

    const isAllZeros = periodTotal === 0;

    // Handle Empty State - REMOVED based on user feedback. Always show chart.
    // if (isAllZeros) { ... } logic removed to force chart rendering.

    const handleDataPointClick = (data: any) => {
      const { value, x, y, index } = data;
      // Find label based on index if available
      const label = analyticsData[analyticsPeriod]?.labels[index] || '';
      setSelectedDataPoint({ value, label, x, y });
    };

    // Prepare chart data with explicit styling
    const chartData = {
      labels: data?.labels || [],
      datasets: [
        {
          data: data?.datasets?.[0]?.data || [0, 0], // Fallback to [0, 0] if no data
          color: (opacity = 1) => theme.primary, // Theme primary color
          strokeWidth: 3
        }
      ]
    };

    return (
      <LineChart
        data={chartData}
        width={chartWidth}
        height={220}
        chartConfig={{
          backgroundColor: theme.card,
          backgroundGradientFrom: theme.card,
          backgroundGradientTo: theme.card,
          decimalPlaces: 0,
          color: (opacity = 1) => theme.primary,
          labelColor: (opacity = 1) => theme.textSecondary,
          style: { borderRadius: 16 },
          strokeWidth: 3,
          propsForLabels: {
            fontSize: 11,
            fontWeight: '600',
          },
          propsForDots: {
            r: "5",
            strokeWidth: "2",
            stroke: theme.primary
          },
          propsForBackgroundLines: {
            strokeWidth: 1,
            stroke: theme.border,
            strokeDasharray: '5, 5'
          },
          fillShadowGradient: '#0ea5e9',
          fillShadowGradientOpacity: 0.6, // Increased for visibility
          fillShadowGradientFrom: '#0ea5e9',
          fillShadowGradientTo: '#ffffff',
        }}
        // Removed bezier to test if straight line renders
        style={{
          marginVertical: 8,
          borderRadius: 16,
          paddingRight: 0,
        }}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLabels={true}
        withShadow={true} // Explicitly enable area shadow/fill
        fromZero={true}
        yAxisInterval={1}
        formatYLabel={(yValue) => {
          const num = parseInt(yValue, 10);
          if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
          return yValue;
        }}
        onDataPointClick={handleDataPointClick}
        verticalLabelRotation={0}
        withDots={true} // Always show dots
        decorator={() => {
          return selectedDataPoint ? (
            <View>
              {/* Vertical Cursor Line */}
              <View
                style={{
                  position: 'absolute',
                  left: selectedDataPoint.x,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  height: 220,
                  backgroundColor: '#cbd5e1',
                  zIndex: 10,
                  opacity: 0.5
                }}
              />
              {/* Highlight Dot */}
              <View
                style={{
                  position: 'absolute',
                  left: selectedDataPoint.x - 6,
                  top: selectedDataPoint.y - 6,
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: '#0ea5e9', // Match Sky theme
                  borderWidth: 2,
                  borderColor: 'white',
                  zIndex: 20,
                  elevation: 3,
                  shadowColor: 'black',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2
                }}
              />
            </View>
          ) : null;
        }}
      />
    );
  };

  // Doughnut Chart Component - Matches HTML Chart.js doughnut design
  const renderPieChart = () => {
    const screenWidth = Dimensions.get('window').width - 64; // Account for screen padding + card padding
    const pieData = demographicsData.map((item) => ({
      name: item.label,
      population: item.value,
      color: item.color,
      legendFontColor: colors.slate700,
      legendFontSize: 12,
    }));

    return (
      <View style={styles.pieChartWrapper}>
        <View style={styles.chartContainer}>
          <PieChart
            data={demographicsData}
            width={screenWidth > 600 ? 500 : screenWidth}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="0"
            center={[screenWidth > 600 ? 125 : screenWidth / 4, 0]}
            absolute={false}
            hasLegend={false}
          />
        </View>

        {/* Unified Premium Legend */}
        <View style={styles.demographicsLegend}>
          {demographicsData.map((item, index) => {
            // Calculate percentage if not provided by backend
            const total = demographicsData.reduce((sum, d) => sum + d.value, 0);
            const percent = item.percentage ? item.percentage : ((item.value / total) * 100).toFixed(1);

            return (
              <View key={index} style={styles.legendRow}>
                <View style={styles.legendLabelContainer}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                </View>
                <View style={styles.legendValueContainer}>
                  <Text style={styles.legendValue}>{item.value}</Text>
                  <Text style={styles.legendPercentage}>({percent}%)</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderOverviewTab = () => (
    <View style={[styles.tabContent, { backgroundColor: theme.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Description</Text>
        <Text style={[styles.descriptionText, { color: theme.text }]}>{novel.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Tags</Text>
        <View style={styles.tagsRow}>
          {novel.tags.map((tag: string, index: number) => (
            <View key={index} style={[styles.tag, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
              <Text style={[styles.tagText, { color: theme.textSecondary }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.statHeader}>
            <Feather name="eye" size={16} color={colors.sky600} />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Views</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>{novel.stats.views}</Text>
          <Text style={styles.statGrowth}>{novel.stats.viewsGrowth}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.statHeader}>
            <Feather name="thumbs-up" size={16} color="#d97706" />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Votes</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>{novel.stats.votes}</Text>
          <Text style={styles.statGrowth}>{novel.stats.votesGrowth}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.statHeader}>
            <Feather name="book-open" size={16} color="#6366f1" />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Chapters</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>{novel.stats.chapters}</Text>
          <Text style={[styles.statSubtext, { color: theme.textSecondary }]}>{novel.stats.lastUpdate}</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.statHeader}>
            <Feather name="star" size={16} color="#f59e0b" />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Rating</Text>
          </View>
          <Text style={[styles.statValue, { color: theme.text }]}>{novel.stats.rating}</Text>
          <Text style={[styles.statSubtext, { color: theme.textSecondary }]}>{novel.stats.ratingsCount}</Text>
        </View>
      </View>

      <View style={[styles.performanceCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Performance Summary</Text>
        <View style={styles.performanceList}>
          {[
            { label: 'Bookmarks', value: novel.performance.bookmarks.value, percentage: novel.performance.bookmarks.percentage, color: colors.sky500 },
            { label: 'Comments', value: novel.performance.comments.value, percentage: novel.performance.comments.percentage, color: '#6366f1' },
            { label: 'Completion Rate', value: novel.performance.completionRate.value, percentage: novel.performance.completionRate.percentage, color: '#10b981' },
          ].map((item, index, array) => (
            <View
              key={item.label}
              style={[
                styles.performanceItem,
                index === array.length - 1 && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }
              ]}
            >
              <View style={styles.performanceHeader}>
                <Text style={[styles.performanceLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                <Text style={[styles.performanceValue, { color: theme.text }]}>{item.value}</Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: isDarkMode ? '#334155' : theme.backgroundSecondary }]}>
                <View style={[styles.progressFill, { width: `${item.percentage}%`, backgroundColor: item.color }]} />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.earningsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.earningsHeader}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Earnings</Text>
          <TouchableOpacity onPress={() => (navigation.navigate as any)('Wallet')}>
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.earningsContent}>
          <View>
            <Text style={[styles.earningsTotal, { color: theme.text }]}>{novel.earnings.total}</Text>
            <Text style={[styles.earningsLabel, { color: theme.textSecondary }]}>Total earnings</Text>
          </View>
          <View style={styles.earningsRight}>
            <Text style={[styles.earningsMonth, { color: theme.text }]}>{novel.earnings.thisMonth}</Text>
            <Text style={[styles.earningsLabel, { color: theme.textSecondary }]}>This month</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderChaptersTab = () => {
    // Show empty state if no chapters exist (after loading completes and no error)
    if (!loading && !error && chapters.length === 0) {
      return (
        <View style={[styles.tabContent, { backgroundColor: theme.background }]}>
          <EmptyState
            icon="book"
            title="No chapters published yet"
            description="Create your first chapter to get started"
            actionText="Create Chapter"
            onActionPress={() => (navigation.navigate as any)('CreateChapter', { novelId })}
          />
        </View>
      );
    }

    return (
      <View style={[styles.tabContent, { backgroundColor: theme.background }]}>
        <View style={styles.searchRow}>
          <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <Feather name="search" size={16} color={theme.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search chapters..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.newButton}
            onPress={() => (navigation.navigate as any)('CreateChapter', { novelId })}
            activeOpacity={0.7}
          >
            <Text style={styles.newButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow}>
          {['newest', 'oldest', 'most-views'].map((sort) => (
            <TouchableOpacity
              key={sort}
              style={[
                styles.sortButton,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                sortBy === sort && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => setSortBy(sort)}
            >
              <Text style={[
                styles.sortButtonText,
                { color: theme.textSecondary },
                sortBy === sort && { color: '#ffffff' }
              ]}>
                {sort === 'newest' ? 'Newest' : sort === 'oldest' ? 'Oldest' : 'Most Views'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.chaptersList}>
          {getFilteredChapters().map((chapter) => (
            <TouchableOpacity
              key={chapter.id}
              style={[styles.chapterCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => {
                if (chapter.is_draft) {
                  (navigation.navigate as any)('EditChapter', {
                    novelId,
                    chapterId: chapter.id,
                    isDraft: true,
                    draftData: chapter.draft_data,
                    novelTitle: novel.title
                  });
                } else {
                  (navigation.navigate as any)('ChapterManage', { novelId, chapterId: chapter.id });
                }
              }}
              activeOpacity={0.7}
            >
              <View style={styles.chapterNumber}>
                <Text style={styles.chapterNumberText}>{chapter.number}</Text>
              </View>
              <View style={styles.chapterInfo}>
                <View style={styles.chapterTitleRow}>
                  <Text style={[styles.chapterTitle, { color: theme.text }]} numberOfLines={1}>{chapter.title}</Text>
                  {chapter.is_draft && (
                    <View style={styles.draftBadge}>
                      <Text style={styles.draftBadgeText}>DRAFT</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.chapterMeta, { color: theme.textSecondary }]}>
                  {chapter.views} views • {chapter.comments} comments • {chapter.date}
                </Text>
                <View style={[styles.chapterStatusRow, { marginTop: 8 }]}>
                  <View style={[
                    styles.chapterStatus,
                    chapter.is_draft && styles.chapterStatusDraftContainer,
                    { marginTop: 0 }
                  ]}>
                    <Text style={[
                      styles.chapterStatusText,
                      chapter.is_draft && styles.chapterStatusDraft
                    ]}>
                      {chapter.status}
                    </Text>
                  </View>
                  {chapter.is_draft && (
                    <TouchableOpacity
                      style={styles.publishSmallButton}
                      onPress={(e) => {
                        // Prevent triggering card onPress
                        e.stopPropagation();
                        handlePublishDraft(chapter);
                      }}
                    >
                      <Text style={styles.publishSmallButtonText}>Publish</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderReviewsTab = () => {
    // Show empty state if no reviews exist (after loading completes and no error)
    if (!loading && !error && reviews.length === 0) {
      return (
        <View style={[styles.tabContent, { backgroundColor: theme.background }]}>
          <EmptyState
            icon="message-circle"
            title="No reviews yet"
            description="Reviews will appear here once readers start reviewing your novel"
          />
        </View>
      );
    }

    return (
      <View style={[styles.tabContent, { backgroundColor: theme.background }]}>
        <View style={[styles.ratingCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.ratingLeft}>
            <Text style={[styles.ratingNumber, { color: theme.text }]}>{novel?.stats.rating.toFixed(1) || '0.0'}</Text>
            <RatingStars rating={novel?.stats.rating || 0} size={14} />
            <Text style={[styles.ratingCount, { color: theme.textSecondary }]}>{novel?.stats.ratingsCount || '0 ratings'}</Text>
          </View>
          <View style={styles.ratingBars}>
            {ratingDistribution.map((item) => (
              <View key={item.stars} style={styles.ratingBarRow}>
                <Text style={[styles.ratingStarLabel, { color: theme.textSecondary }]}>{item.stars}★</Text>
                <View style={[styles.ratingBarContainer, { backgroundColor: theme.backgroundSecondary }]}>
                  <View style={[styles.ratingBarFill, { width: `${item.percentage}%`, backgroundColor: item.color }]} />
                </View>
                <Text style={[styles.ratingPercentage, { color: theme.textSecondary }]}>{item.percentage}%</Text>
              </View>
            ))}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {['all', '5', '4', '3', '2', '1'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
                filterRating === filter && { backgroundColor: theme.primary, borderColor: theme.primary }
              ]}
              onPress={() => setFilterRating(filter)}
            >
              <Text style={[
                styles.filterButtonText,
                { color: theme.textSecondary },
                filterRating === filter && { color: '#ffffff' }
              ]}>
                {filter === 'all' ? 'All' : `${filter}★`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.reviewsList}>
          {getFilteredReviews().map((review, index) => {
            const interaction = reviewInteractions[review.id] || { isLiked: false, isDisliked: false, likes: review.likes, dislikes: review.dislikes };
            const isMenuOpen = openReviewMenu === review.id.toString();
            return (
              <View key={review.id} style={[styles.reviewItemWrapper, isMenuOpen && { zIndex: 1000 }]}>
                <View style={[styles.reviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                  <View style={styles.reviewContent}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewUser}>
                        <Text style={[styles.reviewUsername, { color: theme.text }]}>{review.user}</Text>
                        <RatingStars rating={review.rating} size={14} />
                        <Text style={[styles.reviewTime, { color: theme.textSecondary }]}>{review.time}</Text>
                      </View>
                      <TouchableOpacity
                        ref={(ref) => {
                          menuButtonRefs.current[review.id.toString()] = ref;
                        }}
                        style={styles.reviewMenu}
                        onPress={() => {
                          if (openReviewMenu === review.id.toString()) {
                            setOpenReviewMenu(null);
                            setMenuPosition(null);
                          } else {
                            const buttonRef = menuButtonRefs.current[review.id.toString()];
                            if (buttonRef && buttonRef.measureInWindow) {
                              buttonRef.measureInWindow((x: number, y: number, width: number, height: number) => {
                                setMenuPosition({ x: x + width, y: y + height + 4 });
                                setOpenReviewMenu(review.id.toString());
                              });
                            } else {
                              setMenuPosition({ x: 300, y: 200 + (index * 100) });
                              setOpenReviewMenu(review.id.toString());
                            }
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <Feather name="more-vertical" size={16} color={theme.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.reviewText, { color: theme.text }]}>{review.text}</Text>
                    <View style={styles.reviewActions}>
                      <TouchableOpacity
                        style={styles.reviewAction}
                        onPress={() => handleLikeReview(review.id.toString(), review.likes, review.dislikes)}
                        activeOpacity={0.7}
                      >
                        <AntDesign
                          name={interaction.isLiked ? "like1" : "like2"}
                          size={16}
                          color={interaction.isLiked ? colors.sky500 : theme.textSecondary}
                        />
                        <Text style={[styles.reviewActionText, interaction.isLiked && { color: colors.sky500 }, { color: theme.textSecondary }]}>
                          {interaction.likes}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.reviewAction}
                        onPress={() => handleDislikeReview(review.id.toString(), review.likes, review.dislikes)}
                        activeOpacity={0.7}
                      >
                        <AntDesign
                          name={interaction.isDisliked ? "dislike1" : "dislike2"}
                          size={16}
                          color={interaction.isDisliked ? colors.red500 : theme.textSecondary}
                        />
                        <Text style={[styles.reviewActionText, interaction.isDisliked && { color: colors.red500 }, { color: theme.textSecondary }]}>
                          {interaction.dislikes}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return <LoadingState message="Loading novel data..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadNovelData} title="Failed to load novel" />;
  }

  if (!novel) {
    return <ErrorState error="Novel not found" onRetry={loadNovelData} title="Novel Not Found" />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Manage Novel</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Overview & Management</Text>
        </View>
        <View style={[{ position: 'relative' }, showSettingsMenu && { zIndex: 2000 }]}>
          <TouchableOpacity
            style={styles.settingsButton}
            activeOpacity={0.7}
            onPress={() => setShowSettingsMenu(!showSettingsMenu)}
          >
            <Feather name="settings" size={20} color={theme.text} />
          </TouchableOpacity>
          {showSettingsMenu && (
            <View style={[styles.settingsMenuDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  style={styles.settingsMenuItem}
                  onPress={() => {
                    setShowSettingsMenu(false);
                    (navigation.navigate as any)('EditNovel', { novelId });
                  }}
                  activeOpacity={0.7}
                >
                  <Feather name="edit-2" size={14} color={theme.text} />
                  <Text style={[styles.settingsMenuText, { color: theme.text }]}>Edit Novel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.settingsMenuItem}
                  onPress={handleDeleteNovel}
                  activeOpacity={0.7}
                >
                  <Feather name="trash-2" size={14} color={colors.red500} />
                  <Text style={[styles.settingsMenuText, { color: colors.red500 }]}>Delete Novel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={[styles.content, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.sky500]}
            tintColor={colors.sky500}
          />
        }
        onScroll={() => {
          if (showSettingsMenu) {
            setShowSettingsMenu(false);
          }
          if (openReviewMenu) {
            setOpenReviewMenu(null);
          }
        }}
        scrollEventThrottle={16}
      >
        {/* Banner with Cover */}
        <View style={styles.bannerSection}>
          <ImageBackground
            source={{ uri: novel.bannerImage }}
            style={styles.bannerImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['transparent', isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)', theme.background]}
              style={styles.bannerGradient}
            />
          </ImageBackground>
        </View>

        {/* Novel Info */}
        <View style={styles.novelInfo}>
          <View style={styles.novelInfoRow}>
            <Image source={{ uri: novel.coverImage }} style={styles.novelCover} />
            <View style={styles.novelDetails}>
              <Text style={[styles.novelTitle, { color: theme.text }]}>{novel.title}</Text>
              <View style={styles.genresRow}>
                {novel.genres.map((genre: string, index: number) => {
                  const stylesList = [
                    { tag: styles.genreTagSky, text: styles.genreTagTextSky },
                    { tag: styles.genreTagIndigo, text: styles.genreTagTextIndigo },
                    { tag: styles.genreTagPurple, text: styles.genreTagTextPurple },
                    { tag: styles.genreTagAmber, text: styles.genreTagTextAmber },
                    { tag: styles.genreTagEmerald, text: styles.genreTagTextEmerald },
                    { tag: styles.genreTagRed, text: styles.genreTagTextRed },
                  ];
                  const stylePair = stylesList[index % stylesList.length];
                  return (
                    <View key={index} style={[styles.genreTag, stylePair.tag]}>
                      <Text style={[styles.genreTagText, stylePair.text]}>{genre}</Text>
                    </View>
                  );
                })}
                <View style={[styles.statusTag, { backgroundColor: theme.backgroundSecondary }]}>
                  <Text style={[styles.statusTagText, { color: theme.textSecondary }]}>{novel.status}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editButton}
                  activeOpacity={0.7}
                  onPress={() => (navigation.navigate as any)('EditNovel', { novelId })}
                >
                  <Text style={styles.editButtonText}>Edit Info</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.chapterButton}
                  activeOpacity={0.7}
                  onPress={() => (navigation.navigate as any)('CreateChapter', { novelId })}
                >
                  <Text style={styles.chapterButtonText}>+ Chapter</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabsRow, { borderBottomColor: theme.border }]}>
          {['overview', 'chapters', 'reviews'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.tabActive,
                activeTab === tab && { borderBottomColor: theme.primary }
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.tabText,
                { color: theme.textSecondary },
                activeTab === tab && styles.tabTextActive,
              ]}>
                {tab === 'overview' ? 'Overview' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'chapters' && renderChaptersTab()}
        {activeTab === 'reviews' && renderReviewsTab()}
        {/* Overview tab renamed from analytics */}
      </ScrollView>

      {/* Review Menu Dropdown - Modal Portal */}
      <Modal
        visible={openReviewMenu !== null}
        transparent
        animationType="none"
        onRequestClose={() => {
          setOpenReviewMenu(null);
          setMenuPosition(null);
        }}
      >
        <TouchableOpacity
          style={styles.reviewMenuOverlay}
          activeOpacity={1}
          onPress={() => {
            setOpenReviewMenu(null);
            setMenuPosition(null);
          }}
        >
          <View
            style={[
              styles.reviewMenuDropdownPortal,
              {
                position: 'absolute',
                top: menuPosition?.y || 100,
                left: Math.max(10, (menuPosition?.x || 300) - 120),
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.reviewMenuItem}
              onPress={() => {
                setOpenReviewMenu(null);
                setMenuPosition(null);
                if (openReviewMenu) {
                  handleReportReview(openReviewMenu);
                }
              }}
            >
              <Feather name="flag" size={14} color="#ef4444" />
              <Text style={[styles.reviewMenuItemText, { color: theme.text }]}>Report</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Novel Confirmation Modal */}
      <Modal
        visible={showDeleteNovelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteNovelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Delete Novel?</Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              Are you sure you want to delete "{novel?.title}"? This will permanently remove all chapters, reviews, and analytics. This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowDeleteNovelModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDelete]}
                onPress={confirmDeleteNovel}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: colors.white }]}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: 8,
    zIndex: 100,
    overflow: 'visible',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    overflow: 'visible',
  },
  bannerSection: {
    height: 256,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  novelInfo: {
    paddingHorizontal: 16,
    marginTop: -80,
  },
  novelInfoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  novelCover: {
    width: 80,
    height: 112,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: theme.card,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  novelDetails: {
    flex: 1,
  },
  novelTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  genreTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  genreTagSky: {
    backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : '#f0f9ff',
  },
  genreTagIndigo: {
    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.1)' : '#eef2ff',
  },
  genreTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  genreTagTextSky: {
    color: theme.primary,
  },
  genreTagTextIndigo: {
    color: '#6366f1',
  },
  genreTagPurple: {
    backgroundColor: isDarkMode ? 'rgba(168, 85, 247, 0.1)' : '#f5f3ff',
  },
  genreTagTextPurple: {
    color: '#a855f7',
  },
  genreTagAmber: {
    backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
  },
  genreTagTextAmber: {
    color: '#f59e0b',
  },
  genreTagEmerald: {
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
  },
  genreTagTextEmerald: {
    color: '#10b981',
  },
  genreTagRed: {
    backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
  },
  genreTagTextRed: {
    color: theme.error,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10b981',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.primary,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  chapterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  chapterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
  },
  tabsRow: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
    backgroundColor: theme.card,
  },
  tabActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  tabText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
    overflow: 'visible',
  },
  section: {
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: theme.inputBackground,
  },
  tagText: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
    justifyContent: 'center',
    maxWidth: 600,
    alignSelf: 'center',
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    maxWidth: 280,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    backgroundColor: theme.card,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
  },
  statGrowth: {
    fontSize: 10,
    color: '#10b981',
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 4,
  },
  performanceCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    backgroundColor: theme.card,
    marginTop: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  performanceList: {
    gap: 12,
  },
  performanceItem: {
    gap: 4,
    marginBottom: 12,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  performanceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
  },
  progressBar: {
    height: 8,
    borderRadius: 9999,
    backgroundColor: theme.inputBackground,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  progressFill: {
    height: '100%',
    borderRadius: 9999,
    backgroundColor: theme.primary,
  },
  earningsCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    backgroundColor: theme.card,
    marginTop: 16,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
  },
  earningsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsTotal: {
    fontSize: 24,
    fontWeight: '600',
    color: '#10b981',
  },
  earningsLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  earningsRight: {
    alignItems: 'flex-end',
  },
  earningsMonth: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 10,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 36,
    paddingRight: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    fontSize: 14,
    color: theme.text,
    backgroundColor: theme.inputBackground,
  },
  newButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.primary,
  },
  newButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  sortRow: {
    marginBottom: 16,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
    backgroundColor: theme.card,
  },
  sortButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  sortButtonText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  sortButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  chaptersList: {
    gap: 8,
  },
  chapterCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    backgroundColor: theme.card,
  },
  chapterNumber: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.15)' : colors.sky50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumberText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: theme.primary,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  draftBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.4)' : '#fbbf24',
  },
  draftBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  chapterMeta: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  chapterStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
    marginTop: 8,
  },
  chapterStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#10b981',
  },
  chapterStatusDraft: {
    color: '#f59e0b',
  },
  chapterStatusDraftContainer: {
    backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
  },
  chapterStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  publishSmallButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: theme.primary,
  },
  publishSmallButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.white,
  },
  ratingCard: {
    flexDirection: 'row',
    gap: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 16,
    backgroundColor: theme.card,
  },
  ratingLeft: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 30,
    fontWeight: '600',
    color: theme.text,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  ratingCount: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 4,
  },
  ratingBars: {
    flex: 1,
    gap: 6,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingStarLabel: {
    width: 24,
    fontSize: 11,
    color: theme.textSecondary,
  },
  ratingBarContainer: {
    flex: 1,
    height: 8,
    borderRadius: 9999,
    backgroundColor: theme.inputBackground,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 9999,
    backgroundColor: theme.primary,
  },
  ratingPercentage: {
    width: 40,
    textAlign: 'right',
    fontSize: 11,
    color: theme.textSecondary,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
    backgroundColor: theme.card,
  },
  filterButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  reviewsList: {
    gap: 12,
  },
  reviewItemWrapper: {
    marginBottom: 12,
  },
  reviewCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    backgroundColor: theme.card,
    overflow: 'visible',
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewContent: {
    flex: 1,
    overflow: 'visible',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    overflow: 'visible',
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  reviewUsername: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
  },
  reviewTime: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  reviewMenu: {
    padding: 4,
    borderRadius: 4,
  },
  reviewMenuDropdown: {
    position: 'absolute',
    right: 0,
    top: 28,
    backgroundColor: theme.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    minWidth: 120,
    zIndex: 1000,
  },
  reviewMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reviewMenuText: {
    fontSize: 12,
    color: theme.error,
    fontWeight: '500',
  },
  reviewText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  reviewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewActionText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  placeholderText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  analyticsCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 16,
    marginBottom: 16,
    backgroundColor: theme.card,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    width: '100%',
  },
  pieChartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  analyticsFilterContainer: {
    marginBottom: 8,
  },
  analyticsFilterRow: {
    flexDirection: 'row',
  },
  analyticsFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
    backgroundColor: theme.card,
  },
  analyticsFilterButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  analyticsFilterText: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  analyticsFilterTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  analyticsFilterScroll: {
    marginBottom: 16,
    flexGrow: 0,
  },
  chartPlaceholder: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: 8,
    marginTop: 12,
  },
  chartPlaceholderText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 8,
  },
  engagementList: {
    gap: 12,
    marginTop: 12,
  },
  engagementItem: {
    gap: 4,
  },
  engagementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  engagementLabel: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  engagementValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
  },
  demographicsChartPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: 8,
    marginTop: 12,
  },
  demographicsLegend: {
    marginTop: 20,
    width: '100%',
    paddingHorizontal: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    paddingBottom: 8,
  },
  legendLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendLabel: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '600',
    marginRight: 6,
  },
  legendPercentage: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  reviewMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  reviewMenuDropdownPortal: {
    backgroundColor: theme.card,
    borderRadius: 8,
    minWidth: 120,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  reviewMenuItemText: {
    fontSize: 12,
    color: theme.error,
    fontWeight: '500',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: theme.textSecondary,
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
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.inputBackground,
  },
  modalButtonDelete: {
    backgroundColor: theme.error,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  simpleLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  simpleLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsMenuDropdown: {
    position: 'absolute',
    right: 0,
    top: 40,
    backgroundColor: theme.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    minWidth: 160,
    zIndex: 2000,
    maxHeight: 200,
  },
  settingsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingsMenuText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
  simpleLegendText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
  },
});

export default NovelManageScreen;
