# Performance Testing Guide

## Overview

This guide provides step-by-step instructions for manually testing the performance optimizations implemented for user interaction state synchronization.

## Prerequisites

1. Supabase project with data populated
2. React Native app running on device/emulator
3. Chrome DevTools or React Native Debugger
4. Access to Supabase SQL Editor

## Test 1: Verify Batch Queries Use IN Clauses

### Objective
Confirm that batch operations use single queries with IN clauses instead of multiple individual queries.

### Steps

1. **Enable Supabase Query Logging**
   - Go to Supabase Dashboard → Database → Query Performance
   - Enable query logging

2. **Test Review Reactions Batch Query**
   ```typescript
   // In NovelDetailScreen, after loading reviews
   console.log('Fetching reactions for', reviews.length, 'reviews');
   const startTime = Date.now();
   const reactions = await reviewService.getUserReactions(userId, reviewIds);
   const endTime = Date.now();
   console.log('Fetched reactions in', endTime - startTime, 'ms');
   ```

3. **Check Supabase Logs**
   - Look for query: `SELECT review_id, reaction_type FROM review_reactions WHERE user_id = ? AND review_id IN (?)`
   - Verify only ONE query was executed (not multiple)

4. **Repeat for Other Services**
   - Comment reactions: `commentService.getUserReactions()`
   - Novel votes: `novelService.getUserVotes()`
   - Library status: `readingService.getLibraryNovels()`
   - Follow status: `socialService.getFollowingStatus()`

### Expected Results
- ✅ Single query per batch operation
- ✅ Query uses IN clause with array of IDs
- ✅ No multiple individual queries

### Failure Indicators
- ❌ Multiple queries for same operation
- ❌ Queries without IN clause
- ❌ N+1 query pattern (one query per item)

## Test 2: Performance with Various Data Sizes

### Objective
Measure query performance with 10, 50, and 100 items.

### Test Setup

Add performance logging to services:

```typescript
// In reviewService.getUserReactions()
console.log('[Performance] Fetching reactions for', reviewIds.length, 'reviews');
const startTime = performance.now();
// ... existing code ...
const endTime = performance.now();
console.log('[Performance] Fetched in', (endTime - startTime).toFixed(2), 'ms');
```

### Test Cases

#### Test 2.1: Small Dataset (10 items)
1. Navigate to a novel with 10 reviews
2. Record query time from console
3. Expected: < 100ms

#### Test 2.2: Medium Dataset (50 items)
1. Navigate to a novel with 50 reviews
2. Record query time from console
3. Expected: < 200ms

#### Test 2.3: Large Dataset (100 items)
1. Navigate to a novel with 100 reviews
2. Record query time from console
3. Expected: < 300ms

### Performance Benchmarks

| Data Size | Target Time | Acceptable Range | Status |
|-----------|-------------|------------------|--------|
| 10 items  | < 100ms     | 50-150ms        | ✅ |
| 50 items  | < 200ms     | 100-250ms       | ✅ |
| 100 items | < 300ms     | 200-400ms       | ✅ |

### Recording Results

Create a table like this:

| Screen | Operation | Items | Query Time | Status |
|--------|-----------|-------|------------|--------|
| NovelDetail | Review Reactions | 10 | ___ ms | ✅/❌ |
| NovelDetail | Review Reactions | 50 | ___ ms | ✅/❌ |
| NovelDetail | Review Reactions | 100 | ___ ms | ✅/❌ |
| Chapter | Comment Reactions | 10 | ___ ms | ✅/❌ |
| Chapter | Comment Reactions | 50 | ___ ms | ✅/❌ |
| Home | Novel Votes | 20 | ___ ms | ✅/❌ |
| Home | Library Status | 20 | ___ ms | ✅/❌ |
| Genre | Novel Votes | 50 | ___ ms | ✅/❌ |
| Genre | Library Status | 50 | ___ ms | ✅/❌ |

## Test 3: N+1 Query Problem Detection

### Objective
Verify no N+1 query problems exist.

### Method 1: Query Count Verification

1. **Enable Query Counting**
   ```typescript
   let queryCount = 0;
   const originalFrom = supabase.from;
   supabase.from = function(...args) {
     queryCount++;
     console.log('[Query Count]', queryCount);
     return originalFrom.apply(this, args);
   };
   ```

2. **Load Screen with Multiple Items**
   - Load NovelDetailScreen with 10 reviews
   - Check query count in console

3. **Expected Results**
   - Loading 10 reviews: 1 query for reactions (not 10)
   - Loading 20 novels: 2 queries total (votes + library, not 40)

### Method 2: Supabase Dashboard Analysis

1. Go to Supabase Dashboard → Database → Query Performance
2. Load a screen with multiple items
3. Check "Recent Queries" section
4. Count queries for the same table

### N+1 Problem Indicators

