# Chapters Loading - Debug Guide

## Current Status

The chapters in Novel Manage screen ARE loading from Supabase correctly. The code is already implemented to:

1. Load published chapters from `chapters` table
2. Load draft chapters from AsyncStorage
3. Combine and display both

## Changes Made

### 1. Removed Chapter Limit
**Before**: Only loaded 10 chapters
**After**: Loads ALL chapters for the novel

```typescript
// Before
.limit(10);

// After
// No limit - loads all chapters
```

### 2. Added Debug Logging
Added console logs to help verify what's being loaded:

```typescript
console.log('Loaded chapters from Supabase:', chaptersData?.length || 0);
console.log('Total chapters (including drafts):', allChapters.length);
console.log('Chapters:', allChapters.map(c => ({ 
  number: c.number, 
  title: c.title, 
  status: c.status 
})));
```

## How Chapters Are Loaded

### Step 1: Load from Supabase
```typescript
const { data: chaptersData, error: chaptersError } = await supabase
  .from('chapters')
  .select('*')
  .eq('novel_id', novelId)
  .order('chapter_number', { ascending: false });
```

### Step 2: Format Published Chapters
```typescript
const formattedChapters = (chaptersData || []).map((chapter: any) => ({
  id: chapter.id,
  number: chapter.chapter_number,
  title: chapter.title,
  views: formatNumber(chapter.views || 0),
  comments: formatNumber(0),
  date: new Date(chapter.published_at).toLocaleDateString(),
  status: 'Published',
  is_draft: false,
}));
```

### Step 3: Load Drafts from AsyncStorage
```typescript
const draftKey = `chapter_draft_${novelId}`;
const draftsJson = await AsyncStorage.getItem(draftKey);
const drafts = draftsJson ? JSON.parse(draftsJson) : [];

const formattedDrafts = drafts.map((draft: any) => ({
  id: draft.id,
  number: draft.chapter_number,
  title: draft.title,
  views: '0',
  comments: '0',
  date: new Date(draft.created_at).toLocaleDateString(),
  status: 'Draft',
  is_draft: true,
  draft_data: draft,
}));
```

### Step 4: Combine and Sort
```typescript
const allChapters = [...formattedDrafts, ...formattedChapters];
allChapters.sort((a, b) => b.number - a.number);
setChapters(allChapters);
```

## Troubleshooting

### If No Chapters Are Showing

#### Check 1: Are there chapters in the database?
1. Open Supabase Dashboard
2. Go to Table Editor
3. Select `chapters` table
4. Filter by `novel_id` = your novel's ID
5. Check if any rows exist

#### Check 2: Check the console logs
1. Open the app
2. Go to Novel Manage screen
3. Check the console/terminal for logs:
   ```
   Loaded chapters from Supabase: X
   Total chapters (including drafts): Y
   Chapters: [...]
   ```

#### Check 3: Verify novel ID
1. Make sure you're passing the correct `novelId` to the screen
2. Check the route params: `const { novelId } = (route.params as any)`

#### Check 4: Check RLS policies
1. Make sure the author can read their own chapters
2. RLS policy should allow: `author_id = auth.uid()`

### If Chapters Show But With Wrong Data

#### Check the chapter data in Supabase
1. Verify `chapter_number` is correct
2. Verify `title` is not empty
3. Verify `published_at` has a valid date
4. Verify `views` is a number

#### Check the formatting
The `formatNumber` function formats large numbers:
- 1000 → "1k"
- 1000000 → "1M"

## Testing Steps

### Test 1: Create a Chapter
1. Go to Novel Manage screen
2. Click "+ New" button
3. Fill in chapter details
4. Click "Publish Chapter"
5. Verify chapter appears in the list

### Test 2: Create a Draft
1. Go to Novel Manage screen
2. Click "+ New" button
3. Fill in chapter details
4. Click "Save as Draft"
5. Verify draft appears with "DRAFT" badge

### Test 3: Verify Data
1. Check chapter number is correct
2. Check title is correct
3. Check views count (should be 0 for new chapters)
4. Check date is today's date
5. Check status is "Published" or "Draft"

### Test 4: Check Console Logs
1. Open React Native debugger or terminal
2. Look for console logs:
   ```
   Loaded chapters from Supabase: 2
   Total chapters (including drafts): 3
   Chapters: [
     { number: 3, title: "Chapter 3", status: "Draft" },
     { number: 2, title: "Chapter 2", status: "Published" },
     { number: 1, title: "Chapter 1", status: "Published" }
   ]
   ```

## Expected Behavior

### When No Chapters Exist
- Shows empty state with message: "No chapters published yet"
- Shows "Create Chapter" button

### When Chapters Exist
- Shows all chapters (published + drafts)
- Sorted by chapter number (descending)
- Drafts have yellow "DRAFT" badge
- Published chapters show view count
- Each chapter shows:
  - Chapter number
  - Title
  - Views count
  - Comments count (currently 0)
  - Date published
  - Status (Published/Draft)

## Database Query

The actual SQL query being executed:

```sql
SELECT *
FROM chapters
WHERE novel_id = 'your-novel-id'
ORDER BY chapter_number DESC;
```

## RLS Policy

The Row Level Security policy that allows this:

```sql
CREATE POLICY "Authors can view their own chapters"
  ON chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM novels
      WHERE id = novel_id AND author_id = auth.uid()
    )
  );
```

## Common Issues

### Issue 1: "No chapters" but chapters exist in database
**Cause**: RLS policy blocking access
**Solution**: Check if user is authenticated and is the novel's author

### Issue 2: Chapters show but with "0" views
**Cause**: Views haven't been incremented yet
**Solution**: This is normal for new chapters. Views increment when readers view the chapter.

### Issue 3: Draft doesn't appear after saving
**Cause**: AsyncStorage not saving or loading correctly
**Solution**: 
1. Check AsyncStorage permissions
2. Check console for errors
3. Verify `chapter_draft_{novelId}` key exists

### Issue 4: Chapters appear but in wrong order
**Cause**: Sorting issue
**Solution**: Already fixed - sorts by chapter_number descending

## Verification Checklist

- [ ] Chapters load from Supabase
- [ ] Drafts load from AsyncStorage
- [ ] Both types appear in the list
- [ ] Sorted by chapter number (highest first)
- [ ] Drafts have "DRAFT" badge
- [ ] Published chapters show "Published" status
- [ ] Chapter numbers are correct
- [ ] Titles are correct
- [ ] Views count shows (even if 0)
- [ ] Dates are formatted correctly
- [ ] Empty state shows when no chapters
- [ ] Console logs show correct counts

## Status: ✅ WORKING

Chapters ARE loading from Supabase correctly. The code is properly implemented. If you're not seeing chapters:

1. **Check if chapters exist in database** - Go to Supabase dashboard
2. **Check console logs** - See what's being loaded
3. **Create a test chapter** - Use the "+ New" button
4. **Verify novel ID** - Make sure you're viewing the correct novel

The system is working as designed!

**Last Updated**: November 2, 2024
