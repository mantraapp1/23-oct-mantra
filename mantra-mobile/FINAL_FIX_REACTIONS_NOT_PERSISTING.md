# FINAL FIX: Reactions Not Persisting After Reload

## Current Status
- ✅ Reactions save to database
- ❌ Reactions don't show after reload

## Root Cause
The service is trying to fetch reactions from the database, but either:
1. RLS policies are blocking the SELECT query
2. The service isn't being called with the correct userId

## STEP 1: Run This SQL Script (CRITICAL)

Open Supabase SQL Editor and run this:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('comment_reactions', 'review_reactions') 
AND schemaname = 'public';

-- If rowsecurity is FALSE, enable it
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate SELECT policies
DROP POLICY IF EXISTS "Users can view all comment reactions" ON public.comment_reactions;
DROP POLICY IF EXISTS "Users can view all review reactions" ON public.review_reactions;

CREATE POLICY "Users can view all comment reactions"
ON public.comment_reactions FOR SELECT TO public USING (true);

CREATE POLICY "Users can view all review reactions"
ON public.review_reactions FOR SELECT TO public USING (true);

-- Verify policies exist
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('comment_reactions', 'review_reactions')
ORDER BY tablename, cmd;
```

**Expected output:** You should see SELECT policies for both tables.

## STEP 2: Test in Supabase SQL Editor

Run this query to check if reactions are in the database:

```sql
-- Check comment reactions
SELECT 
  cr.id,
  cr.user_id,
  cr.comment_id,
  cr.reaction_type,
  c.comment_text
FROM comment_reactions cr
JOIN comments c ON c.id = cr.comment_id
ORDER BY cr.created_at DESC
LIMIT 5;

-- Check review reactions
SELECT 
  rr.id,
  rr.user_id,
  rr.review_id,
  rr.reaction_type,
  r.review_text
FROM review_reactions rr
JOIN reviews r ON r.id = rr.review_id
ORDER BY rr.created_at DESC
LIMIT 5;
```

**Expected:** You should see your reactions in the results.

## STEP 3: Add Debug Logging

Temporarily add this to your app to see what's happening:

### In `commentService.ts` (line ~155):

```typescript
// If user is logged in, fetch their reaction status for each comment
if (userId && data && data.length > 0) {
  const commentIds = data.map((c: any) => c.id);
  
  console.log('[CommentService] Fetching reactions for:', {
    userId,
    commentIds,
    commentCount: commentIds.length
  });
  
  const { data: reactions, error } = await supabase
    .from('comment_reactions')
    .select('comment_id, reaction_type')
    .eq('user_id', userId)
    .in('comment_id', commentIds);

  console.log('[CommentService] Reactions result:', {
    reactions,
    error,
    count: reactions?.length || 0
  });

  // Create a map of comment_id -> reaction_type
  const reactionMap = new Map(
    reactions?.map(r => [r.comment_id, r.reaction_type]) || []
  );

  console.log('[CommentService] Reaction map:', Array.from(reactionMap.entries()));

  // Add user_has_liked and user_has_disliked to each comment
  return data.map((comment: any) => {
    const reaction = reactionMap.get(comment.id);
    console.log(`[CommentService] Comment ${comment.id}: reaction=${reaction}`);
    return {
      ...comment,
      user_has_liked: reaction === 'like',
      user_has_disliked: reaction === 'dislike'
    };
  }) as CommentWithUser[];
}
```

### In `ChapterScreen.tsx` (line ~160):

```typescript
const transformedComments = commentsData.map((comment: any) => {
  const authorName = comment.user?.display_name || comment.user?.username || 'Anonymous';

  console.log('[ChapterScreen] Transforming comment:', {
    id: comment.id,
    user_has_liked: comment.user_has_liked,
    user_has_disliked: comment.user_has_disliked
  });

  return {
    id: comment.id,
    userId: comment.user_id,
    author: authorName,
    avatar: getProfilePicture(comment.user?.profile_picture_url, authorName),
    time: formatTimeAgo(comment.created_at),
    text: comment.comment_text,
    likes: comment.likes || 0,
    dislikes: comment.dislikes || 0,
    userLiked: comment.user_has_liked || false,
    userDisliked: comment.user_has_disliked || false,
    replies: [],
  };
});

console.log('[ChapterScreen] Final comments:', transformedComments.map(c => ({
  id: c.id,
  userLiked: c.userLiked,
  userDisliked: c.userDisliked
})));
```

## STEP 4: Test and Check Console

1. Like a comment
2. Reload the page
3. Open browser console (F12)
4. Look for the console.log messages

**What to look for:**

### If you see:
```
[CommentService] Fetching reactions for: { userId: null, ... }
```
**Problem:** User ID is null
**Solution:** Check authentication - user might not be logged in

### If you see:
```
[CommentService] Reactions result: { reactions: null, error: {...} }
```
**Problem:** Database query failed
**Solution:** Check the error message - likely RLS policy issue

### If you see:
```
[CommentService] Reactions result: { reactions: [], count: 0 }
```
**Problem:** No reactions found in database
**Solution:** Reactions aren't saving - check INSERT policies

### If you see:
```
[CommentService] Reaction map: [['comment-uuid', 'like']]
[ChapterScreen] Transforming comment: { user_has_liked: true }
[ChapterScreen] Final comments: [{ userLiked: true }]
```
**Success!** The data is loading correctly. If UI still doesn't show it, it's a rendering issue.

## STEP 5: Common Issues

### Issue 1: userId is null
```typescript
// In ChapterScreen, check if currentUserId is set
useEffect(() => {
  console.log('[ChapterScreen] currentUserId:', currentUserId);
}, [currentUserId]);
```

### Issue 2: RLS blocking SELECT
Run this in Supabase:
```sql
-- Test if you can select reactions
SELECT * FROM comment_reactions LIMIT 1;
```
If this fails, RLS is blocking you.

### Issue 3: Wrong comment ID format
Check console for errors like:
```
invalid input syntax for type uuid
```
This means IDs are still being converted to numbers somewhere.

## Quick Fix Checklist

- [ ] Run the SQL script from Step 1
- [ ] Verify reactions exist in database (Step 2)
- [ ] Add console.log statements (Step 3)
- [ ] Like a comment and reload
- [ ] Check console for errors
- [ ] Share console output if still not working

## If Still Not Working

Share these details:
1. Console output from the debug logs
2. Any error messages in console
3. Result of the SQL queries from Step 2
4. Screenshot of the issue

This will help identify exactly where the problem is.
