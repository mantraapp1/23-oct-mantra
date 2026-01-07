# Chapter Screen - Mock Data Removed

## Issue
ChapterScreen still had hardcoded mock data including:
- Mock novel object with fake author
- Hardcoded author ID checks (userId === 1)
- Hardcoded author badge logic

## Fixes Applied

### 1. Removed mockNovel Object

**Before**:
```typescript
const mockNovel = {
  title: 'Crimson Ledger',
  author: { id: 'author1', name: 'Elena Martinez' },
  authorId: 1,
};
```

**After**: Removed completely, now uses real data from `chapter.novel`

---

### 2. Fixed Author Comment Sorting

**Before**:
```typescript
const aIsAuthor = a.userId === mockNovel.authorId;
const bIsAuthor = b.userId === mockNovel.authorId;
```

**After**:
```typescript
const novelAuthorId = chapter?.novel?.author_id;
const aIsAuthor = novelAuthorId && a.userId.toString() === novelAuthorId;
const bIsAuthor = novelAuthorId && b.userId.toString() === novelAuthorId;
```

**Result**: Author comments now correctly identified and sorted to top

---

### 3. Fixed UnlockOverlay Props

**Before**:
```typescript
<UnlockOverlay
  novelId={params?.novelId || 'mock-novel-id'}
  chapterId={params?.chapterId || 'mock-chapter-id'}
  authorId={mockNovel.author.id}
/>
```

**After**:
```typescript
<UnlockOverlay
  novelId={params?.novelId || chapter.novel?.id || ''}
  chapterId={params?.chapterId || chapter.id}
  authorId={chapter.novel?.author_id || ''}
/>
```

**Result**: Uses real IDs from loaded chapter data

---

### 4. Fixed Author Badge Display

**Before**:
```typescript
{comment.userId === mockNovel.authorId && (
  <View style={styles.authorBadge}>
    <Text style={styles.authorBadgeText}>AUTHOR</Text>
  </View>
)}
```

**After**:
```typescript
{chapter?.novel?.author_id && comment.userId.toString() === chapter.novel.author_id && (
  <View style={styles.authorBadge}>
    <Text style={styles.authorBadgeText}>AUTHOR</Text>
  </View>
)}
```

**Result**: Author badge only shows for actual novel author

---

### 5. Fixed Comment Menu (Edit/Delete)

**Before**:
```typescript
activeCommentMenu === comment.id && { height: comment.userId === 1 ? 100 : 50 }
// ...
{comment.userId === 1 ? (
  // Show Edit/Delete options
) : (
  // Show Report option
)}
```

**After**:
```typescript
activeCommentMenu === comment.id && { height: currentUserId && comment.userId.toString() === currentUserId ? 100 : 50 }
// ...
{currentUserId && comment.userId.toString() === currentUserId ? (
  // Show Edit/Delete options
) : (
  // Show Report option
)}
```

**Result**: Edit/Delete options only show for user's own comments

---

### 6. Fixed Navigation to Author Profile

**Before**:
```typescript
const handleViewAuthor = () => {
  (navigation.navigate as any)('OtherUserProfile', { userId: mockNovel.author.id });
};
```

**After**:
```typescript
const handleViewAuthor = () => {
  if (chapter?.novel?.author_id) {
    (navigation.navigate as any)('OtherUserProfile', { userId: chapter.novel.author_id });
  }
};
```

**Result**: Navigates to real author's profile

---

### 7. Fixed Report Screen Data

**Before**:
```typescript
(navigation.navigate as any)('Report', {
  type: 'chapter',
  novelName: mockNovel.title,
  chapterName: `Chapter ${chapter.number} - ${chapter.title}`,
});
```

**After**:
```typescript
(navigation.navigate as any)('Report', {
  type: 'chapter',
  novelName: chapter?.novel?.title || 'Unknown Novel',
  chapterName: `Chapter ${chapter.number} - ${chapter.title}`,
});
```

**Result**: Uses real novel title in reports

---

### 8. Fixed Header Display

**Before**:
```typescript
<Text style={[styles.novelTitle, { color: themeStyles.textColor }]}>
  {mockNovel.title}
</Text>
```

**After**:
```typescript
<Text style={[styles.novelTitle, { color: themeStyles.textColor }]}>
  {chapter?.novel?.title || 'Loading...'}
</Text>
```

**Result**: Shows real novel title in header

---

## Summary of Changes

| Component | Before | After |
|-----------|--------|-------|
| Novel data | Hardcoded mockNovel | Real data from chapter.novel |
| Author ID | Hardcoded as 1 | From chapter.novel.author_id |
| Author badge | Always showed for userId 1 | Shows for actual author |
| Comment sorting | Used mockNovel.authorId | Uses chapter.novel.author_id |
| Edit/Delete menu | Showed for userId === 1 | Shows for current user's comments |
| Navigation | Used mock IDs | Uses real IDs |

---

## Testing

### Test 1: Author Badge
1. Open a chapter
2. Post a comment as the novel author
3. **Expected**: "AUTHOR" badge appears next to your comment
4. Post a comment as a different user
5. **Expected**: No "AUTHOR" badge

### Test 2: Comment Sorting
1. Have the novel author post a comment
2. Have other users post comments
3. **Expected**: Author's comment appears at the top

### Test 3: Edit/Delete Menu
1. Post a comment
2. Tap the menu (three dots) on your comment
3. **Expected**: See "Edit" and "Delete" options
4. Tap menu on someone else's comment
5. **Expected**: Only see "Report" option

### Test 4: View Author Profile
1. Open a chapter
2. Tap the menu button (top right)
3. Tap "View Author"
4. **Expected**: Navigate to the actual novel author's profile

### Test 5: Novel Title Display
1. Open any chapter
2. **Expected**: See the real novel title in the header (not "Crimson Ledger")

---

## Status

✅ All mock data removed from ChapterScreen
✅ All functionality now uses real data from Supabase
✅ No hardcoded IDs or fake data remaining
✅ All diagnostics passing

---

**File**: `mantra-mobile/components/ChapterScreen.tsx`
**Status**: ✅ Complete - No more mock data