❌ **BAD** - N+1 Problem Exists:
```
Query 1: SELECT * FROM review_reactions WHERE user_id = ? AND review_id = 'review-1'
Query 2: SELECT * FROM review_reactions WHERE user_id = ? AND review_id = 'review-2'
Query 3: SELECT * FROM review_reactions WHERE user_id = ? AND review_id = 'review-3'
... (10 queries for 10 items)
```

✅ **GOOD** - No N+1 Problem:
```
Query 1: SELECT * FROM review_reactions WHERE user_id = ? AND review_id IN ('review-1', 'review-2', 'review-3', ...)
(1 query for 10 items)
```

## Test 4: Database Index Verification

### Objective
Verify required indexes exist for optimal performance.

### Steps

1. **Run Index Verification Script**
   - Open Supabase SQL Editor
   - Run: `supabase-backend/VERIFY_AND_CREATE_INDEXES.sql` (Part 1)
   - Review output

2. **Check for Required Indexes**

Expected indexes:

**review_reactions:**
- `idx_review_reactions_user_review` (user_id, review_id)
- `idx_review_reactions_review_id` (review_id)
- `idx_review_reactions_user_id` (user_id)

**comment_reactions:**
- `idx_comment_reactions_user_comment` (user_id, comment_id)
- `idx_comment_reactions_comment_id` (comment_id)
- `idx_comment_reactions_user_id` (user_id)

**novel_votes:**
- `idx_novel_votes_user_novel` (user_id, novel_id)
- `idx_novel_votes_novel_id` (novel_id)
- `idx_novel_votes_user_id` (user_id)

**library:**
- `idx_library_user_novel` (user_id, novel_id)
- `idx_library_novel_id` (novel_id)
- `idx_library_user_id` (user_id)

**follows:**
- `idx_follows_follower_following` (follower_id, following_id)
- `idx_follows_following_id` (following_id)
- `idx_follows_follower_id` (follower_id)

3. **Create Missing Indexes**
   - If any indexes are missing, run Part 2 of the SQL script
   - Verify creation with Part 3

4. **Test Query Performance**
   - Run Part 5 (EXPLAIN ANALYZE queries)
   - Look for "Index Scan" in output (good)
   - Avoid "Seq Scan" (bad - means no index used)

### Index Performance Indicators

✅ **GOOD** - Index Being Used:
```
Index Scan using idx_review_reactions_user_review on review_reactions
  Index Cond: ((user_id = '...') AND (review_id = ANY (...)))
  Rows: 10
  Time: 0.123 ms
```

❌ **BAD** - No Index (Sequential Scan):
```
Seq Scan on review_reactions
  Filter: ((user_id = '...') AND (review_id = ANY (...)))
  Rows Removed by Filter: 10000
  Time: 45.678 ms
```

## Test 5: Slow Network Conditions

### Objective
Test performance under slow network conditions.

### Setup

1. **Enable Network Throttling**
   - Chrome DevTools → Network tab → Throttling dropdown
   - Select "Slow 3G" or "Fast 3G"

2. **Or use React Native Debugger**
   - Network → Enable throttling
   - Set to 3G or slower

### Test Cases

#### Test 5.1: 3G Network (Slow)
1. Enable "Slow 3G" throttling
2. Navigate to NovelDetailScreen with 10 reviews
3. Observe loading behavior
4. Record time to display interaction states

**Expected:**
- Loading indicator shows
- Query completes in 500ms - 2s
- UI doesn't freeze
- Error handling works if timeout

#### Test 5.2: 2G Network (Very Slow)
1. Enable "2G" throttling (if available)
2. Navigate to HomeScreen with 20 novels
3. Observe loading behavior

**Expected:**
- Loading indicator shows
- Query completes in 2s - 5s
- UI remains responsive
- Timeout after reasonable period (60s)

#### Test 5.3: Offline Mode
1. Disable network completely
2. Navigate to any screen
3. Observe behavior

**Expected:**
- Returns empty collections immediately
- No infinite loading
- UI shows default states
- Error message displayed (optional)

### Network Performance Benchmarks

| Network | Operation | Items | Expected Time | Acceptable Range |
|---------|-----------|-------|---------------|------------------|
| Fast 4G | Batch Query | 10 | 50-100ms | 50-200ms |
| 3G | Batch Query | 10 | 500ms-1s | 500ms-2s |
| Slow 3G | Batch Query | 10 | 1s-2s | 1s-3s |
| 2G | Batch Query | 10 | 2s-5s | 2s-10s |
| Offline | Any | Any | <100ms | Immediate |

## Test 6: Error Handling Performance

### Objective
Verify error handling doesn't impact performance.

### Test Cases

#### Test 6.1: Null User ID
```typescript
const reactions = await reviewService.getUserReactions(null, reviewIds);
// Should return empty Map immediately without database query
```

**Expected:**
- Returns empty Map
- No database query made
- Time: < 1ms

#### Test 6.2: Empty Array
```typescript
const reactions = await reviewService.getUserReactions(userId, []);
// Should return empty Map immediately without database query
```

**Expected:**
- Returns empty Map
- No database query made
- Time: < 1ms

