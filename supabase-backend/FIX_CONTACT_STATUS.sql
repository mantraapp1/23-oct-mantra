-- ============================================================================
-- FIX STATUS CONSTRAINT
-- ============================================================================
-- The previous error happened because the table's "CHECK constraint" didn't allow 'replied'.
-- We need to update the allowed values.

-- 1. Drop the old strict constraint
ALTER TABLE public.contact_submissions
DROP CONSTRAINT IF EXISTS contact_submissions_status_check;

-- 2. Add new constraint that allows 'replied' (and others)
ALTER TABLE public.contact_submissions
ADD CONSTRAINT contact_submissions_status_check
CHECK (status IN ('pending', 'open', 'in_progress', 'resolved', 'closed', 'replied', 'archived'));
