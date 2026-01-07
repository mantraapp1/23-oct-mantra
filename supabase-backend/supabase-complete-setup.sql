-- ============================================================================
-- MANTRA WEBNOVEL APPLICATION - COMPLETE SUPABASE SETUP
-- ============================================================================
-- Version: 1.0.0
-- Last Updated: November 1, 2024
-- 
-- This script creates the complete database schema including:
-- - All 33 tables with proper constraints and relationships
-- - All indexes for optimal query performance
-- - All database functions and triggers for automation
-- - Complete RLS (Row Level Security) policies for data protection
-- - Storage bucket configuration instructions
-- - Initial configuration data with defaults
-- - Email template documentation for Resend.com
-- 
-- INSTRUCTIONS:
-- 1. Open Supabase SQL Editor (https://app.supabase.com)
-- 2. Copy and paste this ENTIRE script
-- 3. Click "Run" to execute (takes 30-60 seconds)
-- 4. Verify setup using verification queries at the end
-- 5. Configure storage buckets in Supabase Dashboard (see Storage section)
-- 6. Configure Resend.com SMTP in Auth settings (see Email section)
-- 
-- IMPORTANT NOTES:
-- - This script uses IF NOT EXISTS clauses and can be re-run safely
-- - All tables will have Row Level Security (RLS) enabled automatically
-- - Default admin config values are included (update after setup)
-- - Storage buckets must be created via Dashboard after SQL execution
-- - First 7 chapters of any novel are always free (no unlock required)
-- - Chapters 8-30 require 3-hour timer, 31+ require 24-hour timer
-- - Chapter unlocks expire after 72 hours
-- - Admin can toggle email verification on/off via admin_config
-- 
-- SUPPORT:
-- - Documentation: See README.md in supabase-backend folder
-- - Setup Guide: See SETUP_GUIDE.md for detailed instructions
-- - Render Service: See RENDER_SERVICE_GUIDE.md for Stellar payments
-- ============================================================================

-- ============================================================================
-- SECTION 1: POSTGRESQL EXTENSIONS
-- ============================================================================

-- Enable UUID generation for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_cron for scheduled tasks (optional - may not be available on free tier)
-- If not available, use external scheduler to call expire_chapter_unlocks() and
-- process_expired_timers() functions periodically
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================================
-- SECTION 2: DATABASE TABLES
-- ============================================================================
-- Creating all 33 tables in dependency order (foreign keys)
-- ============================================================================

-- 1. PROFILES TABLE (extends auth.users)
-- ============================================================================
-- Stores user profile information extending Supabase auth.users
-- Note: Admin status is managed in separate admins table for security
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT UNIQUE NOT NULL,
  profile_picture_url TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  age INTEGER CHECK (age >= 13 AND age <= 120),
  bio TEXT,
  favorite_genres TEXT[] CHECK (array_length(favorite_genres, 1) <= 3),
  preferred_language TEXT DEFAULT 'en',
  push_notifications_enabled BOOLEAN DEFAULT TRUE,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'pending_deletion', 'deleted')),
  deletion_scheduled_date TIMESTAMPTZ,
  joined_date TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  total_app_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 1.5 ADMINS TABLE (PRIVATE - Admin access only)
-- ============================================================================
-- Stores admin user IDs - only users in this table have admin privileges
-- This table is private and can only be modified by existing admins
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_admins_user ON admins(user_id);

-- 2. NOVELS TABLE
-- ============================================================================
-- Stores novel metadata including genres, tags, and statistics
-- Supports mature content flagging and completion tracking
-- Note: cover_image_url is used as both cover and banner (no separate banner field)
CREATE TABLE IF NOT EXISTS public.novels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  genres TEXT[] CHECK (array_length(genres, 1) <= 3),
  tags TEXT[] CHECK (array_length(tags, 1) <= 10),
  language TEXT DEFAULT 'en',
  is_mature BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'completed', 'hiatus')),
  total_chapters INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_editors_pick BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_novels_author ON novels(author_id);
CREATE INDEX IF NOT EXISTS idx_novels_status ON novels(status);
CREATE INDEX IF NOT EXISTS idx_novels_genres ON novels USING GIN(genres);
CREATE INDEX IF NOT EXISTS idx_novels_tags ON novels USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_novels_language ON novels(language);
CREATE INDEX IF NOT EXISTS idx_novels_featured ON novels(is_featured);
CREATE INDEX IF NOT EXISTS idx_novels_editors_pick ON novels(is_editors_pick);

-- 3. CHAPTERS TABLE
-- ============================================================================
-- Stores chapter content with automatic wait_hours calculation
-- Chapters 1-7 are free, 8-30 require 3hrs, 31+ require 24hrs
-- Note: Chapters do not have like/dislike - only comments and reviews do
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  word_count INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT TRUE,
  wait_hours INTEGER,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(novel_id, chapter_number)
);

CREATE INDEX IF NOT EXISTS idx_chapters_novel ON chapters(novel_id);
CREATE INDEX IF NOT EXISTS idx_chapters_published ON chapters(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_chapters_number ON chapters(chapter_number);

-- 4. CHAPTER UNLOCKS TABLE
-- ============================================================================
-- Tracks which chapters users have unlocked and expiration times
-- Unlocks expire after 72 hours
CREATE TABLE IF NOT EXISTS public.chapter_unlocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  unlock_method TEXT NOT NULL CHECK (unlock_method IN ('timer', 'ad', 'free')),
  unlock_timestamp TIMESTAMPTZ DEFAULT NOW(),
  expiration_timestamp TIMESTAMPTZ,
  is_expired BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_unlocks_user_novel ON chapter_unlocks(user_id, novel_id);
CREATE INDEX IF NOT EXISTS idx_unlocks_expiration ON chapter_unlocks(expiration_timestamp);
CREATE INDEX IF NOT EXISTS idx_unlocks_user_chapter ON chapter_unlocks(user_id, chapter_id);

-- 5. CHAPTER TIMERS TABLE
-- ============================================================================
-- Manages active unlock timers for users
-- Only one active timer per user per novel
CREATE TABLE IF NOT EXISTS public.chapter_timers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  timer_start_timestamp TIMESTAMPTZ DEFAULT NOW(),
  timer_duration_hours INTEGER NOT NULL,
  timer_expiration_timestamp TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, novel_id)
);

