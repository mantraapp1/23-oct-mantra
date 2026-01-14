-- ============================================================================
-- PRODUCTION UPGRADE: Add 'processing' status for withdrawal locking
-- ============================================================================
-- This migration adds a 'processing' status to withdrawal_requests
-- to prevent race conditions during withdrawal processing.
--
-- Run this in your Supabase SQL Editor before deploying the Vercel backend.
-- ============================================================================

-- 1. Drop the existing check constraint
ALTER TABLE public.withdrawal_requests 
DROP CONSTRAINT IF EXISTS withdrawal_requests_status_check;

-- 2. Add new check constraint with 'processing' status
ALTER TABLE public.withdrawal_requests 
ADD CONSTRAINT withdrawal_requests_status_check 
CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'failed', 'rejected'));

-- 3. Create index for faster withdrawal queries
CREATE INDEX IF NOT EXISTS idx_withdrawals_processing 
ON withdrawal_requests(status) 
WHERE status IN ('pending', 'approved', 'processing');

-- 4. Verify the change
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'withdrawal_requests_status_check';
