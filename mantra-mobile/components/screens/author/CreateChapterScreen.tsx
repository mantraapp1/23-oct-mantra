import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useToast } from '../../ToastManager';
import chapterService from '../../../services/chapterService';
import novelService from '../../../services/novelService';
import authService from '../../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CreateChapterScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();
  const { theme, isDarkMode } = useTheme();
  const { novelId } = (route.params as any) || {};

  const [novelTitle, setNovelTitle] = useState('Loading...');
  const [chapterNumber, setChapterNumber] = useState('1');
  const [chapterTitle, setChapterTitle] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Initialize user and load novel data
  useEffect(() => {
    const initializeScreen = async () => {
      setIsLoading(true);
      try {
        // Get current user
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUserId(user.id);
        }

        // Load novel data
        if (novelId) {
          const novel = await novelService.getNovel(novelId);
          if (novel) {
            setNovelTitle(novel.title);

            // Get next chapter number
            const chapters = await chapterService.getAllChaptersByNovel(novelId);
            const maxChapterNumber = chapters.reduce((max, ch) =>
              Math.max(max, ch.chapter_number), 0
            );
            setChapterNumber((maxChapterNumber + 1).toString());
          }
        }
      } catch (error) {
        console.error('Error initializing screen:', error);
        showToast('error', 'Failed to load novel data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeScreen();
  }, [novelId]);

  // Calculate word count and character count
  useEffect(() => {
    const text = content.trim();
    const chars = content.length;
    let words = 0;

    if (text.length > 0) {
      const cleaned = text.replace(/\s+/g, ' ');
      words = cleaned.split(' ').length;
    }

    setWordCount(words);
    setCharCount(chars);
  }, [content]);

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!chapterNumber || parseInt(chapterNumber) < 1) {
      newErrors.chapterNumber = 'Chapter number is required';
    }

    if (!chapterTitle.trim()) {
      newErrors.chapterTitle = 'Chapter title is required';
    }

    if (wordCount < 100) {
      newErrors.content = 'Chapter content is required (minimum 100 words)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePublish = async () => {
    if (!validateForm()) {
      return;
    }

    if (!currentUserId || !novelId) {
      showToast('error', 'Missing user or novel information');
      return;
    }

    setIsPublishing(true);
    try {
      const result = await chapterService.createChapter({
        novel_id: novelId,
        chapter_number: parseInt(chapterNumber),
        title: chapterTitle,
        content: content,
        is_locked: parseInt(chapterNumber) > 7, // Chapters 1-7 are free
      });

      if (result.success) {
        showToast('success', 'Chapter published successfully!');

        // Navigate back to novel management screen
        navigation.goBack();
      } else {
        showToast('error', result.message || 'Failed to publish chapter');
      }
    } catch (error) {
      console.error('Error publishing chapter:', error);
      showToast('error', 'Failed to publish chapter');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!chapterTitle.trim() && !content.trim()) {
      showToast('error', 'Please add some content before saving');
      return;
    }

    if (!currentUserId || !novelId) {
      showToast('error', 'Missing user or novel information');
      return;
    }

    setIsPublishing(true);
    try {
      // Save draft offline using AsyncStorage
      const draftKey = `chapter_draft_${novelId}`;

      // Get existing drafts for this novel
      const existingDraftsJson = await AsyncStorage.getItem(draftKey);
      const existingDrafts = existingDraftsJson ? JSON.parse(existingDraftsJson) : [];

      // Create new draft object
      const newDraft = {
        id: `draft_${Date.now()}`, // Temporary ID for draft
        novel_id: novelId,
        novel_title: novelTitle,
        chapter_number: parseInt(chapterNumber),
        title: chapterTitle || 'Untitled Chapter',
        content: content,
        word_count: wordCount,
        is_draft: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Add new draft to the list
      existingDrafts.push(newDraft);

      // Save back to AsyncStorage
      await AsyncStorage.setItem(draftKey, JSON.stringify(existingDrafts));

      showToast('success', 'Chapter saved as draft offline!');

      // Navigate back to novel management screen
      navigation.goBack();
    } catch (error) {
      console.error('Error saving draft:', error);
      showToast('error', 'Failed to save draft');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGoBack = () => {
    const hasContent = chapterTitle.trim() || content.trim();
    if (hasContent) {
      // In a real app, show a confirmation dialog
      // For now, just go back
    }
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Add Chapter</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.sky500} />
          <Text style={styles.loadingText}>Loading novel data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          activeOpacity={0.7}
          disabled={isPublishing}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Add Chapter</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Novel Info Card */}
        <View style={[styles.novelInfoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <Text style={[styles.novelInfoLabel, { color: theme.textSecondary }]}>Adding chapter to:</Text>
          <Text style={[styles.novelInfoTitle, { color: theme.text }]}>{novelTitle}</Text>
        </View>

        {/* Chapter Number */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Chapter Number *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }, errors.chapterNumber && styles.inputError]}
            value={chapterNumber}
            onChangeText={(text) => {
              setChapterNumber(text);
              clearError('chapterNumber');
            }}
            placeholder="1"
            keyboardType="number-pad"
            placeholderTextColor={theme.textSecondary}
          />
          {errors.chapterNumber && (
            <Text style={styles.errorText}>{errors.chapterNumber}</Text>
          )}
        </View>

        {/* Chapter Title */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Chapter Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }, errors.chapterTitle && styles.inputError]}
            value={chapterTitle}
            onChangeText={(text) => {
              setChapterTitle(text);
              clearError('chapterTitle');
            }}
            placeholder="Enter chapter title"
            placeholderTextColor={theme.textSecondary}
          />
          <Text style={styles.helperText}>
            Example: "The Beginning" or "First Encounter"
          </Text>
          {errors.chapterTitle && (
            <Text style={styles.errorText}>{errors.chapterTitle}</Text>
          )}
        </View>

        {/* Chapter Content */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Chapter Content *</Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
              errors.content && styles.inputError
            ]}
            value={content}
            onChangeText={(text) => {
              setContent(text);
              clearError('content');
            }}
            placeholder="Start writing your chapter here..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={15}
            textAlignVertical="top"
          />
          <Text style={[styles.wordCount, { color: theme.textSecondary }]}>
            {wordCount} words • {charCount} characters
          </Text>
          {errors.content && (
            <Text style={styles.errorText}>{errors.content}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.publishButton, isPublishing && styles.buttonDisabled]}
            onPress={handlePublish}
            activeOpacity={0.8}
            disabled={isPublishing}
          >
            {isPublishing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.publishButtonText}>Publish Chapter</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.draftButton, isPublishing && styles.buttonDisabled]}
            onPress={handleSaveDraft}
            activeOpacity={0.8}
            disabled={isPublishing}
          >
            {isPublishing ? (
              <ActivityIndicator size="small" color={colors.slate700} />
            ) : (
              <Text style={styles.draftButtonText}>Save as Draft</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Writing Tips */}
        <View style={[
          styles.tipsCard,
          isDarkMode && { backgroundColor: '#451a03', borderColor: '#78350f' }
        ]}>
          <View style={styles.tipsHeader}>
            <Feather name="zap" size={16} color={isDarkMode ? colors.amber500 : "#d97706"} />
            <Text style={[styles.tipsTitle, isDarkMode && { color: colors.amber500 }]}>Writing Tips</Text>
          </View>
          <View style={styles.tipsList}>
            <Text style={[styles.tipText, isDarkMode && { color: '#fbbf24' }]}>• Keep paragraphs short for better mobile reading</Text>
            <Text style={[styles.tipText, isDarkMode && { color: '#fbbf24' }]}>• Aim for 1000-3000 words per chapter</Text>
            <Text style={[styles.tipText, isDarkMode && { color: '#fbbf24' }]}>• End with a hook to keep readers engaged</Text>
            <Text style={[styles.tipText, isDarkMode && { color: '#fbbf24' }]}>• Proofread before publishing</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
    borderRadius: borderRadius.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[5],
    paddingBottom: spacing[20],
  },
  novelInfoCard: {
    marginBottom: spacing[6],
    padding: spacing[3],
    backgroundColor: colors.slate50,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  novelInfoLabel: {
    fontSize: 12,
    color: colors.slate500,
    marginBottom: spacing[1],
  },
  novelInfoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  formGroup: {
    marginBottom: spacing[6],
  },
  label: {
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate500,
    marginBottom: spacing[2.5],
  },
  input: {
    width: '100%',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: borderRadius.lg,
    fontSize: typography.fontSize.sm,
    color: colors.slate900,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.red500,
  },
  helperText: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: spacing[1.5],
  },
  errorText: {
    fontSize: 12,
    color: colors.red500,
    marginTop: spacing[1],
  },
  textArea: {
    width: '100%',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: borderRadius.lg,
    fontSize: typography.fontSize.sm,
    color: colors.slate700,
    backgroundColor: colors.white,
    minHeight: 300,
    lineHeight: 22,
  },
  wordCount: {
    fontSize: 12,
    color: colors.slate500,
    textAlign: 'right',
    marginTop: spacing[1],
  },
  buttonGroup: {
    marginTop: spacing[8],
    marginBottom: spacing[6],
    gap: spacing[3],
  },
  publishButton: {
    width: '100%',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    backgroundColor: colors.sky500,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  publishButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  draftButton: {
    width: '100%',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    backgroundColor: colors.slate100,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  draftButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate700,
  },
  tipsCard: {
    padding: spacing[4],
    backgroundColor: '#fffbeb', // amber-50
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#fef3c7', // amber-100
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  tipsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: '#78350f', // amber-900
  },
  tipsList: {
    marginTop: spacing[1],
    gap: spacing[1],
  },
  tipText: {
    fontSize: 12,
    color: '#b45309', // amber-700
    lineHeight: 18,
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
    color: colors.slate500,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default CreateChapterScreen;