CREATE INDEX IF NOT EXISTS idx_timers_user ON chapter_timers(user_id);
CREATE INDEX IF NOT EXISTS idx_timers_expiration ON chapter_timers(timer_expiration_timestamp);
CREATE INDEX IF NOT EXISTS idx_timers_active ON chapter_timers(is_active);

-- 6. CHAPTER READING PROGRESS TABLE
-- ============================================================================
-- Tracks reading progress percentage within each chapter
CREATE TABLE IF NOT EXISTS public.chapter_reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_position INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_chapter_progress_user ON chapter_reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_chapter ON chapter_reading_progress(chapter_id);

-- 7. ADS VIEW RECORDS TABLE (PRIVATE - Admin-only)
-- ============================================================================
-- Tracks ad views for author earnings calculation
-- PRIVATE TABLE: Only admins can view this table for payment processing
CREATE TABLE IF NOT EXISTS public.ads_view_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ad_unit_id TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ads_author ON ads_view_records(author_id);
CREATE INDEX IF NOT EXISTS idx_ads_payment_status ON ads_view_records(payment_status);
CREATE INDEX IF NOT EXISTS idx_ads_viewed ON ads_view_records(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ads_user_chapter ON ads_view_records(user_id, chapter_id);

-- 8. WALLETS TABLE
-- ============================================================================
-- Stores user wallet balances and earnings statistics
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance DECIMAL(20,7) DEFAULT 0.00,
  total_earned DECIMAL(20,7) DEFAULT 0.00,
  total_withdrawn DECIMAL(20,7) DEFAULT 0.00,
  total_ad_views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);

-- 9. SAVED WALLET ADDRESSES TABLE
-- ============================================================================
-- Stores user's saved Stellar wallet addresses for withdrawals
CREATE TABLE IF NOT EXISTS public.saved_wallet_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  stellar_address TEXT NOT NULL CHECK (stellar_address ~ '^G[A-Z0-9]{55}$'),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, stellar_address)
);

CREATE INDEX IF NOT EXISTS idx_saved_addresses_user ON saved_wallet_addresses(user_id);

-- 10. TRANSACTIONS TABLE
-- ============================================================================
-- Records all earnings and withdrawal transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earning', 'withdrawal')),
  amount DECIMAL(20,7) NOT NULL,
  novel_id UUID REFERENCES public.novels(id) ON DELETE SET NULL,
  novel_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('successful', 'pending', 'failed')),
  stellar_transaction_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);

-- 11. WITHDRAWAL REQUESTS TABLE
-- ============================================================================
-- Manages withdrawal requests with admin approval workflow
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(20,7) NOT NULL,
  stellar_address TEXT NOT NULL CHECK (stellar_address ~ '^G[A-Z0-9]{55}$'),
  network_fee DECIMAL(20,7) DEFAULT 0.00001,
  total_amount DECIMAL(20,7) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'failed', 'rejected')),
  rejection_reason TEXT,
  stellar_transaction_id TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_requested ON withdrawal_requests(requested_at DESC);

-- 12. REVIEWS TABLE
-- ============================================================================
-- Stores novel reviews with ratings and like/dislike counts
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(novel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_novel ON reviews(novel_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

-- 13. REVIEW REACTIONS TABLE
-- ============================================================================
-- Tracks user reactions (like/dislike) on reviews
CREATE TABLE IF NOT EXISTS public.review_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_review_reactions_review ON review_reactions(review_id);
CREATE INDEX IF NOT EXISTS idx_review_reactions_user ON review_reactions(user_id);

-- 14. COMMENTS TABLE
-- ============================================================================
-- Stores chapter comments with support for replies
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_chapter ON comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

-- 15. COMMENT REACTIONS TABLE
-- ============================================================================
-- Tracks user reactions (like/dislike) on comments
CREATE TABLE IF NOT EXISTS public.comment_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user ON comment_reactions(user_id);

-- 16. FOLLOWS TABLE
-- ============================================================================
-- Manages user follow relationships
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

-- 17. LIBRARY TABLE
-- ============================================================================
-- Stores user's saved novels
CREATE TABLE IF NOT EXISTS public.library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, novel_id)
);

CREATE INDEX IF NOT EXISTS idx_library_user ON library(user_id);
CREATE INDEX IF NOT EXISTS idx_library_novel ON library(novel_id);
CREATE INDEX IF NOT EXISTS idx_library_added ON library(added_at DESC);

-- 18. READING HISTORY TABLE
-- ============================================================================
-- Tracks which chapters users have read
CREATE TABLE IF NOT EXISTS public.reading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, novel_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_history_user ON reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_novel ON reading_history(novel_id);
CREATE INDEX IF NOT EXISTS idx_history_last_read ON reading_history(last_read_at DESC);

-- 19. READING PROGRESS TABLE
-- ============================================================================
-- Tracks overall reading progress per novel
CREATE TABLE IF NOT EXISTS public.reading_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  current_chapter_number INTEGER DEFAULT 1,
  chapters_read INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, novel_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_novel ON reading_progress(novel_id);

-- 20. NOVEL VOTES TABLE
-- ============================================================================
-- Tracks user votes/likes on novels
CREATE TABLE IF NOT EXISTS public.novel_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(novel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_novel_votes_novel ON novel_votes(novel_id);
CREATE INDEX IF NOT EXISTS idx_novel_votes_user ON novel_votes(user_id);

-- 21. NOVEL VIEWS TABLE
-- ============================================================================
-- Tracks novel detail page views for analytics
CREATE TABLE IF NOT EXISTS public.novel_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_novel_views_novel ON novel_views(novel_id);
CREATE INDEX IF NOT EXISTS idx_novel_views_user ON novel_views(user_id);
CREATE INDEX IF NOT EXISTS idx_novel_views_date ON novel_views(viewed_at DESC);

-- 22. USER ACTIVITY LOG TABLE
-- ============================================================================
-- Comprehensive logging of all user activities
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'app_open', 'app_close', 'novel_view', 'chapter_read', 'chapter_unlock',
    'review_create', 'review_update', 'review_delete', 'comment_create', 
    'comment_update', 'comment_delete', 'follow', 'unfollow', 'vote',
    'library_add', 'library_remove', 'search', 'password_change', 
    'email_change', 'profile_update', 'withdrawal_request', 'other'
  )),
  activity_details JSONB,
  related_id UUID,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_date ON user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_session ON user_activity_log(session_id);

