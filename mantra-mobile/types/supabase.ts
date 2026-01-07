/**
 * Database types for Supabase tables
 */

// Import Profile from database.ts to ensure consistency
import { Profile } from './database';

// Re-export Profile for backward compatibility
export { Profile };

export interface Novel {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  banner_image_url: string | null;
  genres: string[] | null;
  tags: string[] | null;
  language: string;
  is_mature: boolean;
  status: 'ongoing' | 'completed' | 'hiatus';
  total_chapters: number;
  total_views: number;
  total_votes: number;
  average_rating: number;
  total_reviews: number;
  is_featured: boolean;
  is_editors_pick: boolean;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Chapter {
  id: string;
  novel_id: string;
  chapter_number: number;
  title: string;
  content: string;
  word_count: number;
  views: number;
  likes: number;
  dislikes: number;
  is_locked: boolean;
  wait_hours: number;
  published_at: string;
  updated_at: string;
}

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

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  total_earned: number;
  total_withdrawn: number;
  total_ad_views: number;
  created_at: string;
  updated_at: string;
}

export interface SavedWalletAddress {
  id: string;
  user_id: string;
  label: string;
  stellar_address: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'earning' | 'withdrawal';
  amount: number;
  novel_id: string | null;
  novel_name: string | null;
  status: 'successful' | 'pending' | 'failed';
  stellar_transaction_id: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  stellar_address: string;
  network_fee: number;
  total_amount: number;
  status: 'pending' | 'approved' | 'completed' | 'failed' | 'rejected';
  rejection_reason: string | null;
  stellar_transaction_id: string | null;
  requested_at: string;
  approved_at: string | null;
  completed_at: string | null;
  approved_by: string | null;
}

export interface Review {
  id: string;
  novel_id: string;
  user_id: string;
  rating: number;
  review_text: string | null;
  likes: number;
  dislikes: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewVote {
  id: string;
  review_id: string;
  user_id: string;
  vote_type: 'like' | 'dislike';
  created_at: string;
}

export interface Comment {
  id: string;
  chapter_id: string;
  user_id: string;
  parent_comment_id: string | null;
  comment_text: string;
  likes: number;
  dislikes: number;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommentVote {
  id: string;
  comment_id: string;
  user_id: string;
  vote_type: 'like' | 'dislike';
  created_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Library {
  id: string;
  user_id: string;
  novel_id: string;
  added_at: string;
}

export interface ReadingHistory {
  id: string;
  user_id: string;
  novel_id: string;
  chapter_id: string;
  last_read_at: string;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  novel_id: string;
  current_chapter_number: number;
  chapters_read: number;
  progress_percentage: number;
  last_updated: string;
}

export interface NovelVote {
  id: string;
  novel_id: string;
  user_id: string;
  created_at: string;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  search_query: string;
  searched_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'new_chapter' | 'new_follower' | 'new_comment' | 'comment_liked' | 
        'new_review' | 'novel_voted' | 'admin_message' | 'wallet_earnings' | 
        'withdrawal_status' | 'withdrawal_completed';
  title: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_type: 'novel' | 'chapter' | 'review' | 'comment' | 'user';
  reported_id: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface HomeSection {
  id: string;
  section_name: string;
  is_manual: boolean;
  priority_order: number;
  created_at: string;
  updated_at: string;
}

export interface SectionNovel {
  id: string;
  section_id: string;
  novel_id: string;
  display_order: number;
  added_at: string;
}

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

export interface FAQ {
  id: string;
  category: 'account' | 'reading' | 'writing' | 'earnings' | 'technical';
  question: string;
  answer: string;
  keywords: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
 * Extended types with joined data
 */

export interface NovelWithAuthor extends Novel {
  author: Profile;
}

export interface ChapterWithNovel extends Chapter {
  novel: Novel;
}

export interface CommentWithUser extends Comment {
  user: Profile;
  replies?: CommentWithUser[];
}

export interface ReviewWithUser extends Review {
  user: Profile;
  // Consistent profile data fields (added by reviewService)
  displayName?: string;
  profileImage?: string;
  // User reaction fields (added by reviewService)
  user_has_liked?: boolean;
  user_has_disliked?: boolean;
}

export interface NotificationWithDetails extends Notification {
  novel?: Novel;
  user?: Profile;
  chapter?: Chapter;
}

export interface TransactionWithNovel extends Transaction {
  novel?: Novel;
}
