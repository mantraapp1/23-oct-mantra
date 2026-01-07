import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../constants/theme';
import { NovelCardProps } from '../../types';

const NovelCard: React.FC<NovelCardProps> = ({ novel, size = 'medium', onPress }) => {
    const { theme } = useTheme();
    const styles = getStyles(theme, size);

    const getCardSize = () => {
        switch (size) {
            case 'small':
                return { width: 100, height: 140 };
            case 'large':
                return { width: 140, height: 200 };
            case 'medium':
            default:
                return { width: 120, height: 168 };
        }
    };

    const cardSize = getCardSize();

    return (
        <TouchableOpacity
            style={[styles.container, { width: cardSize.width }]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <View style={[styles.imageContainer, { height: cardSize.height }]}>
                <Image
                    source={{ uri: novel.coverImage }}
                    style={styles.coverImage}
                    resizeMode="cover"
                />
                {novel.rating !== undefined && size !== 'small' && (
                    <View style={styles.ratingBadge}>
                        <Feather name="star" size={10} color={colors.amber400} />
                        <Text style={styles.ratingText}>{novel.rating.toFixed(1)}</Text>
                    </View>
                )}
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.title} numberOfLines={size === 'large' ? 2 : 1}>
                    {novel.title}
                </Text>
                {size !== 'small' && (
                    <Text style={styles.metaText} numberOfLines={1}>
                        {novel.genre || 'Novel'}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const getStyles = (theme: ThemeColors, size: string) => StyleSheet.create({
    container: {
        marginRight: spacing[4],
    },
    imageContainer: {
        width: '100%',
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        backgroundColor: theme.backgroundSecondary,
        position: 'relative',
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    ratingBadge: {
        position: 'absolute',
        top: spacing[2],
        right: spacing[2],
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.75)', // Fixed dark for readability on images
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
        gap: 2,
    },
    ratingText: {
        color: '#FFFFFF', // Always white on dark badge
        fontSize: 10,
        fontWeight: typography.fontWeight.bold,
    },
    infoContainer: {
        marginTop: spacing[2],
    },
    title: {
        fontSize: size === 'small' ? typography.fontSize.xs : typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        color: theme.text,
        lineHeight: size === 'small' ? 14 : 18,
    },
    metaText: {
        fontSize: 11,
        color: theme.textSecondary,
        marginTop: 2,
    },
});

export default NovelCard;
