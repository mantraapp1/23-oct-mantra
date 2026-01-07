import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { FormInput } from '../../common';
import { useToast } from '../../ToastManager';
import { useTheme } from '../../../context/ThemeContext';
import { ThemeColors } from '../../../constants/theme';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import authService from '../../../services/authService';

const { width } = Dimensions.get('window');

interface PasswordResetScreenProps {
  navigation: any;
}

const PasswordResetScreen: React.FC<PasswordResetScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const { theme, isDarkMode } = useTheme();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendLink = async () => {
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.requestPasswordReset(email.trim());

      if (response.success) {
        showToast('success', response.message);
        setTimeout(() => {
          navigation.navigate('Login');
        }, 1500);
      } else {
        showToast('error', response.message);
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const styles = getStyles(theme, isDarkMode);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/Mantra logo.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>We'll send a reset link to your email</Text>
        </View>

        <View style={styles.form}>
          <FormInput
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setEmailError('');
            }}
            error={emailError}
            placeholder="you@example.com"
            keyboardType="email-address"
          />

          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
            onPress={handleSendLink}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.sendButtonText}>Send Link</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (theme: ThemeColors, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[14],
    paddingBottom: spacing[6],
    maxWidth: 400,
    alignSelf: 'center',
    width: width,
  },
  header: {
    marginBottom: spacing[6],
  },
  logoContainer: {
    marginBottom: spacing[4],
  },
  logo: {
    height: 48,
    width: 48,
    borderRadius: borderRadius.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: theme.text,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: theme.textSecondary,
    marginTop: spacing[1],
  },
  form: {
    gap: spacing[4],
  },
  sendButton: {
    height: 44,
    backgroundColor: theme.primary,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default PasswordResetScreen;
