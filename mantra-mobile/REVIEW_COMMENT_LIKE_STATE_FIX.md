# Review & Comment Like State Not Loading - Fix

## Problem
When users like reviews or comments, the likes save to the database correctly. However, when the screen reloads, the like buttons don't show as filled/liked because the services are not loading the user's like status from the database.

## Root Cause
Both `reviewService.ts` and `commentService.ts` have functions that fetch reviews/comments but they don't include the user's like status:

1. **reviewService.getNovelReviews()** - Fetches reviews but no `user_has_liked` field
2. **commentService.getChapterComments()** - Fetches comments but no `user_has_liked` field

## Solution
We need to modify both services to:
1. Accept the current `userId` as a parameter
2. Check the `review_reactions` or `comment_reactions` table for each item
3. Add a `user_has_liked` boolean field to the returned data

## Implementation

### 1. Fix reviewService.getNovelReviews()

**Current Code:**
```typescript
async getNovelReviews(
  novelId: string,
  page: number = 1,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  rating?: number
): Promise<ReviewWithUser[]>
```

**Fixed Code:**
```typescript
async getNovelReviews(
  novelId: string,
  userId: string | null,  // Add userId parameter
  page: number = 1,
  pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
  rating?: number
): Promise<ReviewWithUser[]> {
  try {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('novel_id', novelId);

    if (rating) {
      query = query.eq('rating', rating);
    }

    query = paginateQuery(query, page, pageSize);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    // If user is logged in, fetch their like status for each review
    if (userId && data) {
      const reviewIds = data.map(r => r.id);
      
      const { data: reactions } = await supabase
        .from('review_reactions')
        .select('review_id, reaction_type')
        .eq('user_id', userId)
        .in('review_id', reviewIds);

      // Create a map of review_id -> user_has_liked
      const likeMap = new Map(
        reactions?.map(r => [r.review_id, r.reaction_type === 'like']) || []
      );

      // Add user_has_liked to each review
      return data.map(review => ({
        ...review,
        user_has_liked: likeMap.get(review.id) || false
      })) as ReviewWithUser[];
    }

    return (data as ReviewWithUser[]) || [];
  } catch (error) {
    console.error('Error getting novel reviews:', error);
    return [];
  }
}
```

### 2. Fix commentService.getChapterComments()

**Current Code:**
```typescript
async getChapterComments(
  chapterId: string,
  page: number = 1,
  pageSize: number = PAGINATION.COMMENTS_PAGE_SIZE,
  sortBy: 'newest' | 'most_liked' = 'newest'
): Promise<CommentWithUser[]>
```

**Fixed Code:**
```typescript
async getChapterComments(
  chapterId: string,
  userId: string | null,  // Add userId parameter
  page: number = 1,
  pageSize: number = PAGINATION.COMMENTS_PAGE_SIZE,
  sortBy: 'newest' | 'most_liked' = 'newest'
): Promise<CommentWithUser[]> {
  try {
    let query = supabase
      .from('comments')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('chapter_id', chapterId)
      .is('parent_comment_id', null);

    query = paginateQuery(query, page, pageSize);

    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('likes', { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    // If user is logged in, fetch their like status for each comment
    if (userId && data) {
      const commentIds = data.map(c => c.id);
      
      const { data: reactions } = await supabase
        .from('comment_reactions')
        .select('comment_id, reaction_type')
        .eq('user_id', userId)
        .in('comment_id', commentIds);

      // Create a map of comment_id -> user_has_liked
      const likeMap = new Map(
        reactions?.map(r => [r.comment_id, r.reaction_type === 'like']) || []
      );

      // Add user_has_liked to each comment
      return data.map(comment => ({
        ...comment,
        user_has_liked: likeMap.get(comment.id) || false
      })) as CommentWithUser[];
    }

    return (data as CommentWithUser[]) || [];
  } catch (error) {
    console.error('Error getting chapter comments:', error);
    return [];
  }
}
```

### 3. Fix getReplies() in commentService

The same fix needs to be applied to the `getReplies()` function for comment replies.

## Files to Update

1. `mantra-mobile/services/reviewService.ts` - Update `getNovelReviews()`
2. `mantra-mobile/services/commentService.ts` - Update `getChapterComments()` and `getReplies()`
3. All screens that call these functions need to pass the `userId`:
   - `NovelDetailScreen.tsx`
   - `ChapterScreen.tsx`
   - Any other screens showing reviews/comments

## Testing

After implementing:
1. Like a review/comment
2. Reload the screen
3. ✅ The like button should show as filled/liked
4. Unlike it
5. Reload the screen
6. ✅ The like button should show as not liked

## Status
- ✅ **IMPLEMENTED**

## Implementation Summary

### Services Updated
1. ✅ `reviewService.getNovelReviews()` - Now accepts `userId` parameter and fetches user's like status
2. ✅ `commentService.getChapterComments()` - Now accepts `userId` parameter and fetches user's like status
3. ✅ `commentService.getCommentReplies()` - Now accepts `userId` parameter and fetches user's like status

### Screens Updated
1. ✅ `ChapterScreen.tsx` - Updated to pass `currentUserId` to `getChapterComments()`
2. ✅ `ChapterManageScreen.tsx` - Updated to:
   - Get real user ID from Supabase auth
   - Pass `currentUserId` to `getChapterComments()`
   - Use batch reaction fetching for better performance
3. ✅ `NovelDetailScreen.tsx` - Already using batch reaction fetching with `getUserReactions()`

### How It Works Now

**For Reviews:**
- When loading reviews, the service checks if a user is logged in
- If logged in, it fetches all review reactions for that user in a single query
- Each review gets a `user_has_liked` field set to `true` or `false`
- The UI shows the correct like state on page load

**For Comments:**
- When loading comments, the service checks if a user is logged in
- If logged in, it fetches all comment reactions for that user in a single query
- Each comment gets a `user_has_liked` field set to `true` or `false`
- The UI shows the correct like state on page load

### Performance Optimization
Both services use batch fetching to minimize database queries:
- Single query to get all reviews/comments
- Single query to get all user reactions for those items
- Data is merged in memory for optimal performance
