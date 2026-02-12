-- ============================================================================
-- UPDATE CONTACT SUBMISSIONS - PART 2
-- ============================================================================
-- Adds support for Admin Replies directly from the Supabase Dashboard.

-- 1. Add Reply Columns
ALTER TABLE public.contact_submissions 
ADD COLUMN IF NOT EXISTS admin_reply TEXT,
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

-- 2. Create a Trigger to automatically set 'replied_at' and 'status'
--    when an admin adds a reply text.

CREATE OR REPLACE FUNCTION public.handle_admin_reply()
RETURNS TRIGGER AS $$
BEGIN
    -- If admin_reply changed and is not null
    IF NEW.admin_reply IS DISTINCT FROM OLD.admin_reply AND NEW.admin_reply IS NOT NULL THEN
        NEW.replied_at = NOW();
        NEW.status = 'replied';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_admin_reply ON public.contact_submissions;

CREATE TRIGGER on_admin_reply
    BEFORE UPDATE ON public.contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_admin_reply();
