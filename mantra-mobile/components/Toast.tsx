import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../constants';

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
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto close timer
    const duration = config.duration || 3000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [config.duration]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
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

  const getToastConfig = () => {
    switch (config.type) {
      case 'success':
        return {
          backgroundColor: colors.emerald50,
          borderColor: colors.emerald700,
          icon: 'checkmark-circle' as const,
          iconColor: colors.emerald700,
          textColor: colors.emerald700,
        };
      case 'error':
        return {
          backgroundColor: '#fef2f2',
          borderColor: colors.red500,
          icon: 'close-circle' as const,
          iconColor: colors.red500,
          textColor: colors.red500,
        };
      case 'warning':
        return {
          backgroundColor: colors.amber50,
          borderColor: colors.amber500,
          icon: 'warning' as const,
          iconColor: colors.amber500,
          textColor: colors.amber500,
        };
      case 'info':
        return {
          backgroundColor: colors.sky50,
          borderColor: colors.sky600,
          icon: 'information-circle' as const,
          iconColor: colors.sky600,
          textColor: colors.sky600,
        };
      case 'loading':
        return {
          backgroundColor: colors.slate50,
          borderColor: colors.slate500,
          icon: 'ellipsis-horizontal-circle' as const,
          iconColor: colors.slate500,
          textColor: colors.slate700,
        };
      default:
        return {
          backgroundColor: colors.sky50,
          borderColor: colors.sky600,
          icon: 'information-circle' as const,
          iconColor: colors.sky600,
          textColor: colors.sky600,
        };
    }
  };

  const toastConfig = getToastConfig();

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={[styles.toastContent, { backgroundColor: toastConfig.backgroundColor, borderColor: toastConfig.borderColor }]}>
        <View style={styles.toastInner}>
          <Ionicons
            name={toastConfig.icon}
            size={20}
            color={toastConfig.iconColor}
            style={styles.toastIcon}
          />
          <Text style={[styles.toastText, { color: toastConfig.textColor }]}>
            {config.message}
          </Text>

          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={16} color={toastConfig.iconColor} />
          </TouchableOpacity>
        </View>

        {config.actionText && config.onAction && (
          <TouchableOpacity onPress={config.onAction} style={styles.actionButton}>
            <Text style={styles.actionText}>{config.actionText}</Text>
          </TouchableOpacity>
        )}

        {config.onUndo && (
          <TouchableOpacity onPress={config.onUndo} style={styles.undoButton}>
            <Text style={styles.undoText}>UNDO</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    maxWidth: 380,
    alignSelf: 'center',
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
  },
  toastContent: {
    borderWidth: 1,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastIcon: {
    marginRight: spacing[2],
    flexShrink: 0,
  },
  toastText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  closeButton: {
    padding: spacing[1],
    marginLeft: spacing[2],
  },
  actionButton: {
    marginTop: spacing[2],
    paddingVertical: spacing[1],
  },
  actionText: {
    fontSize: typography.fontSize.xs,
    color: colors.sky600,
    fontWeight: typography.fontWeight.semibold,
  },
  undoButton: {
    marginTop: spacing[2],
    paddingVertical: spacing[1],
    alignSelf: 'flex-start',
  },
  undoText: {
    fontSize: typography.fontSize.xs,
    color: colors.sky600,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default Toast;