#### Test 6.3: Database Error
1. Temporarily break database connection
2. Try to fetch reactions
3. Observe behavior

**Expected:**
- Returns empty Map
- Error logged to console
- UI shows default states
- No crash
- Time: < 100ms (after error)

#### Test 6.4: Network Timeout
1. Set very slow network (or simulate timeout)
2. Try to fetch reactions
3. Wait for timeout

**Expected:**
- Returns empty Map after timeout
- Error logged
- UI shows default states
- No infinite waiting
- Time: ~60s (Supabase default timeout)

## Test 7: Cross-Screen Consistency

### Objective
Verify interaction states remain consistent across navigation.

### Test Cases

#### Test 7.1: Like Review → Navigate Away → Return
1. Like a review on NovelDetailScreen
2. Navigate to HomeScreen
3. Navigate back to NovelDetailScreen
4. Verify like state persists

**Expected:**
- Like icon remains filled
- State fetched from database
- Consistent across navigation

#### Test 7.2: Vote Novel → Navigate to Detail
1. Vote for a novel on HomeScreen
2. Navigate to NovelDetailScreen for that novel
3. Verify vote state is consistent

**Expected:**
- Vote button shows voted state
- State matches across screens

#### Test 7.3: Add to Library → Check Multiple Screens
1. Add novel to library on GenreScreen
2. Navigate to HomeScreen
3. Navigate to NovelDetailScreen
4. Verify library state consistent everywhere

**Expected:**
- Library button shows "In Library" on all screens
- State consistent across navigation

## Performance Testing Checklist

### Batch Query Verification
- [ ] Review reactions use IN clause
- [ ] Comment reactions use IN clause
- [ ] Novel votes use IN clause
- [ ] Library status use IN clause
- [ ] Follow status use IN clause

### Data Size Testing
- [ ] 10 items: < 100ms
- [ ] 50 items: < 200ms
- [ ] 100 items: < 300ms

### N+1 Query Prevention
- [ ] No multiple queries for same operation
- [ ] Query count matches expected (1 per batch)
- [ ] Supabase logs show single queries

### Database Indexes
- [ ] All required indexes exist
- [ ] EXPLAIN ANALYZE shows index usage
- [ ] No sequential scans on large tables

### Slow Network Testing
- [ ] 3G network: acceptable performance
- [ ] 2G network: acceptable performance
- [ ] Offline: graceful handling

### Error Handling
- [ ] Null user ID: immediate return
- [ ] Empty array: immediate return
- [ ] Database error: graceful degradation
- [ ] Network timeout: no hang

### Cross-Screen Consistency
- [ ] States persist across navigation
- [ ] States reload from database
- [ ] No stale states

## Reporting Results

### Performance Test Report Template

```markdown
## Performance Test Results

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Device/Emulator, OS, Network]

### Batch Query Verification
- Review Reactions: ✅/❌ [Notes]
- Comment Reactions: ✅/❌ [Notes]
- Novel Votes: ✅/❌ [Notes]
- Library Status: ✅/❌ [Notes]
- Follow Status: ✅/❌ [Notes]

### Performance Benchmarks
| Operation | Items | Time | Status |
|-----------|-------|------|--------|
| Review Reactions | 10 | ___ ms | ✅/❌ |
| Review Reactions | 50 | ___ ms | ✅/❌ |
| Review Reactions | 100 | ___ ms | ✅/❌ |

### N+1 Query Check
- Query count for 10 items: ___ (expected: 1)
- Query count for 50 items: ___ (expected: 1)
- N+1 problem detected: Yes/No

### Database Indexes
- All indexes exist: Yes/No
- Indexes being used: Yes/No
- Missing indexes: [List]

### Slow Network Testing
- 3G performance: ✅/❌ [Time: ___ ms]
- 2G performance: ✅/❌ [Time: ___ ms]
- Offline handling: ✅/❌

### Error Handling
- Null user ID: ✅/❌
- Empty array: ✅/❌
- Database error: ✅/❌
- Network timeout: ✅/❌

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]
```

## Troubleshooting

### Issue: Queries are slow (> 500ms)
**Possible Causes:**
- Missing database indexes
- Large dataset without pagination
- Slow network connection
- Database performance issues

**Solutions:**
1. Run index verification script
2. Check Supabase dashboard for slow queries
3. Test with network throttling disabled
4. Contact Supabase support if persistent

### Issue: Multiple queries instead of batch
**Possible Causes:**
- Service method not using batch operation
- Calling single query method in loop

**Solutions:**
1. Verify using `getUserReactions()` not `getUserReaction()`
2. Check code doesn't have loop calling single methods
3. Review service implementation

### Issue: N+1 query problem detected
**Possible Causes:**
- Not using batch methods
- Calling queries in map/forEach loop

**Solutions:**
1. Replace loops with batch operations
2. Collect IDs first, then batch fetch
3. Review implementation against design document

## Conclusion

Complete all tests in this guide and document results. If all tests pass, the performance optimization is successful. If issues are found, refer to troubleshooting section or consult the development team.
