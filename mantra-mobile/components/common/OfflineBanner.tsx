/**
 * Offline Banner Component
 * Shows a banner when user is offline
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, typography } from '../../constants';

interface OfflineBannerProps {
    /** Custom message to show */
    message?: string;
    /** Whether to show retry button */
    showRetry?: boolean;
    /** Callback when retry is pressed */
    onRetry?: () => void;
}

/**
 * Banner that appears when user goes offline
 * Animates in/out smoothly
 */
export const OfflineBanner: React.FC<OfflineBannerProps> = ({
    message = 'You are offline',
    showRetry = false,
    onRetry,
}) => {
    const { isOffline } = useNetworkStatus();
    const { theme } = useTheme();
    const slideAnim = useRef(new Animated.Value(-60)).current;

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: isOffline ? 0 : -60,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }, [isOffline, slideAnim]);

    if (!isOffline) {
        return null;
    }

    return (
        <Animated.View
            style={[
                styles.container,
                { backgroundColor: colors.amber500, transform: [{ translateY: slideAnim }] },
            ]}
        >
            <View style={styles.content}>
                <Feather name="wifi-off" size={16} color={colors.white} />
                <Text style={styles.text}>{message}</Text>
            </View>
            {showRetry && onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <Feather name="refresh-cw" size={14} color={colors.white} />
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 44, // Account for status bar
        paddingBottom: spacing[2],
        paddingHorizontal: spacing[4],
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 999,
        elevation: 999,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    text: {
        color: colors.white,
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[1],
        padding: spacing[2],
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    retryText: {
        color: colors.white,
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
    },
});

export default OfflineBanner;
