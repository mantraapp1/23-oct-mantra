import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography, LANGUAGES } from '../../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const NOTIFICATION_SEEN_KEY = 'mantra_notif_seen';

interface AppHeaderProps {
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  onSearchPress,
  onNotificationPress,
}) => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      const notifSeen = await AsyncStorage.getItem(NOTIFICATION_SEEN_KEY);
      setHasUnreadNotifications(!notifSeen);
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      (navigation.navigate as any)('RecentSearch');
    }
  };

  const handleNotificationPress = async () => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SEEN_KEY, '1');
      setHasUnreadNotifications(false);
      if (onNotificationPress) {
        onNotificationPress();
      } else {
        (navigation.navigate as any)('Notification');
      }
    } catch (error) {
      console.error('Error marking notifications as seen:', error);
    }
  };

  const handleLanguageSelect = async (lang: string) => {
    try {
      await setLanguage(lang);
      setLanguageMenuVisible(false);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // LANGUAGES imported from constants

  const styles = getStyles(theme);

  return (
    <>
      <View style={styles.headerContainer}>
        {/* iOS notch padding */}
        <View style={styles.safeAreaTop} />

        {/* Top bar */}
        <View style={styles.topBar}>
          {/* Brand */}
          <TouchableOpacity
            style={styles.brandContainer}
            onPress={() => (navigation.navigate as any)('Main')}
            activeOpacity={0.7}
          >
            <Image
              source={require('../../assets/Mantra logo.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>Mantra</Text>
          </TouchableOpacity>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {/* Search Button */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleSearchPress}
              activeOpacity={0.7}
            >
              <Feather name="search" size={20} color={theme.text} />
            </TouchableOpacity>

            {/* Notifications Button */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleNotificationPress}
              activeOpacity={0.7}
            >
              <Feather name="bell" size={20} color={theme.text} />
              {hasUnreadNotifications && <View style={styles.notificationDot} />}
            </TouchableOpacity>

            {/* Language Button */}
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => setLanguageMenuVisible(true)}
              activeOpacity={0.7}
            >
              <Feather name="globe" size={16} color={theme.textSecondary} />
              <Text style={styles.languageCode} numberOfLines={1}>
                {language === 'All' ? 'ALL' : language.substring(0, 3).toUpperCase()}
              </Text>
              <Feather name="chevron-down" size={14} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={languageMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageMenuVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLanguageMenuVisible(false)}
        >
          <Pressable style={styles.languageMenuContainer}>
            <View style={styles.languageMenuHeader}>
              <Text style={styles.languageMenuTitle}>Select Language</Text>
              <TouchableOpacity
                onPress={() => setLanguageMenuVisible(false)}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Feather name="x" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    language === lang.code && styles.languageOptionSelected,
                  ]}
                  onPress={() => handleLanguageSelect(lang.code)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      language === lang.code &&
                      styles.languageOptionTextSelected,
                    ]}
                  >
                    {lang.native} {lang.code !== 'All' && `(${lang.label})`}
                  </Text>
                  {language === lang.code && (
                    <Feather name="check" size={16} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  headerContainer: {
    backgroundColor: theme.headerBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    ...Platform.select({
      ios: {
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  safeAreaTop: {
    height: Platform.OS === 'ios' ? StatusBar.currentHeight || 44 : StatusBar.currentHeight || 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    gap: spacing[3],
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  brandText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
    letterSpacing: -0.5,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.error,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.backgroundSecondary, // Using backgroundSecondary for slight contrast
  },
  languageCode: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  languageMenuContainer: {
    backgroundColor: theme.card,
    borderRadius: borderRadius['2xl'],
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
    ...Platform.select({
      ios: {
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  languageMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  languageMenuTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  closeButton: {
    padding: spacing[1],
    marginRight: -spacing[1],
  },
  languageList: {
    maxHeight: 400,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  languageOptionSelected: {
    backgroundColor: theme.primaryLight,
  },
  languageOptionText: {
    fontSize: typography.fontSize.sm,
    color: theme.text,
  },
  languageOptionTextSelected: {
    fontWeight: typography.fontWeight.semibold,
    color: theme.primary,
  },
});

export default AppHeader;
