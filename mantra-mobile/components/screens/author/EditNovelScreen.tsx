import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  SafeAreaView,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../context/ThemeContext';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useToast } from '../../ToastManager';
import { supabase } from '../../../config/supabase';
import novelService from '../../../services/novelService';

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese', 'Russian', 'Arabic', 'Hindi', 'Tamil', 'Sanskrit', 'Other'];

const EditNovelScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();
  const { theme, isDarkMode } = useTheme();
  const { novelId } = (route.params as any) || { novelId: '1' };

  // Pre-populate with existing novel data
  const [title, setTitle] = useState('Echoes of Dawn');
  const [description, setDescription] = useState(
    'In a world where magic and technology collide, young Aria discovers she holds the key to preventing an ancient prophecy from destroying everything she holds dear.'
  );
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?q=80&w=200&auto=format&fit=crop'
  );
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Fantasy', 'Adventure', 'Romance']);
  const [tags, setTags] = useState<string[]>(['detective', 'noir', 'crime']);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState('ongoing');
  const [language, setLanguage] = useState('English');
  const [customLanguage, setCustomLanguage] = useState('');
  const [matureContent, setMatureContent] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteNovelModal, setShowDeleteNovelModal] = useState(false);

  // Load novel data from database
  useEffect(() => {
    loadNovelData();
  }, [novelId]);

  const loadNovelData = async () => {
    try {
      setIsLoading(true);

      const { data: novelData, error } = await supabase
        .from('novels')
        .select('*')
        .eq('id', novelId)
        .single();

      if (error) {
        console.error('Error loading novel:', error);
        showToast('error', 'Failed to load novel data');
        return;
      }

      if (novelData) {
        setTitle(novelData.title || '');
        setDescription(novelData.description || '');
        setCoverImage(novelData.cover_image_url || '');
        setSelectedGenres(novelData.genres || []);
        setTags(novelData.tags || []);
        setStatus(novelData.status || 'ongoing');
        setLanguage(novelData.language || 'English');
        setMatureContent(novelData.is_mature || false);

        // Handle custom language
        if (novelData.language && !LANGUAGES.includes(novelData.language)) {
          setLanguage('Other');
          setCustomLanguage(novelData.language);
        }
      }
    } catch (error) {
      console.error('Error loading novel:', error);
      showToast('error', 'Failed to load novel data');
    } finally {
      setIsLoading(false);
    }
  };

  const availableGenres = [
    'Romance',
    'Fantasy',
    'Action',
    'Adventure',
    'Drama',
    'Mystery',
    'Thriller',
    'Isekai',
    'Reincarnation',
    'Slice of Life',
    'Werewolf',
    'Supernatural',
    'Historical',
    'Psychological',
    'Dystopian',
    'Crime',
    'Sci-Fi',
    'Martial Arts',
    'Comedy',
    'Romantic Fantasy',
    'Mythology',
  ];

  const popularTags = [
    'detective',
    'noir',
    'crime',
    'conspiracy',
    'betrayal',
    'revenge',
    'magic',
    'cultivation',
    'system',
    'transmigration',
  ];

  const tagColors = [
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#f59e0b',
    '#10b981',
    '#06b6d4',
    '#6366f1',
    '#14b8a6',
    '#f97316',
    '#84cc16',
  ];

  const handleDeleteNovel = () => {
    setShowDeleteNovelModal(true);
  };

  const confirmDeleteNovel = async () => {
    try {
      setIsDeleting(true);
      const result = await novelService.deleteNovel(novelId);

      if (result.success) {
        showToast('success', 'Novel deleted successfully');
        setShowDeleteNovelModal(false);
        // Navigate back to dashboard
        navigation.navigate('AuthorDashboard' as never);
      } else {
        showToast('error', result.message || 'Failed to delete novel');
        setIsDeleting(false);
      }
    } catch (error: any) {
      console.error('Error deleting novel:', error);
      showToast('error', error.message || 'Failed to delete novel');
      setIsDeleting(false);
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
      clearError('genres');
    } else if (selectedGenres.length < 3) {
      setSelectedGenres([...selectedGenres, genre]);
      clearError('genres');
    } else {
      showToast('error', 'You can only select up to 3 genres');
    }
  };

  const handleAddCustomTag = () => {
    const tag = tagInput.trim();
    if (!tag) return;

    if (tags.length >= 10) {
      showToast('error', 'You can add up to 10 tags');
      return;
    }

    if (tags.includes(tag)) {
      setTagInput('');
      return;
    }

    setTags([...tags, tag]);
    setTagInput('');
  };

  const handleAddPopularTag = (tag: string) => {
    if (tags.length >= 10) {
      showToast('error', 'You can add up to 10 tags');
      return;
    }

    if (tags.includes(tag)) return;

    setTags([...tags, tag]);
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showToast('error', 'Please grant camera roll permissions');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCoverImage(result.assets[0].uri);
        clearError('coverImage');
      }
    } catch (error) {
      showToast('error', 'Failed to pick image');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (selectedGenres.length === 0) {
      newErrors.genres = 'Please select at least one genre (max 3)';
    }
    if (!status) {
      newErrors.status = 'Please select a status';
    }
    if (!language) {
      newErrors.language = 'Please select a language';
    }
    if (language === 'Other' && !customLanguage.trim()) {
      newErrors.customLanguage = 'Please enter the language name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        showToast('error', firstError);
      }
      return;
    }

    const finalLanguage = language === 'Other' ? customLanguage.trim() : language;

    try {
      // Update novel in database
      const { error: updateError } = await supabase
        .from('novels')
        .update({
          title: title.trim(),
          description: description.trim(),
          genres: selectedGenres,
          tags: tags,
          status: status,
          language: finalLanguage,
          is_mature: matureContent,
        })
        .eq('id', novelId);

      if (updateError) {
        console.error('Error updating novel:', updateError);
        showToast('error', 'Failed to update novel');
        return;
      }

      console.log('Novel Updated Successfully');
      showToast('success', '✓ Saved successfully!');
      navigation.goBack();
    } catch (error: any) {
      console.error('Error updating novel:', error);
      showToast('error', error.message || 'Failed to update novel');
    }
  };

  // Show loading state while fetching novel data
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={colors.sky500} />
          <Text style={{ marginTop: 16, color: theme.textSecondary, fontSize: 14 }}>Loading novel data...</Text>
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
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Novel Info</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveChanges}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        onScroll={() => {
          if (showLanguageDropdown) {
            setShowLanguageDropdown(false);
          }
        }}
        scrollEventThrottle={16}
      >
        {/* Cover Image Section */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Cover Image</Text>
          <View style={styles.coverRow}>
            <View style={[styles.coverPreviewContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
              <Image source={{ uri: coverImage }} style={styles.coverImagePreview} />
            </View>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handleImagePicker}
              activeOpacity={0.7}
            >
              <Feather name="upload" size={16} color={theme.text} />
              <Text style={[styles.uploadButtonText, { color: theme.text }]}>Change Cover</Text>
            </TouchableOpacity>
          </View>
          {errors.coverImage && <Text style={styles.errorText}>{errors.coverImage}</Text>}
        </View>

        {/* Title Section */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Title</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }, errors.title && styles.inputError]}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              clearError('title');
            }}
            placeholder="Enter novel title"
            placeholderTextColor={theme.textSecondary}
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Description</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }, errors.description && styles.inputError]}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              clearError('description');
            }}
            placeholder="Write a compelling description for your novel..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        {/* Genres Section */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Genres (select up to 3)</Text>
          <View style={styles.genresGrid}>
            {availableGenres.map((genre) => (
              <TouchableOpacity
                key={genre}
                style={[
                  styles.genreButton,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  selectedGenres.includes(genre) && { backgroundColor: theme.primary, borderColor: 'transparent' },
                ]}
                onPress={() => handleGenreToggle(genre)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.genreButtonText,
                    { color: theme.text },
                    selectedGenres.includes(genre) && { color: colors.white },
                  ]}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.genres && <Text style={styles.errorText}>{errors.genres}</Text>}
        </View>

        {/* Tags Section */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Tags (up to 10)</Text>

          {/* Added Tags Display */}
          {tags.length > 0 && (
            <View style={styles.tagsDisplay}>
              {tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.tagButton, { backgroundColor: tagColors[index % 10] }]}
                  onPress={() => handleRemoveTag(index)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tagButtonText}>{tag}</Text>
                  <Text style={styles.tagRemoveIcon}>×</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Tag Input with Button */}
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.tagInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Type a tag..."
              placeholderTextColor={theme.textSecondary}
              onSubmitEditing={handleAddCustomTag}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addTagButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
              onPress={handleAddCustomTag}
              activeOpacity={0.7}
            >
              <Text style={[styles.addTagButtonText, { color: theme.text }]}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Popular Tags */}
          <View style={styles.popularTagsSection}>
            <Text style={[styles.popularTagsLabel, { color: theme.textSecondary }]}>Popular Tags:</Text>
            <View style={styles.popularTagsGrid}>
              {popularTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.popularTagButton,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    tags.includes(tag) && styles.popularTagButtonAdded,
                  ]}
                  onPress={() => handleAddPopularTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.popularTagButtonText, { color: theme.textSecondary }]}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Status Section */}
        <View style={[styles.section, { zIndex: 70 }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Status</Text>
          <TouchableOpacity
            style={[styles.dropdown, { backgroundColor: theme.inputBackground, borderColor: theme.border }, errors.status && styles.inputError]}
            onPress={() => {
              setShowLanguageDropdown(false);
              setShowStatusModal(true);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.dropdownText, { color: theme.text }]}>
              {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Select status'}
            </Text>
            <Feather name="chevron-down" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          {errors.status && <Text style={styles.errorText}>{errors.status}</Text>}
        </View>

        {/* Language Section */}
        <View style={[styles.section, { zIndex: 80 }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Language *</Text>
          <TouchableOpacity
            style={[styles.dropdown, { backgroundColor: theme.inputBackground, borderColor: theme.border }, errors.language && styles.inputError]}
            onPress={() => {
              setShowStatusModal(false);
              setShowLanguageDropdown(!showLanguageDropdown);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.dropdownText, { color: theme.text }]}>{language}</Text>
            <Feather name="chevron-down" size={20} color={theme.textSecondary} />
          </TouchableOpacity>

          {showLanguageDropdown && (
            <View style={[styles.languageDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ScrollView
                style={styles.languageDropdownScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.dropdownOption, { borderBottomColor: theme.border }]}
                    onPress={() => {
                      setLanguage(lang);
                      setShowLanguageDropdown(false);
                      clearError('language');
                      if (lang !== 'Other') {
                        setCustomLanguage('');
                        clearError('customLanguage');
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dropdownOptionText, { color: theme.text }]}>{lang}</Text>
                    {language === lang && (
                      <Feather name="check" size={20} color={colors.sky500} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {errors.language && (
            <Text style={styles.errorText}>{errors.language}</Text>
          )}

          {/* Custom Language Input */}
          {language === 'Other' && (
            <View style={styles.customLanguageContainer}>
              <TextInput
                style={[styles.input, errors.customLanguage && styles.inputError, { marginTop: 8, backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                value={customLanguage}
                onChangeText={(text) => {
                  setCustomLanguage(text);
                  clearError('customLanguage');
                }}
                placeholder="Enter language name"
                placeholderTextColor={theme.textSecondary}
              />
              {errors.customLanguage && (
                <Text style={styles.errorText}>{errors.customLanguage}</Text>
              )}
            </View>
          )}
        </View>

        {/* Mature Content Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setMatureContent(!matureContent)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, matureContent && styles.checkboxChecked, { borderColor: theme.border, backgroundColor: theme.inputBackground }, matureContent && { backgroundColor: theme.primary, borderColor: theme.primary }]}>
              {matureContent && <Feather name="check" size={14} color={colors.white} />}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.text }]}>This novel contains mature content (18+)</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Novel Section */}
        <View style={[styles.section, { borderTopWidth: 1, borderTopColor: theme.border, marginTop: 20 }]}>
          <TouchableOpacity
            style={[styles.deleteNovelButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleDeleteNovel}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={18} color={colors.red500} />
            <Text style={[styles.deleteNovelButtonText, { color: colors.red500 }]}>Delete Novel</Text>
          </TouchableOpacity>
          <Text style={[styles.deleteInfoText, { color: theme.textSecondary }]}>
            Deleting this novel will permanently remove all chapters, reviews, and analytics. This action cannot be undone.
          </Text>
        </View>
      </ScrollView>

      {/* Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <TouchableOpacity
              style={[styles.modalOption, { borderBottomColor: theme.border }]}
              onPress={() => {
                setStatus('ongoing');
                setShowStatusModal(false);
                clearError('status');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalOptionText, { color: theme.text }]}>Ongoing</Text>
              {status === 'ongoing' && <Feather name="check" size={20} color={colors.sky500} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, { borderBottomColor: theme.border }]}
              onPress={() => {
                setStatus('completed');
                setShowStatusModal(false);
                clearError('status');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalOptionText, { color: theme.text }]}>Completed</Text>
              {status === 'completed' && <Feather name="check" size={20} color={colors.sky500} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, { borderBottomColor: theme.border }]}
              onPress={() => {
                setStatus('hiatus');
                setShowStatusModal(false);
                clearError('status');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalOptionText, { color: theme.text }]}>Hiatus</Text>
              {status === 'hiatus' && <Feather name="check" size={20} color={colors.sky500} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, styles.modalOptionLast]}
              onPress={() => {
                setStatus('dropped');
                setShowStatusModal(false);
                clearError('status');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalOptionText, { color: theme.text }]}>Dropped</Text>
              {status === 'dropped' && <Feather name="check" size={20} color={colors.sky500} />}
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
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !isDeleting && setShowDeleteNovelModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.deleteModalTitle, { color: theme.text }]}>Delete Novel?</Text>
            <Text style={[styles.deleteModalText, { color: theme.textSecondary }]}>
              Are you sure you want to delete "{title}"? This will permanently remove all chapters, reviews, and analytics. This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowDeleteNovelModal(false)}
                disabled={isDeleting}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
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
        </TouchableOpacity>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate900,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.sky500,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 80,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.slate500,
    marginBottom: 10,
  },
  coverRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  coverPreviewContainer: {
    width: 100,
    height: 140,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    backgroundColor: colors.slate50,
    overflow: 'hidden',
  },
  coverImagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  uploadButtonText: {
    fontSize: 14,
    color: colors.slate700,
  },
  input: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 8,
    fontSize: 14,
    color: colors.slate900,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.red500,
  },
  textArea: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 8,
    fontSize: 14,
    color: colors.slate700,
    backgroundColor: colors.white,
    height: 120,
    textAlignVertical: 'top',
  },
  genresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: colors.slate100,
  },
  genreButtonSelected: {
    backgroundColor: colors.sky500,
  },
  genreButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate500,
  },
  genreButtonTextSelected: {
    color: colors.white,
  },
  tagsDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
    minHeight: 32,
  },
  tagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  tagButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
  },
  tagRemoveIcon: {
    fontSize: 16,
    lineHeight: 16,
    fontWeight: '500',
    color: colors.white,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 8,
    fontSize: 14,
    color: colors.slate900,
    backgroundColor: colors.white,
  },
  addTagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.slate100,
    borderRadius: 8,
  },
  addTagButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.slate700,
  },
  popularTagsSection: {
    marginBottom: 8,
  },
  popularTagsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.slate500,
    marginBottom: 8,
  },
  popularTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  popularTagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
  },
  popularTagButtonAdded: {
    backgroundColor: colors.slate100,
    borderColor: '#cbd5e1',
  },
  popularTagButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.slate500,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  dropdownText: {
    fontSize: 14,
    color: colors.slate900,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.sky500,
    borderColor: colors.sky500,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.slate700,
  },
  errorText: {
    fontSize: 12,
    color: colors.red500,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  modalOptionLast: {
    borderBottomWidth: 0,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.slate900,
  },
  languageDropdown: {
    position: 'absolute',
    top: 64,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 1000,
    maxHeight: 200,
  },
  languageDropdownScroll: {
    maxHeight: 200,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  dropdownOptionText: {
    fontSize: 14,
    color: colors.slate900,
  },
  customLanguageContainer: {
    width: '100%',
  },
  deleteNovelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  deleteNovelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.red500,
  },
  deleteInfoText: {
    fontSize: 12,
    color: colors.slate500,
    lineHeight: 18,
    marginTop: 4,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.slate900,
    marginBottom: 12,
  },
  deleteModalText: {
    fontSize: 14,
    color: colors.slate600,
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
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.slate100,
  },
  modalButtonDelete: {
    backgroundColor: colors.red500,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate700,
  },
});

export default EditNovelScreen;
