-- ============================================================================
-- SECURELY ADD FIRST ADMIN ACCOUNT
-- ============================================================================
-- This script securely grants admin privileges to a user by inserting a record 
-- into the private `admins` table. It does NOT modify the `profiles` table, 
-- ensuring that Row Level Security (RLS) is not bypassed.
--
-- INSTRUCTIONS:
-- 1. Open Supabase SQL Editor (https://app.supabase.com)
-- 2. Select your project
-- 3. Open a New Query
-- 4. Copy one of the options below, replace with your user email or username, and run it.
-- ============================================================================

-- Option A: Grant admin role using Email (RECOMMENDED)
-- Replace 'admin@mantranovels.com' with the user's email address
INSERT INTO public.admins (user_id, notes)
SELECT id, 'Initial admin created securely via SQL script'
FROM public.profiles
WHERE email = 'admin@mantranovels.com'
ON CONFLICT (user_id) DO NOTHING;

-- Option B: Grant admin role using Username
-- Replace 'admin_username' with the user's username
-- INSERT INTO public.admins (user_id, notes)
-- SELECT id, 'Initial admin created securely via SQL script'
-- FROM public.profiles
-- WHERE username = 'admin_username'
-- ON CONFLICT (user_id) DO NOTHING;