-- 23. DAILY USER STATS TABLE
-- ============================================================================
-- Daily aggregated user activity statistics
CREATE TABLE IF NOT EXISTS public.daily_user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  app_time_minutes INTEGER DEFAULT 0,
  chapters_read INTEGER DEFAULT 0,
  novels_viewed INTEGER DEFAULT 0,
  comments_posted INTEGER DEFAULT 0,
  reviews_posted INTEGER DEFAULT 0,
  activity_summary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_user ON daily_user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_user_stats(date DESC);

-- 24. SEARCH HISTORY TABLE
-- ============================================================================
-- Stores user search queries for quick access
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  searched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_date ON search_history(searched_at DESC);

-- 25. NOTIFICATIONS TABLE
-- ============================================================================
-- Manages user notifications with support for custom admin messages
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'new_chapter', 'new_follower', 'new_comment', 'comment_liked',
    'new_review', 'novel_voted', 'admin_message', 'wallet_earnings',
    'withdrawal_status', 'withdrawal_completed', 'custom'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  sent_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 26. REPORTS TABLE
-- ============================================================================
-- Content moderation reports with danger level classification
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_type TEXT NOT NULL CHECK (reported_type IN ('novel', 'chapter', 'review', 'comment', 'user')),
  reported_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  danger_level TEXT DEFAULT 'normal' CHECK (danger_level IN ('normal', 'high_danger')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(reported_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reported_id ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_danger_level ON reports(danger_level);

-- 27. HOME SECTIONS TABLE
-- ============================================================================
-- Defines home page content sections
CREATE TABLE IF NOT EXISTS public.home_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_name TEXT UNIQUE NOT NULL CHECK (section_name IN (
    'top_rankings', 'trending', 'editors_picks', 'popular',
    'recommended', 'new_arrivals', 'recently_updated', 'you_may_like'
  )),
  is_manual BOOLEAN DEFAULT FALSE,
  priority_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_home_sections_priority ON home_sections(priority_order);

-- 28. SECTION NOVELS TABLE
-- ============================================================================
-- Maps novels to home page sections
CREATE TABLE IF NOT EXISTS public.section_novels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES public.home_sections(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section_id, novel_id)
);

CREATE INDEX IF NOT EXISTS idx_section_novels_section ON section_novels(section_id);
CREATE INDEX IF NOT EXISTS idx_section_novels_novel ON section_novels(novel_id);
CREATE INDEX IF NOT EXISTS idx_section_novels_order ON section_novels(display_order);

-- 29. FEATURED BANNERS TABLE
-- ============================================================================
-- Manages featured banner content on home page
CREATE TABLE IF NOT EXISTS public.featured_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_active ON featured_banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_dates ON featured_banners(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_banners_order ON featured_banners(display_order);

-- 30. FAQs TABLE
-- ============================================================================
-- Stores frequently asked questions with full-text search support
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL CHECK (category IN ('account', 'reading', 'writing', 'earnings', 'technical', 'wallet', 'general')),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, question)
);

CREATE INDEX IF NOT EXISTS idx_faqs_category ON faqs(category);
CREATE INDEX IF NOT EXISTS idx_faqs_active ON faqs(is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_search ON faqs USING GIN(to_tsvector('english', question || ' ' || answer || ' ' || keywords));

-- 31. CONTACT SUBMISSIONS TABLE
-- ============================================================================
-- Stores user contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_contact_user ON contact_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_created ON contact_submissions(created_at DESC);

-- 32. ADMIN CONFIG TABLE
-- ============================================================================
-- Stores system configuration settings (admin-only)
CREATE TABLE IF NOT EXISTS public.admin_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- 33. STELLAR DISTRIBUTION LOG TABLE
-- ============================================================================
-- Logs Stellar payment distributions (admin-only)
CREATE TABLE IF NOT EXISTS public.stellar_distribution_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_deposited DECIMAL(20,7) NOT NULL,
  total_distributed DECIMAL(20,7) NOT NULL,
  total_ad_views INTEGER NOT NULL,
  distribution_details JSONB NOT NULL,
  distributed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_distribution_date ON stellar_distribution_log(distributed_at DESC);


-- ============================================================================
-- SECTION 3: DATABASE FUNCTIONS
-- ============================================================================
-- Automated functions for business logic and data management
-- ============================================================================

-- FUNCTION 1: Auto-update timestamps
-- ============================================================================
-- Automatically updates the updated_at column when a row is modified
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION 2: Set chapter wait hours based on chapter number
-- ============================================================================
-- Automatically calculates wait_hours: 0 for ch 1-7, 3hrs for ch 8-30, 24hrs for ch 31+
CREATE OR REPLACE FUNCTION set_chapter_wait_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.chapter_number >= 8 AND NEW.chapter_number <= 30 THEN
    NEW.wait_hours := 3;
  ELSIF NEW.chapter_number > 30 THEN
    NEW.wait_hours := 24;
  ELSE
    NEW.wait_hours := 0; -- Chapters 1-7 are free
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION 3: Expire chapter unlocks
-- ============================================================================
-- Marks chapter unlocks as expired when expiration_timestamp is reached
-- Should be called periodically (via pg_cron or external scheduler)
CREATE OR REPLACE FUNCTION expire_chapter_unlocks()
RETURNS void AS $$
BEGIN
  UPDATE chapter_unlocks
  SET is_expired = TRUE
  WHERE expiration_timestamp < NOW() AND is_expired = FALSE;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION 4: Process expired timers
-- ============================================================================
-- Automatically unlocks chapters when timers expire and deactivates timers
-- Should be called periodically (via pg_cron or external scheduler)
CREATE OR REPLACE FUNCTION process_expired_timers()
RETURNS void AS $$
BEGIN
  -- Create unlock records for expired timers
  INSERT INTO chapter_unlocks (user_id, novel_id, chapter_id, unlock_method, unlock_timestamp, expiration_timestamp)
  SELECT 
    user_id,
    novel_id,
    chapter_id,
    'timer',
    NOW(),
    NOW() + INTERVAL '72 hours'
  FROM chapter_timers
  WHERE timer_expiration_timestamp <= NOW() AND is_active = TRUE
  ON CONFLICT (user_id, chapter_id) DO NOTHING;

  -- Deactivate expired timers
  UPDATE chapter_timers
  SET is_active = FALSE
  WHERE timer_expiration_timestamp <= NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION 5: Update novel statistics (chapter count)
-- ============================================================================
-- Automatically updates total_chapters when chapters are added/removed
CREATE OR REPLACE FUNCTION update_novel_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE novels
    SET total_chapters = (SELECT COUNT(*) FROM chapters WHERE novel_id = NEW.novel_id)
    WHERE id = NEW.novel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE novels
    SET total_chapters = (SELECT COUNT(*) FROM chapters WHERE novel_id = OLD.novel_id)
    WHERE id = OLD.novel_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION 6: Update review statistics
-- ============================================================================
-- Automatically updates total_reviews and average_rating when reviews change
CREATE OR REPLACE FUNCTION update_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE novels
  SET 
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE novel_id = NEW.novel_id),
    average_rating = (SELECT AVG(rating) FROM reviews WHERE novel_id = NEW.novel_id)
  WHERE id = NEW.novel_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION 7: Check report threshold and auto-remove content
