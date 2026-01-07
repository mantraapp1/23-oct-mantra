import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FormInputProps } from '../../types';
import { colors, spacing, borderRadius, typography } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../constants/theme';

const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  multiline = false,
  numberOfLines = 1,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const showPasswordToggle = secureTextEntry;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            error && styles.inputError,
            showPasswordToggle && styles.inputWithIcon,
            multiline && styles.inputMultiline,
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          selectionColor={theme.primary}
          cursorColor={theme.primary}
          underlineColorAndroid="transparent"
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off' : 'eye'}
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const getStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    // No marginBottom - let parent control spacing
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    marginBottom: spacing[1],
    fontWeight: typography.fontWeight.medium,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.fontSize.sm,
    backgroundColor: theme.inputBackground,
    color: theme.text,
  },
  inputFocused: {
    borderColor: theme.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: colors.red500,
  },
  inputWithIcon: {
    paddingRight: spacing[11],
  },
  inputMultiline: {
    height: 'auto',
    minHeight: 80,
    paddingTop: spacing[3],
    textAlignVertical: 'top',
  },
  eyeButton: {
    position: 'absolute',
    right: spacing[2],
    top: spacing[2],
    padding: spacing[1.5],
    borderRadius: borderRadius.md,
  },
  error: {
    fontSize: typography.fontSize.xs,
    color: colors.red500,
    marginTop: spacing[1],
  },
});

export default FormInput;
