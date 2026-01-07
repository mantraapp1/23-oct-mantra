import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../constants';
import { useTheme } from '../../context/ThemeContext';

export interface GenreTagProps {
  label: string;
  variant?: 'default' | 'primary' | 'success';
  onPress?: () => void;
}

const GenreTag: React.FC<GenreTagProps> = ({
  label,
  variant = 'default',
  onPress
}) => {
  const { theme } = useTheme();
  const Component = onPress ? TouchableOpacity : Text;

  const styles = getStyles(theme);

  return (
    <Component
      style={[
        styles.tag,
        variant === 'primary' && styles.tagPrimary,
        variant === 'success' && styles.tagSuccess,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={[
        styles.tagText,
        variant === 'primary' && styles.tagTextPrimary,
        variant === 'success' && styles.tagTextSuccess,
      ]}>
        {label}
      </Text>
    </Component>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  tag: {
    paddingHorizontal: spacing[3], // px-3 from HTML
    paddingVertical: spacing[1.5], // py-1.5 from HTML
    borderRadius: borderRadius.full,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    minWidth: 60, // Ensure minimum width like HTML
    marginRight: spacing[1], // Add spacing between tags
  },
  tagPrimary: {
    backgroundColor: theme.primary, // Active state from HTML
    borderColor: theme.primary,
  },
  tagSuccess: {
    backgroundColor: theme.background, // Or a specific success color if defined in theme
    borderColor: colors.emerald500,
  },
  tagText: {
    fontSize: typography.fontSize.xs, // text-xs from HTML
    fontWeight: typography.fontWeight.semibold,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  tagTextPrimary: {
    color: colors.white, // White text for active state
  },
  tagTextSuccess: {
    color: colors.emerald700,
  },
});

export default GenreTag;
