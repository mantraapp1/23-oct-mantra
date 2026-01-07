import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';

interface NoCommentsProps {
  onAddCommentPress?: () => void;
}

const NoComments: React.FC<NoCommentsProps> = ({ onAddCommentPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name="message-circle" size={64} color={colors.slate300} />
      </View>
      
      <Text style={styles.title}>No Comments Yet</Text>
      <Text style={styles.description}>
        Be the first to share your thoughts about this novel. Your feedback helps other readers discover great stories.
      </Text>
      
      {onAddCommentPress && (
        <TouchableOpacity style={styles.actionButton} onPress={onAddCommentPress}>
          <Feather name="edit-3" size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Write First Comment</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Comment Guidelines:</Text>
        <View style={styles.tipsList}>
          <View style={styles.tipItem}>
            <Feather name="heart" size={16} color={colors.emerald500} />
            <Text style={styles.tipText}>Share what you loved about the story</Text>
          </View>
          <View style={styles.tipItem}>
            <Feather name="star" size={16} color={colors.emerald500} />
            <Text style={styles.tipText}>Rate the novel to help others</Text>
          </View>
          <View style={styles.tipItem}>
            <Feather name="users" size={16} color={colors.emerald500} />
            <Text style={styles.tipText}>Be respectful to authors and readers</Text>
          </View>
          <View style={styles.tipItem}>
            <Feather name="shield" size={16} color={colors.emerald500} />
            <Text style={styles.tipText}>Avoid spoilers in your comments</Text>
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
    maxWidth: 320,
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

export default NoComments;