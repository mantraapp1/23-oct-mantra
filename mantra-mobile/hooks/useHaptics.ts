import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Hook for haptic feedback with graceful fallbacks
 * Provides a premium, responsive feel to the app
 */
export const useHaptics = () => {
    /**
     * Light impact - for taps, selections
     */
    const light = useCallback(async () => {
        try {
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        } catch (error) {
            // Haptics not available, fail silently
        }
    }, []);

    /**
     * Medium impact - for confirmations, toggles
     */
    const medium = useCallback(async () => {
        try {
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
        } catch (error) {
            // Haptics not available, fail silently
        }
    }, []);

    /**
     * Heavy impact - for important actions, errors
     */
    const heavy = useCallback(async () => {
        try {
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }
        } catch (error) {
            // Haptics not available, fail silently
        }
    }, []);

    /**
     * Success notification - for completed actions
     */
    const success = useCallback(async () => {
        try {
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            // Haptics not available, fail silently
        }
    }, []);

    /**
     * Warning notification - for warnings, cautions
     */
    const warning = useCallback(async () => {
        try {
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
        } catch (error) {
            // Haptics not available, fail silently
        }
    }, []);

    /**
     * Error notification - for errors, failures
     */
    const error = useCallback(async () => {
        try {
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } catch (error) {
            // Haptics not available, fail silently
        }
    }, []);

    /**
     * Selection changed - for picker changes, list selections
     */
    const selection = useCallback(async () => {
        try {
            if (Platform.OS === 'ios' || Platform.OS === 'android') {
                await Haptics.selectionAsync();
            }
        } catch (error) {
            // Haptics not available, fail silently
        }
    }, []);

    return {
        light,
        medium,
        heavy,
        success,
        warning,
        error,
        selection,
    };
};

export default useHaptics;
