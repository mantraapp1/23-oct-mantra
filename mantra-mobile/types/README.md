# Database Type Definitions

This directory contains TypeScript type definitions for the Mantra application.

## Files

### `database.ts` (NEW - PRIMARY)
Central database type definitions that match the exact Supabase schema. **Always use these types** when working with database queries.

**Key Features:**
- ✅ Exact column name matching with database schema
- ✅ Core database types for all 33 tables
- ✅ Extended types with relationships (e.g., `NovelWithAuthor`)
- ✅ Transformation types for UI display (e.g., `TransformedNovel`)
- ✅ Helper types and enums
- ✅ Query result types

### `supabase.ts` (DEPRECATED)
Legacy database types. **Do not use** - contains incorrect column names (e.g., `banner_image_url`, chapter `likes`/`dislikes`).

### `index.ts`
Main export file. Exports all types from `database.ts` plus legacy types for backward compatibility.

## Usage Examples

### Importing Types

```typescript
// Import from index (recommended)
import { Novel, NovelWithAuthor, TransformedNovel } from '../types';

// Or import directly from database.ts
import { Novel, Chapter, Review } from '../types/database';
```

### Using Core Database Types

```typescript
import { supabase } from '../config/supabase';
import { Novel, NovelWithAuthor } from '../types';

// Query with correct column names
const { data, error } = await supabase
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

// Type the result
const novel = data as NovelWithAuthor;
```

### Using Transformation Types

```typescript
import { NovelWithAuthor, TransformedNovel } from '../types';

function transformNovel(novel: NovelWithAuthor): TransformedNovel {
  return {
    id: novel.id,
    title: novel.title,
    author: novel.profiles?.display_name || novel.profiles?.username || 'Unknown',
    authorId: novel.author_id,
    cover: novel.cover_image_url || 'default-cover.jpg',
    rating: novel.average_rating || 0,
    views: formatNumber(novel.total_views || 0),
    votes: formatNumber(novel.total_votes || 0),
    chapters: novel.total_chapters || 0,
    genres: novel.genres || [],
    description: novel.description || '',
    tags: novel.tags || [],
    status: novel.status,
    isMature: novel.is_mature,
    isFeatured: novel.is_featured,
    isEditorsPick: novel.is_editors_pick,
    createdAt: novel.created_at,
    updatedAt: novel.updated_at,
  };
}
```

### Using Extended Types with Relationships

```typescript
import { ReviewWithUser } from '../types';

const { data } = await supabase
  .from('reviews')
  .select(`
    *,
    profiles!reviews_user_id_fkey (
      id,
      username,
      display_name,
      profile_picture_url
    )
  `)
  .eq('novel_id', novelId);

const reviews = data as ReviewWithUser[];
```

## Critical Column Name Corrections

The following column names were **WRONG** in old code and are now **CORRECT** in `database.ts`:

| Table | ❌ Wrong Name | ✅ Correct Name |
|-------|--------------|----------------|
| novels | `banner_image_url` | `cover_image_url` |
| novels | `chapter_count` | `total_chapters` |
| novels | `view_count` | `total_views` |
| novels | `vote_count` | `total_votes` |
| novels | `rating` | `average_rating` |
| chapters | `unlock_hours` | `wait_hours` |
| chapters | `view_count` | `views` |
| chapters | `likes` | ❌ **Does not exist** |
| chapters | `dislikes` | ❌ **Does not exist** |
| reviews | `comment` | `review_text` |
| reviews | `likes_count` | `likes` |
| reviews | `dislikes_count` | `dislikes` |
| comments | `likes_count` | `likes` |
| comments | `dislikes_count` | `dislikes` |
| profiles | `avatar_url` | `profile_picture_url` |

## Important Notes

### Chapters Do NOT Have Likes/Dislikes
Only **reviews** and **comments** have likes/dislikes. Chapters only have `views`.

### Cover Image URL
The database has only `cover_image_url` - use it for both cover and banner images.

### Wait Hours Auto-Calculation
`wait_hours` is automatically calculated by a database trigger:
- Chapters 1-7: `0` (free)
- Chapters 8-30: `3` hours
- Chapters 31+: `24` hours

**Do not set `wait_hours` manually** when creating/updating chapters.

### Follower/Following Counts
These are **NOT stored** in the `profiles` table. Calculate them from the `follows` table:

```typescript
// Get follower count
const { count: followerCount } = await supabase
  .from('follows')
  .select('*', { count: 'exact', head: true })
  .eq('following_id', userId);

// Get following count
const { count: followingCount } = await supabase
  .from('follows')
  .select('*', { count: 'exact', head: true })
  .eq('follower_id', userId);
```

### Foreign Key Syntax
Use the foreign key constraint name when joining tables:

```typescript
// Correct
.select(`
  *,
  profiles!novels_author_id_fkey (username, display_name)
`)

// Pattern: {table}_{column}_fkey
```

## Type Safety Best Practices

1. **Always use types from `database.ts`** for database queries
2. **Use transformation types** for UI components
3. **Use extended types** when querying with relationships
4. **Enable TypeScript strict mode** to catch column name errors at compile time
5. **Never use `any` type** for database results

## Migration Guide

If you're updating existing code:

1. Replace imports from `supabase.ts` with imports from `database.ts` or `index.ts`
2. Update all column names to match the correct names (see table above)
3. Remove any references to non-existent fields (e.g., chapter likes/dislikes)
4. Use transformation functions to convert database types to UI types
5. Run TypeScript compiler to catch any remaining errors

## Questions?

See the main documentation:
- `COLUMN_MAPPING_REFERENCE.md` - Complete column mapping reference
- `SCHEMA_COMPLIANCE_ANALYSIS.md` - Detailed schema analysis
- `.kiro/specs/schema-compliance-fixes/design.md` - Design document
