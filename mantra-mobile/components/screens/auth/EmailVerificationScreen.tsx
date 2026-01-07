import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useToast } from '../../ToastManager';
import { useTheme } from '../../../context/ThemeContext';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import authService from '../../../services/authService';

const { width } = Dimensions.get('window');

interface EmailVerificationScreenProps {
  navigation: any;
  route: any;
}

const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  navigation,
  route
}) => {
  const { theme } = useTheme();
  const email = route?.params?.email || 'your email';
  const username = route?.params?.username || '';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { showToast } = useToast();

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      showToast('error', 'Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.verifyOTP(email, otpCode);

      if (response.success) {
        showToast('success', 'Email verified successfully!');
        setTimeout(() => {
          navigation.navigate('Onboarding', { username });
        }, 500);
      } else {
        showToast('error', response.message);
      }
    } catch (error: any) {
      showToast('error', error.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);

    try {
      const response = await authService.resendOTP(email);

      if (response.success) {
        showToast('success', response.message);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        showToast('error', response.message);
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Mantra</Text>
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Verify your email</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Enter the 6-digit code sent to your email
          </Text>
        </View>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
                focusedIndex === index && { borderColor: theme.primary, borderWidth: 2 },
                digit && { borderColor: theme.primary },
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}

              selectionColor={theme.primary}
              cursorColor={theme.primary}
              underlineColorAndroid="transparent"
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          activeOpacity={0.95}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.verifyButtonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: theme.textSecondary }]}>Didn't receive? </Text>
          <TouchableOpacity onPress={handleResend} disabled={isResending}>
            {isResending ? (
              <ActivityIndicator size="small" color={colors.sky600} />
            ) : (
              <Text style={[styles.resendLink, { color: theme.primary }]}>Resend</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
    height: 40,
    width: 40,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.sky500,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  logoText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.slate500,
    marginTop: spacing[1],
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  otpInput: {
    width: 48, // w-12 (48px)
    height: 56, // h-14 (56px)
    textAlign: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate800,
    backgroundColor: colors.white,
  },
  otpInputFocused: {
    borderColor: colors.sky500,
    borderWidth: 2,
  },
  otpInputFilled: {
    borderColor: colors.sky500,
  },
  verifyButton: {
    backgroundColor: colors.sky500,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10, // py-2.5 from HTML
    shadowColor: colors.sky500,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[3],
  },
  resendText: {
    fontSize: typography.fontSize.xs,
    color: colors.slate500,
  },
  resendLink: {
    fontSize: typography.fontSize.xs,
    color: colors.sky600,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default EmailVerificationScreen;
