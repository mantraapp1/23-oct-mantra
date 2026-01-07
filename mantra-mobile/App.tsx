import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './components/SplashScreen';
import RootNavigator from './components/navigation/RootNavigator';
import { ToastProvider } from './components/ToastManager';
import { colors } from './constants';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

const { width } = Dimensions.get('window');
const MAX_WIDTH = 448; // max-w-md from HTML design

const AppContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[
        styles.appContainer,
        { backgroundColor: theme.background },
        width > MAX_WIDTH && styles.appContainerCentered
      ]}>
        {children}
      </View>
    </View>
  );
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (isLoading) {
    return (
      <SplashScreen
        onFinish={() => {
          setIsLoading(false);
        }}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <AppContainer>
              <NavigationContainer>
                <StatusBar style="auto" />
                <RootNavigator isLoggedIn={isLoggedIn} />
              </NavigationContainer>
            </AppContainer>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.slate100,
    alignItems: 'center',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_WIDTH,
    backgroundColor: colors.white,
  },
  appContainerCentered: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
