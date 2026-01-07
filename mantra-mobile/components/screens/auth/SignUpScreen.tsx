import React, { useState, useEffect } from 'react';
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
import { FormInput } from '../../common';
import { useToast } from '../../ToastManager';
import { useTheme } from '../../../context/ThemeContext';
import { ThemeColors } from '../../../constants/theme';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import authService from '../../../services/authService';

const { width } = Dimensions.get('window');

interface SignUpScreenProps {
  navigation: any;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const { showToast } = useToast();
  const { theme, isDarkMode } = useTheme();

  // Check username availability with debounce
  useEffect(() => {
    if (!username) {
      setUsernameError('');
      setUsernameSuccess('');
      return;
    }

    const timer = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      setUsernameSuccess('');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      setUsernameSuccess('');
      return;
    }

    setIsCheckingUsername(true);
    try {
      const isAvailable = await authService.checkUsernameAvailability(username);
      if (isAvailable) {
        setUsernameError('');
        setUsernameSuccess('Username available ✓');
      } else {
        setUsernameError('Username already taken');
        setUsernameSuccess('');
      }
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    // Clear previous errors
    setUsernameError('');
    setUsernameSuccess('');
    setEmailError('');
    setPasswordError('');

    let isValid = true;

    // Validate username
    if (!username.trim()) {
      setUsernameError('Username is required');
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      isValid = false;
    }

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
    } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      setPasswordError('Password must contain both letters and numbers');
      isValid = false;
    }

    if (!isValid) return;

    setIsLoading(true);

    try {
      const response = await authService.signUp({
        email: email.trim(),
        password,
        username: username.trim(),
      });

      if (response.success) {
        showToast('success', 'Account created successfully!');

        if (response.user && !response.user.email_confirmed_at) {
          setTimeout(() => {
            navigation.navigate('EmailVerification', {
              email: email.trim(),
              username: username.trim()
            });
          }, 500);
        } else {
          setTimeout(() => {
            navigation.navigate('Onboarding');
          }, 500);
        }
      } else {
        showToast('error', response.message);
      }
    } catch (error: any) {
      showToast('error', error.message || 'Sign up failed. Please try again.');
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
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join and start reading</Text>
        </View>
        <View style={styles.form}>
          <View>
            <FormInput
              label="Username"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setUsernameError('');
                setUsernameSuccess('');
              }}
              error={usernameError}
              placeholder="username"
            />
            {isCheckingUsername && (
              <View style={styles.checkingContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.checkingText}>Checking availability...</Text>
              </View>
            )}
            {usernameSuccess && !isCheckingUsername && (
              <Text style={styles.successText}>{usernameSuccess}</Text>
            )}
          </View>

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

          <FormInput
            label="Password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setPasswordError('');
            }}
            error={passwordError}
            placeholder="••••••••"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.signUpButton, isLoading && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            activeOpacity={0.95}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
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
  checkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
    gap: spacing[2],
  },
  checkingText: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
  },
  successText: {
    fontSize: typography.fontSize.xs,
    color: colors.emerald700,
    marginTop: spacing[1],
  },
  signUpButton: {
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
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[4],
  },
  loginText: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
  },
  loginLink: {
    fontSize: typography.fontSize.xs,
    color: theme.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default SignUpScreen;
