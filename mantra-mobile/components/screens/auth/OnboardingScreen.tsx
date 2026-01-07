import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Image,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
// Removed Picker import - using custom dropdowns now
import { useToast } from '../../ToastManager';
import { useTheme } from '../../../context/ThemeContext';
import { colors, spacing, borderRadius, typography, LANGUAGES } from '../../../constants';
import authService from '../../../services/authService';
import profileService from '../../../services/profileService';


const { width } = Dimensions.get('window');

interface OnboardingScreenProps {
  navigation: any;
  route: any;
}

const GENRES = [
  'Fantasy', 'Sci-Fi', 'Romance', 'Thriller',
  'Mystery', 'Horror', 'Adventure', 'Slice of Life'
];

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
// LANGUAGES imported from constants

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation, route }) => {
  const prefillUsername = route?.params?.username || '';
  const [name, setName] = useState('');
  const [username, setUsername] = useState(prefillUsername);
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [language, setLanguage] = useState('All');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { theme } = useTheme();



  const [nameError, setNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [genderError, setGenderError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [languageError, setLanguageError] = useState('');
  const [genreError, setGenreError] = useState('');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  const { showToast } = useToast();

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else if (selectedGenres.length < 3) {
      setSelectedGenres([...selectedGenres, genre]);
    }
    setGenreError('');
  };

  const handleContinue = async () => {
    // Clear errors
    setNameError('');
    setUsernameError('');
    setGenderError('');
    setAgeError('');
    setLanguageError('');
    setGenreError('');

    let isValid = true;

    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    }

    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    }

    if (!gender) {
      setGenderError('Gender is required');
      isValid = false;
    }

    if (!age) {
      setAgeError('Age is required');
      isValid = false;
    } else if (parseInt(age) < 13) {
      setAgeError('You must be at least 13 years old');
      isValid = false;
    }

    if (!language) {
      setLanguageError('Language is required');
      isValid = false;
    }

    if (selectedGenres.length === 0) {
      setGenreError('Please select at least one genre');
      isValid = false;
    }

    if (isValid) {
      // Save profile data including language
      try {
        const currentUser = await authService.getCurrentUser();
        await profileService.updateProfile(currentUser?.id || '', {
          display_name: name,
          age: parseInt(age),
          gender: gender.toLowerCase() as any,
          preferred_language: language,
          favorite_genres: selectedGenres,
        });

        showToast('success', 'Profile created successfully!');
        setTimeout(() => {
          navigation.navigate('Main');
        }, 500);
      } catch (error) {
        console.error('Error updating profile:', error);
        // Still navigate even if profile update fails (non-blocking)
        // or show error toast based on preference
        navigation.navigate('Main');
      }
    }
  };

  return (
    <>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.screenWrapper}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
            onScroll={() => {
              if (showGenderDropdown || showLanguageDropdown) {
                setShowGenderDropdown(false);
                setShowLanguageDropdown(false);
              }
            }}
            scrollEventThrottle={16}
          >
            {/* Overlay to close dropdown when tapping outside */}
            {(showGenderDropdown || showLanguageDropdown) && (
              <TouchableOpacity
                style={styles.dropdownOverlay}
                activeOpacity={1}
                onPress={() => {
                  setShowGenderDropdown(false);
                  setShowLanguageDropdown(false);
                }}
              />
            )}

            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Set up your profile</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Tell us a bit about you</Text>
              </View>

              <View style={[styles.form, { zIndex: (showGenderDropdown || showLanguageDropdown) ? 1000 : 1 }]}>


                {/* Profile Photo and Name/Username Row */}
                <View style={styles.profileRow}>
                  <View style={styles.photoSection}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.profileImage} />
                    ) : (
                      <TouchableOpacity style={styles.photoPlaceholder} onPress={pickImage}>
                        <Feather name="image" size={24} color={colors.slate400} />
                        <Text style={styles.photoText}>Upload</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                      <Feather name="camera" size={16} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.nameUsernameContainer}>
                    <View style={styles.halfWidth}>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>Name <Text style={styles.required}>*</Text></Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }, nameError && styles.inputError]}
                        value={name}
                        onChangeText={(text) => {
                          setName(text);
                          setNameError('');
                        }}
                        placeholder="Your name"
                        placeholderTextColor={colors.slate400}
                      />
                      {nameError && <Text style={styles.errorText}>{nameError}</Text>}
                    </View>
                    <View style={styles.halfWidth}>
                      <Text style={[styles.label, { color: theme.textSecondary }]}>Username <Text style={styles.required}>*</Text></Text>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }, usernameError && styles.inputError]}
                        value={username}
                        onChangeText={(text) => {
                          setUsername(text);
                          setUsernameError('');
                        }}
                        placeholder="@username"
                        placeholderTextColor={colors.slate400}
                      />
                      {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
                    </View>
                  </View>
                </View>

                {/* Gender, Age, Language */}
                <View style={[styles.row, { zIndex: (showGenderDropdown || showLanguageDropdown) ? 1000 : 1 }]}>
                  <View style={styles.thirdWidth}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Gender <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity
                      style={[styles.dropdownButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }, genderError && styles.inputError]}
                      onPress={() => {
                        setShowLanguageDropdown(false);
                        setShowGenderDropdown(!showGenderDropdown);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dropdownText, gender && styles.dropdownTextSelected]}>
                        {gender || 'Select'}
                      </Text>
                      <Feather name="chevron-down" size={16} color={colors.slate400} />
                    </TouchableOpacity>
                    {genderError && <Text style={styles.errorText}>{genderError}</Text>}
                  </View>
                  <View style={styles.thirdWidth}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Age <Text style={styles.required}>*</Text></Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }, ageError && styles.inputError]}
                      value={age}
                      onChangeText={(text) => {
                        setAge(text);
                        setAgeError('');
                      }}
                      placeholder="18"
                      placeholderTextColor={colors.slate400}
                      keyboardType="numeric"
                    />
                    {ageError && <Text style={styles.errorText}>{ageError}</Text>}
                  </View>
                  <View style={styles.thirdWidth}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Language <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity
                      style={[styles.dropdownButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }, languageError && styles.inputError]}
                      onPress={() => {
                        setShowGenderDropdown(false);
                        setShowLanguageDropdown(!showLanguageDropdown);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.dropdownText, language && styles.dropdownTextSelected]}>
                        {language || 'Select'}
                      </Text>
                      <Feather name="chevron-down" size={16} color={colors.slate400} />
                    </TouchableOpacity>
                    {languageError && <Text style={styles.errorText}>{languageError}</Text>}
                  </View>
                </View>

                {/* Favorite Genres */}
                <View style={[styles.genreSection, { zIndex: 1 }]}>
                  <View style={styles.genreHeader}>
                    <Text style={[styles.genreTitle, { color: theme.text }]}>Favorite genres</Text>
                    <Text style={[styles.genreCount, { color: theme.textSecondary }]}>
                      Pick up to {selectedGenres.length}/3
                    </Text>
                  </View>
                  <View style={styles.genreContainer}>
                    {GENRES.map((genre) => (
                      <TouchableOpacity
                        key={genre}
                        style={[
                          styles.genreButton,
                          { backgroundColor: theme.card, borderColor: theme.border },
                          selectedGenres.includes(genre) && { backgroundColor: theme.primary, borderColor: theme.primary },
                        ]}
                        onPress={() => toggleGenre(genre)}
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
                  {genreError && <Text style={styles.errorText}>{genreError}</Text>}
                </View>

                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={handleContinue}
                  activeOpacity={0.95}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Gender Selection Modal */}
      <Modal
        visible={showGenderDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGenderDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGenderDropdown(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text, borderBottomColor: theme.border }]}>Select Gender</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: theme.border },
                    gender === g && { backgroundColor: theme.primaryLight }
                  ]}
                  onPress={() => {
                    setGender(g);
                    setGenderError('');
                    setShowGenderDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.modalOptionText,
                    { color: theme.text },
                    gender === g && { color: theme.primary, fontWeight: '600' }
                  ]}>{g}</Text>
                  {gender === g && (
                    <Feather name="check" size={20} color={colors.sky500} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageDropdown(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text, borderBottomColor: theme.border }]}>Select Language</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.modalOption,
                    { borderBottomColor: theme.border },
                    language === lang.code && { backgroundColor: theme.primaryLight }
                  ]}
                  onPress={() => {
                    setLanguage(lang.code);
                    setLanguageError('');
                    setShowLanguageDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.modalOptionText,
                    { color: theme.text },
                    language === lang.code && { color: theme.primary, fontWeight: '600' }
                  ]}>
                    {lang.native} {lang.code !== 'All' && `(${lang.label})`}
                  </Text>
                  {language === lang.code && (
                    <Feather name="check" size={20} color={colors.sky500} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  screenWrapper: {
    position: 'relative',
    flex: 1,
    overflow: 'visible',
    zIndex: 999,
  },
  scrollView: {
    overflow: 'visible',
  },
  scrollContent: {
    flexGrow: 1,
    overflow: 'visible',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[14],
    paddingBottom: spacing[24],
    maxWidth: 400,
    alignSelf: 'center',
    width: width,
    overflow: 'visible',
  },
  header: {
    marginBottom: spacing[6],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.slate500,
    marginTop: spacing[1],
  },
  form: {
    gap: spacing[5],
    overflow: 'visible',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[4],
  },
  photoSection: {
    position: 'relative',
  },
  nameUsernameContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing[3],
  },
  photoPlaceholder: {
    height: 64,
    width: 64,
    borderRadius: borderRadius.full,
    backgroundColor: colors.slate100,
    borderWidth: 2,
    borderColor: colors.slate400,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    height: 64,
    width: 64,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.slate200,
  },
  photoText: {
    fontSize: typography.fontSize.xs,
    color: colors.slate400,
    marginTop: spacing[1],
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
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  halfWidth: {
    flex: 1,
  },
  thirdWidth: {
    flex: 1,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.slate500,
    marginBottom: spacing[1],
    fontWeight: typography.fontWeight.medium,
  },
  required: {
    color: colors.slate400,
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
  inputError: {
    borderColor: colors.red500,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 9998,
    overflow: 'visible',
  },
  dropdownButton: {
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
  dropdownText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate400,
  },
  dropdownTextSelected: {
    color: colors.slate800,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    minWidth: 180,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: borderRadius.xl,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 1000,
    maxHeight: 240,
    overflow: 'hidden',
  },
  dropdownLanguage: {
    left: undefined,
    right: 0,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: -100, // Cover the whole screen
    left: -100,
    right: -100,
    bottom: -1000,
    zIndex: 999,
  },
  dropdownScroll: {
    maxHeight: 240,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.slate50,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate50,
    minHeight: 44,
  },
  dropdownItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate700,
    flex: 1,
    marginRight: spacing[2],
  },
  dropdownItemTextSelected: {
    color: colors.sky500,
    fontWeight: typography.fontWeight.semibold,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.red500,
    marginTop: spacing[1],
  },
  genreSection: {
    marginTop: spacing[2],
    zIndex: 1,
  },
  genreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  genreTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  genreCount: {
    fontSize: typography.fontSize.xs,
    color: colors.slate500,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  genreButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    minWidth: 60, // Ensure minimum width
    alignItems: 'center',
    justifyContent: 'center',
  },
  genreButtonSelected: {
    backgroundColor: colors.sky500,
    borderColor: colors.sky500,
  },
  genreButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.slate700,
    textAlign: 'center',
    flexShrink: 0, // Prevent text shrinking
  },
  genreButtonTextSelected: {
    color: colors.white,
    textAlign: 'center',
    flexShrink: 0, // Prevent text shrinking
  },
  continueButton: {
    backgroundColor: colors.sky500,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10, // py-2.5 from HTML
    marginTop: spacing[2],
    shadowColor: colors.sky500,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  continueButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  // Modal styles for dropdown selection
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    width: '100%',
    maxWidth: 320,
    maxHeight: 400,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 20,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  modalScroll: {
    maxHeight: 320,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate50,
  },
  modalOptionSelected: {
    backgroundColor: colors.sky50,
  },
  modalOptionText: {
    fontSize: typography.fontSize.base,
    color: colors.slate700,
  },
  modalOptionTextSelected: {
    color: colors.sky600,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default OnboardingScreen;
