-- ============================================================================
-- DIAGNOSTIC_RLS_CHECK.sql
-- ============================================================================
-- Run this in Supabase SQL Editor to diagnose the 406 errors
-- ============================================================================

-- 1. Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('wallets', 'follows');

-- 2. Check if RLS is enabled on these tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('wallets', 'follows');

-- 3. Check existing policies on these tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('wallets', 'follows');

-- 4. Check wallets table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wallets' AND table_schema = 'public';

-- 5. Check follows table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'follows' AND table_schema = 'public';

-- 6. Try a direct query (as service role - bypasses RLS)
SELECT COUNT(*) as wallet_count FROM wallets;
SELECT COUNT(*) as follows_count FROM follows;
