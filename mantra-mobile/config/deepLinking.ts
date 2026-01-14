/**
 * Deep Linking Configuration
 * Handle app URLs and navigation from external sources
 */

import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

// App URL scheme
const APP_SCHEME = 'mantra';
const WEB_DOMAIN = 'mantra.app'; // Replace with your actual domain

/**
 * Deep linking path patterns
 */
export const DeepLinkPaths = {
    // Main screens
    home: '',
    ranking: 'ranking',
    library: 'library',
    profile: 'profile/:userId?',

    // Novel screens
    novel: 'novel/:novelId',
    chapter: 'novel/:novelId/chapter/:chapterId',
    reviews: 'novel/:novelId/reviews',

    // Search
    search: 'search',
    searchResults: 'search/:query',
    genre: 'genre/:genre',

    // Auth
    login: 'login',
    signup: 'signup',
    resetPassword: 'reset-password/:token?',
    verifyEmail: 'verify-email/:token',

    // User
    settings: 'settings',
    notifications: 'notifications',
    wallet: 'wallet',

    // Author
    authorDashboard: 'author/dashboard',
    novelManage: 'author/novel/:novelId',
    createNovel: 'author/create',
};

/**
 * Navigation linking configuration
 */
export const linkingConfig: LinkingOptions<any> = {
    prefixes: [
        Linking.createURL('/'),
        `${APP_SCHEME}://`,
        `https://${WEB_DOMAIN}`,
        `http://${WEB_DOMAIN}`,
    ],
    config: {
        screens: {
            // Main tab screens
            Main: {
                screens: {
                    Home: DeepLinkPaths.home,
                    Ranking: DeepLinkPaths.ranking,
                    Library: DeepLinkPaths.library,
                    Profile: DeepLinkPaths.profile,
                },
            },

            // Auth screens
            Login: DeepLinkPaths.login,
            SignUp: DeepLinkPaths.signup,
            PasswordReset: DeepLinkPaths.resetPassword,
            EmailVerification: DeepLinkPaths.verifyEmail,

            // Novel screens
            NovelDetail: DeepLinkPaths.novel,
            ChapterScreen: DeepLinkPaths.chapter,
            Reviews: DeepLinkPaths.reviews,

            // Search screens
            RecentSearch: DeepLinkPaths.search,
            SearchResults: DeepLinkPaths.searchResults,
            Genre: DeepLinkPaths.genre,

            // User screens
            Settings: DeepLinkPaths.settings,
            Notification: DeepLinkPaths.notifications,
            Wallet: DeepLinkPaths.wallet,

            // Author screens
            AuthorDashboard: DeepLinkPaths.authorDashboard,
            NovelManage: DeepLinkPaths.novelManage,
            CreateNovel: DeepLinkPaths.createNovel,
        },
    },
};

/**
 * Generate a deep link URL
 */
export const createDeepLink = (
    path: string,
    params?: Record<string, string>
): string => {
    let url = `${APP_SCHEME}://${path}`;

    if (params) {
        // Replace path parameters
        Object.entries(params).forEach(([key, value]) => {
            url = url.replace(`:${key}`, value);
        });
    }

    return url;
};

/**
 * Generate a web URL
 */
export const createWebLink = (
    path: string,
    params?: Record<string, string>
): string => {
    let url = `https://${WEB_DOMAIN}/${path}`;

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url = url.replace(`:${key}`, value);
        });
    }

    return url;
};

/**
 * Share links for novels and chapters
 */
export const ShareLinks = {
    novel: (novelId: string) => ({
        deepLink: createDeepLink(`novel/${novelId}`),
        webLink: createWebLink(`novel/${novelId}`),
    }),

    chapter: (novelId: string, chapterId: string) => ({
        deepLink: createDeepLink(`novel/${novelId}/chapter/${chapterId}`),
        webLink: createWebLink(`novel/${novelId}/chapter/${chapterId}`),
    }),

    profile: (userId: string) => ({
        deepLink: createDeepLink(`profile/${userId}`),
        webLink: createWebLink(`profile/${userId}`),
    }),

    search: (query: string) => ({
        deepLink: createDeepLink(`search/${encodeURIComponent(query)}`),
        webLink: createWebLink(`search/${encodeURIComponent(query)}`),
    }),
};

/**
 * Handle incoming deep links
 */
export const handleDeepLink = (url: string): Record<string, string> | null => {
    try {
        const { path, queryParams } = Linking.parse(url);

        if (!path) return null;

        // Extract path segments
        const segments = path.split('/').filter(Boolean);

        // Parse based on path pattern
        if (segments[0] === 'novel' && segments[1]) {
            if (segments[2] === 'chapter' && segments[3]) {
                return { screen: 'ChapterScreen', novelId: segments[1], chapterId: segments[3] };
            }
            if (segments[2] === 'reviews') {
                return { screen: 'Reviews', novelId: segments[1] };
            }
            return { screen: 'NovelDetail', novelId: segments[1] };
        }

        if (segments[0] === 'profile' && segments[1]) {
            return { screen: 'Profile', userId: segments[1] };
        }

        if (segments[0] === 'genre' && segments[1]) {
            return { screen: 'Genre', genre: decodeURIComponent(segments[1]) };
        }

        if (segments[0] === 'search' && segments[1]) {
            return { screen: 'SearchResults', query: decodeURIComponent(segments[1]) };
        }

        return { screen: segments[0], ...queryParams };
    } catch (error) {
        console.error('[DeepLink] Parse error:', error);
        return null;
    }
};

export default {
    config: linkingConfig,
    paths: DeepLinkPaths,
    createDeepLink,
    createWebLink,
    handleDeepLink,
    ShareLinks,
};
