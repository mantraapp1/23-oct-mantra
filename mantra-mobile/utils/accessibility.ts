/**
 * Accessibility Utilities
 * Helpers for making the app accessible to all users
 */

import { AccessibilityInfo, Platform, AccessibilityRole } from 'react-native';

/**
 * Common accessibility roles mapped to React Native
 */
export const A11yRoles: Record<string, AccessibilityRole> = {
    button: 'button',
    link: 'link',
    image: 'image',
    text: 'text',
    header: 'header',
    search: 'search',
    tab: 'tab',
    checkbox: 'checkbox',
    radio: 'radio',
    slider: 'adjustable',
    switch: 'switch',
    alert: 'alert',
    menu: 'menu',
    menuItem: 'menuitem',
    progressBar: 'progressbar',
    spinButton: 'spinbutton',
    timer: 'timer',
    list: 'list',
    listItem: 'none', // RN doesn't have listitem
    summary: 'summary',
};

/**
 * Generate accessibility props for a button
 */
export const getButtonA11yProps = (
    label: string,
    hint?: string,
    disabled?: boolean
) => ({
    accessible: true,
    accessibilityRole: 'button' as AccessibilityRole,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { disabled },
});

/**
 * Generate accessibility props for an image
 */
export const getImageA11yProps = (description: string) => ({
    accessible: true,
    accessibilityRole: 'image' as AccessibilityRole,
    accessibilityLabel: description,
});

/**
 * Generate accessibility props for a link
 */
export const getLinkA11yProps = (label: string, hint?: string) => ({
    accessible: true,
    accessibilityRole: 'link' as AccessibilityRole,
    accessibilityLabel: label,
    accessibilityHint: hint || `Opens ${label}`,
});

/**
 * Generate accessibility props for a header
 */
export const getHeaderA11yProps = (level: 1 | 2 | 3 | 4 | 5 | 6 = 1) => ({
    accessible: true,
    accessibilityRole: 'header' as AccessibilityRole,
    // iOS supports heading levels
    ...(Platform.OS === 'ios' && { accessibilityLevel: level }),
});

/**
 * Generate accessibility props for a text input
 */
export const getTextInputA11yProps = (
    label: string,
    hint?: string,
    error?: string
) => ({
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: {
        invalid: !!error,
    },
    ...(error && { accessibilityValue: { text: error } }),
});

/**
 * Generate accessibility props for a loading state
 */
export const getLoadingA11yProps = (isLoading: boolean) => ({
    accessible: true,
    accessibilityRole: 'progressbar' as AccessibilityRole,
    accessibilityState: { busy: isLoading },
    accessibilityLabel: isLoading ? 'Loading' : undefined,
});

/**
 * Generate accessibility props for a selected state
 */
export const getSelectableA11yProps = (
    label: string,
    isSelected: boolean,
    hint?: string
) => ({
    accessible: true,
    accessibilityRole: 'button' as AccessibilityRole,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityState: { selected: isSelected },
});

/**
 * Generate accessibility props for a checkbox
 */
export const getCheckboxA11yProps = (
    label: string,
    isChecked: boolean
) => ({
    accessible: true,
    accessibilityRole: 'checkbox' as AccessibilityRole,
    accessibilityLabel: label,
    accessibilityState: { checked: isChecked },
});

/**
 * Generate accessibility props for a switch/toggle
 */
export const getSwitchA11yProps = (
    label: string,
    isEnabled: boolean
) => ({
    accessible: true,
    accessibilityRole: 'switch' as AccessibilityRole,
    accessibilityLabel: label,
    accessibilityState: { checked: isEnabled },
});

/**
 * Announce a message to screen readers
 */
export const announceForAccessibility = (message: string): void => {
    AccessibilityInfo.announceForAccessibility(message);
};

/**
 * Check if screen reader is enabled
 */
export const isScreenReaderEnabled = async (): Promise<boolean> => {
    return AccessibilityInfo.isScreenReaderEnabled();
};

/**
 * Check if reduce motion is enabled
 */
export const isReduceMotionEnabled = async (): Promise<boolean> => {
    return AccessibilityInfo.isReduceMotionEnabled();
};

/**
 * Subscribe to screen reader changes
 */
export const onScreenReaderChange = (
    callback: (isEnabled: boolean) => void
) => {
    const subscription = AccessibilityInfo.addEventListener(
        'screenReaderChanged',
        callback
    );
    return () => subscription.remove();
};

/**
 * Subscribe to reduce motion changes
 */
export const onReduceMotionChange = (
    callback: (isEnabled: boolean) => void
) => {
    const subscription = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        callback
    );
    return () => subscription.remove();
};

/**
 * Format number for screen readers
 * Converts "1.2k" to "1200" for better reading
 */
export const formatNumberForA11y = (formatted: string): string => {
    const lowerFormatted = formatted.toLowerCase();

    if (lowerFormatted.includes('k')) {
        const num = parseFloat(lowerFormatted.replace('k', ''));
        return Math.round(num * 1000).toString();
    }
    if (lowerFormatted.includes('m')) {
        const num = parseFloat(lowerFormatted.replace('m', ''));
        return Math.round(num * 1000000).toString();
    }
    if (lowerFormatted.includes('b')) {
        const num = parseFloat(lowerFormatted.replace('b', ''));
        return Math.round(num * 1000000000).toString();
    }

    return formatted;
};

/**
 * Generate accessibility label for novel card
 */
export const getNovelCardA11yLabel = (
    title: string,
    author: string,
    rating: number,
    chapters: number
): string => {
    return `${title} by ${author}. Rated ${rating.toFixed(1)} stars. ${chapters} chapters.`;
};

/**
 * Generate accessibility label for chapter item
 */
export const getChapterA11yLabel = (
    chapterNumber: number,
    title: string,
    isLocked: boolean
): string => {
    const lockStatus = isLocked ? 'Locked.' : '';
    return `Chapter ${chapterNumber}: ${title}. ${lockStatus}`;
};

export default {
    roles: A11yRoles,
    button: getButtonA11yProps,
    image: getImageA11yProps,
    link: getLinkA11yProps,
    header: getHeaderA11yProps,
    textInput: getTextInputA11yProps,
    loading: getLoadingA11yProps,
    selectable: getSelectableA11yProps,
    checkbox: getCheckboxA11yProps,
    switch: getSwitchA11yProps,
    announce: announceForAccessibility,
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    onScreenReaderChange,
    onReduceMotionChange,
    formatNumber: formatNumberForA11y,
    novelCard: getNovelCardA11yLabel,
    chapter: getChapterA11yLabel,
};
