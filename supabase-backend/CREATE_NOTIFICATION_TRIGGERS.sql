-- ============================================================================
-- PROFESSIONAL NOTIFICATION SYSTEM
-- ============================================================================
-- This migration creates YouTube/Facebook-style automatic notifications
-- Triggers insert notifications when key events happen:
-- 1. New chapter published → Notify users with novel in library
-- 2. New follower → Notify the followed user
-- 3. New comment on chapter → Notify novel author
-- 4. Comment reply → Notify parent comment author
-- 5. Review/Comment liked → Notify content author
-- 6. New review → Notify novel author
-- ============================================================================

-- ============================================================================
-- 1. HELPER FUNCTION: Create Notification
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Don't create notification for the user themselves
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (user_id, type, title, message, related_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_related_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. TRIGGER: New Chapter Published → Notify Library Users
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_new_chapter()
RETURNS TRIGGER AS $$
DECLARE
  v_novel_title TEXT;
  v_author_id UUID;
  v_library_user RECORD;
BEGIN
  -- Get novel info
  SELECT title, author_id INTO v_novel_title, v_author_id
  FROM novels WHERE id = NEW.novel_id;
  
  -- Notify all users who have this novel in their library (except author)
  FOR v_library_user IN 
    SELECT user_id FROM library 
    WHERE novel_id = NEW.novel_id AND user_id != v_author_id
  LOOP
    PERFORM create_notification(
      v_library_user.user_id,
      'new_chapter',
      'New Chapter Available!',
      v_novel_title || ' - Chapter ' || NEW.chapter_number || ': ' || COALESCE(NEW.title, 'Untitled'),
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_chapter ON chapters;
CREATE TRIGGER trigger_notify_new_chapter
AFTER INSERT ON chapters
FOR EACH ROW
EXECUTE FUNCTION notify_new_chapter();

-- ============================================================================
-- 3. TRIGGER: New Follower → Notify Followed User
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
  v_follower_name TEXT;
BEGIN
  -- Get follower's username
  SELECT username INTO v_follower_name
  FROM profiles WHERE id = NEW.follower_id;
  
  -- Notify the person being followed
  PERFORM create_notification(
    NEW.following_id,
    'new_follower',
    'New Follower!',
    COALESCE(v_follower_name, 'Someone') || ' started following you.',
    NEW.follower_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_follower ON follows;
CREATE TRIGGER trigger_notify_new_follower
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION notify_new_follower();

-- ============================================================================
-- 4. TRIGGER: New Comment → Notify Novel Author
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_author_id UUID;
  v_novel_title TEXT;
  v_chapter_number INTEGER;
  v_commenter_name TEXT;
BEGIN
  -- Get novel author and chapter info
  SELECT n.author_id, n.title, c.chapter_number 
  INTO v_author_id, v_novel_title, v_chapter_number
  FROM chapters c
  JOIN novels n ON n.id = c.novel_id
  WHERE c.id = NEW.chapter_id;
  
  -- Get commenter's username
  SELECT username INTO v_commenter_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Don't notify if author comments on their own novel
  IF NEW.user_id != v_author_id THEN
    -- Only notify for top-level comments (not replies - those have separate trigger)
    IF NEW.parent_comment_id IS NULL THEN
      PERFORM create_notification(
        v_author_id,
        'new_comment',
        'New Comment on Your Novel',
        COALESCE(v_commenter_name, 'Someone') || ' commented on ' || v_novel_title || ' (Ch. ' || v_chapter_number || ')',
        NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_comment ON comments;
CREATE TRIGGER trigger_notify_new_comment
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_new_comment();

-- ============================================================================
-- 5. TRIGGER: Comment Reply → Notify Parent Comment Author
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_author_id UUID;
  v_replier_name TEXT;
  v_novel_title TEXT;
BEGIN
  -- Only process replies (has parent_comment_id)
  IF NEW.parent_comment_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get parent comment author
  SELECT user_id INTO v_parent_author_id
  FROM comments WHERE id = NEW.parent_comment_id;
  
  -- Get replier's username
  SELECT username INTO v_replier_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Get novel title for context
  SELECT n.title INTO v_novel_title
  FROM chapters c
  JOIN novels n ON n.id = c.novel_id
  WHERE c.id = NEW.chapter_id;
  
  -- Don't notify if user replies to their own comment
  IF NEW.user_id != v_parent_author_id THEN
    PERFORM create_notification(
      v_parent_author_id,
      'new_comment', -- Using same type for replies
      'New Reply to Your Comment',
      COALESCE(v_replier_name, 'Someone') || ' replied to your comment on ' || v_novel_title,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_comment_reply ON comments;
CREATE TRIGGER trigger_notify_comment_reply
AFTER INSERT ON comments
FOR EACH ROW
WHEN (NEW.parent_comment_id IS NOT NULL)
EXECUTE FUNCTION notify_comment_reply();

-- ============================================================================
-- 6. TRIGGER: Comment Liked → Notify Comment Author
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_comment_liked()
RETURNS TRIGGER AS $$
DECLARE
  v_comment_author_id UUID;
  v_liker_name TEXT;
BEGIN
  -- Only notify for likes, not dislikes
  IF NEW.reaction_type != 'like' THEN
    RETURN NEW;
  END IF;
  
  -- Get comment author
  SELECT user_id INTO v_comment_author_id
  FROM comments WHERE id = NEW.comment_id;
  
  -- Get liker's username
  SELECT username INTO v_liker_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Don't notify if user likes their own comment
  IF NEW.user_id != v_comment_author_id THEN
    PERFORM create_notification(
      v_comment_author_id,
      'comment_liked',
      'Your Comment Was Liked!',
      COALESCE(v_liker_name, 'Someone') || ' liked your comment.',
      NEW.comment_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_comment_liked ON comment_reactions;
CREATE TRIGGER trigger_notify_comment_liked
AFTER INSERT ON comment_reactions
FOR EACH ROW
WHEN (NEW.reaction_type = 'like')
EXECUTE FUNCTION notify_comment_liked();

-- ============================================================================
-- 7. TRIGGER: New Review → Notify Novel Author
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
DECLARE
  v_author_id UUID;
  v_novel_title TEXT;
  v_reviewer_name TEXT;
BEGIN
  -- Get novel author and title
  SELECT author_id, title INTO v_author_id, v_novel_title
  FROM novels WHERE id = NEW.novel_id;
  
  -- Get reviewer's username
  SELECT username INTO v_reviewer_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Don't notify if author reviews their own novel
  IF NEW.user_id != v_author_id THEN
    PERFORM create_notification(
      v_author_id,
      'new_review',
      'New Review on Your Novel!',
      COALESCE(v_reviewer_name, 'Someone') || ' left a ' || NEW.rating || '-star review on ' || v_novel_title,
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_new_review ON reviews;
CREATE TRIGGER trigger_notify_new_review
AFTER INSERT ON reviews
FOR EACH ROW
EXECUTE FUNCTION notify_new_review();

-- ============================================================================
-- 8. TRIGGER: Review Liked → Notify Review Author
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_review_liked()
RETURNS TRIGGER AS $$
DECLARE
  v_review_author_id UUID;
  v_liker_name TEXT;
BEGIN
  -- Only notify for likes, not dislikes
  IF NEW.reaction_type != 'like' THEN
    RETURN NEW;
  END IF;
  
  -- Get review author
  SELECT user_id INTO v_review_author_id
  FROM reviews WHERE id = NEW.review_id;
  
  -- Get liker's username
  SELECT username INTO v_liker_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Don't notify if user likes their own review
  IF NEW.user_id != v_review_author_id THEN
    PERFORM create_notification(
      v_review_author_id,
      'comment_liked', -- Using same type for review likes
      'Your Review Was Liked!',
      COALESCE(v_liker_name, 'Someone') || ' liked your review.',
      NEW.review_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_review_liked ON review_reactions;
CREATE TRIGGER trigger_notify_review_liked
AFTER INSERT ON review_reactions
FOR EACH ROW
WHEN (NEW.reaction_type = 'like')
EXECUTE FUNCTION notify_review_liked();

-- ============================================================================
-- 9. TRIGGER: Novel Voted → Notify Author
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_novel_voted()
RETURNS TRIGGER AS $$
DECLARE
  v_author_id UUID;
  v_novel_title TEXT;
  v_voter_name TEXT;
BEGIN
  -- Get novel author and title
  SELECT author_id, title INTO v_author_id, v_novel_title
  FROM novels WHERE id = NEW.novel_id;
  
  -- Get voter's username
  SELECT username INTO v_voter_name
  FROM profiles WHERE id = NEW.user_id;
  
  -- Don't notify if author votes for their own novel
  IF NEW.user_id != v_author_id THEN
    PERFORM create_notification(
      v_author_id,
      'novel_voted',
      'Your Novel Got a Vote!',
      COALESCE(v_voter_name, 'Someone') || ' voted for ' || v_novel_title,
      NEW.novel_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_novel_voted ON novel_votes;
CREATE TRIGGER trigger_notify_novel_voted
AFTER INSERT ON novel_votes
FOR EACH ROW
EXECUTE FUNCTION notify_novel_voted();

-- ============================================================================
-- 10. ADD MISSING NOTIFICATION TYPES TO TABLE CHECK
-- ============================================================================
-- Update the notification type check constraint to include all types

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'new_chapter', 'new_follower', 'new_comment', 'comment_liked',
    'new_review', 'novel_voted', 'admin_message', 'wallet_earnings',
    'withdrawal_status', 'withdrawal_completed', 'custom'
  ));

-- ============================================================================
-- DONE
-- ============================================================================
-- The notification system now automatically creates notifications for:
-- ✅ New chapters (notifies library users)
-- ✅ New followers (notifies followed user)
-- ✅ New comments (notifies novel author)
-- ✅ Comment replies (notifies parent commenter)
-- ✅ Comment likes (notifies comment author)
-- ✅ New reviews (notifies novel author)
-- ✅ Review likes (notifies review author)
-- ✅ Novel votes (notifies author)
-- ============================================================================
