import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  title?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
  error, 
  onRetry, 
  title = 'Something went wrong' 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name="alert-circle" size={48} color={colors.red500} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{error}</Text>
      {onRetry && (
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={onRetry}
          activeOpacity={0.7}
        >
          <Feather name="refresh-cw" size={16} color={colors.white} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing[6],
  },
  iconContainer: {
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  message: {
    fontSize: typography.fontSize.sm,
    color: colors.slate600,
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
    backgroundColor: colors.sky500,
    borderRadius: borderRadius.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  retryButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default ErrorState;
