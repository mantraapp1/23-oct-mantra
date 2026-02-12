-- ============================================================================
-- AUTH FEATURES MIGRATION
-- ============================================================================
-- This script adds missing columns for auth flow features
-- 
-- INSTRUCTIONS:
-- 1. Open Supabase SQL Editor
-- 2. Run this script
-- ============================================================================

-- Add onboarding_completed column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    
    COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Tracks whether user has completed onboarding after signup';
  END IF;
END $$;

-- Add index for querying users who haven't completed onboarding (optional)
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON profiles(onboarding_completed) WHERE onboarding_completed = FALSE;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the migration was successful:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles' AND column_name IN ('account_status', 'deletion_scheduled_date', 'onboarding_completed');

-- Expected output should show all 3 columns:
-- account_status        | text    | 'active'::text
-- deletion_scheduled_date| timestamp with time zone | NULL
-- onboarding_completed  | boolean | false

-- ============================================================================
-- NOTE ON AUTH FEATURES (NATIVE SUPABASE AUTH)
-- ============================================================================
-- The following auth features are handled natively by Supabase Auth:
-- - Email OTP verification: supabase.auth.verifyOtp() / supabase.auth.resend()
-- - Password reset: supabase.auth.resetPasswordForEmail()
-- - Email change: supabase.auth.updateUser({ email })
-- - Password change: supabase.auth.updateUser({ password })
-- 
-- Configure in Supabase Dashboard → Authentication → Settings:
-- 1. Enable "Email" as auth provider
-- 2. Set up Resend SMTP (Auth → Settings → SMTP Settings)
-- 3. Customize email templates (Auth → Templates)
-- ============================================================================
