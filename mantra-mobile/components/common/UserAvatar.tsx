/**
 * UserAvatar Component
 * Production-grade avatar component with robust error handling
 * 
 * Features:
 * - Graceful fallback to initials when image fails to load
 * - Consistent styling across the app
 * - Theme-aware colors
 * - Multiple size presets with custom size support
 */

import React, { useState } from 'react';
import { View, Image, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, typography } from '../../constants';
import { getProfilePicture } from '../../constants/defaultImages';

export interface UserAvatarProps {
  /** Image URI - can be null/undefined, will show initials fallback */
  uri?: string | null;
  /** User's name for generating initials fallback */
  name?: string;
  /** Preset size or custom number */
  size?: 'xs' | 'small' | 'medium' | 'large' | 'xl' | number;
  /** Optional additional styles */
  style?: ViewStyle;
  /** Show border around avatar */
  showBorder?: boolean;
  /** Border color (defaults to primary) */
  borderColor?: string;
}

const SIZE_MAP = {
  xs: 24,
  small: 32,
  medium: 40,
  large: 56,
  xl: 80,
};

const FONT_SIZE_MAP = {
  xs: 10,
  small: 12,
  medium: 16,
  large: 20,
  xl: 28,
};

/**
 * Get initials from a name
 * Handles single words, multiple words, and edge cases
 */
const getInitials = (name: string): string => {
  if (!name || name.trim() === '' || name === 'Anonymous') {
    return 'U';
  }

  const words = name.trim().split(/\s+/).filter(w => w.length > 0);

  if (words.length === 0) {
    return 'U';
  }

  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  // Take first letter of first and last word
  const firstInitial = words[0].charAt(0).toUpperCase();
  const lastInitial = words[words.length - 1].charAt(0).toUpperCase();

  return firstInitial + lastInitial;
};

const UserAvatar: React.FC<UserAvatarProps> = ({
  uri,
  name = 'User',
  size = 'medium',
  style,
  showBorder = false,
  borderColor,
}) => {
  const [hasError, setHasError] = useState(false);

  // Calculate actual size
  const avatarSize = typeof size === 'number' ? size : SIZE_MAP[size];
  const fontSize = typeof size === 'number'
    ? Math.max(10, size * 0.4)
    : FONT_SIZE_MAP[size];

  // Get the initials for fallback
  const initials = getInitials(name);

  // Determine if we should show the image or fallback
  const shouldShowImage = uri && !hasError;

  // Get a fallback URL using the centralized function
  const imageUri = uri || getProfilePicture(null, name);

  const containerStyle: ViewStyle = {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    overflow: 'hidden',
    ...(showBorder && {
      borderWidth: 2,
      borderColor: borderColor || colors.sky500,
    }),
  };

  // If image failed to load, show initials fallback
  if (hasError || !uri) {
    return (
      <View style={[containerStyle, styles.placeholder, style]}>
        <Text style={[styles.placeholderText, { fontSize }]}>
          {initials}
        </Text>
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <Image
        source={{ uri: imageUri }}
        style={styles.image}
        onError={() => {
          // Image failed to load, trigger fallback
          setHasError(true);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: colors.sky500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontWeight: typography.fontWeight.bold as any,
    color: colors.white,
  },
});

export default UserAvatar;
