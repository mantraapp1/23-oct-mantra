import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { BottomTabParamList } from '../types';
import { colors, spacing, typography } from '../constants';
import { useTheme } from '../context/ThemeContext';

// Import screens from the aggregate file
import {
    RankingScreen,
    LibraryScreen,
    ProfileScreen
} from './TabScreens';
import HomeScreen from './HomeScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const BottomTabNavigation = () => {
    const { theme } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                // LAZY LOADING: Only mount screens when user navigates to them
                // Prevents unwanted API requests for screens user isn't viewing
                lazy: true,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: any;

                    if (route.name === 'Home') {
                        iconName = 'home';
                    } else if (route.name === 'Ranking') {
                        iconName = 'bar-chart-2';
                    } else if (route.name === 'Library') {
                        iconName = 'book-open';
                    } else if (route.name === 'Profile') {
                        iconName = 'user';
                    }

                    return <Feather name={iconName} size={22} color={color} />;
                },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.textSecondary,
                tabBarStyle: {
                    backgroundColor: theme.card,
                    borderTopColor: theme.border,
                    height: 60,
                    paddingBottom: spacing[2],
                    paddingTop: spacing[2],
                    elevation: 8,
                    shadowColor: theme.shadow,
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: typography.fontWeight.medium,
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Ranking" component={RankingScreen} />
            <Tab.Screen name="Library" component={LibraryScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

export default BottomTabNavigation;
