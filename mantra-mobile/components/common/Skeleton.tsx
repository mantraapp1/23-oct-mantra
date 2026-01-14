/**
 * Skeleton Loading Components
 * Placeholder components that show while content is loading
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius } from '../../constants';
import { createSkeletonAnimation } from '../../utils/animations';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

/**
 * Base Skeleton component with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 16,
    borderRadius: radius = 4,
    style,
}) => {
    const { theme } = useTheme();
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = createSkeletonAnimation(animatedValue);
        animation.start();
        return () => animation.stop();
    }, [animatedValue]);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius: radius,
                    backgroundColor: theme.border,
                    opacity,
                },
                style,
            ]}
        />
    );
};

/**
 * Skeleton for text lines
 */
export const SkeletonText: React.FC<{
    lines?: number;
    lastLineWidth?: string;
    lineHeight?: number;
    spacing?: number;
}> = ({ lines = 3, lastLineWidth = '60%', lineHeight = 14, spacing: gap = 8 }) => {
    return (
        <View style={{ gap }}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    width={i === lines - 1 ? lastLineWidth : '100%'}
                    height={lineHeight}
                />
            ))}
        </View>
    );
};

/**
 * Skeleton for novel cards
 */
export const SkeletonNovelCard: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({
    size = 'medium',
}) => {
    const dimensions = {
        small: { width: 100, height: 140 },
        medium: { width: 120, height: 170 },
        large: { width: 140, height: 200 },
    };

    const { width, height } = dimensions[size];

    return (
        <View style={[styles.cardContainer, { width }]}>
            <Skeleton width={width} height={height} borderRadius={borderRadius.lg} />
            <View style={styles.cardContent}>
                <Skeleton width="100%" height={14} />
                <Skeleton width="60%" height={12} style={{ marginTop: 4 }} />
            </View>
        </View>
    );
};

/**
 * Skeleton for horizontal novel list
 */
export const SkeletonHorizontalList: React.FC<{ count?: number }> = ({ count = 4 }) => {
    return (
        <View style={styles.horizontalContainer}>
            <Skeleton width={120} height={20} style={{ marginBottom: spacing[3] }} />
            <View style={styles.horizontalList}>
                {Array.from({ length: count }).map((_, i) => (
                    <SkeletonNovelCard key={i} size="medium" />
                ))}
            </View>
        </View>
    );
};

/**
 * Skeleton for chapter list item
 */
export const SkeletonChapterItem: React.FC = () => {
    return (
        <View style={styles.chapterItem}>
            <Skeleton width={40} height={40} borderRadius={8} />
            <View style={styles.chapterContent}>
                <Skeleton width="80%" height={16} />
                <Skeleton width="40%" height={12} style={{ marginTop: 4 }} />
            </View>
        </View>
    );
};

/**
 * Skeleton for review item
 */
export const SkeletonReviewItem: React.FC = () => {
    return (
        <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={{ flex: 1, marginLeft: spacing[3] }}>
                    <Skeleton width="50%" height={14} />
                    <Skeleton width="30%" height={12} style={{ marginTop: 4 }} />
                </View>
            </View>
            <SkeletonText lines={2} />
        </View>
    );
};

/**
 * Skeleton for novel detail header
 */
export const SkeletonNovelDetail: React.FC = () => {
    const { theme } = useTheme();

    return (
        <View style={[styles.detailContainer, { backgroundColor: theme.background }]}>
            {/* Banner */}
            <Skeleton width="100%" height={200} borderRadius={0} />

            {/* Content */}
            <View style={styles.detailContent}>
                <View style={styles.detailHeader}>
                    <Skeleton width={120} height={180} borderRadius={borderRadius.lg} />
                    <View style={styles.detailInfo}>
                        <Skeleton width="100%" height={24} />
                        <Skeleton width="60%" height={16} style={{ marginTop: 8 }} />
                        <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
                        <View style={styles.detailButtons}>
                            <Skeleton width={100} height={36} borderRadius={18} />
                            <Skeleton width={100} height={36} borderRadius={18} />
                        </View>
                    </View>
                </View>

                {/* Description */}
                <View style={{ marginTop: spacing[4] }}>
                    <SkeletonText lines={4} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    skeleton: {
        overflow: 'hidden',
    },
    cardContainer: {
        marginRight: spacing[3],
    },
    cardContent: {
        marginTop: spacing[2],
    },
    horizontalContainer: {
        paddingHorizontal: spacing[4],
        marginTop: spacing[4],
    },
    horizontalList: {
        flexDirection: 'row',
    },
    chapterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing[3],
        paddingHorizontal: spacing[4],
    },
    chapterContent: {
        flex: 1,
        marginLeft: spacing[3],
    },
    reviewItem: {
        padding: spacing[4],
        gap: spacing[3],
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailContainer: {
        flex: 1,
    },
    detailContent: {
        padding: spacing[4],
        marginTop: -60,
    },
    detailHeader: {
        flexDirection: 'row',
        gap: spacing[4],
    },
    detailInfo: {
        flex: 1,
        paddingTop: 60,
    },
    detailButtons: {
        flexDirection: 'row',
        gap: spacing[2],
        marginTop: spacing[3],
    },
});

export default {
    Base: Skeleton,
    Text: SkeletonText,
    NovelCard: SkeletonNovelCard,
    HorizontalList: SkeletonHorizontalList,
    ChapterItem: SkeletonChapterItem,
    ReviewItem: SkeletonReviewItem,
    NovelDetail: SkeletonNovelDetail,
};
