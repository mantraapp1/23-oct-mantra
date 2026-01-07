import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../constants/theme';

export interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionText?: string;
  onActionPress?: () => void;
  iconColor?: string;
  actionButtonColor?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onActionPress,
  iconColor, // Default handled in body
  actionButtonColor,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);

  // Set defaults that depend on theme if not provided
  const finalIconColor = iconColor || theme.textSecondary;
  const finalActionButtonColor = actionButtonColor || theme.primary;

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: finalIconColor + '20' }]}>
        <Feather name={icon as any} size={64} color={finalIconColor} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionText && onActionPress && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: finalActionButtonColor }]}
          onPress={onActionPress}
        >
          <Text style={styles.actionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const getStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[8],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: theme.text,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.base,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[8],
  },
  actionButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white, // Keep white on buttons
  },
});

export default EmptyState;