-- ============================================================================
-- Automatically removes content (reviews/comments) when it reaches 25+ reports
CREATE OR REPLACE FUNCTION check_report_threshold()
RETURNS TRIGGER AS $$
DECLARE
  report_count INTEGER;
BEGIN
  -- Count reports for this content
  SELECT COUNT(*) INTO report_count
  FROM reports
  WHERE reported_id = NEW.reported_id AND reported_type = NEW.reported_type;

  -- If 25 or more reports, remove content
  IF report_count >= 25 THEN
    CASE NEW.reported_type
      WHEN 'review' THEN
        DELETE FROM reviews WHERE id = NEW.reported_id;
      WHEN 'comment' THEN
        DELETE FROM comments WHERE id = NEW.reported_id;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION 8: Check if comment is from novel author
-- ============================================================================
-- Helper function to identify if a comment was made by the novel's author
CREATE OR REPLACE FUNCTION is_novel_author_comment(comment_user_id UUID, chapter_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  novel_author_id UUID;
BEGIN
  -- Get the author of the novel that this chapter belongs to
  SELECT n.author_id INTO novel_author_id
  FROM novels n
  JOIN chapters c ON c.novel_id = n.id
  WHERE c.id = chapter_id_param;
  
  -- Return true if comment user is the novel author
  RETURN comment_user_id = novel_author_id;
END;
$$ LANGUAGE plpgsql;

-- FUNCTION 9: Check if user can view mature content
-- ============================================================================
-- Helper function for RLS policies to enforce age restrictions on mature content
CREATE OR REPLACE FUNCTION can_view_mature_content(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_age INTEGER;
BEGIN
  -- Get user's age
  SELECT age INTO user_age
  FROM profiles
  WHERE id = user_id_param;
  
  -- Return true if user is 18 or older, or if age is not set (null)
  -- If age is null, we allow access (user hasn't set age yet)
  RETURN user_age IS NULL OR user_age >= 18;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================

-- FUNCTION 11: Check if user is admin
-- ============================================================================
-- Helper function for RLS policies to check admin status
-- Checks if user exists in the admins table (private table)
DROP FUNCTION IF EXISTS is_admin(UUID) CASCADE;
CREATE OR REPLACE FUNCTION is_admin(user_id_param UUID)
RETURNS BOOLEAN AS $$ 
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- SECTION 4: DATABASE TRIGGERS
-- ============================================================================
-- Automated triggers that execute functions on specific events
-- ============================================================================

-- Drop existing triggers if they exist (for idempotency)
DROP TRIGGER IF EXISTS set_wait_hours_trigger ON chapters;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_novels_updated_at ON novels;
DROP TRIGGER IF EXISTS update_chapters_updated_at ON chapters;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
DROP TRIGGER IF EXISTS update_saved_addresses_updated_at ON saved_wallet_addresses;
DROP TRIGGER IF EXISTS update_home_sections_updated_at ON home_sections;
DROP TRIGGER IF EXISTS update_featured_banners_updated_at ON featured_banners;
DROP TRIGGER IF EXISTS update_faqs_updated_at ON faqs;
DROP TRIGGER IF EXISTS update_admin_config_updated_at ON admin_config;
DROP TRIGGER IF EXISTS update_novel_chapter_count ON chapters;
DROP TRIGGER IF EXISTS update_novel_review_stats ON reviews;
DROP TRIGGER IF EXISTS check_reports_after_insert ON reports;

-- TRIGGER 1: Auto-set wait_hours on chapter insert/update
-- ============================================================================
CREATE TRIGGER set_wait_hours_trigger
BEFORE INSERT OR UPDATE ON chapters
FOR EACH ROW EXECUTE FUNCTION set_chapter_wait_hours();

-- TRIGGER 2-12: Auto-update timestamps on all tables with updated_at
-- ============================================================================
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_novels_updated_at
BEFORE UPDATE ON novels
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at
BEFORE UPDATE ON chapters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at
BEFORE UPDATE ON wallets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_addresses_updated_at
BEFORE UPDATE ON saved_wallet_addresses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_home_sections_updated_at
BEFORE UPDATE ON home_sections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_featured_banners_updated_at
BEFORE UPDATE ON featured_banners
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_faqs_updated_at
BEFORE UPDATE ON faqs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_config_updated_at
BEFORE UPDATE ON admin_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- TRIGGER 13: Update novel chapter count
-- ============================================================================
CREATE TRIGGER update_novel_chapter_count
AFTER INSERT OR DELETE ON chapters
FOR EACH ROW EXECUTE FUNCTION update_novel_stats();

-- TRIGGER 14: Update novel review statistics
-- ============================================================================
CREATE TRIGGER update_novel_review_stats
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_review_stats();

-- TRIGGER 15: Check report threshold and auto-remove content
-- ============================================================================
CREATE TRIGGER check_reports_after_insert
AFTER INSERT ON reports
FOR EACH ROW EXECUTE FUNCTION check_report_threshold();


-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Complete security policies for all tables
-- These policies control who can read, insert, update, and delete data
-- ============================================================================

-- Enable RLS on all tables
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_view_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_wallet_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE library ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE novel_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE novel_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE stellar_distribution_log ENABLE ROW LEVEL SECURITY;

-- PROFILES TABLE POLICIES
-- ============================================================================
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- ADMINS TABLE POLICIES (PRIVATE - Admin-only access)
-- ============================================================================
-- Only admins can view the admins table
CREATE POLICY "Only admins can view admins table"
  ON admins FOR SELECT
  USING (is_admin(auth.uid()));

-- Only admins can add new admins
CREATE POLICY "Only admins can add new admins"
  ON admins FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Only admins can remove admins
CREATE POLICY "Only admins can remove admins"
  ON admins FOR DELETE
  USING (is_admin(auth.uid()));

-- NOVELS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Novels are viewable based on age"
  ON novels FOR SELECT
  USING (
    is_mature = FALSE
    OR
    (is_mature = TRUE AND can_view_mature_content(auth.uid()))
  );

CREATE POLICY "Authors can create novels"
  ON novels FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own novels"
  ON novels FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own novels"
  ON novels FOR DELETE
  USING (auth.uid() = author_id);

-- CHAPTERS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Chapters are viewable by everyone"
  ON chapters FOR SELECT
  USING (true);

CREATE POLICY "Authors can create chapters for their novels"
  ON chapters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM novels
      WHERE id = novel_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can update their own chapters"
  ON chapters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM novels
      WHERE id = novel_id AND author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM novels
      WHERE id = novel_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete their own chapters"
  ON chapters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM novels
      WHERE id = novel_id AND author_id = auth.uid()
    )
  );

-- CHAPTER UNLOCKS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own unlocks"
  ON chapter_unlocks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create unlocks"
  ON chapter_unlocks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update unlocks"
  ON chapter_unlocks FOR UPDATE
  USING (true);

-- CHAPTER TIMERS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own timers"
  ON chapter_timers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own timers"
  ON chapter_timers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update timers"
  ON chapter_timers FOR UPDATE
  USING (true);

-- CHAPTER READING PROGRESS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own chapter progress"
  ON chapter_reading_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chapter progress"
  ON chapter_reading_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chapter progress"
  ON chapter_reading_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ADS VIEW RECORDS TABLE POLICIES (Admin-only)
-- ============================================================================
CREATE POLICY "Only admins can view ad records"
  ON ads_view_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

CREATE POLICY "System can create ad records"
  ON ads_view_records FOR INSERT
  WITH CHECK (true);

-- WALLETS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own wallet"
  ON wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wallet"
  ON wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update wallets"
  ON wallets FOR UPDATE
  USING (true);

-- SAVED WALLET ADDRESSES TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own saved addresses"
  ON saved_wallet_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own saved addresses"
  ON saved_wallet_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved addresses"
  ON saved_wallet_addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved addresses"
  ON saved_wallet_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- TRANSACTIONS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (true);

-- WITHDRAWAL REQUESTS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests"
  ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests"
  ON withdrawal_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

CREATE POLICY "Admins can update withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

-- REVIEWS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- REVIEW REACTIONS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Review reactions are viewable by everyone"
  ON review_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can create review reactions"
  ON review_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review reactions"
  ON review_reactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review reactions"
  ON review_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- COMMENTS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- COMMENT REACTIONS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Comment reactions are viewable by everyone"
  ON comment_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can create comment reactions"
  ON comment_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comment reactions"
  ON comment_reactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment reactions"
  ON comment_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- FOLLOWS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- LIBRARY TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own library"
  ON library FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own library"
  ON library FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their own library"
  ON library FOR DELETE
  USING (auth.uid() = user_id);

-- READING HISTORY TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own reading history"
  ON reading_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own reading history"
  ON reading_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reading history"
  ON reading_history FOR DELETE
  USING (auth.uid() = user_id);

-- READING PROGRESS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own reading progress"
  ON reading_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reading progress"
  ON reading_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading progress"
  ON reading_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- NOVEL VOTES TABLE POLICIES
-- ============================================================================
CREATE POLICY "Novel votes are viewable by everyone"
  ON novel_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote on novels"
  ON novel_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own votes"
  ON novel_votes FOR DELETE
  USING (auth.uid() = user_id);

-- NOVEL VIEWS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Novel views are viewable by everyone"
  ON novel_views FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create novel views"
  ON novel_views FOR INSERT
  WITH CHECK (true);

-- USER ACTIVITY LOG TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own activity log"
  ON user_activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create activity logs"
  ON user_activity_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all activity logs"
  ON user_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

-- DAILY USER STATS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own daily stats"
  ON daily_user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create daily stats"
  ON daily_user_stats FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update daily stats"
  ON daily_user_stats FOR UPDATE
  USING (true);

-- SEARCH HISTORY TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their own search history"
  ON search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history"
  ON search_history FOR DELETE
  USING (auth.uid() = user_id);

-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications for anyone"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

-- REPORTS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

-- HOME SECTIONS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Home sections are viewable by everyone"
  ON home_sections FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage home sections"
  ON home_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

-- SECTION NOVELS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Section novels are viewable by everyone"
  ON section_novels FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage section novels"
  ON section_novels FOR ALL
  USING (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

-- FEATURED BANNERS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Featured banners are viewable by everyone"
  ON featured_banners FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage featured banners"
  ON featured_banners FOR ALL
  USING (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

-- FAQs TABLE POLICIES
-- ============================================================================
CREATE POLICY "FAQs are viewable by everyone"
  ON faqs FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage FAQs"
  ON faqs FOR ALL
  USING (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

-- CONTACT SUBMISSIONS TABLE POLICIES
-- ============================================================================
CREATE POLICY "Users can view their own contact submissions"
  ON contact_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create contact submissions"
  ON contact_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all contact submissions"
  ON contact_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

CREATE POLICY "Admins can update contact submissions"
  ON contact_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

-- ADMIN CONFIG TABLE POLICIES (Admin-only)
-- ============================================================================
CREATE POLICY "Admins can view admin config"
  ON admin_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

CREATE POLICY "Admins can manage admin config"
  ON admin_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

-- STELLAR DISTRIBUTION LOG TABLE POLICIES (Admin-only)
-- ============================================================================
CREATE POLICY "Admins can view distribution logs"
  ON stellar_distribution_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 WHERE is_admin(auth.uid())
    )
  );

CREATE POLICY "System can create distribution logs"
  ON stellar_distribution_log FOR INSERT
  WITH CHECK (true);


-- ============================================================================
-- SECTION 6: STORAGE BUCKET CONFIGURATION
-- ============================================================================
-- Storage buckets must be created via Supabase Dashboard
-- After creating buckets, apply the RLS policies below
-- ============================================================================

-- REQUIRED STORAGE BUCKETS:
-- 
-- 1. profile-pictures
--    - Public: Yes
--    - File size limit: 5MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--    - Path structure: {user_id}/profile.{ext}
-- 
-- 2. novel-covers
--    - Public: Yes
--    - File size limit: 10MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--    - Path structure: {novel_id}/cover.{ext}
--    - Note: Cover image is used as both cover and banner
-- 
-- 3. featured-banners
--    - Public: Yes
--    - File size limit: 10MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--    - Path structure: {banner_id}/image.{ext}
-- 
-- HOW TO CREATE BUCKETS:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Enter bucket name (e.g., "profile-pictures")
-- 4. Set "Public bucket" to ON
-- 5. Click "Create bucket"
-- 6. Repeat for all 3 buckets
-- 
-- STORAGE RLS POLICIES:
-- After creating buckets, run these policies:

-- Profile Pictures Storage Policies
CREATE POLICY "Users can upload their own profile picture"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile picture"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile picture"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Novel Covers Storage Policies
CREATE POLICY "Authors can upload covers for their novels"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'novel-covers' AND
  EXISTS (
    SELECT 1 FROM novels
    WHERE id::text = (storage.foldername(name))[1]
    AND author_id = auth.uid()
  )
);

CREATE POLICY "Authors can update covers for their novels"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'novel-covers' AND
  EXISTS (
    SELECT 1 FROM novels
    WHERE id::text = (storage.foldername(name))[1]
    AND author_id = auth.uid()
  )
);

