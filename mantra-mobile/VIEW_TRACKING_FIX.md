# View Tracking Fix

## Issue
Views were not incrementing when users opened novels or chapters.

## Root Causes

1. **ChapterService** was using manual UPDATE instead of RPC function
2. **NovelDetailScreen** was not calling incrementViews at all
3. **Database RPC functions** were not created yet

## Fixes Applied

### Fix 1: Updated ChapterService to use RPC

**File**: `mantra-mobile/services/chapterService.ts`

**Before**:
```typescript
async incrementViews(chapterId: string): Promise<void> {
  const chapter = await this.getChapter(chapterId);
  if (!chapter) return;

  const { error } = await supabase
    .from('chapters')
    .update({ views: chapter.views + 1 })
    .eq('id', chapterId);
}
```

**After**:
```typescript
async incrementViews(chapterId: string): Promise<void> {
  // Use RPC function (also updates novel views via trigger)
  const { error } = await supabase.rpc('increment_chapter_views', { 
    chapter_id_param: chapterId 
  });

  if (error) {
    // Fallback to manual update if RPC doesn't exist yet
    const chapter = await this.getChapter(chapterId);
    if (!chapter) return;

    const { error: updateError } = await supabase
      .from('chapters')
      .update({ views: chapter.views + 1 })
      .eq('id', chapterId);
  }
}
```

**Benefits**:
- Uses database RPC function for atomic updates
- Automatically updates novel views via database trigger
- Has fallback for backward compatibility

---

### Fix 2: Added View Tracking to NovelDetailScreen

**File**: `mantra-mobile/components/screens/NovelDetailScreen.tsx`

**Added**:
```typescript
const loadNovelData = async () => {
  try {
    // ... load all novel data ...
    
    // NEW: Increment novel views
    if (novelId) {
      await novelService.incrementViews(novelId);
    }
    
  } catch (error) {
    // ... error handling ...
  }
};
```

**Result**: Novel views now increment when user opens a novel detail page

---

### Fix 3: Database RPC Functions

**File**: `supabase-backend/FIX_VOTES_AND_VIEWS.sql`

**Created**:
1. `increment_chapter_views(chapter_id_param UUID)` - Increments both chapter and novel views
2. `increment_novel_views(novel_id_param UUID)` - Increments novel views only

**You must run this SQL file in Supabase for views to work!**

---

## Testing

### Test Chapter Views

1. Open any chapter
2. Note the view count
3. Close and reopen the chapter
4. **Expected**: View count increases by 1

**Verify in Database**:
```sql
SELECT id, chapter_number, title, views 
FROM chapters 
WHERE novel_id = '<your-novel-id>'
ORDER BY chapter_number;
```

### Test Novel Views

1. Open any novel detail screen
2. Note the view count
3. Close and reopen the novel
4. **Expected**: View count increases by 1

**Verify in Database**:
```sql
SELECT id, title, total_views 
FROM novels 
WHERE id = '<your-novel-id>';
```

---

## Important Notes

### 1. SQL File Must Be Run First

Before testing, you **MUST** run the SQL file:
- File: `supabase-backend/FIX_VOTES_AND_VIEWS.sql`
- Location: Supabase Dashboard → SQL Editor
- This creates the RPC functions that the app calls

### 2. Fallback Mechanism

The code includes a fallback:
- If RPC function doesn't exist → uses manual UPDATE
- This prevents the app from breaking if SQL isn't run yet
- But you should still run the SQL for proper functionality

### 3. Novel Views Update Twice

When you open a chapter:
1. Chapter views increment (+1)
2. Novel views increment (+1) via database trigger

This is correct behavior - opening a chapter counts as viewing the novel too.

---

## Summary

| Component | Status | Action Required |
|-----------|--------|-----------------|
| ChapterService | ✅ Fixed | None |
| NovelDetailScreen | ✅ Fixed | None |
| ChapterScreen | ✅ Already working | None |
| Database RPC | ⏳ Pending | Run SQL file |

---

## Next Steps

1. ✅ Code changes applied
2. ⏳ **Run `FIX_VOTES_AND_VIEWS.sql` in Supabase** (REQUIRED)
3. ⏳ Test chapter views
4. ⏳ Test novel views
5. ⏳ Verify in database

---

**Status**: ✅ Code fixed, SQL file ready to run

**Priority**: 🔴 HIGH - Run SQL file to enable view tracking
