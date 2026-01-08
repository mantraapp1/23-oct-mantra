import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  TextInput,
  Modal,
  Image,
  Animated,
} from 'react-native';
import { Feather, AntDesign } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import { getProfilePicture } from '../../../constants/defaultImages';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useToast } from '../../ToastManager';
import { supabase } from '../../../config/supabase';
import commentService from '../../../services/commentService';
import chapterService from '../../../services/chapterService';
import { useTheme } from '../../../context/ThemeContext';


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
  timestamp: number;
  userLiked: boolean;
  userDisliked: boolean;
  replies: Reply[];
}

interface Reply {
  id: string;
  userId: string;
  author: string;
  avatar: string;
  time: string;
  text: string;
}

const ChapterManageScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();
  const { novelId, chapterId } = (route.params as any) || { novelId: '1', chapterId: '1' };
  const scrollViewRef = useRef<ScrollView>(null);
  const commentInputOpacity = useRef(new Animated.Value(0)).current;

  const { theme: globalTheme, isDarkMode } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterMenu, setShowChapterMenu] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('Inter');
  const [lineSpacing, setLineSpacing] = useState(1.6);
  const [readerTheme, setReaderTheme] = useState<'default' | 'sepia' | 'dark'>(isDarkMode ? 'dark' : 'default');
  const [sortBy, setSortBy] = useState<'newest' | 'mostLiked'>('newest');
  const [commentText, setCommentText] = useState('');
  const [activeCommentMenu, setActiveCommentMenu] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; text: string } | null>(null);
  const [editText, setEditText] = useState('');
  const [showDeleteChapterModal, setShowDeleteChapterModal] = useState(false);
  const commentInputRef = useRef<TextInput>(null);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);


  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ displayName: string; avatar: string } | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [chapter, setChapter] = useState<any>(null);
  const [chapterLoading, setChapterLoading] = useState(true);

  // Get current user on mount
  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);

        // Fetch user profile for dynamic name and avatar
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, username, profile_picture_url')
          .eq('id', user.id)
          .single();

        if (profile) {
          const displayName = profile.display_name || profile.username || 'User';
          setUserProfile({
            displayName,
            avatar: getProfilePicture(profile.profile_picture_url, displayName)
          });
        } else {
          const displayName = user.user_metadata?.display_name || 'User';
          setUserProfile({
            displayName,
            avatar: getProfilePicture(user.user_metadata?.avatar_url, displayName)
          });
        }
      }
    };
    initUser();
  }, []);

  // Load chapter and comments data
  useEffect(() => {
    if (chapterId) {
      loadChapterData();
    }
  }, [chapterId]);

  const loadChapterData = async () => {
    try {
      setChapterLoading(true);

      // Load chapter details
      const chapterData = await chapterService.getChapter(chapterId);
      if (chapterData) {
        setChapter(chapterData);
      }

      // Load comments
      await loadComments();

      setChapterLoading(false);
    } catch (error) {
      console.error('Error loading chapter data:', error);
      setChapterLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const commentsData = await commentService.getChapterComments(chapterId, currentUserId, 1, 50);
      if (commentsData && Array.isArray(commentsData)) {
        // Transform comments - service already includes user_has_liked and user_has_disliked
        const transformedComments = commentsData.map((comment: any) => {
          const author = comment.user?.display_name || comment.user?.username || 'Anonymous';
          return {
            id: comment.id,
            userId: comment.user_id,
            author: author,
            avatar: getProfilePicture(comment.user?.profile_picture_url, author),
            time: formatTimeAgo(comment.created_at),
            text: comment.comment_text,
            likes: comment.likes || 0,
            dislikes: comment.dislikes || 0,
            timestamp: new Date(comment.created_at).getTime(),
            userLiked: comment.user_has_liked || false,
            userDisliked: comment.user_has_disliked || false,
            replies: [],
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

  const mockChapter = {
    number: chapter?.chapter_number || 148,
    title: chapter?.title || 'The Final Entry',
    content: `Rain traced silver threads across the city as the ledger's final page dried on the desk. Names bled together—aliases, debts, promises—each an echo of a bargain the Syndicate could not afford to keep.

The detective folded the corner, a quiet ritual. He had learned the ledger's language: how silence weighed more than signatures, how ink grew colder with truth.

Tonight, the city would learn it too. The Mumbai sun, a relentless golden orb, beat down on Aarav Sharma as he navigated the labyrinthine lanes of Dadar market. The air, thick with the scent of spices, jasmine, and exhaust fumes, hummed with the cacophony of a million lives. Vendors hawked their wares, auto-rickshaws blared their horns, and a ceaseless river of humanity flowed around him. For 17-year-old Aarav, this was the rhythm of his life, a familiar symphony of chaos and comfort. Yet, today, a discordant note resonated within him, a subtle unease that had been growing for weeks.

He clutched his worn sketchbook, its pages filled with intricate doodles of ancient temples, mythical beasts, and swirling patterns inspired by the epics his grandfather used to narrate. While his classmates were engrossed in cricket scores or the latest Bollywood gossip, Aarav found solace in the forgotten tales of gods and demons, of Dharma and Adharma. He often felt like an anachronism, a relic in a world hurtling towards an uncertain future.

"Aarav! Don't just stand there, we need those vegetables before Maa starts her lecture!"

The sharp, cheerful voice cut through his reverie. Priya, his 15-year-old sister, stood a few paces ahead, hands on her hips, her long braids swaying with her impatience. She was everything he wasn't – outgoing, vivacious, and effortlessly connected to the pulse of modern Mumbai. Her camera, a sleek digital SLR, hung around her neck, always ready to capture the vibrant tapestry of their city.

"Coming, coming," Aarav mumbled, quickening his pace. He loved Priya fiercely, but her boundless energy often left him feeling a step behind. As he squeezed past a fruit stall, a sudden, inexplicable gust of wind swirled around him, scattering a pile of mangoes. The vendor cursed, and Aarav stammered apologies, his cheeks flushing. It wasn't a strong wind, not enough to cause real damage, but it was odd. The air was still, heavy with humidity, yet a localized vortex had erupted around him. He'd experienced similar phenomena before – a sudden chill in a warm room, a book falling from a shelf without any apparent cause – but he'd dismissed them as coincidences.`,
  };

  // Reader Theme styles
  const getReaderStyles = () => {
    switch (readerTheme) {
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

  const readerStyles = getReaderStyles();

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

  // Comment handlers
  const toggleLike = (commentId: string) => {
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
  };

  const toggleDislike = (commentId: string) => {
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

  const startReply = (commentId: string, author: string) => {
    setReplyingTo({ id: commentId, author });
    setCommentText('');
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

  const handleSendComment = () => {
    if (commentText.trim()) {
      if (editingComment) {
        // Update existing comment
        setComments(prev =>
          prev.map(c =>
            c.id === editingComment.id
              ? { ...c, text: commentText }
              : c
          )
        );
        showToast('success', 'Comment updated successfully!');
        setEditingComment(null);
        setCommentText('');
        return;
      }
      if (replyingTo) {
        // Add reply
        setComments(prev =>
          prev.map(c => {
            if (c.id === replyingTo.id) {
              return {
                ...c,
                replies: [
                  ...c.replies,
                  {
                    id: Date.now().toString(),
                    userId: currentUserId || 'guest',
                    author: userProfile?.displayName || 'User',
                    avatar: userProfile?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100',
                    time: 'Just now',
                    text: commentText,
                  },
                ],
              };
            }
            return c;
          })
        );
        showToast('success', 'Reply posted!');
        setReplyingTo(null);
      } else {
        // Add new comment
        const newComment: Comment = {
          id: Date.now().toString(),
          userId: currentUserId || 'guest',
          author: userProfile?.displayName || 'User',
          avatar: userProfile?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100',
          badge: 'AUTHOR',
          time: 'Just now',
          text: commentText,
          likes: 0,
          dislikes: 0,
          timestamp: Date.now(),
          userLiked: false,
          userDisliked: false,
          replies: [],
        };
        setComments(prev => [newComment, ...prev]);
      }
      setCommentText('');
    }
  };

  const saveCommentEdit = (commentId: string) => {
    if (editText.trim()) {
      setComments(prev =>
        prev.map(c => (c.id === commentId ? { ...c, text: editText } : c))
      );
      showToast('success', 'Comment updated successfully!');
      setEditingComment(null);
      setEditText('');
    }
  };

  const cancelCommentEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  const initiateCommentDelete = (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentModal(true);
    setActiveCommentMenu(null);
  };

  const confirmDeleteComment = () => {
    if (commentToDelete !== null) {
      setComments(prev => prev.filter(c => c.id !== commentToDelete));
      showToast('success', 'Comment deleted successfully!');
      setShowDeleteCommentModal(false);
      setCommentToDelete(null);
    }
  };

  const reportComment = (commentId: string) => {
    setActiveCommentMenu(null);
    showToast('info', 'Comment reported. Our team will review it shortly.');
  };

  const handleEditChapter = () => {
    setShowChapterMenu(false);
    (navigation.navigate as any)('EditChapter', {
      novelId,
      chapterId,
      novelTitle: chapter?.novel?.title
    });
  };

  const handleDeleteChapter = () => {
    setShowChapterMenu(false);
    setShowDeleteChapterModal(true);
  };

  const confirmDeleteChapter = async () => {
    try {
      const result = await chapterService.deleteChapter(chapterId);

      if (result.success) {
        showToast('success', 'Chapter deleted successfully!');
        setShowDeleteChapterModal(false);
        // Navigate back to Novel Manage screen
        navigation.goBack();
      } else {
        showToast('error', result.message || 'Failed to delete chapter');
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
      showToast('error', 'An unexpected error occurred');
    }
  };

  // Scroll handler - Show comment input when comments section starts
  const handleScroll = (event: any) => {
    // Close menu when scrolling
    if (showChapterMenu) {
      setShowChapterMenu(false);
    }

    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;

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
    return sortBy === 'mostLiked' ? b.likes - a.likes : b.timestamp - a.timestamp;
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: readerStyles.backgroundColor }]}
      onTouchStart={() => {
        if (showChapterMenu) setShowChapterMenu(false);
        if (activeCommentMenu) setActiveCommentMenu(null);
        if (editingComment) {
          setEditingComment(null);
          setCommentText('');
        }
      }}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: readerStyles.borderColor, backgroundColor: readerStyles.backgroundColor }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color={readerStyles.textColor} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={[styles.novelTitle, { color: readerStyles.textColor }]} numberOfLines={1}>
            {chapter?.novel?.title || 'Loading...'}
          </Text>
          <Text style={[styles.chapterInfo, { color: readerTheme === 'dark' ? 'rgba(255,255,255,0.6)' : colors.slate500 }]}>
            Chapter {mockChapter.number} • {mockChapter.title}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowSettings(!showSettings)}
        >
          <Feather name="settings" size={20} color={readerStyles.textColor} />
        </TouchableOpacity>

        <View style={[styles.chapterMenuButtonContainer, showChapterMenu && { zIndex: 2000 }]}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowChapterMenu(!showChapterMenu)}
            activeOpacity={0.7}
          >
            <Feather name="more-vertical" size={20} color={readerStyles.textColor} />
          </TouchableOpacity>
          {showChapterMenu && (
            <View style={[styles.chapterMenuDropdown, { backgroundColor: readerStyles.cardBackground, borderColor: readerStyles.borderColor }]}>
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.menuItem} onPress={handleEditChapter} activeOpacity={0.7}>
                  <Feather name="edit-3" size={16} color={readerStyles.textColor} />
                  <Text style={[styles.menuItemText, { color: readerStyles.textColor }]}>Edit Chapter</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={handleDeleteChapter} activeOpacity={0.7}>
                  <Feather name="trash-2" size={16} color={colors.red500} />
                  <Text style={[styles.menuItemText, { color: colors.red500 }]}>Delete Chapter</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Reader Settings */}
      {showSettings && (
        <View style={[styles.settingsPanel, { borderBottomColor: readerStyles.borderColor, backgroundColor: readerStyles.backgroundColor }]}>
          <View style={[styles.settingsCard, { borderColor: readerStyles.borderColor, backgroundColor: readerStyles.cardBackground }]}>
            <View style={styles.settingsRow}>
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: colors.slate500 }]}>Font Size</Text>
                <View style={styles.fontSizeControls}>
                  <TouchableOpacity
                    style={[styles.fontButton, { backgroundColor: readerTheme === 'dark' ? 'rgba(255,255,255,0.1)' : colors.slate100 }]}
                    onPress={() => setFontSize(Math.max(14, fontSize - 1))}
                  >
                    <Text style={[styles.fontButtonText, { color: readerStyles.textColor }]}>A-</Text>
                  </TouchableOpacity>
                  <Text style={[styles.fontSizeValue, { color: readerStyles.textColor }]}>{fontSize}</Text>
                  <TouchableOpacity
                    style={[styles.fontButton, { backgroundColor: readerTheme === 'dark' ? 'rgba(255,255,255,0.1)' : colors.slate100 }]}
                    onPress={() => setFontSize(Math.min(22, fontSize + 1))}
                  >
                    <Text style={[styles.fontButtonText, { color: readerStyles.textColor }]}>A+</Text>
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
                        { borderColor: readerStyles.borderColor, backgroundColor: readerStyles.backgroundColor },
                        fontFamily === font && styles.fontOptionActive,
                      ]}
                      onPress={() => setFontFamily(font)}
                    >
                      <Text style={[
                        styles.fontOptionText,
                        { color: readerStyles.textColor },
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
                        { borderColor: readerStyles.borderColor, backgroundColor: readerStyles.backgroundColor },
                        lineSpacing === option.value && styles.spacingButtonActive,
                      ]}
                      onPress={() => setLineSpacing(option.value)}
                    >
                      <Text style={[
                        styles.spacingButtonText,
                        { color: readerStyles.textColor },
                        lineSpacing === option.value && styles.spacingButtonTextActive,
                      ]}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={[styles.settingsDivider, { backgroundColor: readerStyles.borderColor }]} />

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
                      { borderColor: readerStyles.borderColor, backgroundColor: readerStyles.backgroundColor },
                      readerTheme === option.value && styles.themeButtonActive,
                    ]}
                    onPress={() => setReaderTheme(option.value)}
                  >
                    <Text style={[
                      styles.themeButtonText,
                      { color: readerStyles.textColor },
                      readerTheme === option.value && styles.themeButtonTextActive,
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
        ref={scrollViewRef}
        style={[styles.content, { backgroundColor: readerStyles.backgroundColor }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Text
          style={[
            styles.chapterText,
            {
              fontSize,
              lineHeight: fontSize * lineSpacing,
              color: readerStyles.textColor,
              fontFamily: getFontFamily(),
            },
          ]}
        >
          {chapter?.content || mockChapter.content}
        </Text>

        {/* Chapter Navigation */}
        <View style={styles.chapterNav}>
          <TouchableOpacity style={[styles.navButtonPrev, { borderColor: readerStyles.borderColor, backgroundColor: readerStyles.cardBackground }]}>
            <Text style={[styles.navButtonText, { color: readerStyles.textColor }]}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButtonNext}>
            <Text style={styles.navButtonNextText}>Next</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <View style={styles.commentsHeader}>
            <Text style={[styles.commentsTitle, { color: readerStyles.textColor }]}>Comments</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  { borderColor: readerStyles.borderColor },
                  sortBy === 'newest' && styles.sortButtonActive,
                ]}
                onPress={() => setSortBy('newest')}
              >
                <Text style={[
                  styles.sortButtonText,
                  sortBy === 'newest' ? styles.sortButtonTextActive : { color: readerStyles.textColor + '99' }
                ]}>Newest</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  { borderColor: readerStyles.borderColor },
                  sortBy === 'mostLiked' && styles.sortButtonActive,
                ]}
                onPress={() => setSortBy('mostLiked')}
              >
                <Text style={[
                  styles.sortButtonText,
                  sortBy === 'mostLiked' ? styles.sortButtonTextActive : { color: readerStyles.textColor + '99' }
                ]}>Most Liked</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments List */}
          <View style={styles.commentsList}>
            {sortedComments.length === 0 ? (
              <View style={styles.emptyCommentsState}>
                <Feather name="message-circle" size={48} color={colors.slate400} />
                <Text style={[styles.emptyCommentsTitle, { color: readerStyles.textColor }]}>
                  No comments yet
                </Text>
                <Text style={[styles.emptyCommentsText, { color: readerStyles.textColor + '99' }]}>
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
                        <Text style={[styles.commentAuthor, { color: readerStyles.textColor }]}>
                          {comment.author}
                        </Text>
                        {chapter?.novel?.author_id && comment.userId === chapter.novel.author_id && (
                          <View style={styles.authorBadge}>
                            <Text style={styles.authorBadgeText}>AUTHOR</Text>
                          </View>
                        )}
                        <Text style={[styles.commentTime, { color: readerStyles.textColor + '66' }]}>{comment.time}</Text>
                      </View>

                      <Text style={[styles.commentText, { color: readerStyles.textColor }]}>
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
                            color={comment.userLiked ? colors.sky500 : readerStyles.textColor + '66'}
                          />
                          <Text style={[
                            styles.commentActionText,
                            comment.userLiked ? { color: colors.sky500 } : { color: readerStyles.textColor + '66' },
                          ]}>{comment.likes}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.commentAction}
                          onPress={() => toggleDislike(comment.id)}
                        >
                          <Feather
                            name="thumbs-down"
                            size={16}
                            color={comment.userDisliked ? colors.red500 : readerStyles.textColor + '66'}
                          />
                          <Text style={[
                            styles.commentActionText,
                            comment.userDisliked ? { color: colors.red500 } : { color: readerStyles.textColor + '66' },
                          ]}>{comment.dislikes}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.commentAction}
                          onPress={() => startReply(comment.id, comment.author)}
                        >
                          <Text style={[styles.commentActionText, { color: readerStyles.textColor + '66' }]}>Reply</Text>
                        </TouchableOpacity>

                        <View style={[
                          styles.commentMenuContainer,
                          activeCommentMenu === comment.id && {
                            height: 100,
                            zIndex: 1000
                          }
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
                            <View style={[styles.commentMenuDropdown, { backgroundColor: readerStyles.cardBackground, borderColor: readerStyles.borderColor }]}>
                              {comment.userId === currentUserId ? (
                                <>
                                  <TouchableOpacity
                                    style={styles.commentMenuItem}
                                    onPress={() => handleEditComment(comment.id, comment.text)}
                                  >
                                    <Feather name="edit-3" size={16} color={readerStyles.textColor} />
                                    <Text style={[styles.commentMenuItemText, { color: readerStyles.textColor }]}>Edit</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.commentMenuItem}
                                    onPress={() => initiateCommentDelete(comment.id)}
                                  >
                                    <Feather name="trash-2" size={16} color={colors.red500} />
                                    <Text style={[styles.commentMenuItemText, { color: colors.red500 }]}>Delete</Text>
                                  </TouchableOpacity>
                                </>
                              ) : (
                                <>
                                  <TouchableOpacity
                                    style={styles.commentMenuItem}
                                    onPress={() => reportComment(comment.id)}
                                  >
                                    <Feather name="flag" size={16} color={colors.red500} />
                                    <Text style={[styles.commentMenuItemText, { color: colors.red500 }]}>Report</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.commentMenuItem}
                                    onPress={() => initiateCommentDelete(comment.id)}
                                  >
                                    <Feather name="trash-2" size={16} color={colors.red500} />
                                    <Text style={[styles.commentMenuItemText, { color: colors.red500 }]}>Delete</Text>
                                  </TouchableOpacity>
                                </>
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
                            <Feather name="message-circle" size={14} color={readerStyles.textColor + '99'} />
                            <Text style={[styles.repliesToggleText, { color: readerStyles.textColor + '99' }]}>
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
                                      <Text style={[styles.replyAuthor, { color: readerStyles.textColor }]}>
                                        {reply.author}
                                      </Text>
                                      <Text style={[styles.replyTime, { color: readerStyles.textColor + '66' }]}>{reply.time}</Text>
                                    </View>
                                    <Text style={[styles.replyText, { color: readerStyles.textColor }]}>
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
              <TouchableOpacity onPress={cancelCommentEdit}>
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
          <View style={[styles.commentInputBox, { borderColor: readerStyles.borderColor, backgroundColor: readerStyles.cardBackground }]}>
            <Image
              source={{ uri: userProfile?.avatar || getProfilePicture(null) }}
              style={styles.commentInputAvatar}
            />
            <TextInput
              ref={commentInputRef}
              style={[styles.commentInput, { color: readerStyles.textColor }]}
              placeholder={
                editingComment
                  ? 'Edit your comment...'
                  : replyingTo
                    ? `Reply to ${replyingTo.author}...`
                    : 'Write a comment...'
              }
              placeholderTextColor={colors.slate400}
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

      {/* Delete Chapter Modal */}
      <Modal
        visible={showDeleteChapterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteChapterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: globalTheme.card }]}>
            <Text style={[styles.modalTitle, { color: globalTheme.text }]}>Delete Chapter?</Text>
            <Text style={[styles.modalText, { color: colors.slate600 }]}>
              This action cannot be undone. The chapter will be permanently deleted.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: globalTheme.border }]}
                onPress={() => setShowDeleteChapterModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: globalTheme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={confirmDeleteChapter}
              >
                <Text style={styles.modalButtonDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Comment Modal */}
      <Modal
        visible={showDeleteCommentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: globalTheme.card }]}>
            <Text style={[styles.modalTitle, { color: globalTheme.text }]}>Delete Comment?</Text>
            <Text style={[styles.modalText, { color: colors.slate600 }]}>
              This action cannot be undone. The comment will be permanently deleted.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: globalTheme.border }]}
                onPress={() => setShowDeleteCommentModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: globalTheme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={confirmDeleteComment}
              >
                <Text style={styles.modalButtonDangerText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView >
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
  chapterMenuButtonContainer: {
    position: 'relative',
    zIndex: 200,
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
    marginBottom: spacing[3],
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
  editMode: {
    marginBottom: spacing[3],
  },
  editTextarea: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    padding: spacing[2],
    fontSize: typography.fontSize.sm,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing[2],
  },
  editButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  saveButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    backgroundColor: colors.sky500,
    borderRadius: borderRadius.lg,
  },
  saveButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
  },
  cancelButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.xs,
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
    backgroundColor: 'transparent',
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
    bottom: spacing[4],
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
    backgroundColor: 'transparent',
  },
  commentInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    paddingVertical: 0,
  },
  sendButton: {
    padding: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.sky500,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
    maxHeight: 150,
    padding: spacing[1],
    zIndex: 2001,
  },
  menuDropdown: {
    position: 'absolute',
    top: 60,
    right: 16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    minWidth: 160,
    padding: spacing[1],
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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    maxWidth: 400,
    width: '90%',
    margin: spacing[4],
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[2],
  },
  modalText: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing[6],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  modalButton: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  modalButtonDanger: {
    backgroundColor: colors.red500,
    borderColor: colors.red500,
  },
  modalButtonDangerText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
});

export default ChapterManageScreen;