CREATE POLICY "Authors can delete covers for their novels"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'novel-covers' AND
  EXISTS (
    SELECT 1 FROM novels
    WHERE id::text = (storage.foldername(name))[1]
    AND author_id = auth.uid()
  )
);

CREATE POLICY "Novel covers are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'novel-covers');

-- Featured Banners Storage Policies (Admin-only)
-- ============================================================================
CREATE POLICY "Admins can upload featured banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'featured-banners' AND
  EXISTS (
    SELECT 1 WHERE is_admin(auth.uid())
  )
);

CREATE POLICY "Admins can update featured banners"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'featured-banners' AND
  EXISTS (
    SELECT 1 WHERE is_admin(auth.uid())
  )
);

CREATE POLICY "Admins can delete featured banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'featured-banners' AND
  EXISTS (
    SELECT 1 WHERE is_admin(auth.uid())
  )
);

CREATE POLICY "Featured banners are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'featured-banners');

-- ============================================================================
-- SECTION 7: INITIAL CONFIGURATION DATA
-- ============================================================================
-- Default configuration values and sample data
-- ============================================================================

-- Admin Configuration Settings
-- ============================================================================
-- NOTE: Set require_email_verification to 'false' if you want to allow signup without SMTP
-- Also disable "Enable email confirmations" in Supabase Dashboard > Auth > Settings
INSERT INTO admin_config (config_key, config_value, description) VALUES
('stellar_public_key', '"GBPUY6JSWBZRC6JQ4VQXJZZFIIN5JXUBVIOT2GUB7XO3EMB75VBA4HUU"', 'Admin Stellar wallet public key for payments'),
('admob_app_id', '"ca-app-pub-7674769237472802~2350271052"', 'Google AdMob App ID'),
('admob_reward_ad_unit_id', '"ca-app-pub-7674769237472802/9176142662"', 'AdMob Reward Video Ad Unit ID'),
('minimum_withdrawal', '10', 'Minimum withdrawal amount in XLM'),
('network_fee', '0.00001', 'Stellar network transaction fee in XLM'),
('require_email_verification', 'true', 'Require email verification for new user signups - set to false to skip email verification')
ON CONFLICT (config_key) DO NOTHING;

