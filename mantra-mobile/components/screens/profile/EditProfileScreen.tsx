import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useToast } from '../../ToastManager';
import { useTheme } from '../../../context/ThemeContext';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import authService from '../../../services/authService';
import profileService from '../../../services/profileService';
import storageService from '../../../services/storageService';
import imageCacheService from '../../../services/imageCacheService';
import { getUserProfileImage } from '../../../utils/profileUtils';

interface EditProfileScreenProps {
  navigation: any;
}

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese', 'Russian', 'Arabic'];
const GENRES = ['Fantasy', 'Romance', 'Sci-Fi', 'Mystery', 'Thriller', 'Horror', 'Adventure', 'Drama', 'Comedy', 'Historical', 'Urban', 'Martial Arts'];

const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null); // Start with null to avoid flash
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [language, setLanguage] = useState('English');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);



  const { showToast } = useToast();
  const { theme, isDarkMode } = useTheme();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        navigation.navigate('Login');
        return;
      }

      setCurrentUserId(user.id);

      const profile = await profileService.getProfile(user.id);
      if (profile) {
        setName(profile.display_name || '');
        setUsername(profile.username || '');
        setBio(profile.bio || '');
        setGender(profile.gender || 'Male');
        setAge(profile.age?.toString() || '');
        setLanguage(profile.preferred_language || 'English');
        setSelectedGenres(profile.favorite_genres || []);

        // Get profile image with caching
        const imageUrl = getUserProfileImage(profile);

        // Check if image is cached
        const cachedImage = await imageCacheService.getCachedImage(user.id, imageUrl);
        if (cachedImage) {
          setProfileImage(cachedImage);
        } else {
          setProfileImage(imageUrl);
          // Cache the image URL
          await imageCacheService.cacheImage(user.id, imageUrl);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast('error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        showToast('error', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri, result.assets[0].fileName || 'profile.jpg');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('error', 'Failed to pick image. Please try again.');
    }
  };

  const uploadProfileImage = async (uri: string, fileName: string) => {
    if (!currentUserId) return;

    setIsUploadingImage(true);
    setShowImageOptions(false);

    try {
      // Upload to Supabase Storage
      const uploadResult = await storageService.uploadProfilePicture(currentUserId, uri, fileName);

      if (!uploadResult.success || !uploadResult.url) {
        showToast('error', uploadResult.message);
        return;
      }

      // Update profile with new image URL
      const updateResult = await profileService.updateProfilePicture(currentUserId, uploadResult.url);

      if (updateResult.success) {
        setProfileImage(uploadResult.url);

        // Clear old cache and cache new image
        await imageCacheService.clearCache(currentUserId);
        await imageCacheService.cacheImage(currentUserId, uploadResult.url);

        showToast('success', 'Profile photo updated!');
      } else {
        showToast('error', updateResult.message);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('error', 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        showToast('error', 'Permission to access camera is required!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfileImage(result.assets[0].uri, result.assets[0].fileName || 'profile.jpg');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showToast('error', 'Failed to take photo. Please try again.');
    }
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleSave = async () => {
    if (!currentUserId) return;

    // Validation
    if (!name.trim()) {
      showToast('error', 'Display name is required');
      return;
    }

    if (selectedGenres.length > 3) {
      showToast('error', 'You can select up to 3 favorite genres');
      return;
    }

    if (age && (parseInt(age) < 13 || parseInt(age) > 120)) {
      showToast('error', 'Age must be between 13 and 120');
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        display_name: name.trim(),
        bio: bio.trim(),
        age: age ? parseInt(age) : undefined,
        gender: gender.toLowerCase() as 'male' | 'female' | 'other' | 'prefer_not_to_say',
        favorite_genres: selectedGenres,
        preferred_language: language,
      };

      const response = await profileService.updateProfile(currentUserId, updateData);

      if (response.success) {
        showToast('success', 'Profile updated successfully!');
        setTimeout(() => {
          navigation.goBack();
        }, 500);
      } else {
        showToast('error', response.message);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          activeOpacity={0.7}
          disabled={isSaving || isLoading}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={() => {
          if (showGenderDropdown || showLanguageDropdown) {
            setShowGenderDropdown(false);
            setShowLanguageDropdown(false);
          }
        }}
        scrollEventThrottle={16}
      >
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <ActivityIndicator size="small" color={colors.sky500} />
              </View>
            )}
            {isUploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator size="large" color={colors.white} />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowImageOptions(true)}
              activeOpacity={0.7}
              disabled={isUploadingImage}
            >
              <Feather name="camera" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {/* Username */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Username</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
            value={username}
            onChangeText={setUsername}
            placeholder="@username"
            placeholderTextColor={theme.textSecondary}
          />
        </View>

        {/* Bio */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Gender and Age */}
        <View style={[styles.row, { zIndex: 100 }]}>
          <View style={styles.halfWidth}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Gender</Text>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
              onPress={() => {
                setShowLanguageDropdown(false);
                setShowGenderDropdown(!showGenderDropdown);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.selectText, { color: theme.text }]}>{gender}</Text>
              <Feather name="chevron-down" size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            {showGenderDropdown && (
              <View style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {GENDERS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                      onPress={() => {
                        setGender(g);
                        setShowGenderDropdown(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dropdownItemText, { color: theme.text }]}>{g}</Text>
                      {gender === g && (
                        <Feather name="check" size={16} color={colors.sky500} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.halfWidth}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Age</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
              value={age}
              onChangeText={setAge}
              placeholder="25"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Language */}
        <View style={[styles.inputGroup, { zIndex: 90 }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Language</Text>
          <TouchableOpacity
            style={[styles.selectButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
            onPress={() => {
              setShowGenderDropdown(false);
              setShowLanguageDropdown(!showLanguageDropdown);
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.selectText, { color: theme.text }]}>{language}</Text>
            <Feather name="chevron-down" size={16} color={theme.textSecondary} />
          </TouchableOpacity>

          {showLanguageDropdown && (
            <View style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ScrollView style={styles.dropdownScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.dropdownItem, { borderBottomColor: theme.border }]}
                    onPress={() => {
                      setLanguage(lang);
                      setShowLanguageDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.dropdownItemText, { color: theme.text }]}>{lang}</Text>
                    {language === lang && (
                      <Feather name="check" size={16} color={colors.sky500} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Favorite Genres */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Favorite Genres</Text>
          <Text style={[styles.helperText, { color: theme.textSecondary }]}>Select your favorite genres</Text>
          <View style={styles.genresContainer}>
            {GENRES.map((genre) => (
              <TouchableOpacity
                key={genre}
                style={[
                  styles.genreChip,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  selectedGenres.includes(genre) && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
                onPress={() => toggleGenre(genre)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.genreChipText,
                  { color: theme.textSecondary },
                  selectedGenres.includes(genre) && { color: colors.white }
                ]}>
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>



      {/* Image Options Modal */}
      <Modal
        visible={showImageOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Change Profile Photo</Text>

            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: theme.inputBackground }]}
              onPress={() => {
                setShowImageOptions(false);
                takePhoto();
              }}
              activeOpacity={0.7}
            >
              <Feather name="camera" size={20} color={theme.text} />
              <Text style={[styles.modalOptionText, { color: theme.text }]}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, { backgroundColor: theme.inputBackground }]}
              onPress={() => {
                setShowImageOptions(false);
                pickImage();
              }}
              activeOpacity={0.7}
            >
              <Feather name="image" size={20} color={theme.text} />
              <Text style={[styles.modalOptionText, { color: theme.text }]}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.modalCancelOption, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
              onPress={() => setShowImageOptions(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalCancelText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    backgroundColor: colors.white,
    zIndex: 40,
  },
  backButton: {
    padding: spacing[2],
    borderRadius: borderRadius.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    flex: 1,
    marginLeft: spacing[2],
  },
  saveButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    backgroundColor: colors.sky500,
  },
  saveButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[24],
    gap: spacing[4],
  },
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  photoContainer: {
    position: 'relative',
  },
  profileImage: {
    height: 64,
    width: 64,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  profileImagePlaceholder: {
    backgroundColor: colors.slate100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    height: 28,
    width: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.sky500,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    gap: spacing[1],
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.slate500,
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.fontSize.sm,
    backgroundColor: colors.white,
    color: colors.slate800,
  },
  textArea: {
    height: 80,
    paddingTop: spacing[2],
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  halfWidth: {
    flex: 1,
    position: 'relative',
  },
  selectButton: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  selectText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate800,
  },
  dropdown: {
    position: 'absolute',
    top: 64,
    right: 0,
    marginRight: 15,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: borderRadius.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 1000,
    maxHeight: 200,
    minWidth: 150,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  dropdownItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate800,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: spacing[4],
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing[4],
    gap: spacing[2],
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.slate50,
  },
  modalOptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate700,
    fontWeight: typography.fontWeight.medium,
  },
  modalCancelOption: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    justifyContent: 'center',
    marginTop: spacing[2],
  },
  modalCancelText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate700,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 11,
    color: colors.slate400,
    marginTop: -spacing[0.5],
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  genreChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
  },
  genreChipSelected: {
    backgroundColor: colors.sky500,
    borderColor: colors.sky500,
  },
  genreChipText: {
    fontSize: typography.fontSize.xs,
    color: colors.slate700,
    fontWeight: typography.fontWeight.medium,
  },
  genreChipTextSelected: {
    color: colors.white,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[2],
  },
  uploadingText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
});

export default EditProfileScreen;
