# Error Handling Test Guide

This document provides test scenarios to verify proper error handling and fallback behavior for user interaction state synchronization.

## Test Scenarios

### 1. Network Failure Tests

#### Test 1.1: Review Reactions - Network Error
**Steps:**
1. Open NovelDetailScreen with reviews
2. Simulate network failure (airplane mode or disconnect WiFi)
3. Pull to refresh the screen

**Expected Behavior:**
- UI should not crash
- Reviews should display with default states (no reactions shown)
- Console should log detailed error with timestamp
- User should see reviews but without reaction states

**Console Log Format:**
```
[ReviewService] Error fetching user reactions: {
  error: [Error object],
  errorMessage: "Network request failed",
  errorCode: undefined,
  userId: "user-id",
  reviewIdsCount: 5,
  timestamp: "2024-11-09T..."
}
```

#### Test 1.2: Comment Reactions - Network Error
**Steps:**
1. Open ChapterScreen with comments
2. Simulate network failure
3. Scroll to comments section

**Expected Behavior:**
- UI should not crash
- Comments should display with default states
- Console should log detailed error
- User can still read comments

#### Test 1.3: Novel Votes - Network Error
**Steps:**
1. Open HomeScreen
2. Simulate network failure
3. Pull to refresh

**Expected Behavior:**
- UI should not crash
- Novels should display without vote/library states
- Console should log error for batch fetch
- User can still browse novels

### 2. Unauthenticated User Tests

#### Test 2.1: Review Reactions - No User
**Steps:**
1. Log out of the app
2. Open NovelDetailScreen with reviews

**Expected Behavior:**
- No database queries should be made
- All reviews show default states (not liked/disliked)
- No errors in console
- Empty Map returned immediately

#### Test 2.2: Novel Lists - No User
**Steps:**
1. Log out of the app
2. Open HomeScreen

**Expected Behavior:**
- Novels load successfully
- No vote/library states shown
- No database queries for interaction states
- Empty Sets returned immediately

### 3. Empty Data Tests

#### Test 3.1: No Reviews
**Steps:**
1. Open NovelDetailScreen for a novel with no reviews
2. Check console logs

**Expected Behavior:**
- No errors in console
- Empty Map returned
- UI shows "No reviews yet" state

#### Test 3.2: No Comments
**Steps:**
1. Open ChapterScreen for a chapter with no comments
2. Check console logs

**Expected Behavior:**
- No errors in console
- Empty Map returned
- UI shows "No comments yet" state

### 4. Database Error Tests

#### Test 4.1: Invalid User ID
**Steps:**
1. Manually trigger batch fetch with invalid user ID
2. Check console logs

**Expected Behavior:**
- Method returns empty collection (Map/Set)
- Detailed error logged to console
- UI doesn't crash

#### Test 4.2: Invalid Novel/Review/Comment IDs
**Steps:**
1. Manually trigger batch fetch with invalid IDs
2. Check console logs

**Expected Behavior:**
- Method returns empty collection
- Error logged with details
- UI shows default states

### 5. Concurrent Request Tests

#### Test 5.1: Multiple Screens Loading
**Steps:**
1. Rapidly navigate between HomeScreen, GenreScreen, and RankingScreen
2. Check console logs

**Expected Behavior:**
- All screens load successfully
- No race conditions
- Each screen gets correct interaction states
- Errors (if any) are logged but don't crash UI

### 6. Optimistic Update Error Tests

#### Test 6.1: Like Review - Network Fails
**Steps:**
1. Open NovelDetailScreen
2. Like a review
3. Simulate network failure during the API call

**Expected Behavior:**
- UI updates optimistically (like icon fills)
- Network request fails
- UI reverts to previous state
- User sees error toast message
- Console logs the error

#### Test 6.2: Vote Novel - Network Fails
**Steps:**
1. Open NovelDetailScreen
2. Vote for the novel
3. Simulate network failure

**Expected Behavior:**
- Vote count increments optimistically
- Network request fails
- Vote count reverts
- User sees error toast
- Console logs the error

### 7. Large Dataset Tests

