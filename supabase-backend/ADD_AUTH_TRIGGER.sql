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
    account_status,
    email_confirmed_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    'active',
    NEW.email_confirmed_at
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- 2. Create the trigger on auth.users for insertions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Create function and trigger for user updates (to sync email_confirmed_at)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    email_confirmed_at = NEW.email_confirmed_at,
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE FUNCTION public.handle_user_update();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query to check if the triggers were created:
-- SELECT tgname FROM pg_trigger WHERE tgname IN ('on_auth_user_created', 'on_auth_user_updated');
