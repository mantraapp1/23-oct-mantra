import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '../../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme, isDarkMode, toggleTheme } = useTheme();
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

  const styles = getStyles(theme);

  return (
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

          {/* Theme Toggle Button - Matches original language button design */}
          <TouchableOpacity
            style={styles.themeButton}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Feather name={isDarkMode ? "sun" : "moon"} size={16} color={theme.textSecondary} />
            <Text style={styles.themeText} numberOfLines={1}>
              {isDarkMode ? 'Light' : 'Dark'}
            </Text>
            <Feather name="chevron-down" size={14} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.backgroundSecondary,
  },
  themeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
});

export default AppHeader;