#### Test 7.1: Many Reviews
**Steps:**
1. Open NovelDetailScreen with 50+ reviews
2. Check console logs for batch fetch

**Expected Behavior:**
- Single batch query fetches all reactions
- No N+1 query problem
- Performance remains good
- All reactions load correctly

#### Test 7.2: Many Novels
**Steps:**
1. Open HomeScreen with many novel sections
2. Check console logs

**Expected Behavior:**
- Batch queries used for all novels
- No individual queries per novel
- Performance remains good
- All states load correctly

## Error Log Verification

All error logs should follow this format:

```javascript
console.error('[ServiceName] Error description:', {
  error: errorObject,
  errorMessage: error?.message || 'Unknown error',
  errorCode: error?.code,
  userId: userId,
  additionalContext: value,
  timestamp: new Date().toISOString()
});
```

### Services with Enhanced Logging:
- ✅ ReviewService.getUserReactions()
- ✅ ReviewService.getUserReactionsForNovel()
- ✅ CommentService.getUserReactions()
- ✅ CommentService.getUserReactionsForChapter()
- ✅ NovelService.getUserVotes()
- ✅ NovelService.hasVoted()
- ✅ ReadingService.getLibraryNovels()
- ✅ ReadingService.isInLibrary()
- ✅ SocialService.getFollowingStatus()
- ✅ SocialService.isFollowing()

## Fallback Behavior Verification

### Empty Collection Returns:
All batch fetch methods must return empty collections on error:

| Method | Return Type | Error Return Value |
|--------|-------------|-------------------|
| getUserReactions | Map<string, 'like' \| 'dislike'> | new Map() |
| getUserVotes | Set<string> | new Set() |
| getLibraryNovels | Set<string> | new Set() |
| getFollowingStatus | Set<string> | new Set() |
| hasVoted | boolean | false |
| isInLibrary | boolean | false |
| isFollowing | boolean | false |

### UI Default States:
When batch fetch fails, UI should show:
- Review/Comment reactions: No icons filled (default state)
- Novel votes: Vote button not highlighted
- Library status: "Add to Library" button
- Follow status: "Follow" button

## Testing Checklist

- [ ] Test 1.1: Review reactions network error
- [ ] Test 1.2: Comment reactions network error
- [ ] Test 1.3: Novel votes network error
- [ ] Test 2.1: Review reactions unauthenticated
- [ ] Test 2.2: Novel lists unauthenticated
- [ ] Test 3.1: No reviews
- [ ] Test 3.2: No comments
- [ ] Test 4.1: Invalid user ID
- [ ] Test 4.2: Invalid IDs
- [ ] Test 5.1: Multiple screens loading
- [ ] Test 6.1: Like review network fails
- [ ] Test 6.2: Vote novel network fails
- [ ] Test 7.1: Many reviews
- [ ] Test 7.2: Many novels

## Success Criteria

✅ All batch fetch methods return empty collections on error (never null/undefined)
✅ All errors are logged with detailed context and timestamps
✅ UI never crashes when state fetching fails
✅ UI shows default states when data unavailable
✅ Unauthenticated users handled gracefully
✅ Empty data sets handled without errors
✅ Optimistic updates revert on error
✅ User-friendly error messages shown where appropriate

## Implementation Summary

### Enhanced Error Handling Features:

1. **Detailed Console Logging**
   - Service name prefix for easy filtering
   - Error object with message and code
   - Context data (userId, IDs count, etc.)
   - ISO timestamp for debugging

2. **Consistent Return Values**
   - Always return empty collections on error
   - Never return null or undefined
   - Type-safe return values

3. **Unauthenticated User Handling**
   - Early return with empty collections
   - No unnecessary database queries
   - Type safety with `| null | undefined` parameters

4. **UI Resilience**
   - Try-catch blocks in screen components
   - Fallback to empty states on error
   - Continue operation even if batch fetch fails
   - User can still interact with content

5. **Error Recovery**
   - Optimistic updates revert on failure
   - User notified with toast messages
   - Data reloaded from database after errors
   - No stale state issues
