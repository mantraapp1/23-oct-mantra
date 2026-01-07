/**
 * Supabase Storage Buckets
 */
export const STORAGE_BUCKETS = {
  PROFILE_PICTURES: 'profile-pictures',
  NOVEL_COVERS: 'novel-covers',
  NOVEL_BANNERS: 'novel-banners',
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  SEARCH_PAGE_SIZE: 15,
  COMMENTS_PAGE_SIZE: 10,
  NOTIFICATIONS_PAGE_SIZE: 20,
  TRANSACTIONS_PAGE_SIZE: 10,
} as const;

/**
 * Cache durations (in milliseconds)
 */
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 15 * 60 * 1000, // 15 minutes
  LONG: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Real-time subscription channels
 */
export const REALTIME_CHANNELS = {
  NOTIFICATIONS: 'notifications',
  COMMENTS: 'comments',
  CHAPTERS: 'chapters',
} as const;

/**
 * Query limits
 */
export const QUERY_LIMITS = {
  MAX_GENRES: 3,
  MAX_TAGS: 10,
  MAX_SEARCH_HISTORY: 10,
  MAX_RECENT_SEARCHES: 10,
} as const;

/**
 * Validation constants
 */
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  MIN_AGE: 13,
  MAX_AGE: 120,
  MIN_RATING: 1,
  MAX_RATING: 5,
  MIN_WITHDRAWAL_AMOUNT: 10,
  STELLAR_ADDRESS_LENGTH: 56,
} as const;

/**
 * Timer and unlock constants
 */
export const UNLOCK_SETTINGS = {
  DEFAULT_TIMER_HOURS: 3,
  UNLOCK_DURATION_HOURS: 72,
  MAX_ACTIVE_TIMERS_PER_NOVEL: 1,
} as const;

/**
 * Report thresholds
 */
export const MODERATION = {
  AUTO_REMOVE_REPORT_THRESHOLD: 25,
} as const;

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  NEW_CHAPTER: 'new_chapter',
  NEW_FOLLOWER: 'new_follower',
  NEW_COMMENT: 'new_comment',
  COMMENT_LIKED: 'comment_liked',
  NEW_REVIEW: 'new_review',
  NOVEL_VOTED: 'novel_voted',
  ADMIN_MESSAGE: 'admin_message',
  WALLET_EARNINGS: 'wallet_earnings',
  WITHDRAWAL_STATUS: 'withdrawal_status',
  WITHDRAWAL_COMPLETED: 'withdrawal_completed',
} as const;

/**
 * Novel status options
 */
export const NOVEL_STATUS = {
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  HIATUS: 'hiatus',
} as const;

/**
 * Transaction types
 */
export const TRANSACTION_TYPES = {
  EARNING: 'earning',
  WITHDRAWAL: 'withdrawal',
} as const;

/**
 * Transaction status
 */
export const TRANSACTION_STATUS = {
  SUCCESSFUL: 'successful',
  PENDING: 'pending',
  FAILED: 'failed',
} as const;

/**
 * Withdrawal status
 */
export const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REJECTED: 'rejected',
} as const;

/**
 * Unlock methods
 */
export const UNLOCK_METHODS = {
  TIMER: 'timer',
  AD: 'ad',
  FREE: 'free',
} as const;

/**
 * Report types
 */
export const REPORT_TYPES = {
  NOVEL: 'novel',
  CHAPTER: 'chapter',
  REVIEW: 'review',
  COMMENT: 'comment',
  USER: 'user',
} as const;

/**
 * Report reasons
 */
export const REPORT_REASONS = {
  SPAM: 'Spam',
  INAPPROPRIATE_CONTENT: 'Inappropriate Content',
  HARASSMENT: 'Harassment',
  COPYRIGHT: 'Copyright Violation',
  MISLEADING: 'Misleading Information',
  OTHER: 'Other',
} as const;

/**
 * Home section names
 */
export const HOME_SECTIONS = {
  TOP_RANKINGS: 'top_rankings',
  TRENDING: 'trending',
  EDITORS_PICKS: 'editors_picks',
  POPULAR: 'popular',
  RECOMMENDED: 'recommended',
  NEW_ARRIVALS: 'new_arrivals',
  RECENTLY_UPDATED: 'recently_updated',
  YOU_MAY_LIKE: 'you_may_like',
} as const;

/**
 * FAQ categories
 */
export const FAQ_CATEGORIES = {
  ACCOUNT: 'account',
  READING: 'reading',
  WRITING: 'writing',
  EARNINGS: 'earnings',
  TECHNICAL: 'technical',
} as const;

/**
 * Gender options
 */
export const GENDER_OPTIONS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
} as const;

/**
 * Account status
 */
export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  PENDING_DELETION: 'pending_deletion',
  DELETED: 'deleted',
} as const;
