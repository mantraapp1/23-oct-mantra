# Schema Compliance Fixes Needed

This document lists all the schema compliance issues found across services and screens.

## Critical Issues Found

### 1. Services with Incorrect Column Names

#### novelService.ts
- ❌ Uses `banner_image_url` in CreateNovelData and UpdateNovelData interfaces
- ✅ Should use only `cover_image_url` (banner doesn't exist in schema)

#### chapterService.ts
- ❌ Has `likeChapter()` and `dislikeChapter()` methods
- ❌ References `chapter.likes` and `chapter.dislikes` in getChapterStats()
- ✅ Chapters do NOT have likes/dislikes in the schema
- ✅ Only comments and reviews have likes/dislikes

#### reviewService.ts
- ❌ Uses table name `review_votes`
- ✅ Should use `review_reactions` (correct table name)
- ❌ Uses column `vote_type`
- ✅ Should use `reaction_type`

#### commentService.ts
- ❌ Uses table name `comment_votes`
- ✅ Should use `comment_reactions` (correct table name)
- ❌ Uses column `vote_type`
- ✅ Should use `reaction_type`

### 2. Screens with Incorrect Column Names

#### AuthorDashboardScreen.tsx
- ❌ `novel.view_count` → ✅ `novel.total_views`
- ❌ `novel.chapter_count` → ✅ `novel.total_chapters`

#### NovelDetailScreen.tsx
- ❌ `novelData.banner_image_url` → ✅ Use `cover_image_url` only
- ❌ `novelData.chapter_count` → ✅ `novelData.total_chapters`
- ❌ `chapter.view_count` → ✅ `chapter.views`
- ❌ `chapter.unlock_hours` → ✅ `chapter.wait_hours`
- ❌ `review.comment` → ✅ `review.review_text`
- ❌ `review.likes_count` → ✅ `review.likes`
- ❌ `review.dislikes_count` → ✅ `review.dislikes`

#### NovelManageScreen.tsx
- ❌ `novelData.banner_image_url` → ✅ Use `cover_image_url` only
- ❌ `novelData.chapter_count` → ✅ `novelData.total_chapters`
- ❌ `chapter.view_count` → ✅ `chapter.views`
- ❌ `chapter.comment_count` → ✅ Calculate from comments table
- ❌ `review.comment` → ✅ `review.review_text`
- ❌ `review.likes_count` → ✅ `review.likes`
- ❌ `review.dislikes_count` → ✅ `review.dislikes`

#### SearchResultScreen.tsx
- ❌ `novel.view_count` → ✅ `novel.total_views`
- ❌ `novel.vote_count` → ✅ `novel.total_votes`
- ❌ `author.avatar_url` → ✅ `author.profile_picture_url`
- ❌ `author.full_name` → ✅ `author.display_name`
- ❌ `author.novel_count` → ✅ Calculate from novels table
- ❌ `author.follower_count` → ✅ Calculate from follows table

#### SeeAllScreen.tsx
- ❌ `novel.view_count` → ✅ `novel.total_views`

#### LibraryScreen.tsx
- ❌ `novel.view_count` → ✅ `novel.total_views`

#### HomeScreen.tsx
- ❌ `novel.chapter_count` → ✅ `novel.total_chapters`
- ❌ `novel.view_count` → ✅ `novel.total_views`

#### FollowListScreen.tsx
- ❌ `follower.avatar_url` → ✅ `follower.profile_picture_url`
- ❌ `follower.full_name` → ✅ `follower.display_name`

#### OtherUserProfileScreen.tsx
- ❌ `profile.avatar_url` → ✅ `profile.profile_picture_url`
- ❌ `profile.full_name` → ✅ `profile.display_name`

### 3. Type Files with Issues

#### types/supabase.ts (DEPRECATED)
- ❌ Contains `banner_image_url` in Novel interface
- ❌ Contains `likes` and `dislikes` in Chapter interface
- ❌ Uses `ReviewVote` instead of `ReviewReaction`
- ❌ Uses `CommentVote` instead of `CommentReaction`
- ❌ Uses `vote_type` instead of `reaction_type`
- ✅ Should not be used - use types/database.ts instead

## Fix Priority

### High Priority (Breaking Issues)
1. Fix service table names (review_reactions, comment_reactions)
2. Remove chapter likes/dislikes functionality
3. Fix novel service banner_image_url references

### Medium Priority (Data Display Issues)
1. Fix all screen column name references
2. Update queries to use correct column names

### Low Priority (Cleanup)
1. Deprecate or remove types/supabase.ts
2. Update all imports to use types/database.ts

## Recommended Fix Order

1. **Task 2**: Update novelService.ts (remove banner_image_url)
2. **Task 3**: Update chapterService.ts (remove likes/dislikes)
3. **Task 4**: Update reviewService.ts (fix table/column names)
4. **Task 5**: Update commentService.ts (fix table/column names)
5. **Task 6**: Update all screens with incorrect column names
6. **Task 7**: Verify all queries return correct data

## Testing Checklist

After fixes:
- [ ] Novel creation works without banner_image_url
- [ ] Chapter views increment correctly
- [ ] Review reactions (like/dislike) work
- [ ] Comment reactions (like/dislike) work
- [ ] All screens display correct data
- [ ] No TypeScript errors
- [ ] No runtime errors from missing columns
