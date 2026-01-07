import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../constants/theme';

interface HorizontalSectionProps {
    title: string;
    onSeeAll?: () => void;
    children: React.ReactNode;
}

const HorizontalSection: React.FC<HorizontalSectionProps> = ({ title, onSeeAll, children }) => {
    const { theme } = useTheme();
    const styles = getStyles(theme);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {onSeeAll && (
                    <TouchableOpacity
                        style={styles.seeAllButton}
                        onPress={onSeeAll}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.seeAllText}>See All</Text>
                        <Feather name="chevron-right" size={16} color={theme.primary} />
                    </TouchableOpacity>
                )}
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {children}
            </ScrollView>
        </View>
    );
};

const getStyles = (theme: ThemeColors) => StyleSheet.create({
    container: {
        marginTop: spacing[6],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing[4],
        marginBottom: spacing[3],
    },
    title: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: theme.text,
        letterSpacing: -0.5,
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    seeAllText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: theme.primary,
    },
    scrollContent: {
        paddingLeft: spacing[4],
        paddingRight: spacing[0], // NovelCard has its own marginRight
    },
});

export default HorizontalSection;
