# Navigation Flow Fix - Novel Creation

## Issue
After creating a novel, the navigation flow was incorrect:

**Before Fix:**
```
AuthorDashboard → CreateNovel → NovelManage
                      ↑              |
                      |    (back)    |
                      ←──────────────┘
```

When pressing back from NovelManageScreen, it would go back to CreateNovel screen (with empty form), instead of going to AuthorDashboard.

## Root Cause
The CreateNovelScreen was using `navigation.navigate()` which adds the new screen to the navigation stack:

```typescript
// OLD CODE (WRONG)
navigation.navigate('NovelManage', { novelId: novelData.id });
```

This created a stack like:
```
[AuthorDashboard] → [CreateNovel] → [NovelManage]
```

So pressing back from NovelManage would go to CreateNovel.

## Solution
Use `navigation.reset()` to reset the navigation stack, placing AuthorDashboard at the bottom and NovelManage on top:

```typescript
// NEW CODE (CORRECT)
navigation.reset({
  index: 1,
  routes: [
    { name: 'AuthorDashboard' },
    { name: 'NovelManage', params: { novelId: novelData.id } }
  ],
});
```

This creates a stack like:
```
[AuthorDashboard] → [NovelManage]
```

Now pressing back from NovelManage correctly goes to AuthorDashboard!

## After Fix
**Correct Flow:**
```
AuthorDashboard → CreateNovel → (reset) → NovelManage
      ↑                                         |
      |              (back)                     |
      ←─────────────────────────────────────────┘
```

## Benefits
1. ✅ Back button from NovelManage goes to AuthorDashboard
2. ✅ CreateNovel screen is removed from stack (no empty form)
3. ✅ Cleaner navigation experience
4. ✅ Matches expected user flow

## Testing
1. Go to AuthorDashboard
2. Click "Create Novel"
3. Fill in novel details
4. Click "Create Novel"
5. ✅ Should navigate to NovelManage screen
6. Press back button
7. ✅ Should go to AuthorDashboard (not CreateNovel)

## Files Changed
- ✅ `mantra-mobile/components/screens/author/CreateNovelScreen.tsx`

## Status
**FIXED** - Navigation flow now works correctly!
