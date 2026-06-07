-- ============================================================================
-- CLEANUP TEST DATA FOR PRODUCTION LAUNCH (V2 - NO SUPERUSER REQUIRED)
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Select your project: kiro (hiposzbsobvhkgylmeyy)
-- 3. Click on the "SQL Editor" in the left sidebar
-- 4. Click "New Query"
-- 5. Copy and paste this entire script and click "Run"
-- ============================================================================

-- 1. Delete all novels
-- Because of foreign keys with ON DELETE CASCADE, this automatically deletes all:
-- chapters, unlocks, timers, progress, comments, reviews, library saves, votes, views, etc.
DELETE FROM public.novels;

-- 2. Delete other global metadata & log tables
DELETE FROM public.featured_banners;
DELETE FROM public.stellar_distribution_log;
DELETE FROM public.contact_submissions;

-- 3. Delete all auth users EXCEPT the main account 'pankajgusinge01@gmail.com'
-- Because of foreign keys with ON DELETE CASCADE, this automatically deletes all:
-- profiles, wallets, transactions, activity logs, follows, etc. for all other users.
DELETE FROM auth.users WHERE email != 'pankajgusinge01@gmail.com';

-- 4. Reset data for the remaining main user ('pankajgusinge01@gmail.com') so they start fresh
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'pankajgusinge01@gmail.com';
  
  IF v_user_id IS NOT NULL THEN
    -- Clear activity logs
    DELETE FROM public.user_activity_log WHERE user_id = v_user_id;
    
    -- Clear daily stats
    DELETE FROM public.daily_user_stats WHERE user_id = v_user_id;
    
    -- Clear notifications
    DELETE FROM public.notifications WHERE user_id = v_user_id;
    
    -- Clear search history
    DELETE FROM public.search_history WHERE user_id = v_user_id;
    
    -- Clear reports
    DELETE FROM public.reports WHERE reporter_id = v_user_id;
    
    -- Clear saved wallet addresses
    DELETE FROM public.saved_wallet_addresses WHERE user_id = v_user_id;
    
    -- Clear transactions
    DELETE FROM public.transactions WHERE user_id = v_user_id;
    
    -- Clear withdrawal requests
    DELETE FROM public.withdrawal_requests WHERE user_id = v_user_id;
    
    -- Reset wallet balance and stats back to zero
    UPDATE public.wallets 
    SET 
      balance = 0.00, 
      total_earned = 0.00, 
      total_withdrawn = 0.00, 
      total_ad_views = 0, 
      updated_at = NOW() 
    WHERE user_id = v_user_id;
    
    -- Ensure user profile status is active
    UPDATE public.profiles 
    SET 
      account_status = 'active',
      onboarding_completed = FALSE,
      updated_at = NOW()
    WHERE id = v_user_id;
  END IF;
END $$;

-- 5. Verification check
SELECT 'Wipe Complete' as status, 
       (SELECT COUNT(*) FROM auth.users) as remaining_users,
       (SELECT COUNT(*) FROM public.novels) as remaining_novels,
       (SELECT COUNT(*) FROM public.profiles) as remaining_profiles;
