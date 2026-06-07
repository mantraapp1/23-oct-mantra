-- ============================================================================
-- MANTRA NOVELS — SECURITY HARDENING MIGRATION (FREE CHAPTERS VERSION)
-- ============================================================================
-- This script secures the wallet, transaction, and withdrawal systems from hacks
-- while keeping all chapter reading completely public and free as configured.
--
-- INSTRUCTIONS:
-- 1. Open Supabase SQL Editor (https://app.supabase.com)
-- 2. Open a New Query
-- 3. Copy and run this entire script
-- ============================================================================

-- ============================================================================
-- SECTION 1: HARDEN TABLE POLICIES
-- ============================================================================

-- 1. Hardening Wallets Table
-- ----------------------------------------------------------------------------
-- Drop the insecure "System can update wallets" policy that allowed anyone to update balances.
DROP POLICY IF EXISTS "System can update wallets" ON public.wallets;

-- Only admins are allowed to modify wallets directly via client API.
-- (Regular wallet updates from reading/views will run securely via service_role/triggers).
CREATE POLICY "Admins can update wallets"
  ON public.wallets FOR UPDATE
  USING (is_admin(auth.uid()));

-- 2. Hardening Transactions Table
-- ----------------------------------------------------------------------------
-- Drop the insecure policy that allowed users to insert fake transactions.
DROP POLICY IF EXISTS "System can create transactions" ON public.transactions;

CREATE POLICY "Only admins or system can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- 3. Hardening Chapter Timers (Keep safe for future use)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can update timers" ON public.chapter_timers;

-- Users can only update their own timers.
CREATE POLICY "Users can update their own timers"
  ON public.chapter_timers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Hardening Ad View Records
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can create ad records" ON public.ads_view_records;

-- Users can only insert ad records for themselves (stops faking other users' earnings).
CREATE POLICY "Users can create their own ad records"
  ON public.ads_view_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Hardening Notifications Table
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Users can only send/create notifications for themselves or if they are admin (prevents notification spamming).
CREATE POLICY "Users can create notifications for themselves"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_admin(auth.uid()));


-- ============================================================================
-- SECTION 2: CONTENT PROTECTION (ALL FREE)
-- ============================================================================

-- 1. Ensure Chapters Table allows public reading
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Chapters are viewable by everyone" ON public.chapters;
DROP POLICY IF EXISTS "Chapters are viewable if free, owned, or unlocked" ON public.chapters;

-- Configured for free-to-read model: All chapters can be read by anyone.
CREATE POLICY "Chapters are viewable by everyone"
  ON public.chapters FOR SELECT
  USING (true);


-- ============================================================================
-- SECTION 3: WITHDRAWAL DOUBLE-SPEND / OVERDRAFT PROTECTION
-- ============================================================================

-- Trigger function to validate withdrawal requests BEFORE they are created.
-- Enforces that sum of requested amount + pending requests does not exceed wallet balance.
CREATE OR REPLACE FUNCTION public.validate_withdrawal_request()
RETURNS TRIGGER AS $$
DECLARE
  user_balance DECIMAL(20,7);
  pending_total DECIMAL(20,7);
BEGIN
  -- Get current wallet balance
  SELECT balance INTO user_balance FROM public.wallets WHERE user_id = NEW.user_id;
  IF user_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for this user';
  END IF;

  -- Get total pending/processing withdrawals for this user
  SELECT COALESCE(SUM(amount), 0) INTO pending_total
  FROM public.withdrawal_requests
  WHERE user_id = NEW.user_id AND status IN ('pending', 'approved', 'processing');

  -- Verify sufficient funds
  IF (pending_total + NEW.amount) > user_balance THEN
    RAISE EXCEPTION 'Insufficient wallet balance for this withdrawal request';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind the trigger to withdrawal_requests table
DROP TRIGGER IF EXISTS trg_validate_withdrawal ON public.withdrawal_requests;
CREATE TRIGGER trg_validate_withdrawal
  BEFORE INSERT ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_withdrawal_request();


-- ============================================================================
-- SECTION 4: SECURE STORAGE BUCKETS
-- ============================================================================
-- Force enable RLS on storage tables to ensure policies are respected.
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
