# Column Mapping Reference Guide

Quick reference for developers to use correct column names when querying Supabase.

---

## 📋 Novels Table

```typescript
// ✅ CORRECT Column Names
interface Novel {
  id: string;                    // UUID
  author_id: string;             // UUID (foreign key to profiles)
  title: string;
  description: string | null;
  cover_image_url: string | null; // ⚠️ NO banner_image_url - use this for both!
  genres: string[];              // Array, max 3
  tags: string[];                // Array, max 10
  language: string;              // Default 'en'
  is_mature: boolean;            // Default false
  status: 'ongoing' | 'completed' | 'hiatus';
  total_chapters: number;        // ❌ NOT chapter_count
  total_views: number;           // ❌ NOT view_count
  total_votes: number;           // ❌ NOT vote_count
  average_rating: number;        // ❌ NOT rating (DECIMAL 3,2)
  total_reviews: number;         // ❌ NOT review_count
  is_featured: boolean;
  is_editors_pick: boolean;
  created_at: string;            // TIMESTAMPTZ
  updated_at: string;            // TIMESTAMPTZ
  completed_at: string | null;   // TIMESTAMPTZ
}

// ✅ CORRECT Query
const { data } = await supabase
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
```

---

## 📖 Chapters Table

```typescript
// ✅ CORRECT Column Names
interface Chapter {
  id: string;                    // UUID
  novel_id: string;              // UUID (foreign key)
  chapter_number: number;        // Integer
  title: string;
  content: string;
  word_count: number;            // Default 0
  views: number;                 // ❌ NOT view_count
  is_locked: boolean;            // Default true
  wait_hours: number | null;     // ❌ NOT unlock_hours (auto-calculated by trigger)
  published_at: string;          // TIMESTAMPTZ
  updated_at: string;            // TIMESTAMPTZ
}

// ⚠️ IMPORTANT: Chapters do NOT have likes/dislikes!
// Only comments and reviews have likes/dislikes

// ✅ CORRECT Query
const { data } = await supabase
  .from('chapters')
  .select('*')
  .eq('novel_id', novelId)
  .order('chapter_number', { ascending: true });
```

**Wait Hours Logic (Auto-calculated by trigger):**
- Chapters 1-7: `wait_hours = 0` (free)
- Chapters 8-30: `wait_hours = 3`
- Chapters 31+: `wait_hours = 24`

---

## ⭐ Reviews Table

```typescript
// ✅ CORRECT Column Names
interface Review {
  id: string;                    // UUID
  novel_id: string;              // UUID (foreign key)
  user_id: string;               // UUID (foreign key)
  rating: number;                // 1-5 (CHECK constraint)
  review_text: string | null;    // ❌ NOT comment
  likes: number;                 // ❌ NOT likes_count
  dislikes: number;              // ❌ NOT dislikes_count
  created_at: string;            // TIMESTAMPTZ
  updated_at: string;            // TIMESTAMPTZ
}

// ✅ CORRECT Query
const { data } = await supabase
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
```

---

## 💬 Comments Table

```typescript
// ✅ CORRECT Column Names
interface Comment {
  id: string;                    // UUID
  chapter_id: string;            // UUID (foreign key)
  user_id: string;               // UUID (foreign key)
  parent_comment_id: string | null; // UUID (for replies)
  comment_text: string;
  likes: number;                 // ❌ NOT likes_count
  dislikes: number;              // ❌ NOT dislikes_count
  reply_count: number;           // Default 0
  created_at: string;            // TIMESTAMPTZ
  updated_at: string;            // TIMESTAMPTZ
}

// ✅ CORRECT Query
const { data } = await supabase
  .from('comments')
  .select(`
    *,
    profiles!comments_user_id_fkey (
      username,
      display_name,
      profile_picture_url
    )
  `)
  .eq('chapter_id', chapterId)
  .is('parent_comment_id', null) // Top-level comments only
  .order('created_at', { ascending: false });
```

---

## 👤 Profiles Table

