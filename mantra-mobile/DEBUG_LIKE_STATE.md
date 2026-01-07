# Debug Guide: Like State Persistence

## Issue
Like/dislike buttons not showing correct state after screen reload.

## What Was Fixed

### 1. Service Layer (commentService.ts & reviewService.ts)
- ✅ Services now return `user_has_liked` and `user_has_disliked` fields
- ✅ Both fields are booleans based on the user's reaction in the database
- ✅ Batch fetching is done internally by the service (efficient)

### 2. Screen Layer (ChapterScreen.tsx & ChapterManageScreen.tsx)
- ✅ Screens now use `comment.user_has_liked` and `comment.user_has_disliked` from service
- ✅ Removed redundant `getUserReactions()` calls (service already does this)
- ✅ ChapterManageScreen now gets real user ID from Supabase auth

## How to Debug

### Step 1: Check Database
Open Supabase and run this query to see if reactions are being saved:

```sql
-- Check comment reactions
SELECT 
  cr.id,
  cr.user_id,
  cr.comment_id,
  cr.reaction_type,
  cr.created_at,
  c.comment_text
FROM comment_reactions cr
JOIN comments c ON c.id = cr.comment_id
ORDER BY cr.created_at DESC
LIMIT 10;

-- Check review reactions
SELECT 
  rr.id,
  rr.user_id,
  rr.review_id,
  rr.reaction_type,
  rr.created_at,
  r.review_text
FROM review_reactions rr
JOIN reviews r ON r.id = rr.review_id
ORDER BY rr.created_at DESC
LIMIT 10;
```

**Expected:** You should see rows with `reaction_type` = 'like' or 'dislike'

### Step 2: Check Service Response
Add console.log in the service to see what's being returned:

In `commentService.ts`, add this before the return statement:

```typescript
console.log('[CommentService] Returning comments with reactions:', 
  data.map((c: any) => ({
    id: c.id,
    user_has_liked: reactionMap.get(c.id) === 'like',
    user_has_disliked: reactionMap.get(c.id) === 'dislike',
    reaction: reactionMap.get(c.id)
  }))
);
```

**Expected output:**
```
[CommentService] Returning comments with reactions: [
  { id: '123', user_has_liked: true, user_has_disliked: false, reaction: 'like' },
  { id: '124', user_has_liked: false, user_has_disliked: false, reaction: undefined }
]
```

### Step 3: Check Screen Transformation
Add console.log in the screen to see what's being set:

In `ChapterScreen.tsx`, add this in `loadComments`:

```typescript
console.log('[ChapterScreen] Raw comment data:', commentsData.map(c => ({
  id: c.id,
  user_has_liked: c.user_has_liked,
  user_has_disliked: c.user_has_disliked
})));

console.log('[ChapterScreen] Transformed comments:', transformedComments.map(c => ({
  id: c.id,
  userLiked: c.userLiked,
  userDisliked: c.userDisliked
})));
```

**Expected output:**
```
[ChapterScreen] Raw comment data: [
  { id: '123', user_has_liked: true, user_has_disliked: false }
]
[ChapterScreen] Transformed comments: [
  { id: 123, userLiked: true, userDisliked: false }
]
```

### Step 4: Check User ID
Add console.log to verify the user ID is being passed:

```typescript
console.log('[ChapterScreen] Loading comments with userId:', currentUserId);
```

**Expected:** Should show a valid UUID, not `null` or `undefined`

### Step 5: Check UI Rendering
In the comment rendering code, add:

```typescript
console.log('[ChapterScreen] Rendering comment:', {
  id: comment.id,
  userLiked: comment.userLiked,
  userDisliked: comment.userDisliked
});
```

## Common Issues

### Issue 1: userId is null
**Symptom:** Service returns comments without reaction data
**Cause:** User not logged in or currentUserId not set
**Fix:** Check that `currentUserId` is set before calling `loadComments()`

### Issue 2: user_has_liked is undefined
**Symptom:** `comment.user_has_liked` is undefined in screen
**Cause:** Service not returning the field
**Fix:** Check that service is actually fetching reactions (add console.log)

### Issue 3: Reactions saved but not showing
**Symptom:** Database has reactions, but UI doesn't show them
**Cause:** Field name mismatch (snake_case vs camelCase)
**Fix:** Ensure screen uses `comment.user_has_liked` not `comment.userHasLiked`

### Issue 4: Wrong user's reactions showing
**Symptom:** Seeing someone else's like state
**Cause:** Wrong userId being passed to service
**Fix:** Verify `currentUserId` matches logged-in user

## Testing Checklist

1. [ ] Like a comment
2. [ ] Check database - reaction should be saved
3. [ ] Reload screen (pull to refresh or navigate away and back)
4. [ ] Check console logs - service should return user_has_liked: true
5. [ ] Check UI - like button should be filled/highlighted
6. [ ] Unlike the comment
7. [ ] Check database - reaction should be deleted
8. [ ] Reload screen
9. [ ] Check console logs - service should return user_has_liked: false
10. [ ] Check UI - like button should be empty/not highlighted

## Quick Test Script

Run this in your app to test the flow:

```typescript
// 1. Get current user
const user = await authService.getCurrentUser();
console.log('Current user:', user?.id);

// 2. Load comments
const comments = await commentService.getChapterComments('chapter-id', user?.id);
console.log('Comments with reactions:', comments.map(c => ({
  id: c.id,
  user_has_liked: c.user_has_liked,
  user_has_disliked: c.user_has_disliked
})));

// 3. Like a comment
await commentService.reactToComment(user!.id, comments[0].id, 'like');

// 4. Reload comments
const reloadedComments = await commentService.getChapterComments('chapter-id', user?.id);
console.log('After like:', reloadedComments[0].user_has_liked); // Should be true
```

## Expected Behavior

**Before fix:**
- Like a comment → saves to DB
- Reload screen → like button shows as not liked ❌

**After fix:**
- Like a comment → saves to DB
- Reload screen → like button shows as liked ✅
- Unlike comment → removes from DB
- Reload screen → like button shows as not liked ✅

## Files to Check

1. `mantra-mobile/services/commentService.ts` - Lines 150-175
2. `mantra-mobile/services/reviewService.ts` - Lines 150-175
3. `mantra-mobile/components/ChapterScreen.tsx` - Lines 156-180
4. `mantra-mobile/components/screens/author/ChapterManageScreen.tsx` - Lines 121-145
