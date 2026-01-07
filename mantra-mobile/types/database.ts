/**
 * Central Database Type Definitions
 * 
 * This file contains TypeScript interfaces that match the exact Supabase database schema.
 * All column names are identical to the database schema defined in supabase-complete-setup.sql
 * 
 * IMPORTANT: When querying the database, always use these types to ensure type safety
 * and prevent column name mismatches.
 */

// ============================================================================
// CORE DATABASE TYPES (matching exact schema)
// ============================================================================

/**
 * Profile table - extends auth.users with additional user information
 * Note: Admin status is managed in separate admins table
 */
export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  email: string;
  profile_picture_url: string | null; // NOT avatar_url
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  age: number | null;
  bio: string | null;
  favorite_genres: string[];
  preferred_language: string;
  push_notifications_enabled: boolean;
  account_status: 'active' | 'pending_deletion' | 'deleted';
  deletion_scheduled_date: string | null;
  joined_date: string;
  last_login: string | null;
  total_app_time_minutes: number;
  created_at: string;
  updated_at: string;
}

/**
 * Admin table - tracks admin users (private table)
 */
export interface Admin {
  id: string;
  user_id: string;
  granted_by: string | null;
  granted_at: string;
  notes: string | null;
}

/**
 * Novel table - stores novel metadata and statistics
 * Note: cover_image_url is used for both cover and banner (no separate banner field)
 */
