import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';

interface NoNovelCreatedProps {
  onCreatePress?: () => void;
}

const NoNovelCreated: React.FC<NoNovelCreatedProps> = ({ onCreatePress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name="book-open" size={64} color={colors.slate300} />
      </View>
      
      <Text style={styles.title}>No Novels Yet</Text>
      <Text style={styles.description}>
        Start your writing journey by creating your first novel. Share your stories with readers around the world.
      </Text>
      
      {onCreatePress && (
        <TouchableOpacity style={styles.actionButton} onPress={onCreatePress}>
          <Feather name="plus" size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Create Your First Novel</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Getting Started Tips:</Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <Feather name="check-circle" size={16} color={colors.emerald500} />
            <Text style={styles.tipText}>Choose a compelling title and cover</Text>
          </View>
          <View style={styles.tipItem}>
            <Feather name="check-circle" size={16} color={colors.emerald500} />
            <Text style={styles.tipText}>Write an engaging description</Text>
          </View>
          <View style={styles.tipItem}>
            <Feather name="check-circle" size={16} color={colors.emerald500} />
            <Text style={styles.tipText}>Select appropriate genres and tags</Text>
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
  tipsContainer: {
    width: '100%',
    maxWidth: 300,
  },
  tipsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  tipsList: {
    gap: spacing[3],
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  tipText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate600,
    flex: 1,
  },
});

export default NoNovelCreated;