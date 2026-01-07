# Reaction State Persistence Fix

## Issue
Review and comment like/dislike reactions were not persisting when users navigated away and returned to the screen. The icons would not show as filled even though the user had already reacted, allowing multiple reactions from the same user.

## Root Cause

### Problem 1: Reviews (NovelDetailScreen)
- User reactions were only loaded during initial data load
- When `loadNovelData()` was called after a reaction, it didn't have access to `currentUserId` in its closure
- The `currentUserId` wasn't in the dependency array, so reactions weren't reloaded when user logged in

### Problem 2: Comments (ChapterScreen)
- Comments were loaded with hardcoded `userLiked: false` and `userDisliked: false`
- User reactions were never fetched from the database
- After reacting, the state wasn't reloaded, so it didn't persist

## Solution

### 1. NovelDetailScreen - Review Reactions

#### A. Added useEffect to Reload When User Logs In
```typescript
// Reload reviews when user is available to load reaction states
useEffect(() => {
  if (currentUserId && novelId && novel) {
    // Reload novel data to get user reactions
    loadNovelData();
  }
}, [currentUserId]);
```

This ensures that when a user logs in or the component mounts with a logged-in user, the reviews are reloaded with their reaction states.

#### B. Existing Fix (from previous update)
The `loadNovelData()` function already loads user reactions:
```typescript
// Load user reactions for each review if user is logged in
const transformedReviews = await Promise.all((reviewsData || []).map(async (review) => {
  let isLiked = false;
  let isDisliked = false;

  if (currentUserId) {
    try {
      const reaction = await reviewService.getUserReaction(currentUserId, review.id);
      isLiked = reaction === 'like';
      isDisliked = reaction === 'dislike';
    } catch (error) {
      console.error('Error loading user reaction:', error);
    }
  }

  return {
    // ... other fields
    isLiked,
    isDisliked,
  };
}));
```

### 2. ChapterScreen - Comment Reactions

#### A. Load User Reactions on Initial Load
Updated `loadComments()` to fetch user reactions from database:
```typescript
const loadComments = async (chapterId: string) => {
  try {
    const commentsData = await commentService.getChapterComments(chapterId, 1, 50);
    if (commentsData && Array.isArray(commentsData)) {
      // Transform comments and load user reactions
      const transformedComments = await Promise.all(commentsData.map(async (comment: any) => {
        let userLiked = false;
        let userDisliked = false;

        // Load user reaction if user is logged in
        if (currentUserId) {
          try {
            const reaction = await commentService.getUserReaction(currentUserId, comment.id);
            userLiked = reaction === 'like';
            userDisliked = reaction === 'dislike';
          } catch (error) {
            console.error('Error loading user reaction:', error);
          }
        }

        return {
          // ... other fields
          userLiked,
          userDisliked,
        };
      }));
      setComments(transformedComments);
    }
  } catch (error) {
    console.error('Error loading comments:', error);
  }
};
```

#### B. Reload Comments After Reaction
Updated `toggleLike()` and `toggleDislike()` to reload comments after saving:
```typescript
const toggleLike = async (commentId: number) => {
  // ... optimistic update

  try {
    const result = await commentService.reactToComment(currentUserId, commentId.toString(), 'like');
    if (result.success && chapter?.id) {
      // Reload comments to get accurate counts and persist state
      await loadComments(chapter.id);
    } else if (!result.success) {
      // Revert on error
      // ...
    }
  } catch (error) {
    // Revert on error
    // ...
  }
};
```

## Benefits

### User Experience
1. **Persistent State**: Reactions persist across screen navigation
2. **Visual Feedback**: Icons show filled state when user has reacted
3. **Prevent Spam**: Users can only have one reaction per review/comment
4. **Accurate Counts**: Like/dislike counts are always accurate from database
5. **Optimistic Updates**: Immediate UI feedback while saving

### Technical
1. **Database as Source of Truth**: Always loads reaction state from database
2. **Error Handling**: Reverts optimistic updates on error
3. **Consistent Behavior**: Same pattern for both reviews and comments

## Flow Diagram

```
User Opens Screen
├─ Load Reviews/Comments
├─ For Each Item:
│   ├─ Check if currentUserId exists
│   ├─ If yes → Load user's reaction from database
│   └─ Set isLiked/isDisliked based on database
└─ Render with correct icon state

User Clicks Like/Dislike
├─ Optimistic Update (immediate UI change)
├─ Save to Database
├─ If Success:
│   └─ Reload All Items (gets fresh state from database)
└─ If Error:
    └─ Revert Optimistic Update
```

## Database Tables Used

### Reviews
- `review_reactions` table:
  - `user_id`: Who reacted
  - `review_id`: Which review
  - `reaction_type`: 'like' or 'dislike'

### Comments
- `comment_reactions` table:
  - `user_id`: Who reacted
  - `comment_id`: Which comment
  - `reaction_type`: 'like' or 'dislike'

## Testing Checklist

### Reviews (NovelDetailScreen)
- [x] Like a review → Icon fills with blue
- [x] Navigate away and back → Icon still filled
- [x] Click like again → Removes like (icon unfills)
- [x] Like then dislike → Switches to dislike
- [x] Refresh page → State persists
- [x] Login after viewing → Reactions load correctly

### Comments (ChapterScreen)
- [x] Like a comment → Icon fills with blue
- [x] Navigate away and back → Icon still filled
- [x] Click like again → Removes like (icon unfills)
- [x] Like then dislike → Switches to dislike
- [x] Refresh page → State persists
- [x] Login after viewing → Reactions load correctly

## Files Modified

1. `mantra-mobile/components/screens/NovelDetailScreen.tsx`
   - Added useEffect to reload reviews when user logs in
   - Ensures reaction state is loaded with currentUserId

2. `mantra-mobile/components/ChapterScreen.tsx`
   - Updated `loadComments()` to fetch user reactions from database
   - Updated `toggleLike()` to reload comments after saving
   - Updated `toggleDislike()` to reload comments after saving

## Services Used

1. `reviewService.getUserReaction(userId, reviewId)` - Gets user's reaction on a review
2. `commentService.getUserReaction(userId, commentId)` - Gets user's reaction on a comment
3. `reviewService.reactToReview(userId, reviewId, type)` - Saves/updates/removes review reaction
4. `commentService.reactToComment(userId, commentId, type)` - Saves/updates/removes comment reaction

## Notes

- Both services handle the toggle logic: clicking the same reaction removes it
- Switching between like/dislike updates the existing reaction
- The backend prevents duplicate reactions through the database schema
- Optimistic updates provide immediate feedback while database operations complete
