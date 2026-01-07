# Novel Detail Screen - Supabase Integration Fixes

## Issues Found

The NovelDetailScreen has several functions that only update local state but don't actually save data to Supabase:

### 1. **Library (Save Novel) Not Working**
- **Function**: `toggleLibrary()`
- **Current**: Only toggles `isInLibrary` state
- **Missing**: Call to `readingService.addToLibrary()` or `readingService.removeFromLibrary()`

### 2. **Reviews Not Saving**
- **Function**: `handlePostReview()`
- **Current**: Only adds review to local `userReview` state
- **Missing**: Call to `reviewService.createReview()`

### 3. **Review Edits Not Saving**
- **Function**: `handleSaveEdit()`
- **Current**: Only updates local state
- **Missing**: Call to `reviewService.updateReview()`

### 4. **Review Deletes Not Saving**
- **Function**: `handleDeleteReview()`
- **Current**: Only removes from local state
- **Missing**: Call to `reviewService.deleteReview()`

### 5. **Votes Not Saving**
- **Function**: `toggleVote()`
- **Current**: Only toggles `hasVoted` state
- **Missing**: Call to `novelService.voteNovel()` or `novelService.unvoteNovel()`

### 6. **Review Reactions Not Saving**
- **Functions**: `toggleReviewLike()`, `toggleReviewDislike()`
- **Current**: Only update local state
- **Missing**: Call to `reviewService.reactToReview()`

### 7. **Reading History Not Recording**
- **Missing**: When user reads a chapter, should call `readingService.recordChapterRead()`

## Required Fixes

### Fix 1: Import Required Services
```typescript
import readingService from '../../services/readingService';
import reviewService from '../../services/reviewService';
import novelService from '../../services/novelService';
import authService from '../../services/authService';
import { useToast } from '../ToastManager';
```

### Fix 2: Add Current User State
```typescript
const [currentUserId, setCurrentUserId] = useState<string | null>(null);

useEffect(() => {
  const initUser = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
      // Load user-specific data
      await loadUserData(user.id);
    }
  };
  initUser();
}, []);
```

### Fix 3: Load User-Specific Data
```typescript
const loadUserData = async (userId: string) => {
  if (!novelId) return;
  
  // Check if in library
  const inLibrary = await readingService.isInLibrary(userId, novelId);
  setIsInLibrary(inLibrary);
  
  // Check if voted
  const voted = await novelService.hasVoted(userId, novelId);
  setHasVoted(voted);
  
  // Load user's review
  const userReviewData = await reviewService.getUserReview(userId, novelId);
  if (userReviewData) {
    setUserReview({
      id: userReviewData.id,
      userName: 'You',
      userAvatar: '', // Get from profile
      rating: userReviewData.rating,
      text: userReviewData.review_text || '',
      timeAgo: formatTimeAgo(userReviewData.created_at),
      likes: userReviewData.likes || 0,
      dislikes: userReviewData.dislikes || 0,
    });
  }
};
```

### Fix 4: Fix toggleLibrary Function
```typescript
const { showToast } = useToast();

const toggleLibrary = async () => {
  if (!currentUserId || !novelId) return;
  
  try {
    if (isInLibrary) {
      const result = await readingService.removeFromLibrary(currentUserId, novelId);
      if (result.success) {
        setIsInLibrary(false);
        showToast('success', 'Removed from library');
      } else {
        showToast('error', result.message);
      }
    } else {
      const result = await readingService.addToLibrary(currentUserId, novelId);
      if (result.success) {
        setIsInLibrary(true);
        showToast('success', 'Added to library');
      } else {
        showToast('error', result.message);
      }
    }
  } catch (error) {
    console.error('Error toggling library:', error);
    showToast('error', 'Failed to update library');
  }
};
```

### Fix 5: Fix handlePostReview Function
```typescript
const handlePostReview = async () => {
  if (!currentUserId || !novelId) return;
  
  if (selectedRating === 0) {
    showToast('error', 'Please select a rating');
    return;
  }
  if (!reviewText.trim()) {
    showToast('error', 'Please write a review');
    return;
  }

  try {
    const result = await reviewService.createReview(currentUserId, {
      novel_id: novelId,
      rating: selectedRating,
      review_text: reviewText,
    });

    if (result.success && result.review) {
      const newReview: Review = {
        id: result.review.id,
        userName: 'You',
        userAvatar: '', // Get from profile
        rating: result.review.rating,
        text: result.review.review_text || '',
        timeAgo: 'Just now',
        likes: 0,
        dislikes: 0,
      };

      setUserReview(newReview);
      setReviews([newReview, ...reviews]);
      setReviewText('');
      setSelectedRating(0);
      showToast('success', 'Review posted successfully');
      
      // Reload novel data to update rating
      await loadNovelData();
    } else {
      showToast('error', result.message);
    }
  } catch (error) {
    console.error('Error posting review:', error);
    showToast('error', 'Failed to post review');
  }
};
```

