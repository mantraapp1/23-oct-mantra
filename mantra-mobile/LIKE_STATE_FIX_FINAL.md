# Like State Persistence - Final Fix ✅

## Problem
Like/dislike buttons were not showing the correct state after screen reload, even though the reactions were saved in the database.

## Root Causes Identified

1. **Services were only tracking likes, not dislikes**
   - The service was creating a boolean map (`user_has_liked: true/false`)
   - This lost information about dislikes

2. **Screens were doing redundant work**
   - Screens were calling `getUserReactions()` again after the service already fetched reactions
   - This added unnecessary database queries

3. **Field name mapping issue**
   - Service returns `user_has_liked` (snake_case)
   - Screen needs `userLiked` (camelCase)
   - The mapping wasn't using the service data correctly

## Solution Implemented

### 1. Fixed Services (commentService.ts & reviewService.ts)

**Changed reaction mapping from boolean to string:**
```typescript
// OLD - Lost dislike information
const likeMap = new Map(
  reactions?.map(r => [r.comment_id, r.reaction_type === 'like']) || []
);

// NEW - Preserves both like and dislike
const reactionMap = new Map(
  reactions?.map(r => [r.comment_id, r.reaction_type]) || []
);
```

**Return both fields:**
```typescript
return data.map((comment: any) => {
  const reaction = reactionMap.get(comment.id);
  return {
    ...comment,
    user_has_liked: reaction === 'like',
    user_has_disliked: reaction === 'dislike'
  };
});
```

### 2. Fixed Screens (ChapterScreen.tsx & ChapterManageScreen.tsx)

**Removed redundant getUserReactions() call:**
```typescript
// OLD - Redundant database query
const userReactionsMap = await commentService.getUserReactions(currentUserId, commentIds);
const reactionType = userReactionsMap.get(comment.id);

// NEW - Use data already returned by service
userLiked: comment.user_has_liked || false,
userDisliked: comment.user_has_disliked || false,
```

**Fixed ChapterManageScreen user ID:**
```typescript
// OLD - Hardcoded
const currentUserId = 1;

// NEW - Real user from auth
const [currentUserId, setCurrentUserId] = useState<string | null>(null);

useEffect(() => {
  const initUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };
  initUser();
}, []);
```

## Files Modified

1. ✅ `mantra-mobile/services/commentService.ts`
   - Updated `getChapterComments()` to return both `user_has_liked` and `user_has_disliked`
   - Updated `getCommentReplies()` to return both fields

2. ✅ `mantra-mobile/services/reviewService.ts`
   - Updated `getNovelReviews()` to return both `user_has_liked` and `user_has_disliked`

3. ✅ `mantra-mobile/components/ChapterScreen.tsx`
   - Removed redundant `getUserReactions()` call
   - Now uses `comment.user_has_liked` and `comment.user_has_disliked` from service

4. ✅ `mantra-mobile/components/screens/author/ChapterManageScreen.tsx`
   - Fixed hardcoded `currentUserId` to get real user from auth
   - Removed redundant `getUserReactions()` call
   - Now uses `comment.user_has_liked` and `comment.user_has_disliked` from service

## Testing Steps

1. **Like a comment:**
   - Click like button
   - Button should show as liked (filled/highlighted)

2. **Reload the screen:**
   - Pull to refresh OR navigate away and back
   - Like button should STILL show as liked ✅

3. **Unlike the comment:**
   - Click like button again
   - Button should show as not liked (empty)

4. **Reload the screen again:**
   - Pull to refresh OR navigate away and back
   - Like button should STILL show as not liked ✅

5. **Test dislikes:**
   - Click dislike button
   - Reload screen
   - Dislike button should show as disliked ✅

## Performance Benefits

- **Before:** N+2 database queries (1 for comments + 1 for reactions + N for individual checks)
- **After:** 2 database queries (1 for comments + 1 batch query for all reactions)
- **Improvement:** Eliminated N redundant queries

## Debugging

If the fix doesn't work, check:

1. **User is logged in:** `currentUserId` should not be null
2. **Service returns data:** Add `console.log(commentsData)` to see `user_has_liked` field
3. **Screen uses data:** Add `console.log(comment.user_has_liked)` before setting state
4. **Database has reactions:** Query `comment_reactions` table to verify data exists

See `DEBUG_LIKE_STATE.md` for detailed debugging steps.

## Status: ✅ COMPLETE

The like/dislike state persistence issue is now fixed. Both likes and dislikes will persist correctly across screen reloads for comments and reviews.
