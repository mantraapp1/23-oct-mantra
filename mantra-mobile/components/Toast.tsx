import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../constants';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export interface ToastConfig {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  duration?: number;
  onAction?: () => void;
  actionText?: string;
  onUndo?: () => void;
}

interface ToastProps {
  config: ToastConfig;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ config, onClose }) => {
  const { isDarkMode } = useTheme();
  const slideAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Manual close handler
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose(config.id);
    });
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const duration = config.duration || 3000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [config.duration]);

  // Professional "System-Native" Design System
  const getThemeStyles = () => {
    if (isDarkMode) {
      return {
        // Dark Mode: "Deep Glass"
        bg: colors.slate800,        // Match card surfaces
        border: colors.slate700,    // High-light border for definition
        text: colors.slate50,       // Soft white for readibility
        shadow: '#000000',          // Deep shadow
        shadowOpacity: 0.4,
      };
    } else {
      return {
        // Light Mode: "Clean Paper"
        bg: '#FFFFFF',              // Pure white
        border: colors.slate200,    // Subtle border
        text: colors.slate900,      // Sharp dark text
        shadow: '#000000',          // Soft diffused shadow
        shadowOpacity: 0.1,
      };
    }
  };

  const getTypeConfig = () => {
    switch (config.type) {
      case 'success':
        return {
          icon: 'check-circle' as const,
          iconColor: colors.emerald500
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          iconColor: colors.red500 // Slightly softer than 600 for elegance
        };
      case 'warning':
        return {
          icon: 'alert-triangle' as const,
          iconColor: colors.amber500
        };
      case 'info':
        return {
          icon: 'info' as const,
          iconColor: colors.sky500
        };
      case 'loading':
        return {
          icon: 'loader' as const,
          iconColor: isDarkMode ? colors.slate400 : colors.slate500
        };
      default:
        return {
          icon: 'info' as const,
          iconColor: colors.sky500
        };
    }
  };

  const themeStyles = getThemeStyles();
  const typeConfig = getTypeConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleClose}
        style={[
          styles.pill,
          {
            backgroundColor: themeStyles.bg,
            borderColor: themeStyles.border,
            borderWidth: 1, // Always 1px definition
            shadowColor: themeStyles.shadow,
            shadowOpacity: themeStyles.shadowOpacity,
          }
        ]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Feather
            name={typeConfig.icon}
            size={20}
            color={typeConfig.iconColor}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.message, { color: themeStyles.text }]} numberOfLines={2}>
            {config.message}
          </Text>

          {/* Action Buttons */}
          {(config.actionText && config.onAction) || config.onUndo ? (
            <View style={styles.actions}>
              {config.actionText && config.onAction && (
                <TouchableOpacity onPress={config.onAction} style={styles.actionButton}>
                  <Text style={[styles.actionText, { color: typeConfig.iconColor }]}>
                    {config.actionText}
                  </Text>
                </TouchableOpacity>
              )}
              {config.onUndo && (
                <TouchableOpacity onPress={config.onUndo} style={styles.actionButton}>
                  <Text style={[styles.actionText, { color: typeConfig.iconColor }]}>Undo</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    marginBottom: spacing[2],
    maxWidth: width - 32, // Slightly wider for modern feel
    zIndex: 10000,
  },
  pill: {
    flexDirection: 'row',
    borderRadius: 50, // Full Pill
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // Base Shadow Specs
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowRadius: 12,
    elevation: 8,
    minWidth: 200,
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flexShrink: 1,
  },
  message: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium, // Medium weight for legibility
    lineHeight: 20,
    letterSpacing: 0.2, // Slight tracking for premium feel
    textAlign: 'left',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 16,
  },
  actionButton: {
    paddingVertical: 2,
  },
  actionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
});

export default Toast;
