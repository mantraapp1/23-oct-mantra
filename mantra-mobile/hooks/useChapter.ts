import { useState, useRef, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';
import chapterService from '../services/chapterService';
import commentService from '../services/commentService';
import { formatTimeAgo } from '../utils/dateUtils';
import { formatUserProfile, getUserProfileImage } from '../utils/profileUtils';
import { useSafeState, useCancellableRequest } from './useAsyncHelpers';

// Types
export interface Reply {
    id: string;
    userId: string;
    author: string;
    avatar: string;
    time: string;
    text: string;
}

export interface Comment {
    id: string;
    userId: string;
    author: string;
    avatar: string;
    badge?: string;
    time: string;
    text: string;
    likes: number;
    dislikes: number;
    userLiked: boolean;
    userDisliked: boolean;
    replies: Reply[];
    isCurrentUser?: boolean;
}

export interface ChapterData {
    id: string;
    number: number;
    title: string;
    content: string;
    views: number;
    novel?: {
        id: string;
        title: string;
        author_id: string;
    };
    is_locked: boolean;
}

export interface UseChapterResult {
    // Data
    chapter: ChapterData | null;
    nextChapter: ChapterData | null;
    prevChapter: ChapterData | null;
    comments: Comment[];

    // User state
    currentUserId: string | null;
    currentUserAvatar: string;
    isUnlocked: boolean;
    isCheckingUnlock: boolean;

    // Loading states
    loading: boolean;
    error: string | null;

    // Actions
    loadChapterData: (chapterId: string) => Promise<void>;
    loadComments: (chapterId: string) => Promise<void>;
    setIsUnlocked: (value: boolean) => void;
    setComments: (value: Comment[] | ((prev: Comment[]) => Comment[])) => void;

    // Comment actions
    toggleLike: (commentId: string) => Promise<void>;
    toggleDislike: (commentId: string) => Promise<void>;
}

/**
 * Custom hook for ChapterScreen data management
 * Extracts all data fetching and state logic from the screen component
 */
export const useChapter = (
    chapterId: string | undefined,
    showToast: (type: 'success' | 'error', message: string) => void
): UseChapterResult => {
    // State
    const [chapter, setChapter] = useSafeState<ChapterData | null>(null);
    const [nextChapter, setNextChapter] = useSafeState<ChapterData | null>(null);
    const [prevChapter, setPrevChapter] = useSafeState<ChapterData | null>(null);
    const [comments, setComments] = useSafeState<Comment[]>([]);

    const [currentUserId, setCurrentUserId] = useSafeState<string | null>(null);
    const [currentUserAvatar, setCurrentUserAvatar] = useSafeState<string>('');
    const [isUnlocked, setIsUnlocked] = useSafeState(false);
    const [isCheckingUnlock, setIsCheckingUnlock] = useSafeState(true);

    const [loading, setLoading] = useSafeState(true);
    const [error, setError] = useSafeState<string | null>(null);

    const { isMounted, cancel } = useCancellableRequest();

    // Load chapter data
    const loadChapterData = useCallback(async (chapId: string) => {
        try {
            setLoading(true);
            setError(null);

            const chapterData = await chapterService.getChapter(chapId);
            if (!chapterData) {
                setError('Chapter not found');
                setLoading(false);
                return;
            }

            if (!isMounted()) return;

            setChapter({
                id: chapterData.id,
                number: chapterData.chapter_number,
                title: chapterData.title,
                content: chapterData.content,
                views: chapterData.views || 0,
                novel: chapterData.novel,
                is_locked: chapterData.is_locked,
            });

            // Chapters 1-7 are always free
            if (chapterData.chapter_number <= 7 || !chapterData.is_locked) {
                setIsUnlocked(true);
            }

            // Fetch navigation chapters
            if (chapterData.novel_id && chapterData.chapter_number !== undefined) {
                const [next, prev] = await Promise.all([
                    chapterService.getNextChapter(chapterData.novel_id, chapterData.chapter_number),
                    chapterService.getPreviousChapter(chapterData.novel_id, chapterData.chapter_number),
                ]);

                if (isMounted()) {
                    // Transform navigation chapters to match ChapterData type
                    if (next) {
                        setNextChapter({
                            id: next.id,
                            number: next.chapter_number,
                            title: next.title || 'Untitled',
                            content: '',
                            views: 0,
                            is_locked: next.is_locked ?? false,
                        });
                    }
                    if (prev) {
                        setPrevChapter({
                            id: prev.id,
                            number: prev.chapter_number,
                            title: prev.title || 'Untitled',
                            content: '',
                            views: 0,
                            is_locked: prev.is_locked ?? false,
                        });
                    }
                }
            }

            // Increment views
            await chapterService.incrementViews(chapId);

            // Load comments
            await loadComments(chapId);

            if (isMounted()) {
                setLoading(false);
            }
        } catch (err: any) {
            console.error('[useChapter] Error loading chapter:', err);
            if (isMounted()) {
                setError('Failed to load chapter');
                setLoading(false);
            }
        }
        // Note: loadComments uses currentUserId which may be stale, but this is handled by passing chapId directly
    }, [isMounted, setChapter, setNextChapter, setPrevChapter, setIsUnlocked, setLoading, setError]);

    // Load comments
    const loadComments = useCallback(async (chapId: string) => {
        try {
            const userId = currentUserId;
            const commentsData = await commentService.getChapterComments(chapId, userId, 1, 50);

            if (!commentsData || !Array.isArray(commentsData) || !isMounted()) return;

            const transformedComments: Comment[] = commentsData.map((comment: any) => {
                const formattedProfile = formatUserProfile(comment.user, userId);
                return {
                    id: comment.id,
                    userId: comment.user_id,
                    author: formattedProfile.displayName,
                    avatar: formattedProfile.profileImage,
                    time: formatTimeAgo(comment.created_at),
                    text: comment.comment_text,
                    likes: comment.likes || 0,
                    dislikes: comment.dislikes || 0,
                    userLiked: comment.user_has_liked || false,
                    userDisliked: comment.user_has_disliked || false,
                    replies: [],
                    isCurrentUser: formattedProfile.isCurrentUser,
                };
            });

            setComments(transformedComments);
        } catch (err) {
            console.error('[useChapter] Error loading comments:', err);
        }
    }, [currentUserId, isMounted, setComments]);

    // Toggle like
    const toggleLike = useCallback(async (commentId: string) => {
        if (!currentUserId) {
            showToast('error', 'Please log in to like comments');
            return;
        }

        // Optimistic update
        setComments(prev =>
            prev.map(c => {
                if (c.id === commentId) {
                    const wasLiked = c.userLiked;
                    return {
                        ...c,
                        userLiked: !wasLiked,
                        userDisliked: false,
                        likes: wasLiked ? c.likes - 1 : c.likes + 1,
                        dislikes: c.userDisliked ? c.dislikes - 1 : c.dislikes,
                    };
                }
                return c;
            })
        );

        try {
            const result = await commentService.reactToComment(currentUserId, commentId, 'like');
            if (!result.success) {
                // Revert on error
                setComments(prev =>
                    prev.map(c => {
                        if (c.id === commentId) {
                            const wasLiked = !c.userLiked;
                            return {
                                ...c,
                                userLiked: wasLiked,
                                likes: wasLiked ? c.likes + 1 : c.likes - 1,
                            };
                        }
                        return c;
                    })
                );
            }
        } catch (err) {
            console.error('Error liking comment:', err);
            // Revert on error
            setComments(prev =>
                prev.map(c => {
                    if (c.id === commentId) {
                        const wasLiked = !c.userLiked;
                        return {
                            ...c,
                            userLiked: wasLiked,
                            likes: wasLiked ? c.likes + 1 : c.likes - 1,
                        };
                    }
                    return c;
                })
            );
        }
    }, [currentUserId, showToast, setComments]);

    // Toggle dislike
    const toggleDislike = useCallback(async (commentId: string) => {
        if (!currentUserId) {
            showToast('error', 'Please log in to dislike comments');
            return;
        }

        // Optimistic update
        setComments(prev =>
            prev.map(c => {
                if (c.id === commentId) {
                    const wasDisliked = c.userDisliked;
                    return {
                        ...c,
                        userDisliked: !wasDisliked,
                        userLiked: false,
                        dislikes: wasDisliked ? c.dislikes - 1 : c.dislikes + 1,
                        likes: c.userLiked ? c.likes - 1 : c.likes,
                    };
                }
                return c;
            })
        );

        try {
            const result = await commentService.reactToComment(currentUserId, commentId, 'dislike');
            if (!result.success) {
                // Revert on error
                setComments(prev =>
                    prev.map(c => {
                        if (c.id === commentId) {
                            const wasDisliked = !c.userDisliked;
                            return {
                                ...c,
                                userDisliked: wasDisliked,
                                dislikes: wasDisliked ? c.dislikes + 1 : c.dislikes - 1,
                            };
                        }
                        return c;
                    })
                );
            }
        } catch (err) {
            console.error('Error disliking comment:', err);
            // Revert on error
            setComments(prev =>
                prev.map(c => {
                    if (c.id === commentId) {
                        const wasDisliked = !c.userDisliked;
                        return {
                            ...c,
                            userDisliked: wasDisliked,
                            dislikes: wasDisliked ? c.dislikes + 1 : c.dislikes - 1,
                        };
                    }
                    return c;
                })
            );
        }
    }, [currentUserId, showToast, setComments]);

    // Initialize user - runs once on mount
    useEffect(() => {
        const initUser = async () => {
            try {
                const profile = await authService.getCurrentProfile();
                if (profile && isMounted()) {
                    setCurrentUserId(profile.id);
                    setCurrentUserAvatar(getUserProfileImage(profile));
                }
                if (isMounted()) {
                    setIsCheckingUnlock(false);
                }
            } catch (err) {
                console.error('Error initializing user:', err);
                if (isMounted()) {
                    setIsCheckingUnlock(false);
                }
            }
        };
        initUser();

        return () => {
            cancel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Intentionally empty - should only run on mount

    // Load chapter when ID changes
    useEffect(() => {
        if (chapterId) {
            loadChapterData(chapterId);
        } else {
            setError('Chapter ID not provided');
            setLoading(false);
        }
    }, [chapterId, loadChapterData]);

    return {
        chapter,
        nextChapter,
        prevChapter,
        comments,
        currentUserId,
        currentUserAvatar,
        isUnlocked,
        isCheckingUnlock,
        loading,
        error,
        loadChapterData,
        loadComments,
        setIsUnlocked,
        setComments,
        toggleLike,
        toggleDislike,
    };
};
