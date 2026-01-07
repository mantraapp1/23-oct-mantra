import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';

interface NetworkErrorProps {
  onRetry?: () => void;
  title?: string;
  description?: string;
}

const NetworkError: React.FC<NetworkErrorProps> = ({ 
  onRetry,
  title = "Connection Problem",
  description = "Please check your internet connection and try again. Make sure you're connected to Wi-Fi or mobile data."
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name="wifi-off" size={64} color={colors.red400} />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Feather name="refresh-cw" size={20} color={colors.white} />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.troubleshootContainer}>
        <Text style={styles.troubleshootTitle}>Troubleshooting:</Text>
        <View style={styles.troubleshootList}>
          <View style={styles.troubleshootItem}>
            <Feather name="wifi" size={16} color={colors.slate500} />
            <Text style={styles.troubleshootText}>Check your Wi-Fi connection</Text>
          </View>
          <View style={styles.troubleshootItem}>
            <Feather name="smartphone" size={16} color={colors.slate500} />
            <Text style={styles.troubleshootText}>Verify mobile data is enabled</Text>
          </View>
          <View style={styles.troubleshootItem}>
            <Feather name="globe" size={16} color={colors.slate500} />
            <Text style={styles.troubleshootText}>Try switching networks</Text>
          </View>
          <View style={styles.troubleshootItem}>
            <Feather name="power" size={16} color={colors.slate500} />
            <Text style={styles.troubleshootText}>Restart the app if issues persist</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    backgroundColor: colors.red50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.slate900,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.slate600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[8],
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.red500,
    borderRadius: borderRadius.xl,
    shadowColor: colors.red500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: spacing[8],
  },
  retryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  troubleshootContainer: {
    width: '100%',
    maxWidth: 320,
  },
  troubleshootTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  troubleshootList: {
    gap: spacing[3],
  },
  troubleshootItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  troubleshootText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate600,
    flex: 1,
  },
});

export default NetworkError;