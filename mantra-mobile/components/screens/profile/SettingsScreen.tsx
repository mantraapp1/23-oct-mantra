import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Toggle } from '../../ui/Toggle';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, LANGUAGES } from '../../../constants';
import authService from '../../../services/authService';
import profileService from '../../../services/profileService';
import { useToast } from '../../ToastManager';
import { useTheme } from '../../../context/ThemeContext';
import { useAlert } from '../../../context/AlertContext';
import { useLanguage } from '../../../context/LanguageContext';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { showAlert } = useAlert();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setIsLoading(true);
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUserId(user.id);
        setUserEmail(user.email || '');

        // Load profile settings
        const profile = await profileService.getProfile(user.id);
        if (profile) {
          setPushNotifications(profile.push_notifications_enabled ?? true);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (!currentUserId) return;

    setPushNotifications(value);
    try {
      const response = await profileService.updateNotificationSettings(currentUserId, value);
      if (response.success) {
        showToast('success', value ? 'Notifications enabled' : 'Notifications disabled');
      } else {
        // Revert on failure
        setPushNotifications(!value);
        showToast('error', response.message);
      }
    } catch (error) {
      setPushNotifications(!value);
      showToast('error', 'Failed to update notification settings');
    }
  };



  const handleLogout = () => {
    showAlert(
      'warning',
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              const response = await authService.logout();
              if (response.success) {
                showToast('success', 'Logged out successfully');
                // Navigate to login screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } else {
                showToast('error', response.message);
              }
            } catch (error) {
              showToast('error', 'Failed to log out');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Email</Text>
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text style={styles.settingValue}>{userEmail || 'Not set'}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => navigation.navigate('AccountSettings')}
              activeOpacity={0.7}
            >
              <Text style={styles.settingLabel}>Account Settings</Text>
              <Feather name="chevron-right" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Toggle
                checked={pushNotifications}
                onCheckedChange={handleNotificationToggle}
                size="large"
                trackColor={{ false: theme.border, true: theme.primary }}
                disabled={isLoading}
              />
            </View>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setShowLanguageModal(!showLanguageModal)}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Content Language</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>{language}</Text>
                <Feather name="chevron-right" size={16} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
            {showLanguageModal && (
              <View style={styles.languageDropdown}>
                <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
                  {LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.languageOption,
                        language === lang.code && styles.languageOptionActive
                      ]}
                      onPress={() => {
                        setLanguage(lang.code);
                        setShowLanguageModal(false);
                        showToast('success', 'Language updated');
                      }}
                    >
                      <Text style={[
                        styles.languageOptionText,
                        language === lang.code && styles.languageOptionTextActive
                      ]}>
                        {lang.native} {lang.code !== 'All' && `(${lang.label})`}
                      </Text>
                      {language === lang.code && (
                        <Feather name="check" size={16} color={theme.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Dark Mode</Text>
              <Toggle
                checked={isDarkMode}
                onCheckedChange={toggleTheme}
                size="large"
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => showAlert('info', 'Terms of Service', 'Terms of Service content')}
              activeOpacity={0.7}
            >
              <Text style={styles.settingLabel}>Terms of Service</Text>
              <Feather name="chevron-right" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => showAlert('info', 'Privacy Policy', 'Privacy Policy content')}
              activeOpacity={0.7}
            >
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <Feather name="chevron-right" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, isLoggingOut && styles.logoutButtonDisabled]}
          onPress={handleLogout}
          activeOpacity={0.7}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color={theme.error} />
          ) : (
            <Text style={styles.logoutButtonText}>Log Out</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
    borderRadius: borderRadius.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
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
    color: theme.text,
  },
  sectionContent: {
    gap: spacing[2],
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  settingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.card,
  },
  settingLabel: {
    fontSize: typography.fontSize.sm,
    color: theme.text,
  },
  settingValue: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
  },
  logoutButton: {
    paddingVertical: spacing[2.5],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.border,
    // For logout, we might want to keep it red-tinted or just use theme.card
    // Let's make it standard card but text is red
    backgroundColor: theme.card,
    alignItems: 'center',
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  languageDropdown: {
    marginTop: -spacing[1],
    marginBottom: spacing[2],
    marginHorizontal: spacing[1],
    backgroundColor: theme.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing[1],
  },
  languageList: {
    maxHeight: 300,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: borderRadius.sm,
  },
  languageOptionActive: {
    backgroundColor: theme.background,
  },
  languageOptionText: {
    fontSize: typography.fontSize.sm,
    color: theme.text,
  },
  languageOptionTextActive: {
    color: theme.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  logoutButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: theme.error,
  },
});

export default SettingsScreen;
