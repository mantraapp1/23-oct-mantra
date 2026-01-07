import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import { useTheme } from '../../../context/ThemeContext';
import reportService from '../../../services/reportService';
import authService from '../../../services/authService';
import { useToast } from '../../ToastManager';

interface ReportScreenProps {
  navigation: any;
}

type ReportType = 'novel' | 'chapter' | 'user' | 'comment' | 'review' | null;

const ReportScreen: React.FC<ReportScreenProps> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const [reportType, setReportType] = useState<ReportType>(null);
  const [novelSearch, setNovelSearch] = useState('');
  const [chapter, setChapter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { showToast } = useToast();

  const [errors, setErrors] = useState({
    novel: false,
    chapter: false,
    user: false,
    reason: false,
    description: false,
  });

  useEffect(() => {
    initializeUser();
  }, []);

  const initializeUser = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const reportTypes = [
    {
      id: 'novel' as ReportType,
      icon: 'book',
      title: 'Report a Novel',
      subtitle: 'Content issues, plagiarism, etc.',
      bgColor: colors.sky50,
      iconColor: colors.sky600,
    },
    {
      id: 'chapter' as ReportType,
      icon: 'file-text',
      title: 'Report a Chapter',
      subtitle: 'Specific chapter problems',
      bgColor: colors.purple50,
      iconColor: colors.purple600,
    },
    {
      id: 'user' as ReportType,
      icon: 'user',
      title: 'Report a User',
      subtitle: 'Harassment, spam, abuse',
      bgColor: '#FEF3C7',
      iconColor: '#D97706',
    },
    {
      id: 'technical' as ReportType,
      icon: 'alert-circle',
      title: 'Technical Issue',
      subtitle: 'Bugs, errors, crashes',
      bgColor: '#FFE4E6',
      iconColor: '#E11D48',
    },
    {
      id: 'other' as ReportType,
      icon: 'help-circle',
      title: 'Other',
      subtitle: 'Something else',
      bgColor: colors.slate100,
      iconColor: colors.slate600,
    },
  ];

  const reportReasons: Record<string, string[]> = {
    novel: [
      'Plagiarism',
      'Inappropriate content',
      'Hate speech',
      'Violence/Gore',
      'Sexual content',
      'Copyright infringement',
      'Misleading information',
      'Other',
    ],
    chapter: [
      'Duplicate chapter',
      'Wrong chapter order',
      'Missing content',
      'Inappropriate content',
      'Formatting issues',
      'Other',
    ],
    user: [
      'Harassment',
      'Spam',
      'Impersonation',
      'Hate speech',
      'Threatening behavior',
      'Inappropriate profile',
      'Other',
    ],
    technical: [
      'App crashes',
      'Login issues',
      'Payment problems',
      'Loading errors',
      'Display issues',
      'Performance problems',
      'Other',
    ],
    other: ['Feature request', 'General feedback', 'Partnership inquiry', 'Other'],
  };

  const chapters = [
    'Chapter 148 - The Final Entry',
    'Chapter 147 - Shadows Converge',
    'Chapter 146 - Breaking Point',
  ];

  const handleSelectReportType = (type: ReportType) => {
    setReportType(type);
    setSelectedReason('');
    setErrors({
      novel: false,
      chapter: false,
      user: false,
      reason: false,
      description: false,
    });
  };

  const validateForm = () => {
    const newErrors = {
      novel: (reportType === 'novel' || reportType === 'chapter') && !novelSearch.trim(),
      chapter: reportType === 'chapter' && !chapter,
      user: reportType === 'user' && !userSearch.trim(),
      reason: !selectedReason,
      description: description.trim().length < 20,
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSubmit = async () => {
    if (!validateForm() || !currentUserId || !reportType) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine the entity type and ID based on report type
      let entityType: 'novel' | 'chapter' | 'user' | 'comment' | 'review' = reportType as any;
      let entityId = '';

      // For now, use placeholder IDs - in production, these would come from search/selection
      if (reportType === 'novel' || reportType === 'chapter') {
        entityId = 'novel-id-placeholder'; // Would come from novel search
      } else if (reportType === 'user') {
        entityId = 'user-id-placeholder'; // Would come from user search
      }

      const response = await reportService.submitReport(currentUserId, {
        reported_type: entityType,
        reported_id: entityId,
        reason: selectedReason,
        description: description.trim(),
      });

      if (response.success) {
        showToast('success', 'Report submitted successfully');
        // Reset form
        setReportType(null);
        setNovelSearch('');
        setChapter('');
        setUserSearch('');
        setSelectedReason('');
        setDescription('');
        setErrors({
          novel: false,
          chapter: false,
          user: false,
          reason: false,
          description: false,
        });

        // Navigate back after a short delay
        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      } else {
        showToast('error', response.message);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      showToast('error', 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Report</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Report Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>What would you like to report?</Text>
          <View style={styles.typesContainer}>
            {reportTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => handleSelectReportType(type.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.typeIcon, { backgroundColor: type.bgColor }]}>
                  <Feather name={type.icon as any} size={16} color={type.iconColor} />
                </View>
                <View style={styles.typeContent}>
                  <Text style={[styles.typeTitle, { color: theme.text }]}>{type.title}</Text>
                  <Text style={[styles.typeSubtitle, { color: theme.textSecondary }]}>{type.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Report Form */}
        {reportType && (
          <View style={styles.formContainer}>
            {/* Novel Search */}
            {(reportType === 'novel' || reportType === 'chapter') && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Search for the novel <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.searchContainer}>
                  <Feather
                    name="search"
                    size={16}
                    color={theme.textSecondary}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={[styles.searchInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }, errors.novel && styles.inputError]}
                    placeholder="Type novel name..."
                    value={novelSearch}
                    onChangeText={(text) => {
                      setNovelSearch(text);
                      setErrors({ ...errors, novel: false });
                    }}
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
                {novelSearch.trim() && (
                  <View style={[styles.selectedNovel, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                    <Text style={[styles.selectedNovelLabel, { color: theme.textSecondary }]}>Selected Novel:</Text>
                    <Text style={[styles.selectedNovelText, { color: theme.text }]}>Crimson Ledger</Text>
                  </View>
                )}
                {errors.novel && (
                  <Text style={styles.errorText}>Please search and select a novel</Text>
                )}
              </View>
            )}

            {/* Chapter Selection */}
            {reportType === 'chapter' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Chapter <Text style={styles.required}>*</Text>
                </Text>
                <View style={[styles.pickerContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }, errors.chapter && styles.inputError]}>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => {
                      Alert.alert(
                        'Select Chapter',
                        '',
                        [
                          ...chapters.map((ch) => ({
                            text: ch,
                            onPress: () => {
                              setChapter(ch);
                              setErrors({ ...errors, chapter: false });
                            },
                          })),
                          { text: 'Cancel', style: 'cancel' },
                        ]
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.pickerText, { color: theme.text }, !chapter && { color: theme.textSecondary }]}
                    >
                      {chapter || 'Select chapter'}
                    </Text>
                    <Feather name="chevron-down" size={16} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                {errors.chapter && (
                  <Text style={styles.errorText}>Please select a chapter</Text>
                )}
              </View>
            )}

            {/* User Search */}
            {reportType === 'user' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Username or profile link <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }, errors.user && styles.inputError]}
                  placeholder="@username"
                  value={userSearch}
                  onChangeText={(text) => {
                    setUserSearch(text);
                    setErrors({ ...errors, user: false });
                  }}
                  placeholderTextColor={theme.textSecondary}
                />
                {errors.user && (
                  <Text style={styles.errorText}>Please enter a username</Text>
                )}
              </View>
            )}

            {/* Reason Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Reason <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.reasonsContainer}>
                {reportReasons[reportType].map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonButton,
                      { borderColor: theme.border, backgroundColor: theme.card },
                      selectedReason === reason && { backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : colors.sky50, borderColor: colors.sky500 },
                    ]}
                    onPress={() => {
                      setSelectedReason(reason);
                      setErrors({ ...errors, reason: false });
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.reasonButtonText,
                        { color: theme.text },
                        selectedReason === reason && { color: isDarkMode ? colors.sky200 : colors.sky700 },
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.reason && (
                <Text style={styles.errorText}>Please select a reason</Text>
              )}
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Description <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }, errors.description && styles.inputError]}
                placeholder="Please provide details about the issue..."
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  setErrors({ ...errors, description: false });
                }}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                placeholderTextColor={theme.textSecondary}
              />
              <Text style={styles.helperText}>Minimum 20 characters</Text>
              {errors.description && (
                <Text style={styles.errorText}>
                  Description must be at least 20 characters
                </Text>
              )}
            </View>

            {/* Screenshots (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Screenshots (Optional)</Text>
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => Alert.alert('Upload', 'Image upload functionality')}
                activeOpacity={0.7}
              >
                <Feather name="upload" size={16} color={theme.textSecondary} />
                <Text style={[styles.uploadButtonText, { color: theme.textSecondary }]}>Upload images</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </TouchableOpacity>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Feather name="info" size={16} color="#D97706" />
              <Text style={styles.disclaimerText}>
                False reports may result in account restrictions. We review all reports
                within 24-48 hours.
              </Text>
            </View>
          </View>
        )}

        {/* Help Section */}
        <View style={[styles.helpCard, { backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : colors.slate50, borderColor: theme.border }]}>
          <View style={[styles.helpIcon, { backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.2)' : colors.sky100 }]}>
            <Feather name="shield" size={16} color={colors.sky600} />
          </View>
          <View style={styles.helpContent}>
            <Text style={[styles.helpTitle, { color: theme.text }]}>Our Commitment</Text>
            <Text style={[styles.helpText, { color: theme.textSecondary }]}>
              We're dedicated to maintaining a safe and respectful community. Your reports
              help us keep WebNovel a better place for everyone.
            </Text>
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
  typesContainer: {
    gap: spacing[2],
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeContent: {
    flex: 1,
  },
  typeTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  typeSubtitle: {
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
  searchContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: spacing[3],
    top: '50%',
    transform: [{ translateY: -8 }],
    zIndex: 1,
  },
  searchInput: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    paddingLeft: spacing[9],
    paddingRight: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.fontSize.sm,
    color: colors.slate900,
    backgroundColor: colors.white,
  },
  selectedNovel: {
    marginTop: spacing[2],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.slate50,
  },
  selectedNovelLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate600,
  },
  selectedNovelText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate700,
    marginTop: spacing[1],
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
  reasonsContainer: {
    gap: spacing[2],
  },
  reasonButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
  },
  reasonButtonSelected: {
    backgroundColor: colors.sky50,
    borderColor: colors.sky500,
  },
  reasonButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate700,
  },
  reasonButtonTextSelected: {
    color: colors.sky700,
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
    minHeight: 100,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.slate400,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.red500,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.slate200,
    backgroundColor: colors.white,
  },
  uploadButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate600,
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
  disclaimer: {
    flexDirection: 'row',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: '#FEF3C7',
  },
  disclaimerText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: '#78350F',
  },
  helpCard: {
    marginTop: spacing[6],
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.slate50,
  },
  helpIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.sky100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  helpText: {
    fontSize: typography.fontSize.xs,
    color: colors.slate600,
    marginTop: spacing[1],
    lineHeight: 18,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});

export default ReportScreen;
