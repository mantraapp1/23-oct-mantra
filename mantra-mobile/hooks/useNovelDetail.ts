import { useState, useRef, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import novelService from '../services/novelService';
import reviewService from '../services/reviewService';
import readingService from '../services/readingService';
import authService from '../services/authService';
import { formatTimeAgo, formatNumber, parseFormattedNumber } from '../utils/dateUtils';
import { formatUserProfile, getUserProfileImage, getUserDisplayName } from '../utils/profileUtils';
import { useSafeState, useCancellableRequest } from './useAsyncHelpers';
import type { Profile } from '../types/database';

// Types
export interface Chapter {
    id: string;
    chapter_number: number;
    title: string;
    views: string;
    date: string;
    isLocked: boolean;
    waitHours?: number;
}

export interface Review {
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

export interface RelatedNovel {
    id: string;
    title: string;
    cover: string;
    genre: string;
    rating: number;
}

export interface NovelData {
    id: string;
    title: string;
    author: string;
    author_id: string;
    cover: string;
    banner: string;
    rating: number;
    views: string;
    votes: string;
    chapters: number;
    genres: string[];
    status: string;
    description: string;
    tags: string[];
}

export interface UseNovelDetailResult {
    // Data
    novel: NovelData | null;
    chapters: Chapter[];
    reviews: Review[];
    relatedNovels: RelatedNovel[];
    ratingStats: Record<number, number>;
    totalRatings: number;

    // User state
    currentUserId: string | null;
    currentUserProfile: any;
    isInLibrary: boolean;
    hasVoted: boolean;
    userReview: Review | null;
    unlockedChapters: string[];

    // Loading states
    loading: boolean;
    refreshing: boolean;
    error: string | null;

    // Actions
    loadNovelData: (isSilent?: boolean) => Promise<void>;
    onRefresh: () => Promise<void>;
    toggleLibrary: () => Promise<void>;
    toggleVote: () => Promise<void>;
    setIsInLibrary: (value: boolean) => void;
    setHasVoted: (value: boolean) => void;
    setUserReview: (value: Review | null) => void;
    setNovel: (value: NovelData | null) => void;
    setReviews: (value: Review[] | ((prev: Review[]) => Review[])) => void;
}

/**
 * Custom hook for NovelDetailScreen data management
 * Extracts all data fetching and state logic from the screen component
 */
export const useNovelDetail = (
    novelId: string | undefined,
    showToast: (type: 'success' | 'error', message: string) => void
): UseNovelDetailResult => {
    // State
    const [novel, setNovel] = useSafeState<NovelData | null>(null);
    const [chapters, setChapters] = useSafeState<Chapter[]>([]);
    const [reviews, setReviews] = useSafeState<Review[]>([]);
    const [relatedNovels, setRelatedNovels] = useSafeState<RelatedNovel[]>([]);
    const [ratingStats, setRatingStats] = useSafeState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
    const [totalRatings, setTotalRatings] = useSafeState(0);

    const [currentUserId, setCurrentUserId] = useSafeState<string | null>(null);
    const [currentUserProfile, setCurrentUserProfile] = useSafeState<Profile | null>(null);
    const [isInLibrary, setIsInLibrary] = useSafeState(false);
    const [hasVoted, setHasVoted] = useSafeState(false);
    const [userReview, setUserReview] = useSafeState<Review | null>(null);
    const [unlockedChapters, setUnlockedChapters] = useSafeState<string[]>([]);

    const [loading, setLoading] = useSafeState(true);
    const [refreshing, setRefreshing] = useSafeState(false);
    const [error, setError] = useSafeState<string | null>(null);

    const { isMounted, cancel } = useCancellableRequest();

    // Load novel data
    const loadNovelData = useCallback(async (isSilent: boolean = false) => {
        if (!novelId) {
            setError('Novel ID not provided');
            setLoading(false);
            return;
        }

        if (!isSilent && !novel) {
            setLoading(true);
            setError(null);
        }

        const effectiveUserId = currentUserId;

        try {
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
            if (!isMounted()) return;

            // Transform novel data
            const transformedNovel: NovelData = {
                id: novelData.id,
                title: novelData.title || 'Untitled Novel',
                author: novelData.profiles?.display_name || novelData.profiles?.username || 'Unknown Author',
                author_id: novelData.author_id,
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

            // Load chapters
            const { data: chaptersData, error: chaptersError } = await supabase
                .from('chapters')
                .select('id, chapter_number, title, views, is_locked, wait_hours, published_at, updated_at')
                .eq('novel_id', novelId)
                .order('chapter_number', { ascending: true });

            if (chaptersError) throw chaptersError;
            if (!isMounted()) return;

            const transformedChapters = (chaptersData || []).map((chapter, index) => ({
                id: chapter.id || `unknown-${index}`,
                chapter_number: chapter.chapter_number ?? (index + 1),
                title: chapter.title || `Untitled Chapter ${chapter.chapter_number ?? (index + 1)}`,
                views: formatNumber(chapter.views || 0),
                date: formatTimeAgo(chapter.published_at || chapter.updated_at),
                isLocked: chapter.is_locked ?? false,
                waitHours: chapter.wait_hours ?? 0,
            }));

            setChapters(transformedChapters);

            // Load chapter unlock status
            if (effectiveUserId) {
                const { data: unlocks } = await supabase
                    .from('chapter_unlocks')
                    .select('chapter_id')
                    .eq('user_id', effectiveUserId)
                    .eq('novel_id', novelId)
                    .eq('is_expired', false);

                if (unlocks && isMounted()) {
                    setUnlockedChapters(unlocks.map(u => u.chapter_id));
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
            if (!isMounted()) return;

            // Batch fetch user reactions
            let userReactionsMap = new Map<string, 'like' | 'dislike'>();
            if (effectiveUserId && reviewsData?.length) {
                try {
                    userReactionsMap = await reviewService.getUserReactions(
                        effectiveUserId,
                        reviewsData.map(r => r.id)
                    );
                } catch (err) {
                    console.error('Error loading user reactions:', err);
                }
            }

            const transformedReviews = (reviewsData || []).map(review => {
                const isOwnReview = effectiveUserId ? review.user_id === effectiveUserId : false;
                const profileData = Array.isArray(review.profiles) ? review.profiles[0] : review.profiles;
                const reaction = userReactionsMap.get(review.id);

                return {
                    id: review.id,
                    user_id: review.user_id,
                    userName: getUserDisplayName(profileData),
                    userAvatar: getUserProfileImage(profileData),
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

            // Load related novels
            let foundRelated = false;
            if (novelData.genres?.length) {
                const { data: relatedData } = await supabase
                    .from('novels')
                    .select('*')
                    .contains('genres', [novelData.genres[0]])
                    .neq('id', novelId)
                    .limit(5);

                if (relatedData?.length && isMounted()) {
                    setRelatedNovels(relatedData.map(n => ({
                        id: n.id,
                        title: n.title,
                        cover: n.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=100&auto=format&fit=crop',
                        genre: n.genres?.[0] || 'Novel',
                        rating: n.average_rating || 0,
                    })));
                    foundRelated = true;
                }
            }

            if (!foundRelated && isMounted()) {
                const { data: fallbackData } = await supabase
                    .from('novels')
                    .select('*')
                    .neq('id', novelId)
                    .order('average_rating', { ascending: false })
                    .limit(5);

                if (fallbackData?.length) {
                    setRelatedNovels(fallbackData.map(n => ({
                        id: n.id,
                        title: n.title,
                        cover: n.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=100&auto=format&fit=crop',
                        genre: n.genres?.[0] || 'Novel',
                        rating: n.average_rating || 0,
                    })));
                }
            }

            // Calculate rating stats
            const stats: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
            let total = 0;
            reviewsData?.forEach(review => {
                const rating = Math.floor(review.rating);
                if (rating >= 1 && rating <= 5) {
                    stats[rating]++;
                    total++;
                }
            });
            if (isMounted()) {
                setRatingStats(stats);
                setTotalRatings(total);
            }

            // Increment views
            await novelService.incrementViews(novelId);

        } catch (err: any) {
            console.error('[useNovelDetail] Error loading novel data:', err);
            if (isMounted()) {
                let errorMessage = 'Failed to load novel data';
                if (err?.message?.includes('network')) {
                    errorMessage = 'Network error. Please check your connection.';
                } else if (err?.message?.includes('not found')) {
                    errorMessage = 'Novel not found.';
                } else if (err?.message) {
                    errorMessage = err.message;
                }
                setError(errorMessage);
            }
        } finally {
            if (isMounted()) {
                setLoading(false);
            }
        }
    }, [novelId, currentUserId, novel, isMounted, setNovel, setChapters, setReviews, setRelatedNovels, setRatingStats, setTotalRatings, setUnlockedChapters, setLoading, setError]);

    // Load user data
    const loadUserData = useCallback(async () => {
        if (!currentUserId || !novelId) return;

        try {
            const [voted, inLibrary] = await Promise.all([
                novelService.hasVoted(currentUserId, novelId).catch(() => false),
                readingService.isInLibrary(currentUserId, novelId).catch(() => false),
            ]);

            if (isMounted()) {
                setHasVoted(voted);
                setIsInLibrary(inLibrary);
            }

            // Load user's review
            try {
                const userReviewData = await reviewService.getUserReview(currentUserId, novelId);
                if (userReviewData && isMounted()) {
                    const profile = await authService.getCurrentProfile();
                    const formattedProfile = formatUserProfile(profile, currentUserId);

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
            } catch (err) {
                console.error('Error loading user review:', err);
            }
        } catch (err) {
            console.error('Error loading user data:', err);
        }
    }, [currentUserId, novelId, isMounted, setHasVoted, setIsInLibrary, setUserReview]);

    // Initialize on focus
    useFocusEffect(
        useCallback(() => {
            const initialize = async () => {
                const profile = await authService.getCurrentProfile();
                if (profile) {
                    setCurrentUserId(profile.id);
                    setCurrentUserProfile(profile);
                } else {
                    const user = await authService.getCurrentUser();
                    if (user) {
                        setCurrentUserId(user.id);
                        // Note: user is Auth user, not Profile - don't store in profile state
                        setCurrentUserProfile(null);
                    }
                }
                loadNovelData(false);
            };
            initialize();

            return () => {
                cancel();
            };
        }, [novelId])
    );

    // Load user data when user becomes available
    useEffect(() => {
        if (currentUserId && novelId) {
            loadUserData();
        }
    }, [currentUserId, novelId, loadUserData]);

    // Refresh handler
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadNovelData(true);
        setRefreshing(false);
    }, [loadNovelData, setRefreshing]);

    // Toggle library
    const toggleLibrary = useCallback(async () => {
        if (!currentUserId || !novelId) {
            showToast('error', 'Please log in to save novels');
            return;
        }

        // Capture current state BEFORE optimistic update
        const wasInLibrary = isInLibrary;

        // Optimistic update
        setIsInLibrary(prev => !prev);

        try {
            const result = wasInLibrary
                ? await readingService.removeFromLibrary(currentUserId, novelId)
                : await readingService.addToLibrary(currentUserId, novelId);

            if (result.success) {
                showToast('success', wasInLibrary ? 'Removed from library' : 'Added to library');
            } else {
                setIsInLibrary(wasInLibrary); // Revert to captured state
                showToast('error', result.message);
            }
        } catch (err) {
            setIsInLibrary(wasInLibrary); // Revert to captured state
            showToast('error', 'Failed to update library');
        }
    }, [currentUserId, novelId, isInLibrary, showToast, setIsInLibrary]);

    // Toggle vote
    const toggleVote = useCallback(async () => {
        if (!currentUserId || !novelId || !novel) {
            showToast('error', 'Please log in to vote');
            return;
        }

        // Capture current state BEFORE optimistic update
        const hadVoted = hasVoted;

        // Optimistic update
        setHasVoted(prev => !prev);
        setNovel(prev => {
            if (!prev) return prev;
            const currentVotes = parseFormattedNumber(prev.votes);
            const newCount = hadVoted ? Math.max(0, currentVotes - 1) : currentVotes + 1;
            return { ...prev, votes: formatNumber(newCount) };
        });

        try {
            const result = hadVoted
                ? await novelService.unvoteNovel(currentUserId, novelId)
                : await novelService.voteNovel(currentUserId, novelId);

            if (result.success) {
                showToast('success', hadVoted ? 'Vote removed' : 'Vote added');
                await loadNovelData(true);
            } else {
                await loadNovelData(true); // Revert with fresh data
                showToast('error', result.message || 'Failed to update vote');
            }
        } catch (err) {
            await loadNovelData(true); // Revert with fresh data
            showToast('error', 'Failed to update vote');
        }
    }, [currentUserId, novelId, novel, hasVoted, showToast, setHasVoted, setNovel, loadNovelData]);

    return {
        novel,
        chapters,
        reviews,
        relatedNovels,
        ratingStats,
        totalRatings,
        currentUserId,
        currentUserProfile,
        isInLibrary,
        hasVoted,
        userReview,
        unlockedChapters,
        loading,
        refreshing,
        error,
        loadNovelData,
        onRefresh,
        toggleLibrary,
        toggleVote,
        setIsInLibrary,
        setHasVoted,
        setUserReview,
        setNovel,
        setReviews,
    };
};
