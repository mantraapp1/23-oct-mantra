-- ============================================================================
-- AUTOMATED PROFILE CREATION TRIGGER
-- ============================================================================
-- This script creates a trigger to automatically create a public.profiles row
-- whenever a new user signs up via Supabase Auth.
-- This is CRITICAL for email verification flows where the client does not
-- have a session immediately after signup.
-- ============================================================================

-- 1. Create the function that runs on new user insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    email,
    display_name,
    profile_picture_url,
    account_status
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Initialize wallet for the new user
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Initialize daily stats
  INSERT INTO public.daily_user_stats (user_id, date)
  VALUES (NEW.id, CURRENT_DATE)
  ON CONFLICT (user_id, date) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query to check if the trigger was created:
-- SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
