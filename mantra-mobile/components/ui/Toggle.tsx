import React, { useEffect, useRef } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Animated,
    ViewStyle,
} from 'react-native';

const TOGGLE_WIDTH_SMALL = 28;
const TOGGLE_HEIGHT_SMALL = 16;
const THUMB_SIZE_SMALL = 12;

const TOGGLE_WIDTH_LARGE = 40;
const TOGGLE_HEIGHT_LARGE = 24;
const THUMB_SIZE_LARGE = 22;

export type ToggleColor = 'blue' | 'red' | 'amber' | 'green' | 'teal' | 'purple' | 'pink' | 'gray';

interface ToggleProps {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'small' | 'large';
    color?: ToggleColor; // Maps to the requested color palette if needed
    trackColor?: { false: string; true: string }; // Custom override
    thumbColor?: string; // Custom override
    style?: ViewStyle;
}

// Color palette from the request (converted to hex where possible or approximate)
const colorPalette = {
    blue: { bg: '#3b82f6', fill: '#1d4ed8' }, // blue-500/700
    red: { bg: '#dc2626', fill: '#b91c1c' }, // red-600/700
    amber: { bg: '#b45309', fill: '#92400e' }, // amber-700
    green: { bg: '#15803d', fill: '#166534' }, // green-700
    teal: { bg: '#0f766e', fill: '#115e59' }, // teal-700
    purple: { bg: '#7e22ce', fill: '#6b21a8' }, // purple-700
    pink: { bg: '#be185d', fill: '#9d174d' }, // pink-700
    gray: { bg: '#374151', fill: '#1f2937' }, // gray-700
    default: { bg: '#10b981', fill: '#059669' }, // success/green
};

export const Toggle: React.FC<ToggleProps> = ({
    checked,
    onCheckedChange,
    disabled = false,
    size = 'small',
    color = 'default',
    trackColor,
    thumbColor = '#ffffff',
    style,
}) => {
    // Animation value: 0 for unchecked, 1 for checked
    const animatedValue = useRef(new Animated.Value(checked ? 1 : 0)).current;

    // Sync animation with checked prop
    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: checked ? 1 : 0,
            duration: 150,
            useNativeDriver: false, // Layout properties usually need false
        }).start();
    }, [checked]);

    const isSmall = size === 'small';
    const width = isSmall ? TOGGLE_WIDTH_SMALL : TOGGLE_WIDTH_LARGE;
    const height = isSmall ? TOGGLE_HEIGHT_SMALL : TOGGLE_HEIGHT_LARGE;
    const thumbSize = isSmall ? THUMB_SIZE_SMALL : THUMB_SIZE_LARGE;
    const padding = 2;
    const travelDistance = width - thumbSize - (padding * 2);

    // Determine colors
    const activeColorSet = colorPalette[color as keyof typeof colorPalette] || colorPalette.default;
    const activeBg = trackColor?.true || activeColorSet.bg;
    const inactiveBg = trackColor?.false || '#e5e7eb'; // gray-200

    // Interpolate background color
    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [inactiveBg, activeBg],
    });

    // Interpolate thumb position
    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, travelDistance],
    });

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => !disabled && onCheckedChange(!checked)}
            disabled={disabled}
            style={[
                style,
                disabled && { opacity: 0.5 },
            ]}
        >
            <Animated.View
                style={[
                    styles.track,
                    {
                        width,
                        height,
                        borderRadius: height / 2,
                        backgroundColor,
                        padding,
                        justifyContent: 'center',
                    },
                ]}
            >
                <Animated.View
                    style={[
                        styles.thumb,
                        {
                            width: thumbSize,
                            height: thumbSize,
                            borderRadius: thumbSize / 2,
                            backgroundColor: thumbColor,
                            transform: [{ translateX }],
                        },
                    ]}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    track: {
        borderWidth: 1,
        borderColor: 'transparent', // Can add border color if needed
    },
    thumb: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
});