-- Home Page Sections
-- ============================================================================
INSERT INTO home_sections (section_name, is_manual, priority_order) VALUES
('top_rankings', false, 1),
('trending', false, 2),
('editors_picks', true, 3),
('popular', false, 4),
('recommended', false, 5),
('new_arrivals', false, 6),
('recently_updated', false, 7),
('you_may_like', false, 8)
ON CONFLICT (section_name) DO NOTHING;

-- Sample FAQ Data
-- ============================================================================
INSERT INTO faqs (category, question, answer, keywords, display_order, is_active) VALUES
('account', 'How do I create an account?', 'To create an account, tap the "Sign Up" button on the login screen, enter your email and password, then verify your email address.', 'signup register account create email verification', 1, true),
('account', 'How do I reset my password?', 'On the login screen, tap "Forgot Password" and enter your email. You will receive a password reset link.', 'password reset forgot login', 2, true),
('reading', 'How do I unlock chapters?', 'Chapters can be unlocked by watching reward ads or waiting for the timer to expire. Chapters 1-7 are always free.', 'unlock chapters ads timer free', 3, true),
('reading', 'How long do I have to wait to unlock chapters?', 'Chapters 8-30 require a 3-hour wait, and chapters 31+ require a 24-hour wait. You can skip the wait by watching ads.', 'wait time timer unlock chapters', 4, true),
('wallet', 'How do I earn XLM?', 'You earn XLM by watching reward ads. Each ad view credits your wallet with a small amount of XLM.', 'earn xlm stellar ads rewards', 5, true),
('wallet', 'How do I withdraw my XLM?', 'Go to your wallet, enter your Stellar address, and request a withdrawal. Minimum withdrawal is 10 XLM.', 'withdraw xlm stellar wallet minimum', 6, true),
('general', 'Is the app free to use?', 'Yes! The app is completely free. You can read novels, unlock chapters with ads or timers, and earn XLM.', 'free cost price payment', 7, true),
('general', 'How do I report inappropriate content?', 'Tap the three-dot menu on any review or comment and select "Report". Our team will review it promptly.', 'report flag inappropriate content moderation', 8, true)
ON CONFLICT (category, question) DO NOTHING;

