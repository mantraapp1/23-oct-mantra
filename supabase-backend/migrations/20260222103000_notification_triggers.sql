-- =============================================
-- NOTIFICATION TRIGGERS
-- All triggers that auto-create notifications
-- Applied to Supabase via migration
-- =============================================

-- =============================================
-- 1. NEW FOLLOWER NOTIFICATION
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
    follower_name TEXT;
BEGIN
    SELECT COALESCE(display_name, username) INTO follower_name
    FROM public.profiles WHERE id = NEW.follower_id;

    INSERT INTO public.notifications (user_id, type, title, message, related_id, sent_by)
    VALUES (
        NEW.following_id,
        'new_follower',
        'New Follower! 👤',
        follower_name || ' started following you.',
        NEW.following_id,
        NEW.follower_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_follow ON public.follows;
CREATE TRIGGER on_new_follow
    AFTER INSERT ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_follower();

-- =============================================
-- 2. NEW CHAPTER NOTIFICATION (notifies library users)
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_new_chapter()
RETURNS TRIGGER AS $$
DECLARE
    novel_title TEXT;
    novel_author_id UUID;
    lib_user RECORD;
BEGIN
    SELECT title, author_id INTO novel_title, novel_author_id
    FROM public.novels WHERE id = NEW.novel_id;

    FOR lib_user IN 
        SELECT user_id FROM public.library 
        WHERE novel_id = NEW.novel_id AND user_id != novel_author_id
    LOOP
        INSERT INTO public.notifications (user_id, type, title, message, related_id, sent_by)
        VALUES (
            lib_user.user_id,
            'new_chapter',
            'New Chapter Available! 📖',
            'Chapter ' || NEW.chapter_number || ': "' || NEW.title || '" of "' || novel_title || '" is now available.',
            NEW.novel_id,
            novel_author_id
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_chapter ON public.chapters;
CREATE TRIGGER on_new_chapter
    AFTER INSERT ON public.chapters
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_chapter();

-- =============================================
-- 3. NEW COMMENT + COMMENT REPLY NOTIFICATION
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_new_comment()
RETURNS TRIGGER AS $$
DECLARE
    commenter_name TEXT;
    chapter_title TEXT;
    novel_author_id UUID;
    novel_title TEXT;
    parent_commenter_id UUID;
BEGIN
    SELECT COALESCE(display_name, username) INTO commenter_name
    FROM public.profiles WHERE id = NEW.user_id;

    SELECT c.title, n.author_id, n.title INTO chapter_title, novel_author_id, novel_title
    FROM public.chapters c
    JOIN public.novels n ON n.id = c.novel_id
    WHERE c.id = NEW.chapter_id;

    -- Reply notification
    IF NEW.parent_comment_id IS NOT NULL THEN
        SELECT user_id INTO parent_commenter_id
        FROM public.comments WHERE id = NEW.parent_comment_id;
        
        IF parent_commenter_id IS NOT NULL AND parent_commenter_id != NEW.user_id THEN
            INSERT INTO public.notifications (user_id, type, title, message, related_id, sent_by)
            VALUES (
                parent_commenter_id,
                'comment_reply',
                'New Reply to Your Comment 💬',
                commenter_name || ' replied to your comment on "' || chapter_title || '".',
                NEW.chapter_id,
                NEW.user_id
            );
        END IF;
    END IF;

    -- Author notification
    IF novel_author_id IS NOT NULL AND novel_author_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, related_id, sent_by)
        VALUES (
            novel_author_id,
            'new_comment',
            'New Comment on Your Novel 💬',
            commenter_name || ' commented on "' || chapter_title || '" in "' || novel_title || '".',
            NEW.chapter_id,
            NEW.user_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_comment ON public.comments;
CREATE TRIGGER on_new_comment
    AFTER INSERT ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_comment();

-- =============================================
-- 4. NEW REVIEW NOTIFICATION
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_new_review()
RETURNS TRIGGER AS $$
DECLARE
    reviewer_name TEXT;
    novel_title TEXT;
    novel_author_id UUID;
BEGIN
    SELECT COALESCE(display_name, username) INTO reviewer_name
    FROM public.profiles WHERE id = NEW.user_id;

    SELECT title, author_id INTO novel_title, novel_author_id
    FROM public.novels WHERE id = NEW.novel_id;

    IF novel_author_id IS NOT NULL AND novel_author_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, related_id, sent_by)
        VALUES (
            novel_author_id,
            'new_review',
            'New Review! ⭐',
            reviewer_name || ' gave "' || novel_title || '" a ' || NEW.rating || '-star review.',
            NEW.novel_id,
            NEW.user_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_review ON public.reviews;
CREATE TRIGGER on_new_review
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_new_review();

-- =============================================
-- 5. NOVEL VOTED NOTIFICATION
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_novel_voted()
RETURNS TRIGGER AS $$
DECLARE
    voter_name TEXT;
    novel_title TEXT;
    novel_author_id UUID;
BEGIN
    SELECT COALESCE(display_name, username) INTO voter_name
    FROM public.profiles WHERE id = NEW.user_id;

    SELECT title, author_id INTO novel_title, novel_author_id
    FROM public.novels WHERE id = NEW.novel_id;

    IF novel_author_id IS NOT NULL AND novel_author_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, type, title, message, related_id, sent_by)
        VALUES (
            novel_author_id,
            'novel_voted',
            'New Vote! 🗳️',
            voter_name || ' voted for "' || novel_title || '".',
            NEW.novel_id,
            NEW.user_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_novel_vote ON public.novel_votes;
CREATE TRIGGER on_novel_vote
    AFTER INSERT ON public.novel_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_novel_voted();

-- =============================================
-- 6. COMMENT LIKED NOTIFICATION
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_comment_liked()
RETURNS TRIGGER AS $$
DECLARE
    liker_name TEXT;
    comment_owner_id UUID;
BEGIN
    IF NEW.reaction_type != 'like' THEN RETURN NEW; END IF;

    SELECT user_id INTO comment_owner_id FROM public.comments WHERE id = NEW.comment_id;

    IF comment_owner_id IS NOT NULL AND comment_owner_id != NEW.user_id THEN
        SELECT COALESCE(display_name, username) INTO liker_name
        FROM public.profiles WHERE id = NEW.user_id;

        INSERT INTO public.notifications (user_id, type, title, message, related_id, sent_by)
        VALUES (
            comment_owner_id, 'comment_liked',
            'Your Comment Was Liked! ❤️',
            liker_name || ' liked your comment.',
            NEW.comment_id, NEW.user_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_reaction ON public.comment_reactions;
CREATE TRIGGER on_comment_reaction
    AFTER INSERT ON public.comment_reactions
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_comment_liked();

-- =============================================
-- 7. REVIEW LIKED NOTIFICATION
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_review_liked()
RETURNS TRIGGER AS $$
DECLARE
    liker_name TEXT;
    review_owner_id UUID;
BEGIN
    IF NEW.reaction_type != 'like' THEN RETURN NEW; END IF;

    SELECT user_id INTO review_owner_id FROM public.reviews WHERE id = NEW.review_id;

    IF review_owner_id IS NOT NULL AND review_owner_id != NEW.user_id THEN
        SELECT COALESCE(display_name, username) INTO liker_name
        FROM public.profiles WHERE id = NEW.user_id;

        INSERT INTO public.notifications (user_id, type, title, message, related_id, sent_by)
        VALUES (
            review_owner_id, 'review_like',
            'Your Review Was Liked! ❤️',
            liker_name || ' liked your review.',
            NEW.review_id, NEW.user_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_reaction ON public.review_reactions;
CREATE TRIGGER on_review_reaction
    AFTER INSERT ON public.review_reactions
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_review_liked();

-- =============================================
-- 8. WALLET EARNINGS NOTIFICATION
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_wallet_earning()
RETURNS TRIGGER AS $$
DECLARE
    novel_title TEXT;
BEGIN
    IF NEW.type != 'earning' THEN RETURN NEW; END IF;

    IF NEW.novel_id IS NOT NULL THEN
        SELECT title INTO novel_title FROM public.novels WHERE id = NEW.novel_id;
    END IF;

    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (
        NEW.user_id, 'wallet_earnings',
        'You Earned Money! 💰',
        'You earned $' || ROUND(NEW.amount, 4) || COALESCE(' from "' || novel_title || '"', '') || '.',
        NEW.novel_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_wallet_earning ON public.transactions;
CREATE TRIGGER on_wallet_earning
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_wallet_earning();

-- =============================================
-- 9. WITHDRAWAL STATUS NOTIFICATION
-- =============================================
CREATE OR REPLACE FUNCTION public.notify_withdrawal_status()
RETURNS TRIGGER AS $$
DECLARE
    status_msg TEXT;
    status_title TEXT;
BEGIN
    IF OLD.status = NEW.status THEN RETURN NEW; END IF;

    CASE NEW.status
        WHEN 'approved' THEN
            status_title := 'Withdrawal Approved! ✅';
            status_msg := 'Your withdrawal request for $' || ROUND(NEW.amount, 2) || ' has been approved.';
        WHEN 'completed' THEN
            status_title := 'Withdrawal Completed! 🎉';
            status_msg := 'Your withdrawal of $' || ROUND(NEW.amount, 2) || ' has been completed and sent to your wallet.';
        WHEN 'rejected' THEN
            status_title := 'Withdrawal Rejected ❌';
            status_msg := 'Your withdrawal request for $' || ROUND(NEW.amount, 2) || ' was rejected.' || COALESCE(' Reason: ' || NEW.rejection_reason, '');
        WHEN 'failed' THEN
            status_title := 'Withdrawal Failed ⚠️';
            status_msg := 'Your withdrawal of $' || ROUND(NEW.amount, 2) || ' failed. Please try again.';
        ELSE
            RETURN NEW;
    END CASE;

    INSERT INTO public.notifications (user_id, type, title, message, related_id)
    VALUES (NEW.user_id, 'withdrawal_status', status_title, status_msg, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_withdrawal_status ON public.withdrawal_requests;
CREATE TRIGGER on_withdrawal_status
    AFTER UPDATE ON public.withdrawal_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_withdrawal_status();