```typescript
// ✅ CORRECT Column Names
interface Profile {
  id: string;                    // UUID (references auth.users)
  username: string;              // UNIQUE
  display_name: string | null;
  email: string;                 // UNIQUE
  profile_picture_url: string | null; // ❌ NOT avatar_url
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  age: number | null;            // 13-120 (CHECK constraint)
  bio: string | null;
  favorite_genres: string[];     // Array, max 3
  preferred_language: string;    // Default 'en'
  push_notifications_enabled: boolean; // Default true
  account_status: 'active' | 'pending_deletion' | 'deleted';
  deletion_scheduled_date: string | null; // TIMESTAMPTZ
  joined_date: string;           // TIMESTAMPTZ
  last_login: string | null;     // TIMESTAMPTZ
  total_app_time_minutes: number; // Default 0
  created_at: string;            // TIMESTAMPTZ
  updated_at: string;            // TIMESTAMPTZ
}

// ⚠️ IMPORTANT: follower_count and following_count are NOT in the table!
// Calculate from the 'follows' table instead

// ✅ CORRECT Query for follower count
const { count: followerCount } = await supabase
  .from('follows')
  .select('*', { count: 'exact', head: true })
  .eq('following_id', userId);

// ✅ CORRECT Query for following count
const { count: followingCount } = await supabase
  .from('follows')
  .select('*', { count: 'exact', head: true })
  .eq('follower_id', userId);
```

---

## 🔓 Chapter Unlocks Table

```typescript
// ✅ CORRECT Column Names
interface ChapterUnlock {
  id: string;                    // UUID
  user_id: string;               // UUID (foreign key)
  novel_id: string;              // UUID (foreign key)
  chapter_id: string;            // UUID (foreign key)
  unlock_method: 'timer' | 'ad' | 'free';
  unlock_timestamp: string;      // TIMESTAMPTZ
  expiration_timestamp: string | null; // TIMESTAMPTZ (72 hours after unlock)
  is_expired: boolean;           // Default false
}

// ✅ CORRECT Query to check if chapter is unlocked
const { data } = await supabase
  .from('chapter_unlocks')
  .select('*')
  .eq('user_id', userId)
  .eq('chapter_id', chapterId)
  .eq('is_expired', false)
  .single();

// ✅ CORRECT Insert after ad view
const { data, error } = await supabase
  .from('chapter_unlocks')
  .insert({
    user_id: userId,
    novel_id: novelId,
    chapter_id: chapterId,
    unlock_method: 'ad',
    expiration_timestamp: new Date(Date.now() + 72 * 3600000).toISOString(),
  });
```

---

## ⏱️ Chapter Timers Table

```typescript
// ✅ CORRECT Column Names
interface ChapterTimer {
  id: string;                    // UUID
  user_id: string;               // UUID (foreign key)
  novel_id: string;              // UUID (foreign key)
  chapter_id: string;            // UUID (foreign key)
  timer_start_timestamp: string; // TIMESTAMPTZ
  timer_duration_hours: number;  // Integer
  timer_expiration_timestamp: string; // TIMESTAMPTZ
  is_active: boolean;            // Default true
  created_at: string;            // TIMESTAMPTZ
}

// ⚠️ IMPORTANT: Only ONE active timer per user per novel!
// UNIQUE constraint on (user_id, novel_id)

// ✅ CORRECT Query to get active timer
const { data } = await supabase
  .from('chapter_timers')
  .select('*')
  .eq('user_id', userId)
  .eq('novel_id', novelId)
  .eq('is_active', true)
  .single();

// ✅ CORRECT Insert new timer
const { data, error } = await supabase
  .from('chapter_timers')
  .insert({
    user_id: userId,
    novel_id: novelId,
    chapter_id: chapterId,
    timer_duration_hours: hours,
    timer_expiration_timestamp: new Date(Date.now() + hours * 3600000).toISOString(),
  });
```

---

## 💰 Wallets Table