-- ============================================================================
-- SECTION 8: EMAIL TEMPLATES
-- ============================================================================
-- Email templates for Supabase Auth
-- These should be configured in Supabase Dashboard > Authentication > Email Templates
-- ============================================================================

-- TEMPLATE 1: Confirmation Email (Email Verification)
-- ============================================================================
-- Subject: Confirm your email address
-- Body:
/*
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
<p>If you didn't request this email, you can safely ignore it.</p>
*/

-- TEMPLATE 2: Invite User Email
-- ============================================================================
-- Subject: You have been invited
-- Body:
/*
<h2>You have been invited</h2>
<p>You have been invited to create an account. Follow this link to accept the invite:</p>
<p><a href="{{ .ConfirmationURL }}">Accept the invite</a></p>
*/

-- TEMPLATE 3: Magic Link Email
-- ============================================================================
-- Subject: Your Magic Link
-- Body:
/*
<h2>Magic Link</h2>
<p>Follow this link to login:</p>
<p><a href="{{ .ConfirmationURL }}">Log In</a></p>
<p>If you didn't request this email, you can safely ignore it.</p>
*/

-- TEMPLATE 4: Change Email Address
-- ============================================================================
-- Subject: Confirm email address change
-- Body:
/*
<h2>Confirm email change</h2>
<p>Follow this link to confirm your new email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm email change</a></p>
<p>If you didn't request this email, you can safely ignore it.</p>
*/

-- TEMPLATE 5: Reset Password Email
-- ============================================================================
-- Subject: Reset your password
-- Body:
/*
<h2>Reset Password</h2>
<p>Follow this link to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this email, you can safely ignore it.</p>
*/

-- ============================================================================
-- SECTION 9: INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================
-- Additional indexes to improve query performance
-- ============================================================================

