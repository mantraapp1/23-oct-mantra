# Schema Compliance Analysis Report

## Executive Summary

This document analyzes all screens in the Mantra mobile app against the Supabase database schema defined in `supabase-complete-setup.sql`. It identifies mismatches, missing implementations, and provides recommendations for fixes.

**Analysis Date:** November 1, 2024  
**Schema Version:** 1.0.0  
**Total Screens Analyzed:** 30+

---

## Critical Issues Found

### 1. **NovelDetailScreen.tsx** ❌

**Issues:**
- Uses incorrect column names from old schema
- Missing proper table relationships
- Not using the correct Supabase query structure

**Current Code Problems:**
```typescript
// ❌ WRONG - These columns don't exist in the schema
const { data: novelData } = await supabase
  .from('novels')
  .select(`
    *,
    profiles:author_id (username, display_name, profile_picture_url)
  `)
```

**Schema Reality:**
```sql
-- ✅ CORRECT - Actual schema structure
CREATE TABLE novels (
  id UUID PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,  -- NOT banner_image_url
  genres TEXT[],
  tags TEXT[],
  language TEXT DEFAULT 'en',
  is_mature BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'ongoing',
  total_chapters INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_editors_pick BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

**Problems:**
1. ❌ Trying to access `banner_image_url` - **DOES NOT EXIST** (only `cover_image_url`)
2. ❌ Using `chapter_count` - **WRONG** (should be `total_chapters`)
3. ❌ Using `view_count` - **WRONG** (should be `total_views`)
4. ❌ Reviews query uses `comment` field - **WRONG** (should be `review_text`)
5. ❌ Reviews query uses `likes_count`, `dislikes_count` - **WRONG** (should be `likes`, `dislikes`)

**Required Fixes:**
```typescript
// ✅ CORRECT Implementation
const { data: novelData, error: novelError } = await supabase
  .from('novels')
  .select(`
    *,
    profiles!novels_author_id_fkey (
      username,
      display_name,
      profile_picture_url
    )
  `)
  .eq('id', novelId)
  .single();

// Transform data correctly
const transformedNovel = {
  id: novelData.id,
  title: novelData.title,
  author: novelData.profiles?.display_name || novelData.profiles?.username,
  cover: novelData.cover_image_url || 'default-cover.jpg',
  banner: novelData.cover_image_url, // Use same as cover (no separate banner)
  rating: novelData.average_rating || 0,
  views: formatNumber(novelData.total_views || 0), // NOT view_count
  votes: formatNumber(novelData.total_votes || 0),
  chapters: novelData.total_chapters || 0, // NOT chapter_count
  genres: novelData.genres || [],
  description: novelData.description || '',
  tags: novelData.tags || [],
  status: novelData.status,
  isMature: novelData.is_mature,
};

// ✅ CORRECT Reviews Query
const { data: reviewsData } = await supabase
  .from('reviews')
  .select(`
    *,
    profiles!reviews_user_id_fkey (
      username,
      display_name,
      profile_picture_url
    )
  `)
  .eq('novel_id', novelId)
  .order('created_at', { ascending: false });