```typescript
// ✅ CORRECT Column Names
interface Wallet {
  id: string;                    // UUID
  user_id: string;               // UUID (foreign key, UNIQUE)
  balance: number;               // DECIMAL(20,7)
  total_earned: number;          // DECIMAL(20,7)
  total_withdrawn: number;       // DECIMAL(20,7)
  total_ad_views: number;        // Integer
  created_at: string;            // TIMESTAMPTZ
  updated_at: string;            // TIMESTAMPTZ
}

// ✅ CORRECT Query
const { data } = await supabase
  .from('wallets')
  .select('*')
  .eq('user_id', userId)
  .single();
```

---

## 📚 Library Table

```typescript
// ✅ CORRECT Column Names
interface LibraryItem {
  id: string;                    // UUID
  user_id: string;               // UUID (foreign key)
  novel_id: string;              // UUID (foreign key)
  added_at: string;              // TIMESTAMPTZ
}

// ✅ CORRECT Query with novel details
const { data } = await supabase
  .from('library')
  .select(`
    *,
    novels!library_novel_id_fkey (
      id,
      title,
      cover_image_url,
      genres,
      average_rating,
      total_chapters
    )
  `)
  .eq('user_id', userId)
  .order('added_at', { ascending: false });
```

---

## 📖 Reading Progress Table

```typescript
// ✅ CORRECT Column Names
interface ReadingProgress {
  id: string;                    // UUID
  user_id: string;               // UUID (foreign key)
  novel_id: string;              // UUID (foreign key)
  current_chapter_number: number; // Default 1
  chapters_read: number;         // Default 0
  progress_percentage: number;   // DECIMAL(5,2), 0-100
  last_updated: string;          // TIMESTAMPTZ
}

// ✅ CORRECT Query
const { data } = await supabase
  .from('reading_progress')
  .select('*')
  .eq('user_id', userId)
  .eq('novel_id', novelId)
  .single();

// ✅ CORRECT Upsert (update or insert)
const { data, error } = await supabase
  .from('reading_progress')
  .upsert({
    user_id: userId,
    novel_id: novelId,
    current_chapter_number: chapterNumber,
    chapters_read: chaptersRead,
    progress_percentage: (chaptersRead / totalChapters) * 100,
  }, {
    onConflict: 'user_id,novel_id'
  });
```

---

## 🔍 Search History Table

```typescript
// ✅ CORRECT Column Names
interface SearchHistory {
  id: string;                    // UUID
  user_id: string;               // UUID (foreign key)
  search_query: string;
  searched_at: string;           // TIMESTAMPTZ
}

// ✅ CORRECT Query
const { data } = await supabase
  .from('search_history')
  .select('*')
  .eq('user_id', userId)
  .order('searched_at', { ascending: false })
  .limit(10);
```

---

## 🔔 Notifications Table

```typescript
// ✅ CORRECT Column Names
interface Notification {
  id: string;                    // UUID
  user_id: string;               // UUID (foreign key)
  type: 'new_chapter' | 'new_follower' | 'new_comment' | 'comment_liked' | 
        'new_review' | 'novel_voted' | 'admin_message' | 'wallet_earnings' | 
        'withdrawal_status' | 'withdrawal_completed' | 'custom';
  title: string;
  message: string;
  related_id: string | null;     // UUID
  is_read: boolean;              // Default false
  read_at: string | null;        // TIMESTAMPTZ
  sent_by: string | null;        // UUID (foreign key)
  created_at: string;            // TIMESTAMPTZ
}

// ✅ CORRECT Query
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

---

## 🚩 Reports Table

```typescript
// ✅ CORRECT Column Names
interface Report {
  id: string;                    // UUID
  reporter_id: string;           // UUID (foreign key)
  reported_type: 'novel' | 'chapter' | 'review' | 'comment' | 'user';
  reported_id: string;           // UUID
  reason: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  danger_level: 'normal' | 'high_danger';
  created_at: string;            // TIMESTAMPTZ
  resolved_at: string | null;    // TIMESTAMPTZ
  resolved_by: string | null;    // UUID (foreign key)
}

// ✅ CORRECT Query
const { data, error } = await supabase
  .from('reports')
  .insert({
    reporter_id: userId,
    reported_type: 'review',
    reported_id: reviewId,
    reason: 'Inappropriate content',
    description: 'Contains offensive language',
  });