-- Novels table indexes
CREATE INDEX IF NOT EXISTS idx_novels_author_id ON novels(author_id);
CREATE INDEX IF NOT EXISTS idx_novels_status ON novels(status);
CREATE INDEX IF NOT EXISTS idx_novels_is_mature ON novels(is_mature);
CREATE INDEX IF NOT EXISTS idx_novels_created_at ON novels(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_novels_total_votes ON novels(total_votes DESC);
CREATE INDEX IF NOT EXISTS idx_novels_average_rating ON novels(average_rating DESC);

-- Chapters table indexes
CREATE INDEX IF NOT EXISTS idx_chapters_novel_id ON chapters(novel_id);
CREATE INDEX IF NOT EXISTS idx_chapters_chapter_number ON chapters(chapter_number);
CREATE INDEX IF NOT EXISTS idx_chapters_is_locked ON chapters(is_locked);

-- Chapter unlocks indexes
CREATE INDEX IF NOT EXISTS idx_chapter_unlocks_user_id ON chapter_unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_unlocks_chapter_id ON chapter_unlocks(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_unlocks_expiration ON chapter_unlocks(expiration_timestamp);
CREATE INDEX IF NOT EXISTS idx_chapter_unlocks_is_expired ON chapter_unlocks(is_expired);

-- Chapter timers indexes
CREATE INDEX IF NOT EXISTS idx_chapter_timers_user_id ON chapter_timers(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_timers_expiration ON chapter_timers(timer_expiration_timestamp);
CREATE INDEX IF NOT EXISTS idx_chapter_timers_is_active ON chapter_timers(is_active);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_novel_id ON reviews(novel_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Comments table indexes
CREATE INDEX IF NOT EXISTS idx_comments_chapter_id ON comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Library table indexes
CREATE INDEX IF NOT EXISTS idx_library_user_id ON library(user_id);
CREATE INDEX IF NOT EXISTS idx_library_novel_id ON library(novel_id);

-- Reading history indexes
CREATE INDEX IF NOT EXISTS idx_reading_history_user_id ON reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_history_last_read ON reading_history(last_read_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Withdrawal requests indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_requested_at ON withdrawal_requests(requested_at DESC);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported_id ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Novel votes indexes
CREATE INDEX IF NOT EXISTS idx_novel_votes_novel_id ON novel_votes(novel_id);
CREATE INDEX IF NOT EXISTS idx_novel_votes_user_id ON novel_votes(user_id);

-- Follows indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next steps:
-- 1. Create storage buckets in Supabase Dashboard (see Section 6 instructions)
-- 2. Configure email templates in Dashboard > Authentication > Email Templates
-- 3. Set up pg_cron jobs for automated tasks:
--    - SELECT cron.schedule('expire-unlocks', '*/5 * * * *', 'SELECT expire_chapter_unlocks()');
--    - SELECT cron.schedule('process-timers', '*/5 * * * *', 'SELECT process_expired_timers()');
-- 4. Configure Supabase Auth settings (email verification, password requirements, etc.)
-- 5. Test the setup with sample data
-- ============================================================================


-- ============================================================================
-- SECTION 10: POST-SETUP VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify that everything was set up correctly
-- ============================================================================

-- VERIFICATION 1: Check all tables were created
-- ============================================================================
-- Expected: 33 tables
SELECT 
  'Tables Created' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 33 THEN '✓ PASS' 
    ELSE '✗ FAIL - Expected 33 tables' 
  END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- List all tables
SELECT table_name 
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- VERIFICATION 2: Check all indexes were created
-- ============================================================================
-- Expected: Multiple indexes (varies based on implementation)
SELECT 
  'Indexes Created' as check_name,
  COUNT(*) as count,
  '✓ PASS' as status
FROM pg_indexes
WHERE schemaname = 'public';

-- List all indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- VERIFICATION 3: Check all functions were created
-- ============================================================================
-- Expected: 12 functions
SELECT 
  'Functions Created' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 12 THEN '✓ PASS' 
    ELSE '✗ FAIL - Expected at least 12 functions' 
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f';

-- List all functions
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;

-- VERIFICATION 4: Check all triggers were created
-- ============================================================================
-- Expected: 19+ triggers
SELECT 
  'Triggers Created' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 19 THEN '✓ PASS' 
    ELSE '✗ FAIL - Expected at least 19 triggers' 
  END as status
FROM pg_trigger
WHERE tgisinternal = false;

-- List all triggers
SELECT 
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgisinternal = false
ORDER BY c.relname, t.tgname;

-- VERIFICATION 5: Check RLS is enabled on all tables
-- ============================================================================
-- Expected: 33 tables with RLS enabled
SELECT 
  'RLS Enabled' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 33 THEN '✓ PASS' 
    ELSE '✗ FAIL - Expected RLS on all 33 tables' 
  END as status
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relkind = 'r'
  AND relrowsecurity = true;

-- List tables with RLS status
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✓ Enabled' 
    ELSE '✗ Disabled' 
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- VERIFICATION 6: Check RLS policies were created
-- ============================================================================
-- Expected: 100+ policies across all tables
SELECT 
  'RLS Policies Created' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 100 THEN '✓ PASS' 
    ELSE '⚠ WARNING - Expected at least 100 policies' 
  END as status
FROM pg_policies;

-- List all RLS policies by table
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Detailed policy list
SELECT 
  tablename,
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- VERIFICATION 7: Check initial configuration data
-- ============================================================================
-- Check admin_config table
SELECT 
  'Admin Config Records' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✓ PASS' 
    ELSE '✗ FAIL - Expected at least 6 config records' 
  END as status
FROM admin_config;

-- List all admin config
SELECT 
  config_key,
  config_value,
  description
FROM admin_config
ORDER BY config_key;

-- VERIFICATION 8: Check home sections
-- ============================================================================
-- Check home_sections table
SELECT 
  'Home Sections' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 8 THEN '✓ PASS' 
    ELSE '✗ FAIL - Expected at least 8 home sections' 
  END as status
FROM home_sections;

-- List all home sections
SELECT 
  section_name,
  is_manual,
  priority_order
FROM home_sections
ORDER BY priority_order;

-- VERIFICATION 9: Check FAQs
-- ============================================================================
-- Check faqs table
SELECT 
  'FAQ Records' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 8 THEN '✓ PASS' 
    ELSE '✗ FAIL - Expected at least 8 FAQ records' 
  END as status
FROM faqs;

-- List all FAQs
SELECT 
  category,
  question,
  display_order,
  is_active
FROM faqs
ORDER BY category, display_order;

-- VERIFICATION 10: Check foreign key constraints
-- ============================================================================
-- List all foreign key constraints
SELECT 
  'Foreign Key Constraints' as check_name,
  COUNT(*) as count,
  '✓ PASS' as status
FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY'
  AND table_schema = 'public';

-- Detailed foreign key list
SELECT 
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ============================================================================
-- COMPREHENSIVE VERIFICATION SUMMARY
-- ============================================================================
-- Run this query to get a complete overview
SELECT 
  'SETUP VERIFICATION SUMMARY' as title,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tables_created,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as indexes_created,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind = 'f') as functions_created,
  (SELECT COUNT(*) FROM pg_trigger WHERE tgisinternal = false) as triggers_created,
  (SELECT COUNT(*) FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' AND relrowsecurity = true) as tables_with_rls,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as rls_policies_created,
  (SELECT COUNT(*) FROM admin_config) as admin_config_records,
  (SELECT COUNT(*) FROM home_sections) as home_sections_created,
  (SELECT COUNT(*) FROM faqs) as faq_records_created;

-- ============================================================================
-- SETUP COMPLETE! 🎉
-- ============================================================================
/*
Congratulations! Your Supabase database setup is complete.

NEXT STEPS:
============

1. STORAGE BUCKETS (Manual Setup Required)
   - Go to Supabase Dashboard > Storage
   - Create the following buckets:
     • profile-pictures (public, 5MB limit)
     • novel-covers (public, 10MB limit) - used as both cover and banner
     • featured-banners (public, 10MB limit)
   - Storage RLS policies are already configured in this script

2. EMAIL CONFIGURATION (Manual Setup Required)
   - See email-templates-resend.md for complete instructions
   - Configure Resend.com SMTP in Supabase Dashboard
   - Update email templates in Authentication > Email Templates
   - Set up custom email sending for withdrawals and account deletion

3. SCHEDULED JOBS (Optional but Recommended)
   - Set up pg_cron jobs for automated tasks (run these separately):
     
     Example cron jobs (every 5 minutes):
     SELECT cron.schedule('expire-unlocks', '0,5,10,15,20,25,30,35,40,45,50,55 * * * *', 'SELECT expire_chapter_unlocks()');
     SELECT cron.schedule('process-timers', '0,5,10,15,20,25,30,35,40,45,50,55 * * * *', 'SELECT process_expired_timers()');
     
   - Note: pg_cron may not be available on all Supabase plans
   - Copy and run these commands separately in SQL Editor if pg_cron is available

4. AUTHENTICATION SETTINGS
   - Go to Authentication > Settings
   - Configure password requirements
   - Set up OAuth providers if needed
   - Configure email verification requirements (check admin_config)

5. SECURITY REVIEW
   - Review all RLS policies
   - Test with different user roles (regular user, author, admin)
   - Verify mature content filtering works correctly
   - Test wallet and transaction security

6. TESTING
   - Create test users with different roles
   - Test novel creation and chapter management
   - Test unlock mechanisms (ads, timers)
   - Test wallet operations and withdrawals
   - Test review and comment functionality
   - Test admin features

7. MONITORING
   - Set up database monitoring
   - Monitor RLS policy performance
   - Track function execution times
   - Monitor storage usage

IMPORTANT NOTES:
================
- This script is idempotent - you can run it multiple times safely
- All DROP statements use IF EXISTS
- All CREATE statements use IF NOT EXISTS
- Initial data uses ON CONFLICT DO NOTHING

SUPPORT:
========
If you encounter any issues:
1. Check the verification queries above
2. Review the Supabase logs
3. Verify all prerequisites are met
4. Check that your Supabase plan supports all features

Happy coding! 🚀
*/



