import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
  FlatList,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import { useTheme } from '../../../context/ThemeContext';
import authService from '../../../services/authService';
import { LoadingState } from '../../common';

interface ContactUsScreenProps {
  navigation: any;
}

const ContactUsScreen: React.FC<ContactUsScreenProps> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownHeight = React.useRef(new Animated.Value(0)).current;
  const [userLoading, setUserLoading] = useState(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    subject: false,
    message: false,
  });

  React.useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setUserLoading(true);
      const profile = await authService.getCurrentProfile();
      if (profile) {
        setName(profile.display_name || profile.username || '');
        setEmail(profile.email || '');
        setIsUserAuthenticated(true);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const subjects = [
    { value: '', label: 'Select subject' },
    { value: 'general', label: 'General Inquiry' },
    { value: 'support', label: 'Technical Support' },
    { value: 'feedback', label: 'Feedback & Suggestions' },
    { value: 'author', label: 'Author/Writer Support' },
    { value: 'payment', label: 'Payment Issues' },
    { value: 'partnership', label: 'Partnership Inquiry' },
    { value: 'other', label: 'Other' },
  ];

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateForm = () => {
    const newErrors = {
      name: !name.trim(),
      email: !email.trim() || !validateEmail(email),
      subject: !subject,
      message: message.trim().length < 10,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Form Error', 'Please fill in all required fields and ensure the message is at least 10 characters.');
      return;
    }

    try {
      setUserLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSent(true);
      // Scroll to top to ensure success message is visible
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setUserLoading(false);
    }
  };

  const handleReset = () => {
    setSubject('');
    setMessage('');
    setIsSent(false);
    setShowForm(false);
    setShowDropdown(false);
    setErrors({ name: false, email: false, subject: false, message: false });
  };

  const toggleDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowDropdown(!showDropdown);
  };

  const handleSubjectSelect = (val: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSubject(val);
    setErrors({ ...errors, subject: false });
    setShowDropdown(false);
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:mantranovels@protonmail.com');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Contact Us</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Method Selection */}
        {!isSent && !showForm && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>How would you like to reach us?</Text>
            <View style={styles.methodsContainer}>
              {/* Contact Form Option */}
              <TouchableOpacity
                style={[styles.methodButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setShowForm(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.methodIcon, { backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : colors.sky50 }]}>
                  <Feather name="message-square" size={16} color={colors.sky600} />
                </View>
                <View style={styles.methodContent}>
                  <Text style={[styles.methodTitle, { color: theme.text }]}>Send Message</Text>
                  <Text style={[styles.methodSubtitle, { color: theme.textSecondary }]}>Fill out the contact form</Text>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              {/* Email Option */}
              <TouchableOpacity
                style={[styles.methodButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={handleEmailPress}
                activeOpacity={0.7}
              >
                <View style={[styles.methodIcon, { backgroundColor: isDarkMode ? 'rgba(147, 51, 234, 0.1)' : colors.purple50 }]}>
                  <Feather name="mail" size={16} color={colors.purple600} />
                </View>
                <View style={styles.methodContent}>
                  <Text style={[styles.methodTitle, { color: theme.text }]}>Email Us</Text>
                  <Text style={[styles.methodSubtitle, { color: theme.textSecondary }]}>mantranovels@protonmail.com</Text>
                </View>
                <Feather name="external-link" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Contact Form / Success State */}
        {showForm && (
          <View style={styles.formContainer}>
            {isSent ? (
              <View style={styles.successContainer}>
                <View style={[styles.successIconContainer, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : colors.emerald50 }]}>
                  <Feather name="check-circle" size={48} color={colors.emerald500} />
                </View>
                <Text style={[styles.successTitle, { color: theme.text }]}>Message Sent!</Text>
                <Text style={[styles.successDescription, { color: theme.textSecondary }]}>
                  Thank you for reaching out. We've received your message and will get back to you within 24-48 hours.
                </Text>
                <TouchableOpacity
                  style={[styles.resetButton, { backgroundColor: theme.primary }]}
                  onPress={handleReset}
                >
                  <Text style={styles.resetButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Back Link to Methods */}
                <TouchableOpacity
                  style={styles.backToMethods}
                  onPress={() => setShowForm(false)}
                >
                  <Feather name="chevron-left" size={16} color={colors.sky600} />
                  <Text style={styles.backToMethodsText}>Choose another method</Text>
                </TouchableOpacity>

                {/* Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    Name <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
                      errors.name && styles.inputError,
                      isUserAuthenticated && { opacity: 0.7 }
                    ]}
                    placeholder="Your name"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      setErrors({ ...errors, name: false });
                    }}
                    editable={!isUserAuthenticated}
                    placeholderTextColor={theme.textSecondary}
                  />
                  {errors.name && (
                    <Text style={styles.errorText}>Please enter your name</Text>
                  )}
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    Email <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
                      errors.email && styles.inputError,
                      isUserAuthenticated && { opacity: 0.7 }
                    ]}
                    placeholder="your@email.com"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setErrors({ ...errors, email: false });
                    }}
                    editable={!isUserAuthenticated}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={theme.textSecondary}
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>Please enter a valid email address</Text>
                  )}
                </View>

                {/* Subject */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    Subject <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={[styles.dropdownContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }, errors.subject && styles.inputError, showDropdown && { borderColor: theme.primary }]}>
                    <TouchableOpacity
                      style={styles.pickerButton}
                      onPress={toggleDropdown}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pickerText,
                          { color: theme.text },
                          !subject && { color: theme.textSecondary },
                        ]}
                      >
                        {subject
                          ? subjects.find((s) => s.value === subject)?.label
                          : 'Select subject'}
                      </Text>
                      <Feather name={showDropdown ? "chevron-up" : "chevron-down"} size={16} color={theme.textSecondary} />
                    </TouchableOpacity>

                    {showDropdown && (
                      <View style={[styles.dropdownList, { borderTopColor: theme.border }]}>
                        {subjects.slice(1).map((item) => (
                          <TouchableOpacity
                            key={item.value}
                            style={[styles.dropdownItem, subject === item.value && { backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : colors.sky50 }]}
                            onPress={() => handleSubjectSelect(item.value)}
                          >
                            <Text style={[styles.dropdownItemText, { color: theme.text }, subject === item.value && { color: colors.sky600, fontWeight: typography.fontWeight.semibold }]}>
                              {item.label}
                            </Text>
                            {subject === item.value && (
                              <Feather name="check" size={14} color={colors.sky600} />
                            )}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                  {errors.subject && (
                    <Text style={styles.errorText}>Please select a subject</Text>
                  )}
                </View>

                {/* Message */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    Message <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    style={[styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }, errors.message && styles.inputError]}
                    placeholder="Tell us how we can help you..."
                    value={message}
                    onChangeText={(text) => {
                      setMessage(text);
                      setErrors({ ...errors, message: false });
                    }}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    placeholderTextColor={theme.textSecondary}
                  />
                  <Text style={styles.helperText}>Minimum 10 characters</Text>
                  {errors.message && (
                    <Text style={styles.errorText}>
                      Message must be at least 10 characters
                    </Text>
                  )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, userLoading && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={userLoading}
                  activeOpacity={0.7}
                >
                  {userLoading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Send Message</Text>
                  )}
                </TouchableOpacity>

                {/* Info Box */}
                <View style={[styles.infoBox, { backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : colors.sky50, borderColor: isDarkMode ? 'rgba(14, 165, 233, 0.3)' : colors.sky100 }]}>
                  <Feather name="info" size={16} color={colors.sky600} />
                  <Text style={[styles.infoText, { color: isDarkMode ? colors.sky200 : colors.sky700 }]}>
                    We typically respond within 24-48 hours during business days.
                  </Text>
                </View>
              </>
            )}
          </View>
        )}

        {/* Contact Info */}
        <View style={[styles.contactInfo, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : colors.sky100 }]}>
              <Feather name="clock" size={16} color={colors.sky600} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>Response Time</Text>
              <Text style={[styles.infoDescription, { color: theme.textSecondary }]}>
                We aim to respond to all inquiries within 24-48 hours on business days.
              </Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: isDarkMode ? 'rgba(147, 51, 234, 0.1)' : colors.purple100 }]}>
              <Feather name="mail" size={16} color={colors.purple600} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: theme.text }]}>Email Address</Text>
              <TouchableOpacity onPress={handleEmailPress} activeOpacity={0.7}>
                <Text style={styles.infoLink}>mantranovels@protonmail.com</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
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
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[24],
  },
  section: {
    marginBottom: spacing[4],
  },
  sectionLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.slate500,
    marginBottom: spacing[2],
  },
  methodsContainer: {
    gap: spacing[2],
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
  },
  methodIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  methodSubtitle: {
    fontSize: typography.fontSize.xs,
    color: colors.slate500,
  },
  formContainer: {
    gap: spacing[4],
  },
  inputGroup: {
    gap: spacing[1],
  },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.slate500,
  },
  required: {
    color: colors.slate400,
  },
  input: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.fontSize.sm,
    color: colors.slate900,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.red500,
  },
  textArea: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.fontSize.sm,
    color: colors.slate900,
    backgroundColor: colors.white,
    minHeight: 120,
  },
  pickerContainer: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  pickerText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate900,
  },
  pickerPlaceholder: {
    color: colors.slate400,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.slate400,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.red500,
  },
  submitButton: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.sky500,
    paddingVertical: spacing[2.5],
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  submitButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  infoBox: {
    flexDirection: 'row',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.sky50,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.sky700,
  },
  contactInfo: {
    marginTop: spacing[6],
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.slate50,
    gap: spacing[3],
  },
  infoItem: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  infoDescription: {
    fontSize: typography.fontSize.xs,
    color: colors.slate600,
    marginTop: spacing[1],
    lineHeight: 18,
  },
  infoLink: {
    fontSize: typography.fontSize.xs,
    color: colors.sky600,
    marginTop: spacing[1],
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[4],
    gap: spacing[4],
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  successTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  successDescription: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing[4],
  },
  resetButton: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.xl,
  },
  resetButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  dropdownContainer: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  dropdownList: {
    borderTopWidth: 1,
    paddingVertical: spacing[1],
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  dropdownItemText: {
    fontSize: typography.fontSize.sm,
  },
  backToMethods: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  backToMethodsText: {
    fontSize: typography.fontSize.xs,
    color: colors.sky600,
    fontWeight: typography.fontWeight.medium,
  },
});

export default ContactUsScreen;