export interface Novel {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null; // Used for both cover and banner
  genres: string[];
  tags: string[];
  language: string;
  is_mature: boolean;
  status: 'ongoing' | 'completed' | 'hiatus';
  total_chapters: number;          // NOT chapter_count
  total_views: number;             // NOT view_count
  total_votes: number;             // NOT vote_count
  average_rating: number;          // NOT rating (decimal 3,2)
  total_reviews: number;           // NOT review_count
  is_featured: boolean;
  is_editors_pick: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

/**
 * Chapter table - stores chapter content
 * Note: Chapters do NOT have likes/dislikes - only comments and reviews do
 * wait_hours is auto-calculated: 0 for ch 1-7, 3 for ch 8-30, 24 for ch 31+
 */
export interface Chapter {
  id: string;
  novel_id: string;
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
  views: number;                   // NOT view_count
  is_locked: boolean;
  wait_hours: number | null;       // NOT unlock_hours (auto-calculated by trigger)
  published_at: string;
  updated_at: string;
}

/**
 * Chapter Unlock table - tracks unlocked chapters with expiration
 * Unlocks expire after 72 hours
 */
export interface ChapterUnlock {
  id: string;
  user_id: string;
  novel_id: string;
  chapter_id: string;
  unlock_method: 'timer' | 'ad' | 'free';
  unlock_timestamp: string;
  expiration_timestamp: string | null;
  is_expired: boolean;
}

/**
 * Chapter Timer table - manages active unlock timers
 * Only one active timer per user per novel
 */
export interface ChapterTimer {
  id: string;
  user_id: string;
  novel_id: string;
  chapter_id: string;
  timer_start_timestamp: string;
  timer_duration_hours: number;
  timer_expiration_timestamp: string;
  is_active: boolean;
  created_at: string;
}

/**
 * Chapter Reading Progress table - tracks progress within a chapter
 */
export interface ChapterReadingProgress {
  id: string;
  user_id: string;
  chapter_id: string;
  novel_id: string;
  progress_percentage: number; // decimal 5,2
  last_position: number;
  last_updated: string;
}

/**
 * Ad View Records table - tracks ad views for earnings (admin-only)
 */
export interface AdViewRecord {
  id: string;
  user_id: string;
  novel_id: string;
  chapter_id: string;
  author_id: string;
  ad_unit_id: string;
  payment_status: 'pending' | 'paid';
  viewed_at: string;
  paid_at: string | null;
}

/**
 * Wallet table - stores user wallet balances and earnings
 */
export interface Wallet {
  id: string;
  user_id: string;
  balance: number;              // decimal 20,7
  total_earned: number;         // decimal 20,7
  total_withdrawn: number;      // decimal 20,7
  total_ad_views: number;
  created_at: string;
  updated_at: string;
}

/**
 * Saved Wallet Address table - stores Stellar addresses
 */
export interface SavedWalletAddress {
  id: string;
  user_id: string;
  label: string;
  stellar_address: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Transaction table - records earnings and withdrawals
 */
export interface Transaction {
  id: string;
  user_id: string;
  type: 'earning' | 'withdrawal';
  amount: number;               // decimal 20,7
  novel_id: string | null;
  novel_name: string | null;
  status: 'successful' | 'pending' | 'failed';
  stellar_transaction_id: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

/**
 * Withdrawal Request table - manages withdrawal requests
 */
export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;               // decimal 20,7
  stellar_address: string;
  network_fee: number;          // decimal 20,7
  total_amount: number;         // decimal 20,7
  status: 'pending' | 'approved' | 'completed' | 'failed' | 'rejected';
  rejection_reason: string | null;
  stellar_transaction_id: string | null;
  requested_at: string;
  approved_at: string | null;
  completed_at: string | null;
  approved_by: string | null;
}

/**
 * Review table - stores novel reviews with ratings
 */
export interface Review {
  id: string;
  novel_id: string;
  user_id: string;
  rating: number;               // 1-5
  review_text: string | null;   // NOT comment
  likes: number;                // NOT likes_count
  dislikes: number;             // NOT dislikes_count
  created_at: string;
  updated_at: string;
}

/**
 * Review Reaction table - tracks like/dislike on reviews
 */
export interface ReviewReaction {
  id: string;
  review_id: string;
  user_id: string;
  reaction_type: 'like' | 'dislike';
  created_at: string;
}

/**
 * Comment table - stores chapter comments with reply support
 */
export interface Comment {
  id: string;
  chapter_id: string;
  user_id: string;
  parent_comment_id: string | null;
  comment_text: string;
  likes: number;                // NOT likes_count
  dislikes: number;             // NOT dislikes_count
  reply_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Comment Reaction table - tracks like/dislike on comments
 */
export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction_type: 'like' | 'dislike';
  created_at: string;
}

/**
 * Follow table - manages user follow relationships
 */
export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

/**
 * Library table - stores user's saved novels
 */
export interface Library {
  id: string;
  user_id: string;
  novel_id: string;
  added_at: string;
}

/**
 * Reading History table - tracks which chapters users have read
 */
export interface ReadingHistory {
  id: string;
  user_id: string;
  novel_id: string;
  chapter_id: string;
  last_read_at: string;
}

/**
 * Reading Progress table - tracks overall reading progress per novel
 */
export interface ReadingProgress {
  id: string;
  user_id: string;
  novel_id: string;
  current_chapter_number: number;
  chapters_read: number;
  progress_percentage: number;  // decimal 5,2
  last_updated: string;
}

/**
 * Novel Vote table - tracks user votes/likes on novels
 */
export interface NovelVote {
  id: string;
  novel_id: string;
  user_id: string;
  created_at: string;
}

/**
 * Novel View table - tracks novel detail page views
 */
export interface NovelView {
  id: string;
  novel_id: string;
  user_id: string | null;
  viewed_at: string;
}

/**
 * User Activity Log table - comprehensive activity logging
 */
export interface UserActivityLog {
  id: string;
  user_id: string;
  activity_type: 'app_open' | 'app_close' | 'novel_view' | 'chapter_read' | 
                 'chapter_unlock' | 'review_create' | 'review_update' | 
                 'review_delete' | 'comment_create' | 'comment_update' | 
                 'comment_delete' | 'follow' | 'unfollow' | 'vote' | 
                 'library_add' | 'library_remove' | 'search' | 
                 'password_change' | 'email_change' | 'profile_update' | 
                 'withdrawal_request' | 'other';
  activity_details: Record<string, any> | null; // JSONB
  related_id: string | null;
  session_id: string | null;
  created_at: string;
}

/**
 * Daily User Stats table - daily aggregated statistics
 */
export interface DailyUserStats {
  id: string;
  user_id: string;
  date: string; // DATE type
  app_time_minutes: number;
  chapters_read: number;
  novels_viewed: number;
  comments_posted: number;
  reviews_posted: number;
  activity_summary: Record<string, any> | null; // JSONB
  created_at: string;
}

/**
 * Search History table - stores user search queries
 */
export interface SearchHistory {
  id: string;
  user_id: string;
  search_query: string;
  searched_at: string;
}

/**
 * Notification table - manages user notifications
 */
export interface Notification {
  id: string;
  user_id: string;
  type: 'new_chapter' | 'new_follower' | 'new_comment' | 'comment_liked' | 
        'new_review' | 'novel_voted' | 'admin_message' | 'wallet_earnings' | 
        'withdrawal_status' | 'withdrawal_completed' | 'custom';
  title: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  read_at: string | null;
  sent_by: string | null;
  created_at: string;
}

/**
 * Report table - content moderation reports
 */
export interface Report {
  id: string;
  reporter_id: string;
  reported_type: 'novel' | 'chapter' | 'review' | 'comment' | 'user';
  reported_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  danger_level: 'normal' | 'high_danger';
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

/**
 * Home Section table - defines home page content sections
 */
export interface HomeSection {
  id: string;
  section_name: 'top_rankings' | 'trending' | 'editors_picks' | 'popular' | 
                'recommended' | 'new_arrivals' | 'recently_updated' | 'you_may_like';
  is_manual: boolean;
  priority_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Section Novel table - maps novels to home sections
 */
export interface SectionNovel {
  id: string;
  section_id: string;
  novel_id: string;
  display_order: number;
  added_at: string;
}

/**
 * Featured Banner table - manages home page banners
 */
export interface FeaturedBanner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * FAQ table - frequently asked questions
 */
export interface FAQ {
  id: string;
  category: 'account' | 'reading' | 'writing' | 'earnings' | 'technical' | 'wallet' | 'general';
  question: string;
  answer: string;
  keywords: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Contact Submission table - user contact form submissions
 */
export interface ContactSubmission {
  id: string;
  user_id: string | null;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'responded' | 'resolved';
  created_at: string;
  responded_at: string | null;
  responded_by: string | null;
}

/**
 * Admin Config table - system configuration (admin-only)
 */
export interface AdminConfig {
  id: string;
  config_key: string;
  config_value: Record<string, any>; // JSONB
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Stellar Distribution Log table - payment distributions (admin-only)
 */
export interface StellarDistributionLog {
  id: string;
  total_deposited: number;      // decimal 20,7
  total_distributed: number;    // decimal 20,7
  total_ad_views: number;
  distribution_details: Record<string, any>; // JSONB
  distributed_at: string;
}

// ============================================================================
// EXTENDED TYPES WITH RELATIONSHIPS
// ============================================================================

/**
 * Novel with author profile information
 * Use when querying novels with author details
 */
export interface NovelWithAuthor extends Novel {
  profiles: Pick<Profile, 'id' | 'username' | 'display_name' | 'profile_picture_url'>;
}

/**
 * Chapter with novel information
 * Use when displaying chapter with novel context
 */
export interface ChapterWithNovel extends Chapter {
  novels: Pick<Novel, 'id' | 'title' | 'author_id' | 'cover_image_url'>;
}

/**
 * Review with user profile information
 * Use when displaying reviews with user details
 */
export interface ReviewWithUser extends Review {
  profiles: Pick<Profile, 'id' | 'username' | 'display_name' | 'profile_picture_url'>;
}

/**
 * Comment with user profile information
 * Use when displaying comments with user details
 */
export interface CommentWithUser extends Comment {
  profiles: Pick<Profile, 'id' | 'username' | 'display_name' | 'profile_picture_url'>;
  replies?: CommentWithUser[];
}

/**
 * Notification with related entity details
 * Use when displaying notifications with context
 */
export interface NotificationWithDetails extends Notification {
  novel?: Pick<Novel, 'id' | 'title' | 'cover_image_url'>;
  user?: Pick<Profile, 'id' | 'username' | 'display_name' | 'profile_picture_url'>;
  chapter?: Pick<Chapter, 'id' | 'title' | 'chapter_number'>;
}

/**
 * Transaction with novel information
 * Use when displaying transaction history
 */
export interface TransactionWithNovel extends Transaction {
  novel?: Pick<Novel, 'id' | 'title' | 'cover_image_url'>;
}

/**
 * Profile with follower/following counts
 * Note: Counts are calculated from follows table, not stored in profiles
 */
export interface ProfileWithCounts extends Profile {
  follower_count: number;
  following_count: number;
}

/**
 * Novel with full author profile
 * Use when you need complete author information
 */
export interface NovelWithFullAuthor extends Novel {
  author: Profile;
}

/**
 * Chapter with unlock status for a specific user
 * Use when checking chapter access
 */
export interface ChapterWithUnlockStatus extends Chapter {
  is_unlocked: boolean;
  unlock_method?: 'timer' | 'ad' | 'free';
  expiration_timestamp?: string | null;
}

// ============================================================================
// TRANSFORMATION TYPES FOR UI DISPLAY
// ============================================================================

/**
 * Transformed Novel for UI display
 * Converts database format to UI-friendly format
 */
export interface TransformedNovel {
  id: string;
  title: string;
  author: string;
  authorId: string;
  cover: string;
  rating: number;
  views: string;              // Formatted (e.g., "1.2K", "3.5M")
  votes: string;              // Formatted
  chapters: number;
  genres: string[];
  description: string;
  tags: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  isMature: boolean;
  isFeatured: boolean;
  isEditorsPick: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transformed Chapter for UI display
 */
export interface TransformedChapter {
  id: string;
  novelId: string;
  chapterNumber: number;
  title: string;
  content: string;
  wordCount: number;
  views: string;              // Formatted
  isLocked: boolean;
  waitHours: number | null;
  publishedAt: string;
  isUnlocked?: boolean;
}

/**
 * Transformed Review for UI display
 */
export interface TransformedReview {
  id: string;
  novelId: string;
  userId: string;
  username: string;
  displayName: string | null;
  profilePicture: string | null;
  rating: number;
  reviewText: string | null;
  likes: number;
  dislikes: number;
  hasUserLiked: boolean;
  hasUserDisliked: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transformed Comment for UI display
 */
export interface TransformedComment {
  id: string;
  chapterId: string;
  userId: string;
  username: string;
  displayName: string | null;
  profilePicture: string | null;
  commentText: string;
  likes: number;
  dislikes: number;
  replyCount: number;
  hasUserLiked: boolean;
  hasUserDisliked: boolean;
  replies?: TransformedComment[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Transformed Profile for UI display
 */
export interface TransformedProfile {
  id: string;
  username: string;
  displayName: string | null;
  email: string;
  profilePicture: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  favoriteGenres: string[];
  joinedDate: string;
  isFollowing?: boolean;
}

/**
 * Transformed Wallet for UI display
 */
export interface TransformedWallet {
  balance: string;            // Formatted with currency
  totalEarned: string;        // Formatted
  totalWithdrawn: string;     // Formatted
  totalAdViews: number;
  pendingAmount?: string;     // Formatted
}

/**
 * Transformed Transaction for UI display
 */
export interface TransformedTransaction {
  id: string;
  type: 'earning' | 'withdrawal';
  amount: string;             // Formatted with currency
  novelName: string | null;
  status: 'successful' | 'pending' | 'failed';
  statusColor: string;        // UI color code
  statusIcon: string;         // UI icon name
  createdAt: string;
  completedAt: string | null;
}

/**
 * Transformed Notification for UI display
 */
export interface TransformedNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  icon: string;               // UI icon name
  iconColor: string;          // UI color code
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
  timeAgo: string;            // Human-readable time (e.g., "2 hours ago")
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Ranking sort options
 */
export type RankingSortBy = 'views' | 'votes' | 'rating';

/**
 * Novel status options
 */
export type NovelStatus = 'ongoing' | 'completed' | 'hiatus';

/**
 * Unlock method options
 */
export type UnlockMethod = 'timer' | 'ad' | 'free';

/**
 * Transaction type options
 */
export type TransactionType = 'earning' | 'withdrawal';

/**
 * Transaction status options
 */
export type TransactionStatus = 'successful' | 'pending' | 'failed';

/**
 * Withdrawal status options
 */
export type WithdrawalStatus = 'pending' | 'approved' | 'completed' | 'failed' | 'rejected';

/**
 * Report status options
 */
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

/**
 * Notification type options
 */
export type NotificationType = 'new_chapter' | 'new_follower' | 'new_comment' | 
                               'comment_liked' | 'new_review' | 'novel_voted' | 
                               'admin_message' | 'wallet_earnings' | 
                               'withdrawal_status' | 'withdrawal_completed' | 'custom';

/**
 * Activity type options
 */
export type ActivityType = 'app_open' | 'app_close' | 'novel_view' | 'chapter_read' | 
                          'chapter_unlock' | 'review_create' | 'review_update' | 
                          'review_delete' | 'comment_create' | 'comment_update' | 
                          'comment_delete' | 'follow' | 'unfollow' | 'vote' | 
                          'library_add' | 'library_remove' | 'search' | 
                          'password_change' | 'email_change' | 'profile_update' | 
                          'withdrawal_request' | 'other';

/**
 * FAQ category options
 */
export type FAQCategory = 'account' | 'reading' | 'writing' | 'earnings' | 'technical' | 'wallet' | 'general';

/**
 * Home section name options
 */
export type HomeSectionName = 'top_rankings' | 'trending' | 'editors_picks' | 'popular' | 
                             'recommended' | 'new_arrivals' | 'recently_updated' | 'you_may_like';

// ============================================================================
// QUERY RESULT TYPES
// ============================================================================

/**
 * Generic query result wrapper
 */
export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

/**
 * Paginated query result
 */
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Chapter access check result
 */
export interface ChapterAccessResult {
  canAccess: boolean;
  reason: 'free' | 'unlocked' | 'locked';
  expiresAt?: string | null;
  activeTimer?: ChapterTimer | null;
}

/**
 * User statistics result
 */
export interface UserStatistics {
  totalNovels: number;
  totalChapters: number;
  totalViews: number;
  totalVotes: number;
  totalReviews: number;
  totalEarnings: number;
  followerCount: number;
  followingCount: number;
}

/**
 * Novel statistics result
 */
export interface NovelStatistics {
  totalChapters: number;
  totalViews: number;
  totalVotes: number;
  totalReviews: number;
  averageRating: number;
  totalComments: number;
  totalAdViews: number;
  totalEarnings: number;
}
