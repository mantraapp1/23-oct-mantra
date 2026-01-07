import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../constants/theme';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  autoFocus?: boolean;
  showClearButton?: boolean;
  style?: any;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search novels, authors...',
  value = '',
  onChangeText,
  onSubmit,
  onFocus,
  onBlur,
  autoFocus = false,
  showClearButton = true,
  style,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [isFocused, setIsFocused] = useState(false);
  const [searchText, setSearchText] = useState(value);

  const handleChangeText = (text: string) => {
    setSearchText(text);
    onChangeText?.(text);
  };

  const handleSubmit = () => {
    onSubmit?.(searchText);
  };

  const handleClear = () => {
    setSearchText('');
    onChangeText?.('');
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <View style={[styles.container, isFocused && styles.focusedContainer, style]}>
      <View style={styles.searchIcon}>
        <Feather name="search" size={20} color={theme.textSecondary} />
      </View>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        value={searchText}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmit}
        onFocus={handleFocus}
        onBlur={handleBlur}
        autoFocus={autoFocus}
        returnKeyType="search"
        clearButtonMode="never"
        selectionColor={theme.primary}
        cursorColor={theme.primary}
      />

      {showClearButton && searchText.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Feather name="x" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const getStyles = (theme: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.inputBackground,
    borderRadius: borderRadius.xl,
    paddingLeft: 40, // pl-10 = 40px (space for icon)
    paddingRight: spacing[3], // pr-3 = 12px
    paddingVertical: spacing[2], // py-2 = 8px
    borderWidth: 1,
    borderColor: theme.border,
  },
  focusedContainer: {
    borderColor: theme.primary,
    backgroundColor: theme.inputBackground,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    position: 'absolute',
    left: spacing[3], // left-3 = 12px
    top: '50%',
    transform: [{ translateY: -9 }], // Center vertically (icon height / 2)
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.sm, // text-sm = 14px
    color: theme.text,
    paddingVertical: 0,
    height: 20, // Ensure consistent height
  },
  clearButton: {
    marginLeft: spacing[2],
    padding: spacing[1],
  },
});

export default SearchBar;