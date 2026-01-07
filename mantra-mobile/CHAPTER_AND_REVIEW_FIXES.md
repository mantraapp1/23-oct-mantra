# Chapter Loading and Review Reaction Fixes

## Issues Fixed

### 1. Chapter Loading Failure
**Problem**: Clicking "Read" button on Novel Detail screen showed "Failed to load chapter" error.

**Root Cause**: The `handleRead` function was passing `chapterId: 1` (a number) instead of the actual chapter ID string from the database.

**Solution**: Updated `handleRead` to navigate to the first chapter using its actual ID from the chapters array:
```typescript
const handleRead = () => {
  // Navigate to first chapter
  if (chapters.length > 0) {
    const firstChapter = chapters[0];
    (navigation.navigate as any)('Chapter', { novelId: novel.id, chapterId: firstChapter.id });
  } else {
    showToast('error', 'No chapters available');
  }
};
```

### 2. Review Like/Dislike State Not Persisting
**Problem**: Users could like/dislike reviews multiple times, and the reaction state didn't persist when navigating back to the screen.

**Root Cause**: 
- Review reactions weren't being loaded from the database when fetching reviews
- The UI didn't reflect the user's existing reactions
- No validation to prevent multiple reactions

**Solution**: 

#### A. Load User Reactions on Initial Load
Updated the review loading logic to fetch each user's reaction state:
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
    id: review.id,
    // ... other fields
    isLiked,
    isDisliked,
  };
}));
```

#### B. Optimistic Updates with Proper State Management
Updated like/dislike handlers to:
1. Immediately update UI (optimistic update)
2. Save to database
3. Reload data to get accurate counts
4. Revert on error

```typescript
const toggleReviewLike = async (reviewId: string) => {
  if (!currentUserId) {
    showToast('error', 'Please log in to react to reviews');
    return;
  }

  // Optimistic update
  setReviews(prev => prev.map(review => {
    if (review.id === reviewId) {
      const wasLiked = review.isLiked;
      const wasDisliked = review.isDisliked;
      
      return {
        ...review,
        isLiked: !wasLiked,
        isDisliked: false,
        likes: wasLiked ? review.likes - 1 : review.likes + 1,
        dislikes: wasDisliked ? review.dislikes - 1 : review.dislikes,
      };
    }
    return review;
  }));

  try {
    const result = await reviewService.reactToReview(currentUserId, reviewId, 'like');
    if (result.success) {
      await loadNovelData(); // Reload to get accurate counts
    } else {
      await loadNovelData(); // Revert on error
      showToast('error', result.message);
    }
  } catch (error) {
    await loadNovelData(); // Revert on error
    showToast('error', 'Failed to update reaction');
  }
};
```

#### C. Backend Validation
The `reviewService.reactToReview()` method already handles:
- Preventing duplicate reactions (removes if same type clicked again)
- Switching between like/dislike (updates if different type)
- Storing reactions in `review_reactions` table

## Benefits

1. **Chapter Navigation**: Users can now successfully read chapters from the Novel Detail screen
2. **Reaction Persistence**: Like/dislike states persist across screen navigation
3. **Visual Feedback**: Buttons show filled icons when user has reacted
4. **Prevent Spam**: Users can only have one reaction per review (like OR dislike)
5. **Toggle Behavior**: Clicking the same reaction again removes it
6. **Optimistic UI**: Immediate feedback while saving to database

## Testing Checklist

- [x] Click "Read" button on Novel Detail screen → Opens first chapter successfully
- [x] Like a review → Button fills with color and count increases
- [x] Navigate away and back → Like state persists
- [x] Click like again → Removes like (toggle behavior)
- [x] Like then dislike → Switches from like to dislike
- [x] Dislike a review → Button fills with red color
- [x] Try to like without login → Shows "Please log in" message

## Files Modified

1. `mantra-mobile/components/screens/NovelDetailScreen.tsx`
   - Fixed `handleRead()` to use actual chapter ID
   - Updated review loading to fetch user reactions
   - Enhanced `toggleReviewLike()` and `toggleReviewDislike()` with optimistic updates

## Database Schema Used

- `reviews` table: Stores review data with likes/dislikes counts
- `review_reactions` table: Stores individual user reactions (user_id, review_id, reaction_type)
- The service layer handles the relationship between these tables
