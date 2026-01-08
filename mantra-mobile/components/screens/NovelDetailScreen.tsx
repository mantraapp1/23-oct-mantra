import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Modal,
  ImageBackground,
  Animated,
  RefreshControl,
} from 'react-native';
import { Feather, FontAwesome, AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography, semanticColors } from '../../constants';
import { getProfilePicture } from '../../constants/defaultImages';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { RatingStars, LoadingState, ErrorState, NovelCard } from '../common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../config/supabase';
import readingService from '../../services/readingService';
import reviewService from '../../services/reviewService';
import novelService from '../../services/novelService';
import authService from '../../services/authService';
import { useToast } from '../ToastManager';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../constants/theme';
import { formatUserProfile, getUserProfileImage, getUserDisplayName } from '../../utils/profileUtils';

type TabType = 'about' | 'chapters' | 'reviews';

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  views: string;
  date: string;
  isLocked: boolean;
  waitHours?: number;
}

interface Review {
  id: string;
  user_id: string;
  userName: string;
  userAvatar: string;
  isCurrentUser: boolean;
  rating: number;
  text: string;
  timeAgo: string;
  likes: number;
  dislikes: number;
  isLiked?: boolean;
  isDisliked?: boolean;
}

interface RelatedNovel {
  id: string;
  title: string;
  cover: string;
  genre: string;
  rating: number;
}

const NovelDetailScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme, isDarkMode);
  const navigation = useNavigation();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('about');
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [chapterSort, setChapterSort] = useState<'oldest' | 'newest'>('oldest');
  const [chapterSearch, setChapterSearch] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | number>('all');
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [unlockChapter, setUnlockChapter] = useState<Chapter | null>(null);
  const [openReviewMenu, setOpenReviewMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const menuButtonRefs = useRef<Record<string, any>>({});

  // Timer system state
  const [chapterTimers, setChapterTimers] = useState<Record<string, number>>({});
  const [unlockedChapters, setUnlockedChapters] = useState<string[]>([]);
  const [timerDisplay, setTimerDisplay] = useState<Record<string, string>>({});
  const [fullTimerDisplay, setFullTimerDisplay] = useState<Record<string, string>>({});
  const timerInterval = useRef<any>(null);

  // Pulse animation for timer badge
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Real novel data state
  const [novel, setNovel] = useState<any>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedNovels, setRelatedNovels] = useState<RelatedNovel[]>([]);
  const [ratingStats, setRatingStats] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Get novel ID from route params
  const route = useRoute<any>();
  const novelId = route.params?.novelId;

  // Load novel data from Supabase
  const loadNovelData = async (userId: string | null = null) => {
    try {
      setLoading(true);
      setError(null);

      // Use passed userId or fall back to state
      const effectiveUserId = userId || currentUserId;

      // Load novel details
      const { data: novelData, error: novelError } = await supabase
        .from('novels')
        .select(`
          *,
          profiles:author_id (username, display_name, profile_picture_url)
        `)
        .eq('id', novelId)
        .single();

      if (novelError) throw novelError;

      // Validate required novel fields per requirement 4.5
      if (!novelData.id) {
        console.warn('Novel missing id field');
      }
      if (!novelData.title) {
        console.warn('Novel missing title field');
      }
      if (!novelData.author_id) {
        console.warn('Novel missing author_id field');
      }

      // Transform novel data with proper field mapping per requirement 4.1
      const transformedNovel = {
        id: novelData.id,
        title: novelData.title || 'Untitled Novel',
        author: novelData.profiles?.display_name || novelData.profiles?.username || 'Unknown Author',
        author_id: novelData.author_id, // Include author ID for navigation
        cover: novelData.cover_image_url || 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=300&auto=format&fit=crop',
        banner: novelData.cover_image_url || 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=1200&auto=format&fit=crop',
        rating: novelData.average_rating || 0,
        views: formatNumber(novelData.total_views || 0),
        votes: formatNumber(novelData.total_votes || 0),
        chapters: novelData.total_chapters || 0,
        genres: novelData.genres || [],
        status: novelData.status?.toUpperCase() || 'ONGOING',
        description: novelData.description || 'No description available.',
        tags: novelData.tags || [],
      };

      setNovel(transformedNovel);

      // Load chapters - explicitly select required fields per requirement 4.2
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('id, chapter_number, title, views, is_locked, wait_hours, published_at, updated_at')
        .eq('novel_id', novelId)
        .order('chapter_number', { ascending: true });

      if (chaptersError) throw chaptersError;

      // Transform chapter data with validation per requirement 4.5
      const transformedChapters = (chaptersData || []).map((chapter, index) => {
        // Validate required fields and log warnings if missing
        if (!chapter.id) {
          console.error('[Data Transformation Error] Chapter missing id field:', {
            chapter,
            novelId,
            index,
            timestamp: new Date().toISOString()
          });
        }
        if (chapter.chapter_number === undefined || chapter.chapter_number === null) {
          console.error('[Data Transformation Error] Chapter missing chapter_number field:', {
            chapterId: chapter.id,
            novelId,
            index,
            timestamp: new Date().toISOString()
          });
        }
        if (!chapter.title) {
          console.warn('[Data Transformation Warning] Chapter missing title field:', {
            chapterId: chapter.id,
            chapter_number: chapter.chapter_number,
            novelId,
            timestamp: new Date().toISOString()
          });
        }

        // Fallback for missing chapter_number - use index + 1 as fallback
        const chapterNumber = chapter.chapter_number ?? (index + 1);

        // Log if fallback was used
        if (chapter.chapter_number === undefined || chapter.chapter_number === null) {
          console.warn('[Data Transformation Fallback] Using index-based chapter number:', {
            chapterId: chapter.id,
            fallbackNumber: chapterNumber,
            index,
            timestamp: new Date().toISOString()
          });
        }

        return {
          id: chapter.id || `unknown-${index}`,
          chapter_number: chapterNumber,
          title: chapter.title || `Untitled Chapter ${chapterNumber}`,
          views: formatNumber(chapter.views || 0),
          date: formatTimeAgo(chapter.published_at || chapter.updated_at),
          isLocked: chapter.is_locked ?? false,
          waitHours: chapter.wait_hours ?? 0,
        };
      });

      setChapters(transformedChapters);

      // Load chapter unlock status for current user
      if (effectiveUserId) {
        const { data: unlocks, error: unlocksError } = await supabase
          .from('chapter_unlocks')
          .select('chapter_id, is_expired')
          .eq('user_id', effectiveUserId)
          .eq('novel_id', novelId)
          .eq('is_expired', false);

        if (!unlocksError && unlocks) {
          const unlockedIds = unlocks.map(u => u.chapter_id);
          setUnlockedChapters(unlockedIds);
        }
      }

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

      // Batch fetch user reactions for all reviews if user is logged in
      let userReactionsMap = new Map<string, 'like' | 'dislike'>();
      if (effectiveUserId && reviewsData && reviewsData.length > 0) {
        try {
          const reviewIds = reviewsData.map(review => review.id);
          userReactionsMap = await reviewService.getUserReactions(effectiveUserId, reviewIds);
        } catch (error) {
          console.error('Error loading user reactions:', error);
          // Continue with empty map - UI will show default states
        }
      }

      // Transform reviews and merge with reaction states
      const transformedReviews = (reviewsData || []).map((review) => {
        // Check if this review belongs to the current user
        const isOwnReview = effectiveUserId ? review.user_id === effectiveUserId : false;

        // Get display name and profile image
        const displayName = review.profiles?.display_name || review.profiles?.username || 'Anonymous';
        const profileImage = getUserProfileImage(review.profiles);

        const reaction = userReactionsMap.get(review.id);

        // Debug log for review ownership
        console.log('[Review Transform]', {
          reviewId: review.id,
          reviewUserId: review.user_id,
          effectiveUserId,
          isOwnReview,
          displayName,
        });

        return {
          id: review.id,
          user_id: review.user_id,
          userName: displayName,
          userAvatar: profileImage,
          isCurrentUser: isOwnReview,
          rating: review.rating,
          text: review.review_text,
          timeAgo: formatTimeAgo(review.created_at),
          likes: review.likes || 0,
          dislikes: review.dislikes || 0,
          isLiked: reaction === 'like',
          isDisliked: reaction === 'dislike',
        };
      });

      setReviews(transformedReviews);

      let foundRelated = false;

      // Load related novels (same genre)
      if (novelData.genres && novelData.genres.length > 0) {
        const { data: relatedData, error: relatedError } = await supabase
          .from('novels')
          .select('*')
          .contains('genres', [novelData.genres[0]])
          .neq('id', novelId)
          .limit(5);

        if (!relatedError && relatedData && relatedData.length > 0) {
          const transformedRelated = relatedData.map(novel => ({
            id: novel.id,
            title: novel.title,
            cover: novel.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=100&auto=format&fit=crop',
            genre: novel.genres?.[0] || 'Novel',
            rating: novel.average_rating || 0,
          }));
          setRelatedNovels(transformedRelated);
          foundRelated = true;
        }
      }

      // Fallback: If no related novels found (or no genres), fetch top rated novels
      if (!foundRelated) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('novels')
          .select('*')
          .neq('id', novelId)
          .order('average_rating', { ascending: false })
          .limit(5);

        if (!fallbackError && fallbackData && fallbackData.length > 0) {
          const transformedFallback = fallbackData.map(novel => ({
            id: novel.id,
            title: novel.title,
            cover: novel.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=100&auto=format&fit=crop',
            genre: novel.genres?.[0] || 'Novel',
            rating: novel.average_rating || 0,
          }));
          setRelatedNovels(transformedFallback);
        }
      }

      // Calculate rating stats
      const stats: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let total = 0;
      reviewsData?.forEach((review: any) => {
        const rating = Math.floor(review.rating);
        if (rating >= 1 && rating <= 5) {
          stats[rating]++;
          total++;
        }
      });
      setRatingStats(stats);
      setTotalRatings(total);

      // Increment novel views
      if (novelId) {
        await novelService.incrementViews(novelId);
      }

    } catch (error: any) {
      console.error('[Data Loading Error] Failed to load novel data:', {
        error,
        errorMessage: error?.message || 'Unknown error',
        errorCode: error?.code,
        errorDetails: error?.details,
        novelId,
        timestamp: new Date().toISOString()
      });

      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to load novel data';
      if (error?.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error?.message?.includes('not found')) {
        errorMessage = 'Novel not found.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load user-specific data
  const loadUserData = async () => {
    if (!currentUserId || !novelId) {
      console.warn('[User Data Loading] Missing user or novel ID:', {
        currentUserId,
        novelId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      // Fetch vote and library states concurrently using Promise.all
      const [voted, inLibrary] = await Promise.all([
        novelService.hasVoted(currentUserId, novelId).catch(error => {
          console.error('[User Data Loading Error] Failed to check vote status:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            userId: currentUserId,
            novelId,
            timestamp: new Date().toISOString()
          });
          return false; // Return default value on error
        }),
        readingService.isInLibrary(currentUserId, novelId).catch(error => {
          console.error('[User Data Loading Error] Failed to check library status:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            userId: currentUserId,
            novelId,
            timestamp: new Date().toISOString()
          });
          return false; // Return default value on error
        })
      ]);

      // Update states with fetched values
      setHasVoted(voted);
      setIsInLibrary(inLibrary);

      // Load user's review
      try {
        const userReviewData = await reviewService.getUserReview(currentUserId, novelId);
        if (userReviewData) {
          // Get current user profile for consistent display
          const currentUserProfile = await authService.getCurrentProfile();
          const formattedProfile = formatUserProfile(currentUserProfile, currentUserId);

          setUserReview({
            id: userReviewData.id,
            user_id: currentUserId,
            userName: formattedProfile.displayName,
            userAvatar: formattedProfile.profileImage,
            isCurrentUser: true,
            rating: userReviewData.rating,
            text: userReviewData.review_text || '',
            timeAgo: formatTimeAgo(userReviewData.created_at),
            likes: userReviewData.likes || 0,
            dislikes: userReviewData.dislikes || 0,
          });
        }
      } catch (error) {
        console.error('[User Data Loading Error] Failed to load user review:', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          userId: currentUserId,
          novelId,
          timestamp: new Date().toISOString()
        });
        // Don't block other operations, just log the error
      }
    } catch (error) {
      console.error('[User Data Loading Error] Unexpected error loading user data:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        userId: currentUserId,
        novelId,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Helper functions
  const formatNumber = (num: number): string => {
    try {
      // Validation: Check if num is a valid number
      if (typeof num !== 'number' || isNaN(num)) {
        console.warn('[Format Number Warning] Invalid number:', {
          num,
          type: typeof num,
          timestamp: new Date().toISOString()
        });
        return '0';
      }

      // Handle negative numbers
      if (num < 0) {
        console.warn('[Format Number Warning] Negative number:', {
          num,
          timestamp: new Date().toISOString()
        });
        return '0';
      }

      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
      return num.toString();
    } catch (error) {
      console.error('[Format Number Error] Unexpected error:', {
        error,
        num,
        timestamp: new Date().toISOString()
      });
      return '0';
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    try {
      // Validation: Check if dateString is valid
      if (!dateString || typeof dateString !== 'string') {
        console.warn('[Format Time Warning] Invalid date string:', {
          dateString,
          type: typeof dateString,
          timestamp: new Date().toISOString()
        });
        return 'Unknown';
      }

      const date = new Date(dateString);

      // Validation: Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('[Format Time Warning] Invalid date:', {
          dateString,
          timestamp: new Date().toISOString()
        });
        return 'Unknown';
      }

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();

      // Handle future dates
      if (diffMs < 0) {
        console.warn('[Format Time Warning] Future date:', {
          dateString,
          diffMs,
          timestamp: new Date().toISOString()
        });
        return 'Just now';
      }

      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      return `${Math.floor(diffDays / 30)}mo ago`;
    } catch (error) {
      console.error('[Format Time Error] Unexpected error:', {
        error,
        dateString,
        timestamp: new Date().toISOString()
      });
      return 'Unknown';
    }
  };

  // Initialize user and load data on focus
  useFocusEffect(
    useCallback(() => {
      const initializeScreen = async () => {
        // Get current user first
        const user = await authService.getCurrentUser();
        let userId = null;
        if (user) {
          userId = user.id;
          setCurrentUserId(user.id);
          setCurrentUserProfile(user);
        }

        // Load novel data with userId
        if (novelId) {
          await loadNovelData(userId);
        }
      };
      initializeScreen();
    }, [novelId])
  );

  // Load user-specific data when user is available
  useEffect(() => {
    if (currentUserId && novelId) {
      loadUserData();
    }
  }, [currentUserId, novelId]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNovelData();
    setRefreshing(false);
  };

  const handleRead = () => {
    // Navigate to first chapter
    if (chapters.length > 0) {
      const firstChapter = chapters[0];
      (navigation.navigate as any)('Chapter', { novelId: novel.id, chapterId: firstChapter.id });
    } else {
      showToast('error', 'No chapters available');
    }
  };

  const toggleLibrary = async () => {
    if (!currentUserId || !novelId) {
      showToast('error', 'Please log in to save novels');
      return;
    }

    try {
      if (isInLibrary) {
        const result = await readingService.removeFromLibrary(currentUserId, novelId);
        if (result.success) {
          setIsInLibrary(false);
          showToast('success', 'Removed from library');
        } else {
          showToast('error', result.message);
        }
      } else {
        const result = await readingService.addToLibrary(currentUserId, novelId);
        if (result.success) {
          setIsInLibrary(true);
          showToast('success', 'Added to library');
        } else {
          showToast('error', result.message);
        }
      }
    } catch (error) {
      console.error('Error toggling library:', error);
      showToast('error', 'Failed to update library');
    }
  };

  const toggleVote = async () => {
    // Validation: Check if user is logged in (Requirement 2.4)
    if (!currentUserId || !novelId) {
      console.warn('[Vote Validation] User not authenticated:', {
        currentUserId,
        novelId,
        timestamp: new Date().toISOString()
      });
      showToast('error', 'Please log in to vote');
      return;
    }

    // Validation: Check if novel data is loaded
    if (!novel) {
      console.error('[Vote Validation] Novel data not loaded:', {
        novelId,
        timestamp: new Date().toISOString()
      });
      showToast('error', 'Novel data not available. Please refresh.');
      return;
    }

    // Validation: Check if votes field exists and is valid
    if (!novel.votes || typeof novel.votes !== 'string') {
      console.error('[Vote Validation] Invalid votes data:', {
        votes: novel.votes,
        novelId,
        timestamp: new Date().toISOString()
      });
      showToast('error', 'Unable to update vote. Please refresh.');
      return;
    }

    try {
      if (hasVoted) {
        // Optimistic update - decrement vote count immediately
        setNovel((prev: any) => {
          if (!prev) return prev;

          try {
            const currentVotes = prev.votes.replace(/[^0-9.]/g, '');
            const numericVotes = parseFloat(currentVotes);

            // Validation: Check if vote count is a valid number
            if (isNaN(numericVotes)) {
              console.error('[Vote Calculation Error] Invalid vote count:', {
                votes: prev.votes,
                numericVotes,
                timestamp: new Date().toISOString()
              });
              return prev;
            }

            let actualCount = numericVotes;

            // Handle formatted numbers (e.g., "1.2k" = 1200, "1.5M" = 1500000)
            if (prev.votes.includes('k')) {
              actualCount = numericVotes * 1000;
            } else if (prev.votes.includes('M')) {
              actualCount = numericVotes * 1000000;
            }

            const newCount = Math.max(0, actualCount - 1);
            return {
              ...prev,
              votes: formatNumber(newCount)
            };
          } catch (error) {
            console.error('[Vote Calculation Error] Failed to calculate new vote count:', {
              error,
              votes: prev.votes,
              timestamp: new Date().toISOString()
            });
            return prev;
          }
        });

        const result = await novelService.unvoteNovel(currentUserId, novelId);
        if (result.success) {
          setHasVoted(false);
          showToast('success', 'Vote removed');
          // Reload novel data to get accurate count from database
          await loadNovelData();
        } else {
          console.error('[Vote Operation Error] Failed to remove vote:', {
            result,
            novelId,
            userId: currentUserId,
            timestamp: new Date().toISOString()
          });
          // Revert optimistic update on error
          await loadNovelData();
          showToast('error', result.message || 'Failed to remove vote');
        }
      } else {
        // Optimistic update - increment vote count immediately
        setNovel((prev: any) => {
          if (!prev) return prev;

          try {
            const currentVotes = prev.votes.replace(/[^0-9.]/g, '');
            const numericVotes = parseFloat(currentVotes);

            // Validation: Check if vote count is a valid number
            if (isNaN(numericVotes)) {
              console.error('[Vote Calculation Error] Invalid vote count:', {
                votes: prev.votes,
                numericVotes,
                timestamp: new Date().toISOString()
              });
              return prev;
            }

            let actualCount = numericVotes;

            // Handle formatted numbers (e.g., "1.2k" = 1200, "1.5M" = 1500000)
            if (prev.votes.includes('k')) {
              actualCount = numericVotes * 1000;
            } else if (prev.votes.includes('M')) {
              actualCount = numericVotes * 1000000;
            }

            const newCount = actualCount + 1;
            return {
              ...prev,
              votes: formatNumber(newCount)
            };
          } catch (error) {
            console.error('[Vote Calculation Error] Failed to calculate new vote count:', {
              error,
              votes: prev.votes,
              timestamp: new Date().toISOString()
            });
            return prev;
          }
        });

        const result = await novelService.voteNovel(currentUserId, novelId);
        if (result.success) {
          setHasVoted(true);
          showToast('success', 'Vote added');
          // Reload novel data to get accurate count from database
          await loadNovelData();
        } else {
          console.error('[Vote Operation Error] Failed to add vote:', {
            result,
            novelId,
            userId: currentUserId,
            timestamp: new Date().toISOString()
          });
          // Revert optimistic update on error
          await loadNovelData();
          showToast('error', result.message || 'Failed to add vote');
        }
      }
    } catch (error) {
      console.error('[Vote Operation Error] Unexpected error toggling vote:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        novelId,
        userId: currentUserId,
        hasVoted,
        timestamp: new Date().toISOString()
      });
      // Revert optimistic update on error
      await loadNovelData();
      showToast('error', 'Failed to update vote');
    }
  };

  const handleChapterPress = async (chapter: Chapter) => {
    try {
      // Validation: Check if chapter data is valid
      if (!chapter || !chapter.id) {
        console.error('[Chapter Navigation Error] Invalid chapter data:', {
          chapter,
          timestamp: new Date().toISOString()
        });
        showToast('error', 'Invalid chapter data');
        return;
      }

      // Validation: Check if chapter_number exists (with fallback)
      if (chapter.chapter_number === undefined || chapter.chapter_number === null) {
        console.warn('[Chapter Navigation Warning] Chapter missing chapter_number:', {
          chapterId: chapter.id,
          chapter,
          timestamp: new Date().toISOString()
        });
      }

      const unlocked = isChapterUnlocked(chapter);

      // If chapter is not unlocked (chapters 8+), show unlock dialog
      if (!unlocked) {
        setUnlockChapter(chapter);
        setShowUnlockDialog(true);
      } else {
        // Record chapter read in history
        if (currentUserId && novelId) {
          try {
            await readingService.recordChapterRead(
              currentUserId,
              novelId,
              chapter.id,
              chapter.chapter_number
            );
          } catch (error) {
            // Log error but don't block navigation
            console.error('[Reading History Error] Failed to record chapter read:', {
              error,
              chapterId: chapter.id,
              novelId,
              userId: currentUserId,
              timestamp: new Date().toISOString()
            });
          }
        }

        // Validation: Check if novel data exists before navigation
        if (!novel || !novel.id) {
          console.error('[Chapter Navigation Error] Novel data not available:', {
            novel,
            timestamp: new Date().toISOString()
          });
          showToast('error', 'Novel data not available. Please refresh.');
          return;
        }

        (navigation.navigate as any)('Chapter', { novelId: novel.id, chapterId: chapter.id });
      }
    } catch (error) {
      console.error('[Chapter Navigation Error] Unexpected error:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        chapterId: chapter?.id,
        timestamp: new Date().toISOString()
      });
      showToast('error', 'Failed to open chapter');
    }
  };

  const handlePostReview = async () => {
    // Validation: Check authentication
    if (!currentUserId || !novelId) {
      console.warn('[Review Validation] User not authenticated:', {
        currentUserId,
        novelId,
        timestamp: new Date().toISOString()
      });
      showToast('error', 'Please log in to post a review');
      return;
    }

    // Validation: Check rating
    if (selectedRating === 0 || selectedRating < 1 || selectedRating > 5) {
      console.warn('[Review Validation] Invalid rating:', {
        selectedRating,
        timestamp: new Date().toISOString()
      });
      showToast('error', 'Please select a rating between 1 and 5');
      return;
    }

    // Validation: Check review text
    const trimmedText = reviewText.trim();
    if (!trimmedText) {
      console.warn('[Review Validation] Empty review text:', {
        timestamp: new Date().toISOString()
      });
      showToast('error', 'Please write a review');
      return;
    }

    // Validation: Check review text length
    if (trimmedText.length < 10) {
      console.warn('[Review Validation] Review text too short:', {
        length: trimmedText.length,
        timestamp: new Date().toISOString()
      });
      showToast('error', 'Review must be at least 10 characters');
      return;
    }

    if (trimmedText.length > 1000) {
      console.warn('[Review Validation] Review text too long:', {
        length: trimmedText.length,
        timestamp: new Date().toISOString()
      });
      showToast('error', 'Review must be less than 1000 characters');
      return;
    }

    try {
      const result = await reviewService.createReview(currentUserId, {
        novel_id: novelId,
        rating: selectedRating,
        review_text: trimmedText,
      });

      if (result.success && result.review) {
        // Get current user profile and format consistently
        const currentUserProfile = await authService.getCurrentProfile();
        const formattedProfile = formatUserProfile(currentUserProfile, currentUserId);

        const newReview: Review = {
          id: result.review.id,
          user_id: currentUserId,
          userName: formattedProfile.displayName,
          userAvatar: formattedProfile.profileImage,
          isCurrentUser: true,
          rating: result.review.rating,
          text: result.review.review_text || '',
          timeAgo: 'Just now',
          likes: 0,
          dislikes: 0,
        };

        setUserReview(newReview);
        setReviews([newReview, ...reviews]);
        setReviewText('');
        setSelectedRating(0);
        showToast('success', 'Review posted successfully');

        // Reload novel data to update rating
        await loadNovelData();
      } else {
        console.error('[Review Operation Error] Failed to create review:', {
          result,
          novelId,
          userId: currentUserId,
          timestamp: new Date().toISOString()
        });
        showToast('error', result.message || 'Failed to post review');
      }
    } catch (error) {
      console.error('[Review Operation Error] Unexpected error posting review:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        novelId,
        userId: currentUserId,
        timestamp: new Date().toISOString()
      });
      showToast('error', 'Failed to post review');
    }
  };

  const handleEditReview = () => {
    // Find user's review from the reviews list
    const ownReview = reviews.find(r => r.isCurrentUser);
    if (ownReview) {
      setReviewText(ownReview.text);
      setSelectedRating(ownReview.rating);
      setIsEditingReview(true);
    }
  };

  const handleSaveEdit = async () => {
    // Find user's review from the reviews list
    const ownReview = reviews.find(r => r.isCurrentUser);
    if (!ownReview || !currentUserId) return;

    try {
      const result = await reviewService.updateReview(ownReview.id, {
        rating: selectedRating,
        review_text: reviewText,
      });

      if (result.success && result.review) {
        const updatedReview = result.review;
        // Update the review in the reviews list
        setReviews(prev => prev.map(review =>
          review.id === ownReview.id
            ? {
              ...review,
              rating: updatedReview.rating,
              text: updatedReview.review_text || '',
            }
            : review
        ));

        // Also update userReview state if it exists
        if (userReview) {
          setUserReview({
            ...userReview,
            rating: updatedReview.rating,
            text: updatedReview.review_text || '',
          });
        }

        setIsEditingReview(false);
        setReviewText('');
        setSelectedRating(0);
        showToast('success', 'Review updated successfully');

        // Reload novel data to update rating
        await loadNovelData();
      } else {
        showToast('error', result.message);
      }
    } catch (error) {
      console.error('Error updating review:', error);
      showToast('error', 'Failed to update review');
    }
  };

  const handleDeleteReview = async () => {
    // Find user's review from the reviews list
    const ownReview = reviews.find(r => r.isCurrentUser);
    if (!ownReview) return;

    try {
      const result = await reviewService.deleteReview(ownReview.id);

      if (result.success) {
        setUserReview(null);
        setIsEditingReview(false);
        setReviews(reviews.filter(r => r.id !== ownReview.id));
        showToast('success', 'Review deleted successfully');

        // Reload novel data to update rating
        await loadNovelData();
      } else {
        showToast('error', result.message);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      showToast('error', 'Failed to delete review');
    }
  };

  const toggleReviewLike = async (reviewId: string) => {
    if (!currentUserId) {
      showToast('error', 'Please log in to react to reviews');
      return;
    }

    // Optimistic update
    setReviews(prev => prev.map(review => {
      if (review.id === reviewId) {
        const wasLiked = review.isLiked;
        const wasDisliked = review.isDisliked;

        return {
          ...review,
          isLiked: !wasLiked,
          isDisliked: false,
          likes: wasLiked ? review.likes - 1 : review.likes + 1,
          dislikes: wasDisliked ? review.dislikes - 1 : review.dislikes,
        };
      }
      return review;
    }));

    try {
      const result = await reviewService.reactToReview(currentUserId, reviewId, 'like');
      if (result.success) {
        // Reload to get accurate counts from database
        await loadNovelData();
      } else {
        // Revert on error
        await loadNovelData();
        showToast('error', result.message);
      }
    } catch (error) {
      console.error('Error liking review:', error);
      // Revert on error
      await loadNovelData();
      showToast('error', 'Failed to update reaction');
    }
  };

  const toggleReviewDislike = async (reviewId: string) => {
    if (!currentUserId) {
      showToast('error', 'Please log in to react to reviews');
      return;
    }

    // Optimistic update
    setReviews(prev => prev.map(review => {
      if (review.id === reviewId) {
        const wasLiked = review.isLiked;
        const wasDisliked = review.isDisliked;

        return {
          ...review,
          isLiked: false,
          isDisliked: !wasDisliked,
          likes: wasLiked ? review.likes - 1 : review.likes,
          dislikes: wasDisliked ? review.dislikes - 1 : review.dislikes + 1,
        };
      }
      return review;
    }));

    try {
      const result = await reviewService.reactToReview(currentUserId, reviewId, 'dislike');
      if (result.success) {
        // Reload to get accurate counts from database
        await loadNovelData();
      } else {
        // Revert on error
        await loadNovelData();
        showToast('error', result.message);
      }
    } catch (error) {
      console.error('Error disliking review:', error);
      // Revert on error
      await loadNovelData();
      showToast('error', 'Failed to update reaction');
    }
  };

  const getSortedChapters = () => {
    let filtered = chapters;
    if (chapterSearch) {
      filtered = chapters.filter((ch) =>
        ch.title.toLowerCase().includes(chapterSearch.toLowerCase())
      );
    }
    return chapterSort === 'newest' ? [...filtered].reverse() : filtered;
  };

  const getFilteredReviews = () => {
    if (reviewFilter === 'all') return reviews;
    return reviews.filter((r) => r.rating === reviewFilter);
  };

  const getGenreColor = (genre: string) => {
    // Light mode colors
    const lightGenreColors: Record<string, { bg: string; text: string }> = {
      THRILLER: { bg: '#f0f9ff', text: '#0369a1' },    // sky-50 / sky-700
      MYSTERY: { bg: '#eef2ff', text: '#4338ca' },     // indigo-50 / indigo-700
      SUSPENSE: { bg: '#fffbeb', text: '#b45309' },    // amber-50 / amber-700
      ONGOING: { bg: '#ecfdf5', text: '#047857' },     // emerald-50 / emerald-700
    };

    // Dark mode colors (deeper backgrounds, brighter text)
    const darkGenreColors: Record<string, { bg: string; text: string }> = {
      THRILLER: { bg: 'rgba(3, 105, 161, 0.2)', text: '#7dd3fc' },
      MYSTERY: { bg: 'rgba(67, 56, 202, 0.2)', text: '#a5b4fc' },
      SUSPENSE: { bg: 'rgba(180, 83, 9, 0.2)', text: '#fcd34d' },
      ONGOING: { bg: 'rgba(4, 120, 87, 0.2)', text: '#6ee7b7' },
    };

    const colors = isDarkMode ? darkGenreColors : lightGenreColors;
    return colors[genre] || { bg: theme.backgroundSecondary, text: theme.textSecondary };
  };

  // Timer System Functions
  const loadTimers = async () => {
    try {
      const timersData = await AsyncStorage.getItem('chapterTimers');
      const unlockedData = await AsyncStorage.getItem('unlockedChapters');

      if (timersData) {
        const timers = JSON.parse(timersData);
        setChapterTimers(timers);
      }
      if (unlockedData) {
        const unlocked = JSON.parse(unlockedData);
        setUnlockedChapters(unlocked);
      }
    } catch (error) {
      console.error('Error loading timers:', error);
    }
  };

  const saveTimers = async (timers: Record<string, number>) => {
    try {
      await AsyncStorage.setItem('chapterTimers', JSON.stringify(timers));
    } catch (error) {
      console.error('Error saving timers:', error);
    }
  };

  const saveUnlockedChapters = async (unlocked: string[]) => {
    try {
      await AsyncStorage.setItem('unlockedChapters', JSON.stringify(unlocked));
    } catch (error) {
      console.error('Error saving unlocked chapters:', error);
    }
  };

  const startChapterTimer = (chapterId: string, hours: number) => {
    // Check if there's already an active timer for this novel
    if (Object.keys(chapterTimers).length > 0) {
      const activeChapter = Object.keys(chapterTimers)[0];
      alert(`You can only wait for one chapter at a time. Chapter ${activeChapter} is currently waiting.`);
      return;
    }

    const unlockTime = Date.now() + (hours * 60 * 60 * 1000);
    const newTimers = { [chapterId]: unlockTime };
    setChapterTimers(newTimers);
    saveTimers(newTimers);
    // Don't close dialog - show timer section instead
  };

  const unlockChapterNow = (chapterId: string) => {
    const newUnlocked = [...unlockedChapters, chapterId];
    setUnlockedChapters(newUnlocked);
    saveUnlockedChapters(newUnlocked);

    // Remove timer if exists
    const newTimers = { ...chapterTimers };
    delete newTimers[chapterId];
    setChapterTimers(newTimers);
    saveTimers(newTimers);

    setShowUnlockDialog(false);
  };

  const updateTimerDisplays = () => {
    const now = Date.now();
    const newDisplays: Record<string, string> = {};
    const newFullDisplays: Record<string, string> = {};
    const newTimers = { ...chapterTimers };
    const newUnlocked = [...unlockedChapters];
    let hasChanges = false;

    Object.entries(chapterTimers).forEach(([chapterId, unlockTime]) => {
      const remaining = unlockTime - now;

      if (remaining <= 0) {
        // Timer expired, unlock chapter
        newUnlocked.push(chapterId);
        delete newTimers[chapterId];
        hasChanges = true;
      } else {
        // Calculate time remaining
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

        // Short display for badge
        if (hours > 0) {
          newDisplays[chapterId] = `${hours}h ${minutes}m`;
        } else {
          newDisplays[chapterId] = `${minutes}:${String(seconds).padStart(2, '0')}`;
        }

        // Full display for dialog (always show HH:MM:SS)
        newFullDisplays[chapterId] = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      }
    });

    if (hasChanges) {
      setChapterTimers(newTimers);
      setUnlockedChapters(newUnlocked);
      saveTimers(newTimers);
      saveUnlockedChapters(newUnlocked);
    }

    setTimerDisplay(newDisplays);
    setFullTimerDisplay(newFullDisplays);
  };

  // Load timers on mount
  useEffect(() => {
    loadTimers();
  }, []);

  // Start timer interval
  useEffect(() => {
    if (Object.keys(chapterTimers).length > 0) {
      timerInterval.current = setInterval(updateTimerDisplays, 1000);
      updateTimerDisplays(); // Initial update
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [chapterTimers]);

  // Pulse animation for timer badge
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const isChapterUnlocked = (chapter: Chapter) => {
    try {
      // Validation: Check if chapter data is valid
      if (!chapter) {
        console.error('[Chapter Unlock Check Error] Invalid chapter data:', {
          chapter,
          timestamp: new Date().toISOString()
        });
        return false;
      }

      // Validation: Check if chapter_number exists (with fallback to always locked)
      if (chapter.chapter_number === undefined || chapter.chapter_number === null) {
        console.warn('[Chapter Unlock Check Warning] Chapter missing chapter_number:', {
          chapterId: chapter.id,
          timestamp: new Date().toISOString()
        });
        // If chapter_number is missing, check unlock status only
        return unlockedChapters.includes(chapter.id);
      }

      // Chapters 1-7 are always free (Requirement 3.1)
      if (chapter.chapter_number <= 7) {
        return true;
      }

      // Check if user has unlocked this chapter (Requirement 3.4, 3.5)
      return unlockedChapters.includes(chapter.id);
    } catch (error) {
      console.error('[Chapter Unlock Check Error] Unexpected error:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        chapterId: chapter?.id,
        timestamp: new Date().toISOString()
      });
      // Default to locked on error for security
      return false;
    }
  };

  const hasActiveTimer = (chapterId: string) => {
    return chapterTimers[chapterId] !== undefined;
  };

  if (loading) {
    return <LoadingState message="Loading novel details..." />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadNovelData} title="Failed to load novel" />;
  }

  if (!novel) {
    return <ErrorState error="Novel not found" onRetry={loadNovelData} title="Novel Not Found" />;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => showMenu && setShowMenu(false)}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          {/* Banner with gradient overlay */}
          <View style={styles.bannerContainer}>
            <ImageBackground source={{ uri: novel.banner }} style={styles.banner}>
              <LinearGradient
                colors={['transparent', isDarkMode ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', theme.background]}
                style={styles.bannerGradient}
              />
              {/* Back button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={20} color={theme.text} />
              </TouchableOpacity>

              {/* Menu button */}
              <View style={styles.menuContainer}>
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => setShowMenu(!showMenu)}
                >
                  <Feather name="more-vertical" size={20} color={theme.text} />
                </TouchableOpacity>

                {/* Menu dropdown */}
                {showMenu && (
                  <View style={styles.menuDropdown}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setShowMenu(false);
                        if (novel?.author_id) {
                          (navigation.navigate as any)('OtherUserProfile', { userId: novel.author_id });
                        } else {
                          showToast('error', 'Author information not available');
                        }
                      }}
                    >
                      <Feather name="user" size={18} color={theme.text} />
                      <Text style={styles.menuItemText}>View Author</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.menuItem, styles.menuItemDanger]}
                      onPress={() => {
                        setShowMenu(false);
                        (navigation.navigate as any)('Report', { type: 'novel', id: novel.id });
                      }}
                    >
                      <Feather name="flag" size={18} color="#dc2626" />
                      <Text style={styles.menuItemTextDanger}>Report</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ImageBackground>
          </View>

          {/* Novel info section */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Image source={{ uri: novel.cover }} style={styles.coverImage} />
              <View style={styles.infoContent}>
                <Text style={styles.title}>{novel.title}</Text>
                <Text style={styles.author}>
                  by{' '}
                  <Text style={styles.authorLink} onPress={() => { }}>
                    {novel.author}
                  </Text>
                </Text>
                <View style={styles.genresContainer}>
                  {/* Status Tag - Always first with distinct style */}
                  {/* Status Tag - Standardized Emerald Green */}
                  <View style={[styles.genreTag, {
                    backgroundColor: colors.emerald50,
                    borderColor: colors.emerald100
                  }]}>
                    <Text style={[styles.genreText, {
                      color: colors.emerald700,
                      fontWeight: '700'
                    }]}>
                      {novel.status}
                    </Text>
                  </View>

                  {novel.genres.map((genre: string, index: number) => {
                    // Predefined colors for common genres to ensure distinctness and consistency
                    const genreColors: Record<string, { bg: string, text: string }> = {
                      'Action': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' }, // red
                      'Adventure': { bg: 'rgba(34, 197, 94, 0.1)', text: '#22c55e' }, // green
                      'Romance': { bg: 'rgba(236, 72, 153, 0.1)', text: '#ec4899' }, // pink
                      'Fantasy': { bg: 'rgba(168, 85, 247, 0.1)', text: '#a855f7' }, // purple
                      'Comedy': { bg: 'rgba(234, 179, 8, 0.1)', text: '#eab308' }, // yellow
                      'Drama': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' }, // blue
                      'Mystery': { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' }, // gray
                      'Horror': { bg: 'rgba(185, 28, 28, 0.1)', text: '#b91c1c' }, // dark red
                      'Sci-Fi': { bg: 'rgba(6, 182, 212, 0.1)', text: '#06b6d4' }, // cyan
                      'Slice of Life': { bg: 'rgba(20, 184, 166, 0.1)', text: '#14b8a6' }, // teal
                      'System': { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1' }, // indigo
                      'Martial Arts': { bg: 'rgba(249, 115, 22, 0.1)', text: '#f97316' }, // orange
                      'Magic': { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6' }, // violet
                      'Supernatural': { bg: 'rgba(75, 85, 99, 0.1)', text: '#4b5563' }, // slate
                      'Harem': { bg: 'rgba(244, 63, 94, 0.1)', text: '#f43f5e' }, // rose
                    };

                    // Fallback palette for unknown genres
                    const fallbackColors = [
                      { bg: 'rgba(99, 102, 241, 0.1)', text: '#6366f1' }, // indigo
                      { bg: 'rgba(20, 184, 166, 0.1)', text: '#14b8a6' }, // teal
                      { bg: 'rgba(244, 63, 94, 0.1)', text: '#f43f5e' }, // rose
                      { bg: 'rgba(217, 70, 239, 0.1)', text: '#d946ef' }, // fuchsia
                      { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' }, // amber
                    ];

                    let colorStyle = genreColors[genre];

                    if (!colorStyle) {
                      const charSum = genre.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                      const colorIndex = charSum % fallbackColors.length;
                      colorStyle = fallbackColors[colorIndex];
                    }

                    return (
                      <View
                        key={index}
                        style={[styles.genreTag, { backgroundColor: colorStyle.bg, borderColor: colorStyle.bg }]}
                      >
                        <Text style={[styles.genreText, { color: colorStyle.text }]}>
                          {genre}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
              <TouchableOpacity style={styles.shareButton}>
                <Feather name="share-2" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{novel.rating}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{novel.views}</Text>
                <Text style={styles.statLabel}>Views</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{novel.votes}</Text>
                <Text style={styles.statLabel}>Votes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{novel.chapters}</Text>
                <Text style={styles.statLabel}>Chapters</Text>
              </View>
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.readButton} onPress={handleRead}>
                <Text style={styles.readButtonText}>Read</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.libraryButton, isInLibrary && styles.libraryButtonActive]}
                onPress={toggleLibrary}
              >
                <Text
                  style={[
                    styles.libraryButtonText,
                    isInLibrary && styles.libraryButtonTextActive,
                  ]}
                >
                  {isInLibrary ? '✓ In Library' : '+ Library'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.voteButton, hasVoted && styles.voteButtonActive]}
                onPress={toggleVote}
              >
                <Feather
                  name="thumbs-up"
                  size={16}
                  color={hasVoted ? colors.white : colors.slate700}
                />
                <Text
                  style={[styles.voteButtonText, hasVoted && styles.voteButtonTextActive]}
                >
                  Vote
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'about' && styles.tabActive]}
                onPress={() => setActiveTab('about')}
              >
                <Text
                  style={[styles.tabText, activeTab === 'about' && styles.tabTextActive]}
                >
                  About
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'chapters' && styles.tabActive]}
                onPress={() => setActiveTab('chapters')}
              >
                <Text
                  style={[styles.tabText, activeTab === 'chapters' && styles.tabTextActive]}
                >
                  Chapters
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
                onPress={() => setActiveTab('reviews')}
              >
                <Text
                  style={[styles.tabText, activeTab === 'reviews' && styles.tabTextActive]}
                >
                  Reviews
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab content - About */}
            {activeTab === 'about' && (
              <View style={styles.tabContent}>
                <Text style={styles.description}>{novel.description}</Text>

                <View style={styles.tagsContainer}>
                  {novel.tags.map((tag: string, index: number) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                {/* Top Reviews - Only show if there are reviews */}
                {reviews.length > 0 && (
                  <View style={styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Top Reviews</Text>
                      <TouchableOpacity onPress={() => setActiveTab('reviews')}>
                        <Text style={styles.seeAllText}>See all</Text>
                      </TouchableOpacity>
                    </View>
                    {reviews.slice(0, 3).map((review, index) => (
                      <View
                        key={index}
                        style={[
                          styles.topReviewItem,
                          index < 2 && styles.topReviewItemBorder,
                        ]}
                      >
                        <Image
                          source={{ uri: review.userAvatar }}
                          style={styles.topReviewAvatar}
                        />
                        <View style={styles.topReviewContent}>
                          <View style={styles.topReviewHeader}>
                            <Text style={styles.topReviewName}>{review.userName}</Text>
                            <RatingStars rating={review.rating} size={12} />
                            <Text style={styles.topReviewTime}>{review.timeAgo}</Text>
                          </View>
                          <Text style={styles.topReviewText} numberOfLines={2}>
                            {review.text}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Related Novels */}
                {/* Related Novels */}
                {/* Related Novels */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>Related Novels</Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {relatedNovels.map((relatedNovel) => (
                      <TouchableOpacity
                        key={relatedNovel.id}
                        activeOpacity={0.7}
                        onPress={() => (navigation as any).push('NovelDetail', { novelId: relatedNovel.id })}
                        style={{ width: '30%', marginBottom: 16 }}
                      >
                        <View style={{
                          width: '100%',
                          borderRadius: 8,
                          overflow: 'hidden',
                          position: 'relative',
                          aspectRatio: 2 / 3,
                          backgroundColor: theme.card
                        }}>
                          <Image
                            source={{ uri: relatedNovel.cover }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                          <View style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 2
                          }}>
                            <Feather name="star" size={10} color="#fbbf24" fill="#fbbf24" />
                            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                              {relatedNovel.rating}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={{
                            marginTop: 8,
                            color: theme.text,
                            fontWeight: '600',
                            fontSize: 13,
                            lineHeight: 18
                          }}
                          numberOfLines={2}
                        >
                          {relatedNovel.title}
                        </Text>
                        <Text
                          style={{
                            marginTop: 2,
                            color: theme.textSecondary,
                            fontSize: 11
                          }}
                          numberOfLines={1}
                        >
                          {relatedNovel.genre}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Tab content - Chapters */}
            {activeTab === 'chapters' && (
              <View style={styles.tabContent}>
                <View style={styles.chapterControls}>
                  <View style={styles.chapterSearchContainer}>
                    <Feather
                      name="search"
                      size={16}
                      color={theme.textSecondary}
                      style={styles.chapterSearchIcon}
                    />
                    <TextInput
                      style={styles.chapterSearchInput}
                      placeholder="Search chapters..."
                      value={chapterSearch}
                      onChangeText={setChapterSearch}
                    />
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.sortButton,
                      chapterSort === 'newest' && styles.sortButtonActive,
                    ]}
                    onPress={() => setChapterSort('newest')}
                  >
                    <Text
                      style={[
                        styles.sortButtonText,
                        chapterSort === 'newest' && styles.sortButtonTextActive,
                      ]}
                    >
                      Newest
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sortButton,
                      chapterSort === 'oldest' && styles.sortButtonActive,
                    ]}
                    onPress={() => setChapterSort('oldest')}
                  >
                    <Text
                      style={[
                        styles.sortButtonText,
                        chapterSort === 'oldest' && styles.sortButtonTextActive,
                      ]}
                    >
                      Oldest
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Empty state for chapters */}
                {chapters.length === 0 ? (
                  <View style={styles.inlineEmptyState}>
                    <Feather name="book" size={48} color={theme.textSecondary} />
                    <Text style={styles.inlineEmptyTitle}>No chapters published yet</Text>
                    <Text style={styles.inlineEmptyDescription}>
                      This novel doesn't have any chapters yet. Check back later!
                    </Text>
                  </View>
                ) : (
                  <View style={styles.chaptersList}>
                    {getSortedChapters().map((chapter) => {
                      const unlocked = isChapterUnlocked(chapter);
                      const hasTimer = hasActiveTimer(chapter.id);
                      const timerText = timerDisplay[chapter.id];

                      // Determine if chapter should show lock based on chapter_number
                      const shouldShowLock = chapter.chapter_number > 7 && !unlocked && !hasTimer;

                      return (
                        <TouchableOpacity
                          key={chapter.id}
                          style={[
                            styles.chapterItem,
                            shouldShowLock && styles.chapterItemLocked,
                          ]}
                          onPress={() => handleChapterPress(chapter)}
                        >
                          <View style={styles.chapterNumber}>
                            <Text style={styles.chapterNumberText}>{chapter.chapter_number}</Text>
                          </View>
                          <View style={styles.chapterInfo}>
                            <Text style={styles.chapterTitle}>{chapter.title}</Text>
                            <Text style={styles.chapterMeta}>
                              {chapter.views} views · {chapter.date}
                            </Text>
                          </View>
                          {hasTimer ? (
                            <Animated.View style={{ opacity: pulseAnim }}>
                              <LinearGradient
                                colors={['#0ea5e9', '#3b82f6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.timerBadge}
                              >
                                <Feather name="clock" size={12} color={colors.white} />
                                <Text style={styles.timerBadgeText}>{timerText}</Text>
                              </LinearGradient>
                            </Animated.View>
                          ) : unlocked ? (
                            <Feather
                              name="chevron-right"
                              size={16}
                              color={theme.textSecondary}
                            />
                          ) : shouldShowLock ? (
                            <View style={styles.lockIconContainer}>
                              <Feather
                                name="lock"
                                size={16}
                                color="#64748b"
                              />
                            </View>
                          ) : (
                            <Feather
                              name="chevron-right"
                              size={16}
                              color={theme.textSecondary}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Tab content - Reviews */}
            {activeTab === 'reviews' && (
              <View style={styles.tabContent}>
                {/* Rating overview */}
                <View style={styles.ratingOverview}>
                  <View style={styles.ratingLeft}>
                    <Text style={styles.overallRating}>{novel.rating}</Text>
                    <RatingStars rating={novel.rating} size={16} />
                    <Text style={styles.totalRatings}>{totalRatings.toLocaleString()} ratings</Text>
                  </View>
                  <View style={styles.ratingBars}>
                    {[5, 4, 3, 2, 1].map((star) => (
                      <View key={star} style={styles.ratingBarRow}>
                        <Text style={styles.ratingBarLabel}>{star}★</Text>
                        <View style={styles.ratingBarTrack}>
                          <View
                            style={[
                              styles.ratingBarFill,
                              { width: `${ratingStats[star as keyof typeof ratingStats]}%` },
                              star === 5 && { backgroundColor: '#10b981' },
                              star === 4 && { backgroundColor: '#34d399' },
                              star === 3 && { backgroundColor: '#fbbf24' },
                              star === 2 && { backgroundColor: '#fb923c' },
                              star === 1 && { backgroundColor: '#ef4444' },
                            ]}
                          />
                        </View>
                        <Text style={styles.ratingBarPercent}>
                          {ratingStats[star as keyof typeof ratingStats]}%
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Rating filters */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.reviewFilters}
                  contentContainerStyle={styles.reviewFiltersContent}
                >
                  {['all', 5, 4, 3, 2, 1].map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.reviewFilter,
                        reviewFilter === filter && styles.reviewFilterActive,
                      ]}
                      onPress={() => setReviewFilter(filter as 'all' | number)}
                    >
                      <Text
                        style={[
                          styles.reviewFilterText,
                          reviewFilter === filter && styles.reviewFilterTextActive,
                        ]}
                      >
                        {filter === 'all' ? 'All' : `${filter}★`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Write review */}
                {!userReview && !isEditingReview && currentUserId && (
                  <View style={styles.writeReviewCard}>
                    <View style={styles.writeReviewHeader}>
                      <Image
                        source={{ uri: getUserProfileImage(currentUserProfile) }}
                        style={styles.writeReviewAvatar}
                      />
                      <Text style={styles.writeReviewTitle}>Write a review</Text>
                    </View>
                    <View style={styles.ratingStarsInput}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          style={styles.starButton}
                          onPress={() => setSelectedRating(star)}
                        >
                          <FontAwesome
                            name={star <= selectedRating ? "star" : "star-o"}
                            size={20}
                            color="#fbbf24"
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={styles.reviewTextInput}
                      placeholder="Share your thoughts..."
                      value={reviewText}
                      onChangeText={setReviewText}
                      multiline
                      numberOfLines={3}
                    />
                    <View style={styles.reviewInputFooter}>
                      <Text style={styles.reviewInputHint}>
                        Be respectful and constructive.
                      </Text>
                      <TouchableOpacity
                        style={styles.postReviewButton}
                        onPress={handlePostReview}
                      >
                        <Text style={styles.postReviewButtonText}>Post</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}



                {/* Edit review */}
                {isEditingReview && (() => {
                  const ownReview = reviews.find(r => r.isCurrentUser);
                  return (
                    <View style={styles.editReviewCard}>
                      <Image
                        source={{ uri: ownReview?.userAvatar || getUserProfileImage(currentUserProfile) }}
                        style={styles.userReviewAvatar}
                      />
                      <View style={styles.editReviewContent}>
                        <Text style={styles.editReviewTitle}>Edit your review</Text>
                        <View style={styles.ratingStarsInput}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                              key={star}
                              style={styles.starButton}
                              onPress={() => setSelectedRating(star)}
                            >
                              <FontAwesome
                                name={star <= selectedRating ? "star" : "star-o"}
                                size={20}
                                color="#fbbf24"
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TextInput
                          style={styles.reviewTextInput}
                          placeholder="Share your thoughts..."
                          value={reviewText}
                          onChangeText={setReviewText}
                          multiline
                          numberOfLines={3}
                        />
                        <View style={styles.editReviewActions}>
                          <TouchableOpacity
                            style={styles.cancelEditButton}
                            onPress={() => {
                              setIsEditingReview(false);
                              setReviewText('');
                              setSelectedRating(0);
                            }}
                          >
                            <Text style={styles.cancelEditButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.saveEditButton}
                            onPress={handleSaveEdit}
                          >
                            <Text style={styles.saveEditButtonText}>Save</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })()}

                {/* Reviews list */}
                {reviews.length === 0 ? (
                  <View style={styles.inlineEmptyState}>
                    <Feather name="message-circle" size={48} color={theme.textSecondary} />
                    <Text style={styles.inlineEmptyTitle}>No reviews yet</Text>
                    <Text style={styles.inlineEmptyDescription}>
                      Be the first to review this novel!
                    </Text>
                  </View>
                ) : (
                  <View style={styles.reviewsList}>
                    {getFilteredReviews().map((review, index) => (
                      <View key={review.id} style={[styles.reviewItemWrapper, openReviewMenu === review.id && { zIndex: 1000 }]}>
                        <View style={styles.reviewItem}>
                          <Image source={{ uri: review.userAvatar }} style={styles.reviewAvatar} />
                          <View style={styles.reviewContent}>
                            <View style={styles.reviewHeader}>
                              <View style={styles.reviewHeaderLeft}>
                                <View style={styles.reviewNameContainer}>
                                  <Text style={styles.reviewName}>{review.userName}</Text>
                                  {review.isCurrentUser && (
                                    <View style={styles.youBadge}>
                                      <Text style={styles.youBadgeText}>You</Text>
                                    </View>
                                  )}
                                </View>
                                <RatingStars rating={review.rating} size={14} />
                                <Text style={styles.reviewTime}>{review.timeAgo}</Text>
                              </View>
                              <TouchableOpacity
                                ref={(ref) => {
                                  menuButtonRefs.current[review.id] = ref;
                                }}
                                style={styles.reviewMenuButton}
                                onPress={() => {
                                  if (openReviewMenu === review.id) {
                                    setOpenReviewMenu(null);
                                    setMenuPosition(null);
                                  } else {
                                    const buttonRef = menuButtonRefs.current[review.id];
                                    if (buttonRef && buttonRef.measureInWindow) {
                                      buttonRef.measureInWindow((x: number, y: number, width: number, height: number) => {
                                        setMenuPosition({ x: x + width, y: y + height + 4 });
                                        setOpenReviewMenu(review.id);
                                      });
                                    } else {
                                      // Fallback positioning
                                      setMenuPosition({ x: 300, y: 200 + (index * 100) }); // Approximate position based on index
                                      setOpenReviewMenu(review.id);
                                    }
                                  }
                                }}
                              >
                                <Feather name="more-vertical" size={16} color={theme.text} />
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.reviewText}>{review.text}</Text>
                            <View style={styles.reviewActions}>
                              <TouchableOpacity
                                style={styles.reviewActionButton}
                                onPress={() => toggleReviewLike(review.id)}
                              >
                                <Feather
                                  name="thumbs-up"
                                  size={16}
                                  color={review.isLiked ? colors.sky500 : colors.slate500}
                                />
                                <Text
                                  style={[
                                    styles.reviewActionText,
                                    review.isLiked && styles.reviewActionTextActive,
                                  ]}
                                >
                                  {review.likes}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.reviewActionButton}
                                onPress={() => toggleReviewDislike(review.id)}
                              >
                                <Feather
                                  name="thumbs-down"
                                  size={16}
                                  color={review.isDisliked ? '#ef4444' : colors.slate500}
                                />
                                <Text
                                  style={[
                                    styles.reviewActionText,
                                    review.isDisliked && { color: '#ef4444' },
                                  ]}
                                >
                                  {review.dislikes}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </TouchableOpacity>

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
                left: Math.max(10, (menuPosition?.x || 300) - 120), // Position to the left of button, with min margin
              },
            ]}
          >
            {/* Show Edit/Delete for user's own review, Report for others */}
            {(() => {
              const selectedReview = reviews.find(r => r.id === openReviewMenu);
              const isOwnReview = selectedReview?.isCurrentUser;

              if (isOwnReview) {
                return (
                  <>
                    <TouchableOpacity
                      style={styles.reviewMenuItem}
                      onPress={() => {
                        setOpenReviewMenu(null);
                        setMenuPosition(null);
                        handleEditReview();
                      }}
                    >
                      <Feather name="edit-2" size={14} color={theme.text} />
                      <Text style={[styles.reviewMenuItemText, { color: theme.textSecondary, }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.reviewMenuItem}
                      onPress={() => {
                        setOpenReviewMenu(null);
                        setMenuPosition(null);
                        handleDeleteReview();
                      }}
                    >
                      <Feather name="trash-2" size={14} color="#ef4444" />
                      <Text style={[styles.reviewMenuItemText, { color: '#ef4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  </>
                );
              } else {
                return (
                  <TouchableOpacity
                    style={styles.reviewMenuItem}
                    onPress={() => {
                      setOpenReviewMenu(null);
                      setMenuPosition(null);
                      alert('Report functionality would go here');
                    }}
                  >
                    <Feather name="flag" size={14} color="#ef4444" />
                    <Text style={styles.reviewMenuItemText}>Report</Text>
                  </TouchableOpacity>
                );
              }
            })()}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Unlock Chapter Dialog */}
      <Modal
        visible={showUnlockDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnlockDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.unlockDialog}>
            <View style={styles.unlockDialogHeader}>
              <Text style={styles.unlockDialogTitle}>Unlock Chapter</Text>
              <TouchableOpacity onPress={() => setShowUnlockDialog(false)}>
                <Feather name="x" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Check if this chapter has an active timer */}
            {unlockChapter && chapterTimers[unlockChapter.id] ? (
              // Show timer section
              <View style={styles.timerSection}>
                <View style={styles.timerSectionContent}>
                  <Text style={styles.timerSectionTitle}>⏳ Unlocking in Progress</Text>
                  <Text style={styles.timerSectionDisplay}>
                    {fullTimerDisplay[unlockChapter.id] || '--:--:--'}
                  </Text>
                  <Text style={styles.timerSectionText}>
                    This chapter will automatically unlock when the timer reaches zero. You can close this dialog and continue reading other chapters.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.gotItButton}
                  onPress={() => setShowUnlockDialog(false)}
                >
                  <Text style={styles.gotItButtonText}>Got It</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Show unlock options
              <>
                <View style={styles.unlockDialogContent}>
                  <Feather name="lock" size={48} color={theme.textSecondary} style={styles.unlockIcon} />
                  <Text style={styles.unlockChapterText}>
                    Chapter {unlockChapter?.chapter_number} is locked
                  </Text>
                  <Text style={styles.unlockSubtext}>
                    Choose an option below to unlock this chapter
                  </Text>
                </View>

                <View style={styles.unlockOptions}>
                  <TouchableOpacity
                    style={styles.watchAdButton}
                    onPress={() => {
                      if (unlockChapter) {
                        unlockChapterNow(unlockChapter.id);
                        alert('Chapter unlocked! You can now read it.');
                      }
                    }}
                  >
                    <Feather name="play-circle" size={20} color={colors.white} />
                    <Text style={styles.watchAdButtonText}>Watch Ad → Unlock Now</Text>
                  </TouchableOpacity>

                  <View style={styles.orDivider}>
                    <View style={styles.orLine} />
                    <Text style={styles.orText}>or</Text>
                    <View style={styles.orLine} />
                  </View>

                  <TouchableOpacity
                    style={styles.waitButton}
                    onPress={() => {
                      if (unlockChapter) {
                        startChapterTimer(unlockChapter.id, unlockChapter.waitHours || 3);
                      }
                    }}
                  >
                    <View style={styles.waitButtonContent}>
                      <Feather name="clock" size={20} color={colors.white} />
                      <Text style={styles.waitButtonText}>
                        Start {unlockChapter?.waitHours} Hours Timer
                      </Text>
                    </View>
                    <Text style={styles.waitButtonSubtext}>
                      Chapter unlocks automatically after timer ends
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowUnlockDialog(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default NovelDetailScreen;

const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  bannerContainer: {
    height: 256,
    position: 'relative',
  },
  banner: {
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
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: theme.card,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 100,
  },
  menuButton: {
    padding: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: theme.card,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuDropdown: {
    position: 'absolute',
    top: 48,
    right: 0,
    backgroundColor: theme.card,
    borderRadius: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
    minWidth: 180,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    zIndex: 50,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemDanger: {
    backgroundColor: theme.card,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text, // Use theme text color
  },
  menuItemTextDanger: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: '#dc2626',
  },
  infoSection: {
    paddingHorizontal: spacing[4],
    marginTop: -80,
    position: 'relative',
    zIndex: 10,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  coverImage: {
    width: 80,
    height: 112,
    borderRadius: borderRadius.xl,
    borderWidth: 4,
    borderColor: theme.card, // Match card background or remove border in dark mode
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  infoContent: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
    letterSpacing: -0.5,
  },
  author: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    marginTop: 4,
  },
  authorLink: {
    textDecorationLine: 'underline',
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1.5],
    marginTop: spacing[2],
  },
  genreTag: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  genreText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing[2.5],
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  statLabel: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  readButton: {
    flex: 1,
    borderRadius: borderRadius.xl,
    backgroundColor: theme.primary,
    paddingVertical: spacing[2.5],
    alignItems: 'center',
    shadowColor: colors.sky500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  readButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  libraryButton: {
    flex: 1,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
    paddingVertical: spacing[2.5],
    alignItems: 'center',
  },
  libraryButtonActive: {
    backgroundColor: theme.primary,
    borderColor: colors.sky500,
  },
  libraryButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  libraryButtonTextActive: {
    color: colors.white,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  voteButtonActive: {
    backgroundColor: theme.primary,
    borderColor: colors.sky500,
  },
  voteButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  voteButtonTextActive: {
    color: colors.white,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[6],
  },
  tab: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tabActive: {
    backgroundColor: theme.primary,
    borderColor: colors.sky500,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    color: theme.text,
  },
  tabTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  tabContent: {
    marginTop: spacing[4],
    gap: spacing[4],
    paddingBottom: spacing[24],
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: theme.text,
    lineHeight: 20,
    marginBottom: spacing[3],
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
    backgroundColor: theme.border,
  },
  tagText: {
    fontSize: typography.fontSize.xs,
    color: theme.text,
  },
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing[4],
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    backgroundColor: theme.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  cardTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  seeAllText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.primary,
  },
  topReviewItem: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingBottom: spacing[3],
  },
  topReviewItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    marginBottom: spacing[3],
  },
  topReviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  topReviewContent: {
    flex: 1,
  },
  topReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  topReviewName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  topReviewTime: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  topReviewText: {
    fontSize: typography.fontSize.xs,
    color: theme.text,
    marginTop: spacing[1],
    lineHeight: 16,
  },
  relatedNovelItem: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  relatedNovelCover: {
    width: 48,
    height: 64,
    borderRadius: borderRadius.lg,
  },
  relatedNovelInfo: {
    flex: 1,
  },
  relatedNovelTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  relatedNovelGenre: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 2,
  },
  relatedNovelRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  relatedNovelRatingText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  chapterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  chapterSearchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    height: 40, // Fixed height
    backgroundColor: theme.card,
  },
  chapterSearchIcon: {
    marginRight: spacing[2],
  },
  chapterSearchInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: theme.text,
    height: '100%',
    paddingVertical: 0,
  },
  sortButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sortButtonActive: {
    backgroundColor: theme.primary,
    borderColor: colors.sky500,
  },
  sortButtonText: {
    fontSize: typography.fontSize.xs,
    color: theme.text,
  },
  sortButtonTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  chaptersList: {
    gap: spacing[2],
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  chapterItemLocked: {
    opacity: 0.6,
  },
  chapterNumber: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.sky50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterNumberText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.primary,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  chapterMeta: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  lockIconContainer: {
    padding: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  ratingOverview: {
    flexDirection: 'row',
    gap: spacing[4],
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing[4],
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    backgroundColor: theme.card,
  },
  ratingLeft: {
    alignItems: 'center',
  },
  overallRating: {
    fontSize: 32,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
    lineHeight: 32,
  },
  totalRatings: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: spacing[1],
  },
  ratingBars: {
    flex: 1,
    gap: spacing[1.5],
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  ratingBarLabel: {
    width: 24,
    fontSize: 11,
    color: theme.textSecondary,
  },
  ratingBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: theme.border,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  ratingBarPercent: {
    width: 40,
    textAlign: 'right',
    fontSize: 11,
    color: theme.textSecondary,
  },
  reviewFilters: {
    marginBottom: spacing[4],
  },
  reviewFiltersContent: {
    gap: spacing[2],
  },
  reviewFilter: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: theme.border,
  },
  reviewFilterActive: {
    backgroundColor: theme.primary,
    borderColor: colors.sky500,
  },
  reviewFilterText: {
    fontSize: typography.fontSize.xs,
    color: theme.text,
  },
  reviewFilterTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  writeReviewCard: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing[4],
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    backgroundColor: theme.card,
  },
  writeReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  writeReviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  writeReviewTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  ratingStarsInput: {
    flexDirection: 'row',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  starButton: {
    padding: spacing[1],
    borderRadius: borderRadius.md,
  },
  reviewTextInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.fontSize.sm,
    color: theme.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reviewInputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  reviewInputHint: {
    fontSize: 11,
    color: theme.textSecondary,
  },
  postReviewButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.lg,
    backgroundColor: theme.primary,
    shadowColor: colors.sky500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  postReviewButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  userReviewSection: {
    marginBottom: spacing[4],
  },
  userReviewLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
    marginBottom: spacing[2],
  },
  userReviewCard: {
    flexDirection: 'row',
    gap: spacing[3],
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    borderColor: isDarkMode ? 'rgba(14, 165, 233, 0.2)' : '#e0f2fe',
    padding: spacing[4],
    backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.05)' : colors.sky50,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userReviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.primary,
  },
  userReviewContent: {
    flex: 1,
  },
  userReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userReviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  userReviewName: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    color: theme.text,
  },
  userReviewTime: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  userReviewActions: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  userReviewAction: {
    padding: spacing[1],
    borderRadius: borderRadius.md,
  },
  userReviewText: {
    fontSize: typography.fontSize.xs,
    color: theme.text,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing[1],
  },
  editReviewCard: {
    flexDirection: 'row',
    gap: spacing[3],
    borderRadius: borderRadius['2xl'],
    borderWidth: 2,
    borderColor: theme.primary,
    padding: spacing[4],
    backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : 'rgba(240, 249, 255, 0.8)',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  editReviewContent: {
    flex: 1,
  },
  editReviewTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.primary,
    marginBottom: spacing[2],
  },
  editReviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  cancelEditButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelEditButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  saveEditButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.lg,
    backgroundColor: theme.primary,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveEditButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  reviewsList: {
    gap: spacing[3],
  },
  reviewItemWrapper: {
  },
  reviewItem: {
    flexDirection: 'row',
    gap: spacing[3],
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing[3],
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    backgroundColor: theme.card,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewContent: {
    flex: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  reviewNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  reviewName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  youBadge: {
    paddingHorizontal: spacing[1.5],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: theme.primaryLight,
  },
  youBadgeText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.semibold,
    color: theme.primary,
    textTransform: 'uppercase',
  },
  reviewTime: {
    fontSize: 10,
    color: theme.textSecondary,
  },
  reviewMenuButton: {
    padding: spacing[1],
    borderRadius: borderRadius.md,
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
  reviewMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.card,
  },
  reviewMenuItemText: {
    fontSize: typography.fontSize.xs,
    color: theme.error,
    fontWeight: typography.fontWeight.medium,
  },
  reviewText: {
    fontSize: typography.fontSize.xs,
    color: theme.text,
    marginTop: spacing[1],
  },
  reviewActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  reviewActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  reviewActionText: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
  },
  reviewActionTextActive: {
    color: theme.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  unlockDialog: {
    backgroundColor: theme.card,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    width: '100%',
    maxWidth: 340,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  unlockDialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  unlockDialogTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: theme.text,
  },
  unlockDialogContent: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  unlockIcon: {
    marginBottom: spacing[2],
  },
  unlockChapterText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
    marginBottom: spacing[1],
  },
  unlockSubtext: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  unlockOptions: {
    gap: spacing[3],
  },
  watchAdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.emerald500,
    shadowColor: colors.emerald500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  watchAdButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  orText: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
  },
  waitButton: {
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    backgroundColor: theme.primary,
    shadowColor: colors.sky500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  waitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  waitButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  waitButtonSubtext: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  timerSection: {
    gap: spacing[4],
  },
  timerSectionContent: {
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: isDarkMode ? 'rgba(14, 165, 233, 0.2)' : '#e0f2fe',
    padding: spacing[4],
    backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.05)' : '#f0f9ff',
    marginBottom: spacing[2],
  },
  timerSectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.primary,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  timerSectionDisplay: {
    fontSize: 28,
    fontWeight: typography.fontWeight.bold,
    color: theme.primary,
    textAlign: 'center',
    marginVertical: spacing[2],
  },
  timerSectionText: {
    fontSize: typography.fontSize.xs,
    color: theme.text,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  gotItButton: {
    paddingVertical: spacing[2],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  gotItButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: spacing[2],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
    textAlign: 'center',
  },
  inlineEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[6],
  },
  inlineEmptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
    marginTop: spacing[4],
    textAlign: 'center',
  },
  inlineEmptyDescription: {
    fontSize: typography.fontSize.sm,
    color: theme.textSecondary,
    marginTop: spacing[2],
    textAlign: 'center',
    lineHeight: 20,
  },
});
