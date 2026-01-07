# Novel Manage Screen - Comment Counts Fixed

## Issue
NovelManageScreen (Chapter Manage Screen) was showing hardcoded "0" for all comment counts instead of loading real data from the database.

## Fix Applied

### Before:
```typescript
const formattedChapters = (chaptersData || []).map((chapter: any) => ({
  id: chapter.id,
  number: chapter.chapter_number,
  title: chapter.title,
  views: formatNumber(chapter.views || 0),
  comments: formatNumber(0), // TODO: Get actual comment count from comments table
  date: new Date(chapter.published_at).toLocaleDateString(),
  status: 'Published',
  is_draft: false,
}));
```

### After:
```typescript
// Load comment counts for all chapters
const formattedChapters = await Promise.all((chaptersData || []).map(async (chapter: any) => {
  // Get comment count for this chapter
  const { count: commentCount } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', chapter.id);

  return {
    id: chapter.id,
    number: chapter.chapter_number,
    title: chapter.title,
    views: formatNumber(chapter.views || 0),
    comments: formatNumber(commentCount || 0), // Now loads real count!
    date: new Date(chapter.published_at).toLocaleDateString(),
    status: 'Published',
    is_draft: false,
  };
}));
```

## What Changed

1. **Changed from `.map()` to `Promise.all()` with async map** - Allows loading comment counts asynchronously
2. **Added Supabase query** - Fetches actual comment count for each chapter
3. **Removed hardcoded `0`** - Now uses real `commentCount` from database

## Result

- Each chapter now shows its actual comment count
- Comment counts update in real-time from the database
- No more hardcoded "0 comments" for all chapters

## Testing

### Test 1: View Comment Counts
1. Go to Author Dashboard
2. Select a novel
3. Go to "Chapters" tab
4. **Expected**: Each chapter shows its real comment count (not all zeros)

### Test 2: Verify with Database
1. Check a chapter's comment count in the app
2. Run this SQL query:
```sql
SELECT 
  c.id,
  c.chapter_number,
  c.title,
  COUNT(com.id) as comment_count
FROM chapters c
LEFT JOIN comments com ON c.id = com.chapter_id
WHERE c.novel_id = '<your-novel-id>'
GROUP BY c.id, c.chapter_number, c.title
ORDER BY c.chapter_number;
```
3. **Expected**: Counts match between app and database

### Test 3: Add a Comment
1. Open a chapter
2. Post a comment
3. Go back to Novel Manage screen
4. **Expected**: Comment count for that chapter increased by 1

## Known Limitations

### Analytics Data Still Hardcoded

The analytics section (graphs, comment rate, etc.) still uses hardcoded placeholder data:
- View trends
- Comment rate percentage
- Completion rate
- Demographics

**Why**: These require complex analytics calculations and historical data tracking. They should be implemented separately with proper analytics infrastructure.

**Current Status**: Shows placeholder data with a note that it's for demonstration purposes.

## Files Changed

- `mantra-mobile/components/screens/author/NovelManageScreen.tsx`
  - Fixed chapter comment counts to load from database
  - Changed from synchronous map to async Promise.all

## Summary

| Item | Before | After |
|------|--------|-------|
| Chapter comment counts | Hardcoded 0 | Real data from database |
| Loading method | Synchronous map | Async Promise.all |
| Data source | None | Supabase comments table |
| Analytics data | Hardcoded | Still hardcoded (future work) |

---

**Status**: ✅ Chapter comment counts fixed
**Priority**: Analytics data can be fixed in a future update
