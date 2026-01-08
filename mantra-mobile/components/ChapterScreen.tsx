import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  Alert,
  Image,
  Animated,
  Pressable,
} from 'react-native';
import { Feather, AntDesign } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { getProfilePicture } from '../constants/defaultImages';
import { formatUserProfile, getUserProfileImage } from '../utils/profileUtils';
import UnlockOverlay from './chapter/UnlockOverlay';
import authService from '../services/authService';
import chapterService from '../services/chapterService';
import commentService from '../services/commentService';
import { LoadingState, ErrorState } from './common';

interface Comment {
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

interface Reply {
  id: string;
  userId: string;
  author: string;
  avatar: string;
  time: string;
  text: string;
}

const ChapterScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as any;
  const commentInputOpacity = useRef(new Animated.Value(0)).current;

  const [showSettings, setShowSettings] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [lineSpacing, setLineSpacing] = useState(1.6);
  const { theme: globalTheme, isDarkMode } = useTheme();
  const [theme, setTheme] = useState<'default' | 'sepia' | 'dark'>(isDarkMode ? 'dark' : 'default');

  // Sync local theme with global dark mode changes
  useEffect(() => {
    setTheme(isDarkMode ? 'dark' : 'default');
  }, [isDarkMode]);
  const [sortBy, setSortBy] = useState<'newest' | 'mostLiked'>('newest');
  const [commentText, setCommentText] = useState('');
  const [activeCommentMenu, setActiveCommentMenu] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; text: string } | null>(null);
  const commentInputRef = useRef<TextInput>(null);

  // Unlock state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('');
  const [isCheckingUnlock, setIsCheckingUnlock] = useState(true);

  // Chapter data state
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user and load chapter on mount
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        // Get current user profile
        const profile = await authService.getCurrentProfile();
        let userId = null;
        if (profile) {
          userId = profile.id;
          setCurrentUserId(profile.id);
          // Use getUserProfileImage for consistent profile image
          setCurrentUserAvatar(getUserProfileImage(profile));
        }
        setIsCheckingUnlock(false);

        // Load chapter data with userId
        if (params?.chapterId) {
          await loadChapterData(params.chapterId, userId);
        } else {
          setError('Chapter ID not provided');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error initializing screen:', err);
        setError('Failed to load chapter');
        setLoading(false);
      }
    };
    initializeScreen();
  }, [params?.chapterId]);

  const loadChapterData = async (chapterId: string, userId: string | null = null) => {
    try {
      setLoading(true);
      setError(null);

      const chapterData = await chapterService.getChapter(chapterId);

      if (!chapterData) {
        setError('Chapter not found');
        setLoading(false);
        return;
      }

      setChapter({
        id: chapterData.id,
        number: chapterData.chapter_number,
        title: chapterData.title,
        content: chapterData.content,
        views: chapterData.views || 0,
        novel: chapterData.novel,
        is_locked: chapterData.is_locked,
      });

      // Chapters 1-7 are always free (not locked)
      if (chapterData.chapter_number <= 7) {
        setIsUnlocked(true);
      } else if (!chapterData.is_locked) {
        // If chapter is marked as not locked in DB, unlock it
        setIsUnlocked(true);
      }

      // Increment chapter views
      await chapterService.incrementViews(chapterId);

      // Load comments for this chapter
      await loadComments(chapterId, userId);

      setLoading(false);
    } catch (err) {
      console.error('Error loading chapter:', err);
      setError('Failed to load chapter');
      setLoading(false);
    }
  };

  const loadComments = async (chapterId: string, userId: string | null = null) => {
    try {
      const commentsData = await commentService.getChapterComments(chapterId, userId || currentUserId, 1, 50);
      if (commentsData && Array.isArray(commentsData)) {
        // Transform comments - service already includes user_has_liked and user_has_disliked
        const transformedComments = commentsData.map((comment: any) => {
          // Use formatUserProfile for consistent profile data
          const formattedProfile = formatUserProfile(comment.user, userId || currentUserId);

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
            replies: [], // TODO: Load replies
            isCurrentUser: formattedProfile.isCurrentUser,
          };
        });
        setComments(transformedComments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };
  const [comments, setComments] = useState<Comment[]>([]);

  // Show loading state
  if (loading) {
    return <LoadingState message="Loading chapter..." />;
  }

  // Show error state
  if (error || !chapter) {
    return (
      <ErrorState
        title="Failed to load chapter"
        error={error || 'Chapter not found'}
        onRetry={() => params?.chapterId && loadChapterData(params.chapterId)}
      />
    );
  }

  const handleMenuPress = () => {
    setShowMenu(!showMenu);
  };

  const handleViewNovel = () => {
    setShowMenu(false);
    (navigation.navigate as any)('NovelDetail', { novelId: params?.novelId });
  };

  const handleViewAuthor = () => {
    setShowMenu(false);
    if (chapter?.novel?.author_id) {
      (navigation.navigate as any)('OtherUserProfile', { userId: chapter.novel.author_id });
    }
  };

  const handleShare = async () => {
    setShowMenu(false);
    try {
      const { Share } = require('react-native');
      const result = await Share.share({
        message: `Check out "${chapter?.novel?.title}" - Chapter ${chapter?.number}: ${chapter?.title}`,
        title: `${chapter?.novel?.title} - Chapter ${chapter?.number}`,
      });
      if (result.action === Share.sharedAction) {
        // Successfully shared
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share chapter');
    }
  };

  const handleReport = () => {
    setShowMenu(false);
    (navigation.navigate as any)('Report', {
      type: 'chapter',
      novelName: chapter?.novel?.title || 'Unknown Novel',
      chapterName: `Chapter ${chapter.number} - ${chapter.title}`,
    });
  };

  const toggleLike = async (commentId: string) => {
    if (!currentUserId) {
      Alert.alert('Login Required', 'Please log in to like comments');
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

    // Save to database
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
      // Don't reload comments - optimistic update is enough
    } catch (error) {
      console.error('Error liking comment:', error);
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
  };

  const toggleDislike = async (commentId: string) => {
    if (!currentUserId) {
      Alert.alert('Login Required', 'Please log in to dislike comments');
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

    // Save to database
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
      // Don't reload comments - optimistic update is enough
    } catch (error) {
      console.error('Error disliking comment:', error);
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
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;

    if (!currentUserId) {
      Alert.alert('Login Required', 'Please log in to comment');
      return;
    }

    if (!chapter?.id) {
      Alert.alert('Error', 'Chapter not loaded');
      return;
    }

    try {
      // Get current user profile data
      const currentProfile = await authService.getCurrentProfile();
      // Use formatUserProfile for consistent profile data
      const formattedProfile = formatUserProfile(currentProfile, currentUserId);

      if (editingComment) {
        // Update existing comment
        const result = await commentService.updateComment(editingComment.id.toString(), commentText);
        if (result.success) {
          setComments(prev =>
            prev.map(c =>
              c.id === editingComment.id
                ? { ...c, text: commentText }
                : c
            )
          );
          setEditingComment(null);
        } else {
          Alert.alert('Error', result.message);
        }
      } else if (replyingTo) {
        // Add reply
        const result = await commentService.createComment(currentUserId, {
          chapter_id: chapter.id,
          comment_text: commentText,
          parent_comment_id: replyingTo.id.toString(),
        });

        if (result.success && result.comment) {
          setComments(prev =>
            prev.map(c => {
              if (c.id === replyingTo.id.toString()) {
                return {
                  ...c,
                  replies: [
                    ...c.replies,
                    {
                      id: result.comment!.id,
                      userId: currentUserId,
                      author: formattedProfile.displayName,
                      avatar: formattedProfile.profileImage,
                      time: 'Just now',
                      text: commentText,
                    },
                  ],
                };
              }
              return c;
            })
          );
          setReplyingTo(null);
        } else {
          Alert.alert('Error', result.message);
        }
      } else {
        // Add new comment
        const result = await commentService.createComment(currentUserId, {
          chapter_id: chapter.id,
          comment_text: commentText,
        });

        if (result.success && result.comment) {
          const newComment: Comment = {
            id: result.comment.id,
            userId: currentUserId,
            author: formattedProfile.displayName,
            avatar: formattedProfile.profileImage,
            time: 'Just now',
            text: commentText,
            likes: 0,
            dislikes: 0,
            userLiked: false,
            userDisliked: false,
            replies: [],
            isCurrentUser: true,
          };
          setComments(prev => [newComment, ...prev]);
        } else {
          Alert.alert('Error', result.message);
        }
      }
      setCommentText('');
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    }
  };

  const handleReply = (commentId: string, author: string) => {
    setReplyingTo({ id: commentId, author });
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  const handleEditComment = (commentId: string, currentText: string) => {
    setEditingComment({ id: commentId, text: currentText });
    setCommentText(currentText);
    setActiveCommentMenu(null);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setCommentText('');
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Optimistic UI update
            setComments(prev => prev.filter(c => c.id !== commentId));
            setActiveCommentMenu(null);

            try {
              // Persist deletion to database
              const result = await commentService.deleteComment(commentId);
              if (!result.success) {
                // Revert on error - reload comments
                Alert.alert('Error', result.message || 'Failed to delete comment');
                if (chapter?.id && currentUserId) {
                  await loadComments(chapter.id, currentUserId);
                }
              }
            } catch (error) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
              // Reload comments to restore state
              if (chapter?.id && currentUserId) {
                await loadComments(chapter.id, currentUserId);
              }
            }
          },
        },
      ]
    );
  };

  const getThemeStyles = () => {
    switch (theme) {
      case 'sepia':
        return {
          backgroundColor: '#fef3c7',
          textColor: '#78350f',
          borderColor: '#fde68a',
          cardBackground: '#fef3c7',
        };
      case 'dark':
        return {
          backgroundColor: '#0f172a',
          textColor: '#e2e8f0',
          borderColor: '#334155',
          cardBackground: '#1e293b',
        };
      default: // Light theme
        return {
          backgroundColor: colors.white,
          textColor: colors.slate900,
          borderColor: colors.slate100,
          cardBackground: colors.white,
        };
    }
  };

  const themeStyles = getThemeStyles();

  // Font family mapping
  const getFontFamily = () => {
    switch (fontFamily) {
      case 'Serif':
        return 'Georgia';
      case 'SF':
        return 'System';
      default:
        return 'Inter';
    }
  };

  // Sort comments - Author comments always on top
  const sortedComments = [...comments].sort((a, b) => {
    // First, check if either comment is from the novel author
    const novelAuthorId = chapter?.novel?.author_id;
    const aIsAuthor = novelAuthorId && a.userId.toString() === novelAuthorId;
    const bIsAuthor = novelAuthorId && b.userId.toString() === novelAuthorId;

    // If one is author and other isn't, author goes first
    if (aIsAuthor && !bIsAuthor) return -1;
    if (!aIsAuthor && bIsAuthor) return 1;

    // If both are author or both are not, sort by selected criteria
    if (sortBy === 'mostLiked') {
      return b.likes - a.likes;
    } else {
      // For newest, compare IDs as strings (assuming newer IDs are lexicographically greater)
      return b.id.localeCompare(a.id);
    }
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
      {/* Unlock Overlay - Only show when user is logged in and chapter is locked */}
      {!isCheckingUnlock && currentUserId && !isUnlocked && chapter && (
        <UnlockOverlay
          userId={currentUserId}
          novelId={params?.novelId || chapter.novel?.id || ''}
          chapterId={params?.chapterId || chapter.id}
          authorId={chapter.novel?.author_id || ''}
          onUnlocked={() => setIsUnlocked(true)}
        />
      )}

      <Pressable
        style={{ flex: 1 }}
        onPress={() => {
          if (showMenu) setShowMenu(false);
          if (activeCommentMenu) setActiveCommentMenu(null);
          if (editingComment) {
            setEditingComment(null);
            setCommentText('');
          }
        }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeStyles.borderColor }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={20} color={themeStyles.textColor} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={[styles.novelTitle, { color: themeStyles.textColor }]} numberOfLines={1}>
              {chapter?.novel?.title || 'Loading...'}
            </Text>
            <Text style={[styles.chapterInfo, { color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : colors.slate500 }]}>
              Chapter {chapter.number} • {chapter.title}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowSettings(!showSettings)}
          >
            <Feather name="settings" size={20} color={themeStyles.textColor} />
          </TouchableOpacity>

          <View style={[styles.chapterMenuButtonContainer, showMenu && { zIndex: 2000 }]}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleMenuPress}
              activeOpacity={0.7}
            >
              <Feather name="more-vertical" size={20} color={themeStyles.textColor} />
            </TouchableOpacity>
            {showMenu && (
              <View style={[styles.chapterMenuDropdown, { backgroundColor: themeStyles.backgroundColor, borderColor: themeStyles.borderColor }]}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  <TouchableOpacity style={styles.menuItem} onPress={handleViewNovel} activeOpacity={0.7}>
                    <Feather name="book-open" size={16} color={themeStyles.textColor} />
                    <Text style={[styles.menuItemText, { color: themeStyles.textColor }]}>View Novel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={handleViewAuthor} activeOpacity={0.7}>
                    <Feather name="user" size={16} color={themeStyles.textColor} />
                    <Text style={[styles.menuItemText, { color: themeStyles.textColor }]}>View Author</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={handleShare} activeOpacity={0.7}>
                    <Feather name="share-2" size={16} color={themeStyles.textColor} />
                    <Text style={[styles.menuItemText, { color: themeStyles.textColor }]}>Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.menuItem} onPress={handleReport} activeOpacity={0.7}>
                    <Feather name="flag" size={16} color={colors.red500} />
                    <Text style={[styles.menuItemText, { color: colors.red500 }]}>Report</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Reader Settings */}
        {showSettings && (
          <View style={[styles.settingsPanel, { borderBottomColor: themeStyles.borderColor }]}>
            <View style={[styles.settingsCard, { borderColor: themeStyles.borderColor, backgroundColor: themeStyles.backgroundColor }]}>
              <View style={styles.settingsRow}>
                <View style={styles.settingItem}>
                  <Text style={[styles.settingLabel, { color: colors.slate500 }]}>Font Size</Text>
                  <View style={styles.fontSizeControls}>
                    <TouchableOpacity
                      style={[styles.fontButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : colors.slate100 }]}
                      onPress={() => setFontSize(Math.max(14, fontSize - 1))}
                    >
                      <Text style={[styles.fontButtonText, { color: themeStyles.textColor }]}>A-</Text>
                    </TouchableOpacity>
                    <Text style={[styles.fontSizeValue, { color: themeStyles.textColor }]}>{fontSize}</Text>
                    <TouchableOpacity
                      style={[styles.fontButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : colors.slate100 }]}
                      onPress={() => setFontSize(Math.min(22, fontSize + 1))}
                    >
                      <Text style={[styles.fontButtonText, { color: themeStyles.textColor }]}>A+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.settingItem}>
                  <Text style={[styles.settingLabel, { color: colors.slate500 }]}>Font</Text>
                  <View style={styles.fontSelect}>
                    {['Inter', 'Serif', 'SF'].map((font) => (
                      <TouchableOpacity
                        key={font}
                        style={[
                          styles.fontOption,
                          { borderColor: themeStyles.borderColor, backgroundColor: themeStyles.backgroundColor },
                          fontFamily === font && styles.fontOptionActive,
                        ]}
                        onPress={() => setFontFamily(font)}
                      >
                        <Text style={[
                          styles.fontOptionText,
                          { color: themeStyles.textColor },
                          fontFamily === font && styles.fontOptionTextActive,
                        ]}>{font}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.settingsRow}>
                <View style={styles.settingItem}>
                  <Text style={[styles.settingLabel, { color: colors.slate500 }]}>Spacing</Text>
                  <View style={styles.spacingButtons}>
                    {[
                      { label: 'Normal', value: 1.6 },
                      { label: 'Wide', value: 1.8 },
                      { label: 'Extra', value: 2 },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.label}
                        style={[
                          styles.spacingButton,
                          { borderColor: themeStyles.borderColor, backgroundColor: themeStyles.backgroundColor },
                          lineSpacing === option.value && styles.spacingButtonActive,
                        ]}
                        onPress={() => setLineSpacing(option.value)}
                      >
                        <Text style={[
                          styles.spacingButtonText,
                          { color: themeStyles.textColor },
                          lineSpacing === option.value && styles.spacingButtonTextActive,
                        ]}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={[styles.settingsDivider, { backgroundColor: themeStyles.borderColor }]} />

              <View style={styles.themeSection}>
                <Text style={[styles.settingLabel, { color: colors.slate500 }]}>Theme</Text>
                <View style={styles.themeButtons}>
                  {[
                    { label: 'Light', value: 'default' as const },
                    { label: 'Sepia', value: 'sepia' as const },
                    { label: 'Dark', value: 'dark' as const },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.themeButton,
                        { borderColor: themeStyles.borderColor, backgroundColor: themeStyles.backgroundColor },
                        theme === option.value && styles.themeButtonActive,
                      ]}
                      onPress={() => setTheme(option.value)}
                    >
                      <Text style={[
                        styles.themeButtonText,
                        { color: themeStyles.textColor },
                        theme === option.value && styles.themeButtonTextActive,
                      ]}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Chapter Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            // Close menu when scrolling
            if (showMenu) {
              setShowMenu(false);
            }

            const offsetY = e.nativeEvent.contentOffset.y;
            const contentHeight = e.nativeEvent.contentSize.height;
            const scrollViewHeight = e.nativeEvent.layoutMeasurement.height;

            // Calculate how much content is left below the current viewport
            const remainingContent = contentHeight - offsetY - scrollViewHeight;

            // Show input when comments section header is visible
            // Use a reasonable threshold that works for both short and long comment sections
            // 600px ensures input appears when "Comments" header enters viewport
            const shouldShow = remainingContent < 600;

            if (shouldShow !== showCommentInput) {
              setShowCommentInput(shouldShow);
              Animated.timing(commentInputOpacity, {
                toValue: shouldShow ? 1 : 0,
                duration: 300,
                useNativeDriver: true,
              }).start();
            }
          }}
          scrollEventThrottle={16}
        >
          <Text
            style={[
              styles.chapterText,
              {
                fontSize,
                lineHeight: fontSize * lineSpacing,
                color: themeStyles.textColor,
                fontFamily: getFontFamily(),
              },
            ]}
          >
            {chapter.content?.trim()}
          </Text>

          {/* Chapter Navigation */}
          <View style={styles.chapterNav}>
            <TouchableOpacity style={[styles.navButtonPrev, { borderColor: themeStyles.borderColor, backgroundColor: themeStyles.cardBackground }]}>
              <Text style={[styles.navButtonText, { color: themeStyles.textColor }]}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButtonNext}>
              <Text style={styles.navButtonNextText}>Next</Text>
            </TouchableOpacity>
          </View>

          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <Text style={[styles.commentsTitle, { color: themeStyles.textColor }]}>Comments</Text>
              <View style={styles.sortButtons}>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'newest' && styles.sortButtonActive,
                  ]}
                  onPress={() => setSortBy('newest')}
                >
                  <Text style={[
                    styles.sortButtonText,
                    sortBy === 'newest' && styles.sortButtonTextActive,
                  ]}>Newest</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'mostLiked' && styles.sortButtonActive,
                  ]}
                  onPress={() => setSortBy('mostLiked')}
                >
                  <Text style={[
                    styles.sortButtonText,
                    sortBy === 'mostLiked' && styles.sortButtonTextActive,
                  ]}>Most Liked</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Comments List */}
            <View style={styles.commentsList}>
              {sortedComments.length === 0 ? (
                <View style={styles.emptyCommentsState}>
                  <Feather name="message-circle" size={48} color={colors.slate400} />
                  <Text style={[styles.emptyCommentsTitle, { color: themeStyles.textColor }]}>
                    No comments yet
                  </Text>
                  <Text style={styles.emptyCommentsText}>
                    Be the first to share your thoughts!
                  </Text>
                </View>
              ) : (
                sortedComments.map(comment => (
                  <View key={comment.id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <Image
                        source={{ uri: comment.avatar }}
                        style={styles.commentAvatar}
                      />
                      <View style={styles.commentMeta}>
                        <View style={styles.commentAuthorRow}>
                          <Text style={[styles.commentAuthor, { color: themeStyles.textColor }]}>
                            {comment.author}
                          </Text>
                          {comment.isCurrentUser && (
                            <View style={[styles.authorBadge, { backgroundColor: colors.sky50 }]}>
                              <Text style={[styles.authorBadgeText, { color: colors.sky700 }]}>YOU</Text>
                            </View>
                          )}
                          {chapter?.novel?.author_id && comment.userId.toString() === chapter.novel.author_id && (
                            <View style={styles.authorBadge}>
                              <Text style={styles.authorBadgeText}>AUTHOR</Text>
                            </View>
                          )}
                          <Text style={[styles.commentTime, { color: themeStyles.textColor + '66' }]}>{comment.time}</Text>
                        </View>
                        <Text style={[styles.commentText, { color: themeStyles.textColor }]}>
                          {comment.text}
                        </Text>
                        <View style={styles.commentActions}>
                          <TouchableOpacity
                            style={styles.commentAction}
                            onPress={() => toggleLike(comment.id)}
                          >
                            <Feather
                              name="thumbs-up"
                              size={16}
                              color={comment.userLiked ? colors.sky500 : colors.slate400}
                            />
                            <Text style={[
                              styles.commentActionText,
                              comment.userLiked ? { color: colors.sky500 } : { color: themeStyles.textColor + '66' },
                            ]}>{comment.likes}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.commentAction}
                            onPress={() => toggleDislike(comment.id)}
                          >
                            <Feather
                              name="thumbs-down"
                              size={16}
                              color={comment.userDisliked ? colors.red500 : colors.slate400}
                            />
                            <Text style={[
                              styles.commentActionText,
                              comment.userDisliked ? { color: colors.red500 } : { color: themeStyles.textColor + '66' },
                            ]}>{comment.dislikes}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.commentAction}
                            onPress={() => handleReply(comment.id, comment.author)}
                          >
                            <Text style={[styles.commentActionText, { color: themeStyles.textColor + '66' }]}>Reply</Text>
                          </TouchableOpacity>
                          <View style={[
                            styles.commentMenuContainer,
                            activeCommentMenu === comment.id && { height: currentUserId && comment.userId.toString() === currentUserId ? 100 : 50 }
                          ]}>
                            <TouchableOpacity
                              style={styles.commentMenuButton}
                              onPress={() => setActiveCommentMenu(
                                activeCommentMenu === comment.id ? null : comment.id
                              )}
                            >
                              <Feather name="more-horizontal" size={16} color={colors.slate400} />
                            </TouchableOpacity>
                            {activeCommentMenu === comment.id && (
                              <View style={[styles.commentMenuDropdown, { backgroundColor: themeStyles.backgroundColor, borderColor: themeStyles.borderColor }]}>
                                {currentUserId && comment.userId.toString() === currentUserId ? (
                                  <>
                                    <TouchableOpacity
                                      style={styles.commentMenuItem}
                                      onPress={() => handleEditComment(comment.id, comment.text)}
                                    >
                                      <Feather name="edit-3" size={16} color={themeStyles.textColor} />
                                      <Text style={[styles.commentMenuItemText, { color: themeStyles.textColor }]}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.commentMenuItem}
                                      onPress={() => handleDeleteComment(comment.id)}
                                    >
                                      <Feather name="trash-2" size={16} color={colors.red500} />
                                      <Text style={[styles.commentMenuItemText, { color: colors.red500 }]}>Delete</Text>
                                    </TouchableOpacity>
                                  </>
                                ) : (
                                  <TouchableOpacity
                                    style={styles.commentMenuItem}
                                    onPress={() => {
                                      setActiveCommentMenu(null);
                                      (navigation.navigate as any)('Report', {
                                        type: 'comment',
                                        commentId: comment.id,
                                      });
                                    }}
                                  >
                                    <Feather name="flag" size={16} color={colors.red500} />
                                    <Text style={[styles.commentMenuItemText, { color: colors.red500 }]}>Report</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                        {comment.replies.length > 0 && (
                          <>
                            <TouchableOpacity
                              style={styles.repliesToggle}
                              onPress={() => toggleReplies(comment.id)}
                            >
                              <Feather name="message-circle" size={14} color={colors.slate500} />
                              <Text style={styles.repliesToggleText}>
                                {expandedReplies.has(comment.id)
                                  ? 'Hide Replies'
                                  : `${comment.replies.length} ${comment.replies.length === 1 ? 'Reply' : 'Replies'}`}
                              </Text>
                            </TouchableOpacity>
                            {expandedReplies.has(comment.id) && (
                              <View style={styles.repliesList}>
                                {comment.replies.map(reply => (
                                  <View key={reply.id} style={styles.replyCard}>
                                    <Image
                                      source={{ uri: reply.avatar }}
                                      style={styles.replyAvatar}
                                    />
                                    <View style={styles.replyContent}>
                                      <View style={styles.replyAuthorRow}>
                                        <Text style={[styles.replyAuthor, { color: themeStyles.textColor }]}>
                                          {reply.author}
                                        </Text>
                                        <Text style={[styles.replyTime, { color: themeStyles.textColor + '66' }]}>{reply.time}</Text>
                                      </View>
                                      <Text style={[styles.replyText, { color: themeStyles.textColor }]}>
                                        {reply.text}
                                      </Text>
                                    </View>
                                  </View>
                                ))}
                              </View>
                            )}
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* Comment Input - Only show when in comments section */}
        {showCommentInput && (
          <Animated.View style={[styles.commentInputContainer, { opacity: commentInputOpacity }]}>
            {editingComment && (
              <View style={[styles.replyIndicator, { backgroundColor: colors.amber50 }]}>
                <Text style={[styles.replyIndicatorText, { color: colors.amber700 }]}>
                  Editing comment
                </Text>
                <TouchableOpacity onPress={cancelEdit}>
                  <Feather name="x" size={16} color={colors.amber700} />
                </TouchableOpacity>
              </View>
            )}
            {replyingTo && !editingComment && (
              <View style={styles.replyIndicator}>
                <Text style={styles.replyIndicatorText}>
                  Replying to {replyingTo.author}
                </Text>
                <TouchableOpacity onPress={cancelReply}>
                  <Feather name="x" size={16} color={colors.slate600} />
                </TouchableOpacity>
              </View>
            )}
            <View style={[styles.commentInputBox, { backgroundColor: themeStyles.backgroundColor, borderColor: themeStyles.borderColor }]}>
              <Image
                source={{ uri: currentUserAvatar || getProfilePicture(null, 'User') }}
                style={styles.commentInputAvatar}
              />
              <TextInput
                ref={commentInputRef}
                style={[styles.commentInput, { color: themeStyles.textColor }]}
                placeholder={
                  editingComment
                    ? 'Edit your comment...'
                    : replyingTo
                      ? `Reply to ${replyingTo.author}...`
                      : 'Write a comment...'
                }
                placeholderTextColor={theme === 'dark' ? colors.slate500 : colors.slate400}
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSendComment}
              >
                <Feather name="send" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    gap: spacing[2],
    zIndex: 100,
    overflow: 'visible',
  },
  headerButton: {
    padding: spacing[2],
    borderRadius: borderRadius.lg,
  },
  headerInfo: {
    flex: 1,
  },
  novelTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: 18,
  },
  chapterInfo: {
    fontSize: 11,
    marginTop: 2,
  },
  settingsPanel: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
  },
  settingsCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing[3],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  settingItem: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 11,
    marginBottom: 6,
  },
  fontSizeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  fontButton: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.DEFAULT,
  },
  fontButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate700,
  },
  fontSizeValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    minWidth: 24,
    textAlign: 'center',
  },
  fontSelect: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  fontOption: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.slate200,
    alignItems: 'center',
  },
  fontOptionActive: {
    backgroundColor: colors.sky500,
    borderColor: colors.sky500,
  },
  fontOptionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate700,
  },
  fontOptionTextActive: {
    color: colors.white,
  },
  spacingButtons: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  spacingButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.slate200,
    alignItems: 'center',
  },
  spacingButtonActive: {
    backgroundColor: colors.sky500,
    borderColor: colors.sky500,
  },
  spacingButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate700,
  },
  spacingButtonTextActive: {
    color: colors.white,
  },
  settingsDivider: {
    height: 1,
    marginVertical: spacing[3],
  },
  themeSection: {
    gap: spacing[2],
  },
  themeButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  themeButton: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.slate200,
    alignItems: 'center',
  },
  themeButtonActive: {
    backgroundColor: colors.sky500,
    borderColor: colors.sky500,
  },
  themeButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate700,
  },
  themeButtonTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
    paddingBottom: spacing[32],
  },
  chapterText: {
    marginBottom: spacing[4],
  },
  chapterNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[6],
    gap: spacing[3],
  },
  navButtonPrev: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  navButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate700,
  },
  navButtonNext: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.sky500,
  },
  navButtonNextText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  commentsSection: {
    marginTop: spacing[8],
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  commentsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  sortButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  sortButtonActive: {
    backgroundColor: colors.sky500,
    borderColor: colors.sky500,
  },
  sortButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate700,
  },
  sortButtonTextActive: {
    color: colors.white,
  },
  commentsList: {
    gap: spacing[4],
  },
  emptyCommentsState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[6],
  },
  emptyCommentsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  emptyCommentsText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate500,
    textAlign: 'center',
  },
  commentCard: {
    marginBottom: spacing[4],
  },
  commentHeader: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  commentMeta: {
    flex: 1,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
    flexWrap: 'wrap',
  },
  commentAuthor: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  authorBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    backgroundColor: '#fef3c7',
  },
  authorBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#d97706',
  },
  commentTime: {
    fontSize: typography.fontSize.xs,
    color: colors.slate400,
  },
  commentText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  commentActionText: {
    fontSize: typography.fontSize.xs,
    color: colors.slate400,
  },
  commentMenuContainer: {
    marginLeft: 'auto',
    position: 'relative',
  },
  commentMenuButton: {
    padding: spacing[1],
  },
  commentMenuDropdown: {
    position: 'absolute',
    top: 24,
    right: 0,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.slate200,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 120,
    padding: spacing[1],
    zIndex: 1000,
  },
  commentMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  commentMenuItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate700,
  },
  repliesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[2],
  },
  repliesToggleText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate500,
  },
  repliesList: {
    marginTop: spacing[3],
    gap: spacing[3],
  },
  replyCard: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.slate200,
  },
  replyContent: {
    flex: 1,
  },
  replyAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: 2,
  },
  replyAuthor: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  replyTime: {
    fontSize: 10,
    color: colors.slate400,
  },
  replyText: {
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  commentInputContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[3],
    zIndex: 30,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.sky50,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[2],
  },
  replyIndicatorText: {
    fontSize: typography.fontSize.xs,
    color: colors.sky700,
    fontWeight: typography.fontWeight.medium,
  },
  commentInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  commentInputAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.slate200,
  },
  commentInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  sendButton: {
    padding: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.sky500,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chapterMenuButtonContainer: {
    position: 'relative',
    zIndex: 200,
  },
  chapterMenuDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    marginRight: 0,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 10,
    minWidth: 160,
    maxHeight: 200,
    padding: spacing[1],
    zIndex: 2001,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.md,
  },
  menuItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate700,
  },
});

export default ChapterScreen;
