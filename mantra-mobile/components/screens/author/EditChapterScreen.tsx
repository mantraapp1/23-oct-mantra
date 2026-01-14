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
import { useAlert } from '../../../context/AlertContext';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useToast } from '../../ToastManager';
import chapterService from '../../../services/chapterService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditChapterScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();
  const { theme, isDarkMode } = useTheme();
  const { showAlert } = useAlert();
  const { novelId, chapterId, novelTitle, isDraft, draftData } = (route.params as any) || {};

  const [chapterNumber, setChapterNumber] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Load chapter data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (isDraft && draftData) {
          setChapterNumber(draftData.chapter_number.toString());
          setChapterTitle(draftData.title);
          setContent(draftData.content);
          setLastUpdated(formatTimeAgo(draftData.updated_at));
        } else if (chapterId) {
          const chapter = await chapterService.getChapter(chapterId);
          if (chapter) {
            setChapterNumber(chapter.chapter_number.toString());
            setChapterTitle(chapter.title);
            setContent(chapter.content);
            setLastUpdated(formatTimeAgo(chapter.updated_at));
          }
        }
      } catch (error) {
        console.error('Error loading chapter:', error);
        showToast('error', 'Failed to load chapter data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [chapterId, isDraft, draftData, novelId]);

  const formatTimeAgo = (dateString: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

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

  const handleUpdate = async () => {
    if (!validateForm()) return;

    setIsUpdating(true);
    try {
      if (isDraft) {
        // Update draft in AsyncStorage
        const draftKey = `chapter_draft_${novelId}`;
        const draftsJson = await AsyncStorage.getItem(draftKey);
        if (draftsJson) {
          const drafts = JSON.parse(draftsJson);
          const updatedDrafts = drafts.map((d: any) =>
            d.id === chapterId ? {
              ...d,
              chapter_number: parseInt(chapterNumber),
              title: chapterTitle,
              content: content,
              word_count: wordCount,
              updated_at: new Date().toISOString()
            } : d
          );
          await AsyncStorage.setItem(draftKey, JSON.stringify(updatedDrafts));
          showToast('success', 'Draft updated successfully!');
          navigation.goBack();
        }
      } else {
        // Update published chapter in Supabase
        const result = await chapterService.updateChapter(chapterId, {
          title: chapterTitle,
          content: content,
        });

        if (result.success) {
          showToast('success', 'Chapter updated successfully!');
          navigation.goBack();
        } else {
          showToast('error', result.message || 'Failed to update chapter');
        }
      }
    } catch (error) {
      console.error('Error updating chapter:', error);
      showToast('error', 'An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    setIsUpdating(true);
    try {
      const result = await chapterService.createChapter({
        novel_id: novelId,
        chapter_number: parseInt(chapterNumber),
        title: chapterTitle,
        content: content,
        is_locked: parseInt(chapterNumber) > 7,
      });

      if (result.success) {
        if (isDraft) {
          // Remove from AsyncStorage
          const draftKey = `chapter_draft_${novelId}`;
          const draftsJson = await AsyncStorage.getItem(draftKey);
          if (draftsJson) {
            const drafts = JSON.parse(draftsJson);
            const updatedDrafts = drafts.filter((d: any) => d.id !== chapterId);
            await AsyncStorage.setItem(draftKey, JSON.stringify(updatedDrafts));
          }
        }

        showToast('success', 'Chapter published successfully!');
        navigation.goBack();
      } else {
        showToast('error', result.message || 'Failed to publish chapter');
      }
    } catch (error) {
      console.error('Error publishing chapter:', error);
      showToast('error', 'An unexpected error occurred');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleDelete = () => {
    showAlert(
      'warning',
      'Delete Chapter',
      `Are you sure you want to delete this ${isDraft ? 'draft' : 'chapter'}? This action is permanent.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!chapterId) {
              showToast('error', 'Chapter ID is missing');
              return;
            }
            try {
              if (isDraft) {
                const draftKey = `chapter_draft_${novelId}`;
                const draftsJson = await AsyncStorage.getItem(draftKey);
                if (draftsJson) {
                  const drafts = JSON.parse(draftsJson);
                  const updatedDrafts = drafts.filter((d: any) => d.id !== chapterId);
                  await AsyncStorage.setItem(draftKey, JSON.stringify(updatedDrafts));
                }
              } else {
                const result = await chapterService.deleteChapter(chapterId);
                if (!result.success) {
                  showToast('error', result.message || 'Failed to delete chapter');
                  return;
                }
              }
              showToast('success', `${isDraft ? 'Draft' : 'Chapter'} deleted successfully!`);
              navigation.goBack();
            } catch (error) {
              console.error('Error during deletion:', error);
              showToast('error', 'An unexpected error occurred during deletion');
            }
          }
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.sky500} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading chapter...</Text>
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
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{isDraft ? 'Edit Draft' : 'Edit Chapter'}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Feather name="trash-2" size={20} color={colors.red600} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Novel Info Card */}
        <View style={[styles.novelInfoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <Text style={[styles.novelInfoLabel, { color: theme.textSecondary }]}>Editing chapter from:</Text>
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
            editable={isDraft} // Only editable for drafts
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
          <Text style={styles.wordCount}>
            {wordCount} words • {charCount} characters
          </Text>
          {errors.content && (
            <Text style={styles.errorText}>{errors.content}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.updateButton, isUpdating && { opacity: 0.7 }]}
            onPress={isDraft ? handlePublish : handleUpdate}
            disabled={isUpdating}
            activeOpacity={0.8}
          >
            {isUpdating ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.updateButtonText}>
                {isDraft ? 'Publish Chapter' : 'Update Chapter'}
              </Text>
            )}
          </TouchableOpacity>

          {isDraft && (
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { backgroundColor: theme.backgroundSecondary },
                isUpdating && { opacity: 0.7 }
              ]}
              onPress={handleUpdate}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>Save Draft</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
          </TouchableOpacity>
        </View>

        {/* Last Updated Info */}
        <View style={[styles.infoCard, isDarkMode && { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={styles.infoHeader}>
            <Feather name="info" size={16} color={colors.sky600} />
            <Text style={[styles.infoTitle, isDarkMode && { color: colors.sky200 }]}>Last Updated</Text>
          </View>
          <Text style={[styles.infoText, isDarkMode && { color: colors.sky200 }]}>{lastUpdated}</Text>
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
  deleteButton: {
    padding: spacing[2],
    marginRight: -spacing[2],
    borderRadius: borderRadius.lg,
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
  updateButton: {
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
  updateButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  cancelButton: {
    width: '100%',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    backgroundColor: colors.slate100,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate700,
  },
  infoCard: {
    padding: spacing[4],
    backgroundColor: '#eff6ff', // sky-50
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#dbeafe', // sky-100
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    marginBottom: spacing[0.5],
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: '#0c4a6e', // sky-900
  },
  infoText: {
    fontSize: 12,
    color: '#075985', // sky-700
    marginTop: spacing[0.5],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: colors.slate500,
    fontSize: 14,
  },
});

export default EditChapterScreen;
