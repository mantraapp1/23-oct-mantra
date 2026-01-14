import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    onReset?: () => void;
    screenName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Per-screen Error Boundary with retry capability
 * Catches errors in child components and displays a fallback UI
 */
export class ScreenErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log the error
        console.error(`[ScreenErrorBoundary${this.props.screenName ? ` - ${this.props.screenName}` : ''}] Error caught:`, {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
        });

        // Call optional error handler
        this.props.onError?.(error, errorInfo);

        // TODO: Send to error tracking service (e.g., Sentry, Crashlytics)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        this.props.onReset?.();
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <View style={styles.container}>
                    <View style={styles.iconContainer}>
                        <Feather name="alert-circle" size={48} color={colors.red500} />
                    </View>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.message}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </Text>
                    <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                        <Feather name="refresh-cw" size={16} color={colors.white} />
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: colors.white,
    },
    iconContainer: {
        marginBottom: 16,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.slate900,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: colors.slate500,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 32,
        lineHeight: 20,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.sky500,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    buttonText: {
        color: colors.white,
        fontWeight: '600',
        fontSize: 14,
    },
});

export default ScreenErrorBoundary;
