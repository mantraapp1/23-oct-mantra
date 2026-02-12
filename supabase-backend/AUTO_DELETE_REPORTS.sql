-- ============================================================================
-- AUTO DELETE REPORTED CONTENT
-- ============================================================================
-- Triggers when a new report is inserted.
-- Checks if the reported content (Review or Comment) has reached 25 reports.
-- If so, deletes it from the respective table.

CREATE OR REPLACE FUNCTION public.handle_auto_delete_reports()
RETURNS TRIGGER AS $$
DECLARE
    report_count INT;
BEGIN
    -- Only check for 'review' or 'comment' types
    IF NEW.reported_type IN ('review', 'comment') THEN
        
        -- Count how many reports exist for this specific ID
        SELECT COUNT(*) INTO report_count
        FROM public.reports
        WHERE reported_id = NEW.reported_id
          AND reported_type = NEW.reported_type;

        -- If count reaches 25 (including the new one)
        IF report_count >= 25 THEN
            
            -- Delete from Reviews table
            IF NEW.reported_type = 'review' THEN
                DELETE FROM public.reviews WHERE id = NEW.reported_id::uuid;
            
            -- Delete from Comments table
            ELSIF NEW.reported_type = 'comment' THEN
                DELETE FROM public.comments WHERE id = NEW.reported_id::uuid;
            END IF;

            -- Optional: We could also mark reports as 'resolved' or ‘archived’ here
            -- but usually cascade delete on the reports table handles cleanup 
            -- if foreign keys are set up correctly. 
            -- Assuming reports.reported_id might NOT be a foreign key (polymorphic),
            -- we leave the reports for record keeping or manual cleanup.
            
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to allow updates
DROP TRIGGER IF EXISTS on_report_threshold ON public.reports;

-- Create the trigger
CREATE TRIGGER on_report_threshold
    AFTER INSERT ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_auto_delete_reports();
