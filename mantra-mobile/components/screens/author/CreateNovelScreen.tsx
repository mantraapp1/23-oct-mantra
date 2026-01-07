import React, { useState } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../context/ThemeContext';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../ToastManager';
import { supabase } from '../../../config/supabase';
import authService from '../../../services/authService';

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese', 'Russian', 'Arabic', 'Hindi', 'Tamil', 'Sanskrit', 'Other'];

const CreateNovelScreen = () => {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { theme, isDarkMode } = useTheme();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState('ongoing');
  const [language, setLanguage] = useState('English');
  const [customLanguage, setCustomLanguage] = useState('');
  const [matureContent, setMatureContent] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);

  const availableGenres = [
    'Romance', 'Fantasy', 'Action', 'Adventure', 'Drama', 'Mystery',
    'Thriller', 'Isekai', 'Reincarnation', 'Slice of Life', 'Werewolf',
    'Supernatural', 'Historical', 'Psychological', 'Dystopian', 'Crime',
    'Sci-Fi', 'Martial Arts', 'Comedy', 'Romantic Fantasy', 'Mythology'
  ];

  const popularTags = [
    'strong-protagonist', 'system', 'cultivation', 'transmigration',
    'magic', 'revenge', 'academy', 'kingdom-building', 'level-up', 'modern-day'
  ];

  const tagColors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#06b6d4', '#6366f1', '#14b8a6', '#f97316', '#84cc16'
  ];

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGenreToggle = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
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

    if (!coverImage) {
      newErrors.coverImage = 'Cover image is required';
    }
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

  const handleCreate = async () => {
    if (!validateForm()) {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        showToast('error', firstError);
      }
      return;
    }

    try {
      setIsCreating(true);

      // Get current user
      const user = await authService.getCurrentUser();
      if (!user) {
        showToast('error', 'You must be logged in to create a novel');
        return;
      }

      // STEP 1: Create novel in database FIRST (without cover image)
      const finalLanguage = language === 'Other' ? customLanguage.trim() : language;

      const { data: novelData, error: novelError } = await supabase
        .from('novels')
        .insert({
          title: title.trim(),
          description: description.trim(),
          cover_image_url: null, // Will update after upload
          genres: selectedGenres,
          tags: tags,
          status: status,
          language: finalLanguage,
          is_mature: matureContent,
          author_id: user.id,
          total_chapters: 0,
          total_views: 0,
          total_votes: 0,
          total_reviews: 0,
          average_rating: 0
        })
        .select()
        .single();

      if (novelError) {
        console.error('Error creating novel:', novelError);
        throw novelError;
      }

      console.log('✅ Novel created in database with ID:', novelData.id);
      console.log('Full novel data:', novelData);

      // STEP 2: Upload cover image AFTER novel exists (so storage policy works)
      let coverImageUrl = '';
      if (coverImage && novelData) {
        try {
          const fileName = `${novelData.id}/${Date.now()}.jpg`;
          const response = await fetch(coverImage);
          const blob = await response.blob();

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('novel-covers')
            .upload(fileName, blob, {
              contentType: 'image/jpeg',
              upsert: false
            });

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('novel-covers')
            .getPublicUrl(fileName);

          coverImageUrl = publicUrl;
          console.log('Cover image uploaded:', coverImageUrl);

          // STEP 3: Update novel with cover image URL
          const { error: updateError } = await supabase
            .from('novels')
            .update({
              cover_image_url: coverImageUrl
            })
            .eq('id', novelData.id);

          if (updateError) {
            console.error('Error updating cover URL:', updateError);
            // Don't fail the whole operation if just the image update fails
          }
        } catch (uploadError: any) {
          console.error('Error uploading cover image:', uploadError);
          // Don't fail - novel is already created
          showToast('warning', 'Novel created but cover image upload failed');
        }
      }

      console.log('Novel Created Successfully:', novelData);
      showToast('success', '✓ Novel created successfully! You can now add chapters.');

      // Reset navigation to AuthorDashboard, then navigate to NovelManage
      // This ensures back button goes to AuthorDashboard, not CreateNovel
      navigation.reset({
        index: 1,
        routes: [
          { name: 'AuthorDashboard' as never },
          { name: 'NovelManage' as never, params: { novelId: novelData.id } as never }
        ],
      });
    } catch (error: any) {
      console.error('Error creating novel:', error);
      showToast('error', error.message || 'Failed to create novel');
    } finally {
      setIsCreating(false);
    }
  };

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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Create Novel</Text>
        <TouchableOpacity
          style={[styles.createButton, isCreating && styles.createButtonDisabled]}
          onPress={handleCreate}
          activeOpacity={0.7}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
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
          <Text style={[styles.label, { color: theme.textSecondary }]}>Cover Image *</Text>
          <View style={styles.coverRow}>
            <View style={[styles.coverPreviewContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
              {coverImage ? (
                <Image source={{ uri: coverImage }} style={styles.coverImagePreview} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Feather name="image" size={32} color={theme.textSecondary} />
                  <Text style={[styles.coverPlaceholderText, { color: theme.textSecondary }]}>Cover{'\n'}Image</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handleImagePicker}
              activeOpacity={0.7}
            >
              <Feather name="upload" size={16} color={theme.text} />
              <Text style={[styles.uploadButtonText, { color: theme.text }]}>Upload Cover</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.helperText, { color: theme.textSecondary }]}>Recommended: 800x1200px, Max: 5MB</Text>
          {errors.coverImage && (
            <Text style={styles.errorText}>{errors.coverImage}</Text>
          )}
        </View>

        {/* Title Section */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Novel Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }, errors.title && styles.inputError]}
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              clearError('title');
            }}
            placeholder="Enter your novel title"
            placeholderTextColor={theme.textSecondary}
          />
          {errors.title && (
            <Text style={styles.errorText}>{errors.title}</Text>
          )}
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Description *</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }, errors.description && styles.inputError]}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              clearError('description');
            }}
            placeholder="Write a compelling description that will hook readers..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text style={[styles.helperText, { color: theme.textSecondary }]}>
            Describe your story, main characters, and what makes it unique
          </Text>
          {errors.description && (
            <Text style={styles.errorText}>{errors.description}</Text>
          )}
        </View>

        {/* Genres Section */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Genres * (select up to 3)</Text>
          <View style={styles.genresGrid}>
            {availableGenres.map((genre) => (
              <TouchableOpacity
                key={genre}
                style={[
                  styles.genreButton,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  selectedGenres.includes(genre) && { backgroundColor: theme.primary, borderColor: 'transparent' }
                ]}
                onPress={() => handleGenreToggle(genre)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.genreButtonText,
                  { color: theme.text },
                  selectedGenres.includes(genre) && { color: colors.white }
                ]}>
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.genres && (
            <Text style={styles.errorText}>{errors.genres}</Text>
          )}
        </View>

        {/* Tags Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Tags (up to 10)</Text>

          {/* Added Tags Display */}
          {tags.length > 0 && (
            <View style={styles.tagsDisplay}>
              {tags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.tagButton,
                    { backgroundColor: tagColors[index % 10] }
                  ]}
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
              style={styles.tagInput}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Type a tag..."
              placeholderTextColor={colors.slate400}
              onSubmitEditing={handleAddCustomTag}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.addTagButton}
              onPress={handleAddCustomTag}
              activeOpacity={0.7}
            >
              <Text style={styles.addTagButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Popular Tags */}
          <View style={styles.popularTagsSection}>
            <Text style={styles.popularTagsLabel}>Popular Tags:</Text>
            <View style={styles.popularTagsGrid}>
              {popularTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.popularTagButton,
                    tags.includes(tag) && styles.popularTagButtonAdded
                  ]}
                  onPress={() => handleAddPopularTag(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.popularTagButtonText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text style={styles.helperText}>Tags help readers discover your story</Text>
        </View>

        {/* Status Section */}
        <View style={[styles.section, { zIndex: 70 }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Status *</Text>
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
          {errors.status && (
            <Text style={styles.errorText}>{errors.status}</Text>
          )}
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
            <View style={styles.languageDropdown}>
              <ScrollView
                style={styles.languageDropdownScroll}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}
              >
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={styles.dropdownOption}
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
                    <Text style={styles.dropdownOptionText}>{lang}</Text>
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
              {matureContent && (
                <Feather name="check" size={14} color={colors.white} />
              )}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.text }]}>
              This novel contains mature content (18+)
            </Text>
          </TouchableOpacity>
          <Text style={[styles.helperText, { marginLeft: 28, color: theme.textSecondary }]}>
            Check this if your story contains violence, explicit content, or mature themes
          </Text>
        </View>

        {/* Publishing Info */}
        <View style={[styles.infoBox, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.infoBoxHeader}>
            <Feather name="info" size={16} color={colors.sky600} />
            <Text style={[styles.infoBoxTitle, { color: theme.text }]}>Publishing Your Novel</Text>
          </View>
          <Text style={[styles.infoBoxText, { color: theme.textSecondary }]}>
            After creating your novel, you'll be able to add chapters and publish them for readers. You can save as draft or publish immediately.
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
              {status === 'ongoing' && (
                <Feather name="check" size={20} color={colors.sky500} />
              )}
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
              {status === 'completed' && (
                <Feather name="check" size={20} color={colors.sky500} />
              )}
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
              {status === 'hiatus' && (
                <Feather name="check" size={20} color={colors.sky500} />
              )}
            </TouchableOpacity>
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
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.sky500,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
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
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    fontSize: 11,
    color: colors.slate400,
    textAlign: 'center',
    marginTop: 4,
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
  helperText: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 6,
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
  infoBox: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.sky50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.sky100,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0c4a6e',
  },
  infoBoxText: {
    fontSize: 12,
    color: colors.sky700,
    lineHeight: 18,
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
    maxWidth: 300,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
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
});

export default CreateNovelScreen;