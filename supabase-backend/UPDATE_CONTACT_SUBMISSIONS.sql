-- ============================================================================
-- UPDATE CONTACT SUBMISSIONS TABLE
-- ============================================================================
-- The existing 'contact_submissions' table (used by mobile app) might likely 
-- missing 'name' and 'email' columns since the mobile app relies on user_id.
-- We need these for the web contact form.

ALTER TABLE public.contact_submissions 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Ensure RLS allows anonymous inserts if not already
-- (The existing policy "Anyone can create contact submissions" should cover it, 
-- but this grants permissions just in case)
GRANT INSERT ON public.contact_submissions TO anon;
GRANT INSERT ON public.contact_submissions TO authenticated;
