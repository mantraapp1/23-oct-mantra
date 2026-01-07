/**
 * App Constants
 * Centralized configuration values to avoid magic numbers and hardcoded strings
 */

// Genre/Category constants
export const GENRES = [
    'All',
    'Fantasy',
    'Romance',
    'Sci-Fi',
    'Adventure',
    'Thriller',
    'Mystery',
    'Horror',
    'Comedy',
    'Drama',
    'Action',
    'Slice of Life',
] as const;

export const HOME_CATEGORIES = ['All', 'Fantasy', 'Romance', 'Sci-Fi', 'Adventure', 'Thriller'] as const;

// Default image URLs
export const DEFAULT_IMAGES = {
    featuredBanner: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200&auto=format&fit=crop',
    novelCover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400&auto=format&fit=crop',
    profilePlaceholder: 'https://ui-avatars.com/api/?background=0ea5e9&color=fff&size=128&name=',
} as const;

// Chapter unlock settings
export const CHAPTER_SETTINGS = {
    FREE_CHAPTERS_COUNT: 7, // Chapters 1-7 are free
    DEFAULT_WAIT_HOURS: 24,
    MAX_WAIT_HOURS: 168, // 1 week
} as const;

// UI size constants
export const UI_SIZES = {
    AVATAR_SMALL: 32,
    AVATAR_MEDIUM: 48,
    AVATAR_LARGE: 56,
    AVATAR_XLARGE: 80,
    MAX_APP_WIDTH: 448,
    NOVEL_CARD_WIDTH: 120,
    NOVEL_CARD_HEIGHT: 160,
} as const;

// Pagination defaults
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    SEARCH_PAGE_SIZE: 20,
    COMMENTS_PAGE_SIZE: 50,
    NOTIFICATIONS_PAGE_SIZE: 20,
    TRANSACTIONS_PAGE_SIZE: 20,
} as const;

// Validation limits
export const VALIDATION = {
    MIN_PASSWORD_LENGTH: 6,
    MAX_PASSWORD_LENGTH: 128,
    MIN_USERNAME_LENGTH: 3,
    MAX_USERNAME_LENGTH: 30,
    MAX_BIO_LENGTH: 500,
    MAX_REVIEW_LENGTH: 5000,
    MAX_COMMENT_LENGTH: 2000,
    MIN_RATING: 1,
    MAX_RATING: 5,
    MIN_AGE: 13,
    MAX_AGE: 120,
    MAX_GENRES: 3,
    MIN_WITHDRAWAL_AMOUNT: 10,
} as const;

// Rate limiting (client-side throttle)
export const RATE_LIMITS = {
    VOTE_COOLDOWN_MS: 1000,
    LIKE_COOLDOWN_MS: 500,
    COMMENT_COOLDOWN_MS: 3000,
    REFRESH_COOLDOWN_MS: 2000,
} as const;