### Fix 6: Fix handleSaveEdit Function
```typescript
const handleSaveEdit = async () => {
  if (!userReview || !currentUserId) return;

  try {
    const result = await reviewService.updateReview(userReview.id, {
      rating: selectedRating,
      review_text: reviewText,
    });

    if (result.success && result.review) {
      setUserReview({
        ...userReview,
        rating: result.review.rating,
        text: result.review.review_text || '',
      });
      setIsEditingReview(false);
      setReviewText('');
      setSelectedRating(0);
      showToast('success', 'Review updated successfully');
      
      // Reload novel data to update rating
      await loadNovelData();
    } else {
      showToast('error', result.message);
    }
  } catch (error) {
    console.error('Error updating review:', error);
    showToast('error', 'Failed to update review');
  }
};
```

### Fix 7: Fix handleDeleteReview Function
```typescript
const handleDeleteReview = async () => {
  if (!userReview) return;

  try {
    const result = await reviewService.deleteReview(userReview.id);
    
    if (result.success) {
      setUserReview(null);
      setIsEditingReview(false);
      setReviews(reviews.filter(r => r.id !== userReview.id));
      showToast('success', 'Review deleted successfully');
      
      // Reload novel data to update rating
      await loadNovelData();
    } else {
      showToast('error', result.message);
    }
  } catch (error) {
    console.error('Error deleting review:', error);
    showToast('error', 'Failed to delete review');
  }
};
```

### Fix 8: Fix toggleVote Function
```typescript
const toggleVote = async () => {
  if (!currentUserId || !novelId) return;

  try {
    if (hasVoted) {
      const result = await novelService.unvoteNovel(currentUserId, novelId);
      if (result.success) {
        setHasVoted(false);
        // Update vote count in novel state
        if (novel) {
          const currentVotes = parseInt(novel.votes.replace('k', '000').replace('M', '000000'));
          novel.votes = formatNumber(currentVotes - 1);
        }
        showToast('success', 'Vote removed');
      } else {
        showToast('error', result.message);
      }
    } else {
      const result = await novelService.voteNovel(currentUserId, novelId);
      if (result.success) {
        setHasVoted(true);
        // Update vote count in novel state
        if (novel) {
          const currentVotes = parseInt(novel.votes.replace('k', '000').replace('M', '000000'));
          novel.votes = formatNumber(currentVotes + 1);
        }
        showToast('success', 'Vote added');
      } else {
        showToast('error', result.message);
      }
    }
  } catch (error) {
    console.error('Error toggling vote:', error);
    showToast('error', 'Failed to update vote');
  }
};
```

### Fix 9: Fix Review Reactions
```typescript
const toggleReviewLike = async (reviewId: string) => {
  if (!currentUserId) return;

  try {
    const result = await reviewService.reactToReview(currentUserId, reviewId, 'like');
    if (result.success) {
      // Reload reviews to get updated counts
      await loadNovelData();
    }
  } catch (error) {
    console.error('Error liking review:', error);
  }
};

const toggleReviewDislike = async (reviewId: string) => {
  if (!currentUserId) return;

  try {
    const result = await reviewService.reactToReview(currentUserId, reviewId, 'dislike');
    if (result.success) {
      // Reload reviews to get updated counts
      await loadNovelData();
    }
  } catch (error) {
    console.error('Error disliking review:', error);
  }
};
```

### Fix 10: Record Chapter Reads
```typescript
const handleChapterPress = async (chapter: Chapter) => {
  if (chapter.isLocked) {
    setUnlockChapter(chapter);
    setShowUnlockDialog(true);
  } else {
    // Record chapter read
    if (currentUserId && novelId) {
      await readingService.recordChapterRead(
        currentUserId,
        novelId,
        chapter.id.toString(),
        chapter.id
      );
    }
    
    (navigation.navigate as any)('Chapter', { 
      novelId: novel.id, 
      chapterId: chapter.id 
    });
  }
};
```

## Summary

All these functions need to be updated to actually call the Supabase services instead of just updating local state. The services are already implemented correctly in:
- `services/readingService.ts` - Library and history
- `services/reviewService.ts` - Reviews and reactions
- `services/novelService.ts` - Votes

The NovelDetailScreen just needs to be updated to use them properly.