```

---

## 🏠 Home Sections Table

```typescript
// ✅ CORRECT Column Names
interface HomeSection {
  id: string;                    // UUID
  section_name: 'top_rankings' | 'trending' | 'editors_picks' | 'popular' | 
                'recommended' | 'new_arrivals' | 'recently_updated' | 'you_may_like';
  is_manual: boolean;            // Default false
  priority_order: number;        // Default 0
  created_at: string;            // TIMESTAMPTZ
  updated_at: string;            // TIMESTAMPTZ
}

// ✅ CORRECT Query with novels
const { data } = await supabase
  .from('home_sections')
  .select(`
    *,
    section_novels!section_novels_section_id_fkey (
      display_order,
      novels!section_novels_novel_id_fkey (
        id,
        title,
        cover_image_url,
        genres,
        average_rating
      )
    )
  `)
  .order('priority_order', { ascending: true });
```

---

## ❓ FAQs Table

```typescript
// ✅ CORRECT Column Names
interface FAQ {
  id: string;                    // UUID
  category: 'account' | 'reading' | 'writing' | 'earnings' | 'technical' | 'wallet' | 'general';
  question: string;
  answer: string;
  keywords: string;              // For search
  display_order: number;         // Default 0
  is_active: boolean;            // Default true
  created_at: string;            // TIMESTAMPTZ
  updated_at: string;            // TIMESTAMPTZ
}

// ✅ CORRECT Query with search
const { data } = await supabase
  .from('faqs')
  .select('*')
  .eq('is_active', true)
  .or(`question.ilike.%${searchTerm}%,answer.ilike.%${searchTerm}%,keywords.ilike.%${searchTerm}%`)
  .order('display_order', { ascending: true });
```

---

## 🔐 Admin Functions

```typescript
// ✅ Check if user is admin
const { data, error } = await supabase
  .rpc('is_admin', { user_id_param: userId });

// Returns: boolean

// ✅ Check if user can view mature content
const { data, error } = await supabase
  .rpc('can_view_mature_content', { user_id_param: userId });

// Returns: boolean
```

---

## 🎯 Common Mistakes to Avoid

### ❌ WRONG:
```typescript
// Using old column names
const { data } = await supabase
  .from('novels')
  .select('chapter_count, view_count, banner_image_url');

// Using wrong relationship syntax
.select('*, author:author_id(*)')

// Forgetting to check mature content
.select('*') // Will be filtered by RLS, but should handle in UI
```

### ✅ CORRECT:
```typescript
// Using correct column names
const { data } = await supabase
  .from('novels')
  .select('total_chapters, total_views, cover_image_url');

// Using correct relationship syntax
.select('*, profiles!novels_author_id_fkey(*)')

// Checking mature content
const canView = await supabase.rpc('can_view_mature_content', { 
  user_id_param: userId 
});
```

---

## 📝 Quick Tips

1. **Always use the foreign key name** in relationship queries:
   ```typescript
   profiles!novels_author_id_fkey(*)
   ```

2. **Remember: No banner field** - use `cover_image_url` for both cover and banner

3. **Chapters don't have likes/dislikes** - only comments and reviews do

4. **Follower counts** - calculate from `follows` table, not stored in profiles

5. **Wait hours** - auto-calculated by trigger, don't set manually

6. **Mature content** - filtered by RLS based on user age

7. **Admin status** - stored in separate `admins` table, use `is_admin()` function

8. **Unlock expiry** - 72 hours after unlock timestamp

9. **One timer per novel** - UNIQUE constraint on (user_id, novel_id)

10. **Free chapters** - Chapters 1-7 always free (wait_hours = 0)

---

## 🔗 Related Documents

- `supabase-complete-setup.sql` - Full schema definition
- `SCHEMA_COMPLIANCE_ANALYSIS.md` - Detailed analysis of all screens
- `design.md` - Database design documentation

---

**Last Updated:** November 1, 2024  
**Schema Version:** 1.0.0