const transformedReviews = reviewsData.map(review => ({
  id: review.id,
  userName: review.profiles?.display_name || review.profiles?.username,
  userAvatar: review.profiles?.profile_picture_url,
  rating: review.rating,
  text: review.review_text, // NOT comment
  timeAgo: formatTimeAgo(review.created_at),
  likes: review.likes, // NOT likes_count
  dislikes: review.dislikes, // NOT dislikes_count
}));
```

---

### 2. **LibraryScreen.tsx** ⚠️

**Issues:**
- Uses correct service layer (good!)
- But service might be using wrong column names

**Current Code:**
```typescript
// Service is being used correctly
const libraryData = await readingService.getLibrary(currentUserId);
```

**Need to Verify:**
- Check `readingService.ts` to ensure it uses correct schema
- Verify `library` table queries use proper columns

**Schema Reference:**
```sql
CREATE TABLE library (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  novel_id UUID REFERENCES novels(id),
  added_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3. **RankingScreen.tsx** ❌

**Issues:**
- Currently using mock data only
- Not connected to database at all
- Missing implementation

**Required Implementation:**
```typescript
// ✅ CORRECT Implementation needed
const loadRankings = async () => {
  try {
    let query = supabase
      .from('novels')
      .select(`
        id,
        title,
        cover_image_url,
        genres,
        average_rating,
        total_views,
        total_votes
      `);

    // Apply sorting based on sortBy state
    switch (sortBy) {
      case 'Most Viewed':
        query = query.order('total_views', { ascending: false });
        break;
      case 'Most Voted':
        query = query.order('total_votes', { ascending: false });
        break;
      case 'Highest Rated':
        query = query.order('average_rating', { ascending: false });
        break;
      default: // Trending
        // Trending = combination of recent views and votes
        query = query.order('total_votes', { ascending: false });
    }

    // Apply genre filter
    if (genre !== 'All Genres') {
      query = query.contains('genres', [genre]);
    }

    query = query.limit(50);

    const { data, error } = await query;
    if (error) throw error;

    // Transform data
    const rankings = data.map((novel, index) => ({
      id: novel.id,
      rank: index + 1,
      title: novel.title,
      genre: novel.genres?.[0] || 'Unknown',
      rating: novel.average_rating || 0,
      views: formatNumber(novel.total_views || 0),
      coverImage: novel.cover_image_url || 'default.jpg',
    }));

    setRankings(rankings);
  } catch (error) {
    console.error('Error loading rankings:', error);
  }
};
```

---

## Column Name Mapping (Old vs New)

### Novels Table
| ❌ Wrong Name (Used in Code) | ✅ Correct Name (Schema) |
|------------------------------|--------------------------|
| `banner_image_url` | **DOES NOT EXIST** (use `cover_image_url`) |
| `chapter_count` | `total_chapters` |
| `view_count` | `total_views` |
| `vote_count` | `total_votes` |
| `rating` | `average_rating` |
| `review_count` | `total_reviews` |

### Chapters Table
| ❌ Wrong Name | ✅ Correct Name |
|--------------|-----------------|
| `unlock_hours` | `wait_hours` |
| `view_count` | `views` |
| `like_count` | **DOES NOT EXIST** (chapters don't have likes) |
| `dislike_count` | **DOES NOT EXIST** (chapters don't have dislikes) |

### Reviews Table
| ❌ Wrong Name | ✅ Correct Name |
|--------------|-----------------|
| `comment` | `review_text` |
| `likes_count` | `likes` |
| `dislikes_count` | `dislikes` |

### Profiles Table
| ❌ Wrong Name | ✅ Correct Name |
|--------------|-----------------|
| `avatar_url` | `profile_picture_url` |
| `follower_count` | **NOT IN TABLE** (calculate from `follows` table) |
| `following_count` | **NOT IN TABLE** (calculate from `follows` table) |

---

## Missing Features in Screens

### 1. **Mature Content Filtering** ❌
**Schema Support:**
```sql
-- Novels have is_mature flag
is_mature BOOLEAN DEFAULT FALSE

-- Function to check user age
CREATE FUNCTION can_view_mature_content(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_age INTEGER;
BEGIN
  SELECT age INTO user_age FROM profiles WHERE id = user_id_param;
  RETURN user_age IS NULL OR user_age >= 18;
END;
$$ LANGUAGE plpgsql;

-- RLS Policy
CREATE POLICY "Novels are viewable based on age"
  ON novels FOR SELECT
  USING (
    is_mature = FALSE
    OR
    (is_mature = TRUE AND can_view_mature_content(auth.uid()))
  );
```

**Missing in Screens:**
- NovelDetailScreen doesn't show mature content warning
- Search/Discovery screens don't filter by age
- CreateNovelScreen needs `is_mature` checkbox

---

### 2. **Admin Features** ❌
**Schema Support:**
```sql
-- Admins table exists
CREATE TABLE admins (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id),
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Admin check function
CREATE FUNCTION is_admin(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admins WHERE user_id = user_id_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Missing Screens:**
- No admin dashboard
- No admin panel for managing reports
- No admin panel for managing withdrawals
- No admin panel for managing featured content

---

### 3. **Chapter Unlock System** ⚠️
**Schema Support:**
```sql
-- Chapters have wait_hours (auto-calculated)
CREATE FUNCTION set_chapter_wait_hours()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.chapter_number >= 8 AND NEW.chapter_number <= 30 THEN
    NEW.wait_hours := 3;
  ELSIF NEW.chapter_number > 30 THEN
    NEW.wait_hours := 24;
  ELSE
    NEW.wait_hours := 0; -- Chapters 1-7 are free
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Current Implementation:**
- NovelDetailScreen has unlock dialog ✅
- But uses AsyncStorage instead of database ❌
- Should use `chapter_unlocks` and `chapter_timers` tables

**Required Fix:**
```typescript
// ✅ Use database instead of AsyncStorage
const startChapterTimer = async (chapterId: string, hours: number) => {
  const { data, error } = await supabase
    .from('chapter_timers')
    .insert({
      user_id: currentUserId,
      novel_id: novelId,
      chapter_id: chapterId,
      timer_duration_hours: hours,
      timer_expiration_timestamp: new Date(Date.now() + hours * 3600000).toISOString(),
    });
  
  if (error) {
    console.error('Error starting timer:', error);
    return;
  }
  
  // Reload timers from database
  loadActiveTimers();
};
```

---

## Services Layer Analysis

### ✅ Services That Exist:
1. `authService.ts` - Authentication
2. `novelService.ts` - Novel operations
3. `chapterService.ts` - Chapter operations
4. `reviewService.ts` - Reviews
5. `commentService.ts` - Comments
6. `readingService.ts` - Reading progress/history
7. `walletService.ts` - Wallet operations
8. `unlockService.ts` - Chapter unlocks
9. `socialService.ts` - Follow/vote operations
10. `searchService.ts` - Search functionality
11. `notificationService.ts` - Notifications
12. `reportService.ts` - Content reporting
13. `supportService.ts` - FAQ/Contact
14. `storageService.ts` - File uploads
15. `adService.ts` - Ad tracking
16. `profileService.ts` - Profile management

### ⚠️ Services Need Schema Verification:
All services need to be checked to ensure they use correct column names from the schema.

---

## Screens Status Summary

| Screen | Status | Issues |
|--------|--------|--------|
| **Auth Screens** |
| SignUpScreen | ✅ Good | Uses authService correctly |
| EmailVerificationScreen | ✅ Good | OTP verification works |
| PasswordResetScreen | ⚠️ Check | Verify schema compliance |
| OnboardingScreen | ✅ Good | No database interaction |
| **Main Screens** |
| NovelDetailScreen | ❌ Critical | Wrong column names, missing features |
| LibraryScreen | ⚠️ Check | Verify service uses correct schema |
| RankingScreen | ❌ Critical | Mock data only, not connected to DB |
| SearchResultScreen | ⚠️ Check | Verify schema compliance |
| RecentSearchScreen | ⚠️ Check | Verify `search_history` table usage |
| GenreScreen | ⚠️ Check | Verify genre filtering |
| TagsSectionScreen | ⚠️ Check | Verify tags filtering |
| SeeAllScreen | ⚠️ Check | Verify queries |
| ProfileScreen | ⚠️ Check | Verify profile data |
| **Author Screens** |
| AuthorDashboardScreen | ⚠️ Check | Verify statistics queries |
| NovelManageScreen | ✅ Good | Uses novelService |
| ChapterManageScreen | ⚠️ Check | Verify chapter queries |
| CreateNovelScreen | ⚠️ Check | Missing `is_mature` field |
| CreateChapterScreen | ⚠️ Check | Verify `wait_hours` auto-calculation |
| EditNovelScreen | ⚠️ Check | Verify update operations |
| EditChapterScreen | ⚠️ Check | Verify update operations |
| **Profile Screens** |
| EditProfileScreen | ⚠️ Check | Verify profile fields |
| AccountSettingsScreen | ⚠️ Check | Verify settings operations |
| FollowListScreen | ⚠️ Check | Verify `follows` table |
| NotificationScreen | ✅ Good | Uses notificationService |
| OtherUserProfileScreen | ⚠️ Check | Verify profile queries |
| SettingsScreen | ⚠️ Check | Verify settings |
| **Wallet Screens** |
| WalletScreen | ⚠️ Check | Verify wallet queries |
| TransactionHistoryScreen | ⚠️ Check | Verify transactions table |
| WithdrawalScreen | ⚠️ Check | Verify withdrawal_requests table |
| TopUpScreen | ❌ Not Needed | No top-up in schema (earnings only) |
| **Misc Screens** |
| FaqScreen | ⚠️ Check | Verify `faqs` table |
| ContactUsScreen | ⚠️ Check | Verify `contact_submissions` table |
| ReportScreen | ✅ Good | Uses reportService |

---

## Priority Fixes Required

### 🔴 Critical (Fix Immediately):
1. **NovelDetailScreen.tsx** - Fix all column name mismatches
2. **RankingScreen.tsx** - Connect to database
3. **CreateNovelScreen.tsx** - Add `is_mature` field
4. **All Services** - Audit for correct column names

### 🟡 High Priority:
5. Implement mature content filtering across all screens
6. Fix chapter unlock system to use database instead of AsyncStorage
7. Add admin dashboard screens
8. Verify all service layer queries

### 🟢 Medium Priority:
9. Add missing features (featured content, editors picks)
10. Implement proper error handling
11. Add loading states everywhere
12. Implement pull-to-refresh

---

## Recommended Action Plan

### Phase 1: Critical Fixes (Day 1-2)
1. Create `COLUMN_MAPPING.md` reference document
2. Fix NovelDetailScreen column names
3. Connect RankingScreen to database
4. Audit all services for schema compliance

### Phase 2: Feature Completion (Day 3-5)
5. Implement mature content filtering
6. Fix chapter unlock system
7. Add missing fields to create/edit screens
8. Implement admin features

### Phase 3: Testing & Polish (Day 6-7)
9. Test all screens with real data
10. Add error handling
11. Add loading states
12. Performance optimization

---

## Schema Reference Quick Links

**Key Tables:**
- `profiles` - User profiles (extends auth.users)
- `admins` - Admin users (private table)
- `novels` - Novel metadata
- `chapters` - Chapter content
- `chapter_unlocks` - Unlocked chapters (72hr expiry)
- `chapter_timers` - Active unlock timers
- `reviews` - Novel reviews
- `comments` - Chapter comments
- `library` - Saved novels
- `reading_history` - Read chapters
- `reading_progress` - Overall progress per novel
- `wallets` - User wallet balances
- `transactions` - Earnings/withdrawals
- `withdrawal_requests` - Withdrawal requests
- `follows` - User follow relationships
- `novel_votes` - Novel votes/likes
- `notifications` - User notifications
- `reports` - Content reports
- `search_history` - Search queries
- `faqs` - FAQ entries
- `contact_submissions` - Contact form submissions
- `admin_config` - System configuration
- `home_sections` - Home page sections
- `section_novels` - Novels in sections
- `featured_banners` - Featured banners

**Important Notes:**
- ✅ Chapters 1-7 are always free (no unlock needed)
- ✅ Chapters 8-30 require 3-hour timer
- ✅ Chapters 31+ require 24-hour timer
- ✅ Unlocks expire after 72 hours
- ✅ Only one active timer per user per novel
- ✅ Mature content filtered by user age (18+)
- ✅ Admin status managed in separate `admins` table
- ✅ Cover image used as both cover and banner (no separate banner field)

---

## Conclusion

The mobile app has a good foundation with service layers in place, but there are critical schema mismatches that need immediate attention. The most urgent issues are:

1. **Column name mismatches** in NovelDetailScreen and likely other screens
2. **Missing database connections** in RankingScreen
3. **Incomplete implementations** of chapter unlock system
4. **Missing features** like mature content filtering and admin panels

Following the recommended action plan will bring the app into full compliance with the database schema and enable all planned features.

---

**Next Steps:**
1. Review this document with the team
2. Prioritize fixes based on criticality
3. Create tickets for each fix
4. Begin Phase 1 implementation
5. Test thoroughly with real Supabase data

