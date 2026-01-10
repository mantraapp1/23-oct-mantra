import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
    Platform,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, borderRadius, typography } from '../../constants';

// Types related to Alert System
export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertProps {
    visible: boolean;
    title?: string;
    message?: string;
    buttons?: AlertButton[];
    onDismiss?: () => void;
}

const { width } = Dimensions.get('window');

const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    title,
    message,
    buttons = [],
    onDismiss
}) => {
    const { theme, isDarkMode } = useTheme();
    const styles = getStyles(theme, isDarkMode);

    // Animation values
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 7,
                    tension: 40,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.9,
                    duration: 150,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    if (!visible && (opacityAnim as any)._value === 0) return null;

    // Default button if none provided
    const alertButtons = buttons && buttons.length > 0 ? buttons : [
        { text: 'OK', style: 'default', onPress: onDismiss }
    ] as AlertButton[];

    const handleButtonPress = (btn: AlertButton) => {
        if (btn.onPress) {
            btn.onPress();
        } else if (onDismiss) {
            onDismiss();
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onDismiss}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={onDismiss}>
                    <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.alertContainer,
                        {
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    <View style={styles.contentContainer}>
                        {title && <Text style={styles.title}>{title}</Text>}
                        {message && <Text style={styles.message}>{message}</Text>}
                    </View>

                    <View style={[
                        styles.buttonContainer,
                        alertButtons.length > 2 && styles.buttonContainerVertical
                    ]}>
                        {alertButtons.map((btn, index) => {
                            const isDestructive = btn.style === 'destructive';
                            const isCancel = btn.style === 'cancel';

                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[
                                        styles.button,
                                        alertButtons.length > 2 && styles.buttonVertical,
                                        isCancel && !isDestructive && styles.buttonCancel,
                                        // If it's the primary action (last button usually), give it prominence or keeping it simple?
                                        // Design choice: Keep buttons minimal like iOS/Android native but refined.
                                    ]}
                                    onPress={() => handleButtonPress(btn)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[
                                        styles.buttonText,
                                        isDestructive && styles.textDestructive,
                                        isCancel && !isDestructive && styles.textCancel,
                                        // Default Logic: If it's the last button and not cancel/destructive, make it bold/primary color
                                        (index === alertButtons.length - 1 && !isCancel && !isDestructive) && styles.textPrimary
                                    ]}>
                                        {btn.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const getStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    alertContainer: {
        width: Math.min(width * 0.85, 360),
        backgroundColor: theme.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.border,
        elevation: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    contentContainer: {
        padding: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.text,
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.2,
    },
    message: {
        fontSize: 15,
        color: theme.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    buttonContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: theme.border,
    },
    buttonContainerVertical: {
        flexDirection: 'column',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        // Add separator logic in rendering if needed, but flex handles basic spacing
        borderRightWidth: 0.5,
        borderRightColor: theme.border,
    },
    buttonVertical: {
        borderRightWidth: 0,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    // Ensure last button doesn't have right border in horizontal mode
    buttonCancel: {
        // Optional specific styling
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.primary, // Default button color
    },
    textDestructive: {
        color: colors.red500,
    },
    textCancel: {
        color: theme.textSecondary,
        fontWeight: '500',
    },
    textPrimary: {
        color: theme.primary,
        fontWeight: '700',
    }
});

export default CustomAlert;
