import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';

// Auth screens
import LoginScreen from '../LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import PasswordResetScreen from '../screens/auth/PasswordResetScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

// Main navigation
import BottomTabNavigation from '../BottomTabNavigation';

// Novel screens
import NovelDetailScreen from '../screens/NovelDetailScreen';
import ChapterScreen from '../ChapterScreen';

// Search screens
import RecentSearchScreen from '../screens/RecentSearchScreen';
import SearchResultScreen from '../screens/SearchResultScreen';

// Genre and discovery screens
import GenreScreen from '../screens/GenreScreen';
import SeeAllScreen from '../screens/SeeAllScreen';
import TagsSectionScreen from '../screens/TagsSectionScreen';
import EditorsChoiceScreen from '../screens/EditorsChoiceScreen';

// Author dashboard screens
import AuthorDashboardScreen from '../screens/author/AuthorDashboardScreen';
import NovelManageScreen from '../screens/author/NovelManageScreen';
import ChapterManageScreen from '../screens/author/ChapterManageScreen';
import CreateNovelScreen from '../screens/author/CreateNovelScreen';
import EditNovelScreen from '../screens/author/EditNovelScreen';
import CreateChapterScreen from '../screens/author/CreateChapterScreen';
import EditChapterScreen from '../screens/author/EditChapterScreen';

// Profile screens
import OtherUserProfileScreen from '../screens/profile/OtherUserProfileScreen';
import FollowListScreen from '../screens/profile/FollowListScreen';
import NotificationScreen from '../screens/profile/NotificationScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import AccountSettingsScreen from '../screens/profile/AccountSettingsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';

// Wallet screens
import WalletScreen from '../screens/wallet/WalletScreen';
import WithdrawalScreen from '../screens/wallet/WithdrawalScreen';
import TransactionHistoryScreen from '../screens/wallet/TransactionHistoryScreen';
import TopUpScreen from '../screens/wallet/TopUpScreen';

// Miscellaneous screens
import FaqScreen from '../screens/misc/FaqScreen';
import ContactUsScreen from '../screens/misc/ContactUsScreen';
import ReportScreen from '../screens/misc/ReportScreen';

const Stack = createStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  isLoggedIn: boolean;
}

import { useTheme } from '../../context/ThemeContext';

const RootNavigator: React.FC<RootNavigatorProps> = ({ isLoggedIn }) => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.background },
      }}
      initialRouteName={isLoggedIn ? 'Main' : 'Login'}
    >
      {/* Auth Stack - Always available for navigation */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />

      {/* Main Stack - Always available for navigation */}
      <Stack.Screen name="Main" component={BottomTabNavigation} />

      {/* Novel Screens */}
      <Stack.Screen
        name="NovelDetail"
        component={NovelDetailScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="Chapter"
        component={ChapterScreen}
        options={{
          presentation: 'card',
        }}
      />

      {/* Search Screens */}
      <Stack.Screen
        name="RecentSearch"
        component={RecentSearchScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="SearchResult"
        component={SearchResultScreen}
        options={{
          presentation: 'card',
        }}
      />

      {/* Discovery Screens */}
      <Stack.Screen
        name="Genre"
        component={GenreScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="SeeAll"
        component={SeeAllScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="TagsSection"
        component={TagsSectionScreen}
        options={{
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="EditorsChoice"
        component={EditorsChoiceScreen}
        options={{
          presentation: 'card',
        }}
      />

      {/* Author Dashboard Screens */}
      <Stack.Screen
        name="AuthorDashboard"
        component={AuthorDashboardScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="NovelManage"
        component={NovelManageScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="ChapterManage"
        component={ChapterManageScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="CreateNovel"
        component={CreateNovelScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="EditNovel"
        component={EditNovelScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="CreateChapter"
        component={CreateChapterScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="EditChapter"
        component={EditChapterScreen}
        options={{ presentation: 'card' }}
      />

      {/* Profile Screens */}
      <Stack.Screen
        name="OtherUserProfile"
        component={OtherUserProfileScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="FollowList"
        component={FollowListScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="Notification"
        component={NotificationScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="AccountSettings"
        component={AccountSettingsScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ presentation: 'card' }}
      />

      {/* Wallet Screens */}
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="TopUp"
        component={TopUpScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="Withdrawal"
        component={WithdrawalScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="TransactionHistory"
        component={TransactionHistoryScreen}
        options={{ presentation: 'card' }}
      />

      {/* Miscellaneous Screens */}
      <Stack.Screen
        name="Faq"
        component={FaqScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="ContactUs"
        component={ContactUsScreen}
        options={{ presentation: 'card' }}
      />
      <Stack.Screen
        name="Report"
        component={ReportScreen}
        options={{ presentation: 'card' }}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
