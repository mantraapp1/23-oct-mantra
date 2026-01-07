# Action Guide: Fix Comments Not Saving & Like States Not Persisting

## Issues
1. **Comments not saving** - When posting a comment, it doesn't save to database
2. **Like states not persisting** - After liking/disliking, state doesn't show after reload

## Root Cause
Most likely: **Row Level Security (RLS) policies are missing or blocking inserts**

## IMMEDIATE FIX - Run This SQL Script

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"

### Step 2: Run the RLS Fix Script
Copy and paste this entire script into the SQL Editor and click "Run":

```sql
-- Enable RLS on tables
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

DROP POLICY IF EXISTS "Users can view all comment reactions" ON public.comment_reactions;
DROP POLICY IF EXISTS "Users can insert their own comment reactions" ON public.comment_reactions;
DROP POLICY IF EXISTS "Users can delete their own comment reactions" ON public.comment_reactions;

DROP POLICY IF EXISTS "Users can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

DROP POLICY IF EXISTS "Users can view all review reactions" ON public.review_reactions;
DROP POLICY IF EXISTS "Users can insert their own review reactions" ON public.review_reactions;
DROP POLICY IF EXISTS "Users can delete their own review reactions" ON public.review_reactions;

-- COMMENTS POLICIES
CREATE POLICY "Users can view all comments"
ON public.comments FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert their own comments"
ON public.comments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.comments FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- COMMENT REACTIONS POLICIES
CREATE POLICY "Users can view all comment reactions"
ON public.comment_reactions FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert their own comment reactions"
ON public.comment_reactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment reactions"
ON public.comment_reactions FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- REVIEWS POLICIES
CREATE POLICY "Users can view all reviews"
ON public.reviews FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert their own reviews"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- REVIEW REACTIONS POLICIES
CREATE POLICY "Users can view all review reactions"
ON public.review_reactions FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert their own review reactions"
ON public.review_reactions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review reactions"
ON public.review_reactions FOR DELETE TO authenticated
USING (auth.uid() = user_id);
```

### Step 3: Verify the Fix
Run this query to check that policies are created:

```sql
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('comments', 'comment_reactions', 'reviews', 'review_reactions')
ORDER BY tablename, cmd;
```

**Expected Output:** You should see 4 policies for each table (SELECT, INSERT, UPDATE, DELETE)

## Test the Fix

### Test 1: Post a Comment
1. Open your app
2. Navigate to any chapter
3. Post a comment
4. **Expected:** Comment should appear immediately
5. Reload the screen
6. **Expected:** Comment should still be there

### Test 2: Like a Comment
1. Like a comment
2. **Expected:** Like button shows as filled/liked
3. Reload the screen
4. **Expected:** Like button STILL shows as filled/liked ✅

### Test 3: Unlike a Comment
1. Click the like button again to unlike
2. **Expected:** Like button shows as not liked
3. Reload the screen
4. **Expected:** Like button STILL shows as not liked ✅

## If Still Not Working

### Check 1: User is Authenticated
Add this to your app temporarily:

```typescript
const checkAuth = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user);
  console.log('User ID:', user?.id);
  console.log('Is authenticated:', !!user);
};
```

**Expected:** User should not be null

### Check 2: Check Database Directly
Run this in Supabase SQL Editor:

```sql
-- Check if comments are being inserted
SELECT * FROM comments ORDER BY created_at DESC LIMIT 5;

-- Check if reactions are being inserted
SELECT * FROM comment_reactions ORDER BY created_at DESC LIMIT 5;
```

**Expected:** You should see your test comments and reactions

### Check 3: Check for Errors
Add detailed logging to the service:

```typescript
// In commentService.ts createComment function
console.log('[CommentService] Attempting to create comment:', {
  userId,
  data,
  timestamp: new Date().toISOString()
});

const { data: comment, error } = await supabase
  .from('comments')
  .insert({
    user_id: userId,
    ...data,
  })
  .select()
  .single();

console.log('[CommentService] Result:', { comment, error });

if (error) {
  console.error('[CommentService] ERROR DETAILS:', {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });
}
```

## Common Error Codes

- **42501** - RLS policy violation (run the SQL script above)
- **23503** - Foreign key violation (chapter_id or user_id doesn't exist)
- **23505** - Unique constraint violation (duplicate reaction)
- **23502** - Not null violation (missing required field)

## Summary

The most likely issue is missing RLS policies. Run the SQL script in Step 2, and both issues should be fixed:
1. ✅ Comments will save to database
2. ✅ Like states will persist after reload

If you still have issues after running the SQL script, check the console logs and share the error messages.
