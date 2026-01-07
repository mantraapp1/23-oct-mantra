import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';

interface NoHistoryProps {
  onBrowsePress?: () => void;
}

const NoHistory: React.FC<NoHistoryProps> = ({ onBrowsePress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name="clock" size={64} color={colors.slate300} />
      </View>
      
      <Text style={styles.title}>No Reading History</Text>
      <Text style={styles.description}>
        Your reading history will appear here once you start reading novels. Discover amazing stories and track your progress.
      </Text>
      
      {onBrowsePress && (
        <TouchableOpacity style={styles.actionButton} onPress={onBrowsePress}>
          <Feather name="book-open" size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Browse Novels</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Reading History Features:</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Feather name="bookmark" size={16} color={colors.emerald500} />
            <Text style={styles.featureText}>Track your reading progress</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="clock" size={16} color={colors.emerald500} />
            <Text style={styles.featureText}>Resume where you left off</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="heart" size={16} color={colors.emerald500} />
            <Text style={styles.featureText}>Save your favorite novels</Text>
          </View>
          <View style={styles.featureItem}>
            <Feather name="trending-up" size={16} color={colors.emerald500} />
            <Text style={styles.featureText}>Get personalized recommendations</Text>
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
    backgroundColor: colors.slate50,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    backgroundColor: colors.sky500,
    borderRadius: borderRadius.xl,
    shadowColor: colors.sky500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: spacing[8],
  },
  actionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  featuresContainer: {
    width: '100%',
    maxWidth: 320,
  },
  featuresTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  featuresList: {
    gap: spacing[3],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate600,
    flex: 1,
  },
});

export default NoHistory;