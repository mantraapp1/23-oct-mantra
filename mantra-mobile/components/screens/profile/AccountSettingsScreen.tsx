import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import authService from '../../../services/authService';
import { useToast } from '../../ToastManager';
import { useTheme } from '../../../context/ThemeContext';

interface AccountSettingsScreenProps {
  navigation: any;
}

const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({ navigation }) => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const { showToast } = useToast();
  const { theme, isDarkMode } = useTheme();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim() || !validateEmail(newEmail)) {
      showToast('error', 'Please enter a valid email address');
      return;
    }

    setIsChangingEmail(true);
    try {
      const response = await authService.changeEmail(newEmail);

      if (response.success) {
        showToast('success', response.message);
        setShowEmailForm(false);
        setNewEmail('');
        setEmailPassword('');
      } else {
        showToast('error', response.message);
      }
    } catch (error) {
      showToast('error', 'Failed to change email');
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      showToast('error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Passwords don\'t match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await authService.updatePassword(newPassword);

      if (response.success) {
        showToast('success', 'Password changed successfully');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('error', response.message);
      }
    } catch (error) {
      showToast('error', 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      showToast('error', 'Please type DELETE to confirm');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const response = await authService.requestAccountDeletion();

      if (response.success) {
        showToast('success', 'Account deletion scheduled for 7 days');
        setShowDeleteModal(false);
        // Navigate to login screen
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      } else {
        showToast('error', response.message);
      }
    } catch (error) {
      showToast('error', 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Account Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Email Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Email Address</Text>
          <View style={[styles.emailCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.emailInfo}>
              <Text style={[styles.emailLabel, { color: theme.textSecondary }]}>Current Email</Text>
              <Text style={[styles.emailValue, { color: theme.text }]}>you@example.com</Text>
            </View>
            <TouchableOpacity
              style={[styles.changeButton, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => setShowEmailForm(!showEmailForm)}
              activeOpacity={0.7}
            >
              <Text style={[styles.changeButtonText, { color: theme.text }]}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Change Email Form */}
        {showEmailForm && (
          <View style={styles.formContainer}>
            <View style={[styles.infoBox, { backgroundColor: isDarkMode ? 'rgba(14, 165, 233, 0.1)' : colors.sky50, borderColor: isDarkMode ? 'rgba(14, 165, 233, 0.3)' : colors.sky100 }]}>
              <Feather name="info" size={16} color={colors.sky600} />
              <Text style={[styles.infoText, { color: isDarkMode ? colors.sky200 : colors.sky700 }]}>
                We'll send a verification code to your new email address to confirm the
                change.
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                New Email Address <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                placeholder="new@example.com"
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Current Password <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                  placeholder="Enter current password"
                  value={emailPassword}
                  onChangeText={setEmailPassword}
                  secureTextEntry={!showEmailPassword}
                  placeholderTextColor={theme.textSecondary}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowEmailPassword(!showEmailPassword)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={showEmailPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  setShowEmailForm(false);
                  setNewEmail('');
                  setEmailPassword('');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleEmailChange}
                activeOpacity={0.7}
              >
                <Text style={styles.submitButtonText}>Update Email</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Password Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Password</Text>
          <TouchableOpacity
            style={[styles.settingButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setShowPasswordForm(!showPasswordForm)}
            activeOpacity={0.7}
          >
            <Text style={[styles.settingLabel, { color: theme.text }]}>Change Password</Text>
            <Feather name="chevron-right" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Change Password Form */}
        {showPasswordForm && (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Current Password <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrentPassword}
                  placeholderTextColor={theme.textSecondary}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={showCurrentPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                New Password <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  placeholderTextColor={theme.textSecondary}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={showNewPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              <Text style={[styles.helperText, { color: theme.textSecondary }]}>Minimum 8 characters</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Confirm New Password <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor={theme.textSecondary}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={16}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => {
                  setShowPasswordForm(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handlePasswordChange}
                activeOpacity={0.7}
              >
                <Text style={styles.submitButtonText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Delete Account Section */}
        <View style={styles.section}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: isDarkMode ? '#451a1d' : '#FFF1F2', borderColor: isDarkMode ? '#7f1d1d' : '#FFE4E6' }]}
            onPress={() => setShowDeleteModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.deleteContent}>
              <Text style={styles.deleteTitle}>Delete Account</Text>
              <Text style={[styles.deleteSubtitle, { color: isDarkMode ? '#f87171' : '#FB7185' }]}>
                Permanently delete your account and data
              </Text>
            </View>
            <Feather name="trash-2" size={16} color="#E11D48" />
          </TouchableOpacity>
        </View>

        {/* Account Info */}
        <View style={[styles.accountInfo, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Account Created</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>January 15, 2024</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Account ID</Text>
            <Text style={[styles.infoValue, { fontFamily: 'monospace', color: theme.text }]}>
              USR-2024-12345
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Last Login</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>Today, 2:45 PM</Text>
          </View>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.modalIcon, { backgroundColor: isDarkMode ? '#451a1d' : '#FFE4E6' }]}>
              <Feather name="alert-triangle" size={24} color="#E11D48" />
            </View>

            <Text style={[styles.modalTitle, { color: theme.text }]}>Delete Account?</Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              This action cannot be undone. All your data including your library, novels,
              and reading history will be permanently deleted.
            </Text>

            <View style={styles.modalInputs}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Type "DELETE" to confirm</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                  placeholder="DELETE"
                  value={deleteConfirm}
                  onChangeText={setDeleteConfirm}
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Enter your password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                    placeholder="Your password"
                    value={deletePassword}
                    onChangeText={setDeletePassword}
                    secureTextEntry={!showDeletePassword}
                    placeholderTextColor={theme.textSecondary}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowDeletePassword(!showDeletePassword)}
                    activeOpacity={0.7}
                  >
                    <Feather
                      name={showDeletePassword ? 'eye-off' : 'eye'}
                      size={16}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm('');
                  setDeletePassword('');
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteForeverButton}
                onPress={handleDeleteAccount}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteForeverButtonText}>Delete Forever</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: spacing[6],
  },
  section: {
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  dangerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#E11D48',
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.white,
  },
  emailInfo: {
    flex: 1,
  },
  emailLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.slate500,
  },
  emailValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    marginTop: spacing[0.5],
  },
  changeButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
  },
  changeButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.slate900,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.white,
  },
  settingLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.slate900,
  },
  formContainer: {
    gap: spacing[3],
  },
  infoBox: {
    flexDirection: 'row',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.sky100,
    backgroundColor: colors.sky50,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.sky700,
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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    paddingHorizontal: spacing[3],
    paddingRight: spacing[10],
    paddingVertical: spacing[2],
    fontSize: typography.fontSize.sm,
    color: colors.slate900,
    backgroundColor: colors.white,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing[3],
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.slate400,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  submitButton: {
    flex: 1,
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.xl,
    backgroundColor: colors.sky500,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    backgroundColor: '#FFF1F2',
  },
  deleteContent: {
    flex: 1,
  },
  deleteTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#E11D48',
  },
  deleteSubtitle: {
    fontSize: typography.fontSize.xs,
    color: '#FB7185',
    marginTop: spacing[0.5],
  },
  accountInfo: {
    padding: spacing[4],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate100,
    backgroundColor: colors.slate50,
    gap: spacing[2],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.slate500,
  },
  infoValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate700,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing[4],
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  modalText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate600,
    textAlign: 'center',
    marginBottom: spacing[4],
    lineHeight: 20,
  },
  modalInputs: {
    gap: spacing[3],
  },
  deleteForeverButton: {
    flex: 1,
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.xl,
    backgroundColor: '#E11D48',
    alignItems: 'center',
  },
  deleteForeverButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default AccountSettingsScreen;
