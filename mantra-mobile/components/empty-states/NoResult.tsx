import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';

interface NoResultProps {
  searchQuery?: string;
  onTryAgain?: () => void;
  onClearSearch?: () => void;
}

const NoResult: React.FC<NoResultProps> = ({ 
  searchQuery, 
  onTryAgain, 
  onClearSearch 
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Feather name="search" size={64} color={colors.slate300} />
      </View>
      
      <Text style={styles.title}>No Results Found</Text>
      <Text style={styles.description}>
        {searchQuery 
          ? `We couldn't find any novels matching "${searchQuery}". Try adjusting your search terms.`
          : "We couldn't find any novels matching your search. Try different keywords or browse our categories."
        }
      </Text>
      
      <View style={styles.actionsContainer}>
        {onClearSearch && (
          <TouchableOpacity style={styles.secondaryButton} onPress={onClearSearch}>
            <Feather name="x" size={18} color={colors.slate600} />
            <Text style={styles.secondaryButtonText}>Clear Search</Text>
          </TouchableOpacity>
        )}
        
        {onTryAgain && (
          <TouchableOpacity style={styles.primaryButton} onPress={onTryAgain}>
            <Feather name="refresh-cw" size={18} color={colors.white} />
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Search Tips:</Text>
        <View style={styles.suggestionsList}>
          <View style={styles.suggestionItem}>
            <Feather name="check-circle" size={16} color={colors.sky500} />
            <Text style={styles.suggestionText}>Try different keywords or phrases</Text>
          </View>
          <View style={styles.suggestionItem}>
            <Feather name="check-circle" size={16} color={colors.sky500} />
            <Text style={styles.suggestionText}>Check your spelling</Text>
          </View>
          <View style={styles.suggestionItem}>
            <Feather name="check-circle" size={16} color={colors.sky500} />
            <Text style={styles.suggestionText}>Use more general terms</Text>
          </View>
          <View style={styles.suggestionItem}>
            <Feather name="check-circle" size={16} color={colors.sky500} />
            <Text style={styles.suggestionText}>Browse by genre or tags</Text>
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
  actionsContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[8],
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.sky500,
    borderRadius: borderRadius.xl,
    shadowColor: colors.sky500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate700,
  },
  suggestionsContainer: {
    width: '100%',
    maxWidth: 320,
  },
  suggestionsTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  suggestionsList: {
    gap: spacing[3],
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  suggestionText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate600,
    flex: 1,
  },
});

export default NoResult;