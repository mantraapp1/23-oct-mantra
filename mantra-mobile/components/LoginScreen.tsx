import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { FormInput } from './common';
import { useToast } from './ToastManager';
import { colors, spacing, borderRadius, typography } from '../constants';
import authService from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../constants/theme';

const { width } = Dimensions.get('window');

interface LoginScreenProps {
  navigation: any;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    let isValid = true;

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);

    try {
      const response = await authService.login({
        email: email.trim(),
        password,
      });

      if (response.success) {
        showToast('success', 'Login successful!');
        // Navigate to main screen
        setTimeout(() => {
          navigation.navigate('Main');
        }, 500);
      } else {
        showToast('error', response.message);
      }
    } catch (error: any) {
      showToast('error', error.message || 'Login failed. Please try again.');
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
              source={require('../assets/Mantra logo.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
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

          <View>
            <View style={styles.passwordHeader}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PasswordReset')}>
                <Text style={styles.forgotText}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <FormInput
              label=""
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError('');
              }}
              error={passwordError}
              placeholder="••••••••"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            activeOpacity={0.95}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>No account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: theme.textSecondary,
    marginTop: spacing[1],
  },
  form: {
    gap: spacing[4],
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  forgotText: {
    fontSize: typography.fontSize.xs,
    color: theme.primary,
    fontWeight: typography.fontWeight.medium,
  },
  loginButton: {
    backgroundColor: theme.primary,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: spacing[2],
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[4],
  },
  signUpText: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
  },
  signUpLink: {
    fontSize: typography.fontSize.xs,
    color: theme.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default LoginScreen;
