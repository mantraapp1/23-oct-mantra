# Remove Mock Data Guide

## Files with Mock/Dummy Data

These files contain hardcoded test data that should be replaced with real Supabase data:

### 1. ✅ RankingScreen.tsx
**Location:** `components/screens/RankingScreen.tsx`
**Issue:** Has mock rankings data
**Status:** Needs to fetch from Supabase `novels` table with sorting

### 2. ✅ TagsSectionScreen.tsx
**Location:** `components/screens/TagsSectionScreen.tsx`
**Issue:** Has `mockNovelsByTag` object
**Status:** Needs to fetch from Supabase `novels` table filtered by tags

### 3. ✅ RecentSearchScreen.tsx
**Location:** `components/screens/RecentSearchScreen.tsx`
**Issue:** Has fallback mock trending searches
**Status:** Needs to fetch from Supabase `search_history` table

### 4. ✅ WalletScreen.tsx
**Location:** `components/screens/wallet/WalletScreen.tsx`
**Issue:** Has `mockRecentTransactions` array
**Status:** Needs to fetch from Supabase `transactions` table

### 5. ✅ NovelDetailScreen.tsx
**Location:** `components/screens/NovelDetailScreen.tsx`
**Issue:** Has mock novel data object
**Status:** Needs to fetch from Supabase `novels` table by ID

### 6. ✅ NovelManageScreen.tsx
**Location:** `components/screens/author/NovelManageScreen.tsx`
**Issue:** Has mock novel data
**Status:** Needs to fetch from Supabase `novels` table for current author

### 7. ✅ ChapterManageScreen.tsx
**Location:** `components/screens/author/ChapterManageScreen.tsx`
**Issue:** Has `mockNovel` and `mockChapter` objects
**Status:** Needs to fetch from Supabase `chapters` and `novels` tables

### 8. ✅ ChapterScreen.tsx
**Location:** `components/ChapterScreen.tsx`
**Issue:** Has `mockNovel` and `mockChapter` objects
**Status:** Needs to fetch from Supabase `chapters` and `novels` tables

## Placeholder Text (KEEP THESE)

These are NOT dummy data - they're helpful placeholder examples:
- ❌ `you@example.com` in email input fields
- ❌ `username` in username input fields
- ❌ `new@example.com` in email change fields

**These should stay** - they help users understand what format to enter.

## How to Fix Each Screen

### Example: RankingScreen.tsx

**Before (Mock Data):**
```typescript
const rankings: RankingItem[] = [
  { id: '1', title: 'Test Novel', ... },
  // ... more mock data
];
```

**After (Real Data):**
```typescript
const [rankings, setRankings] = useState<RankingItem[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadRankings();
}, []);

const loadRankings = async () => {
  try {
    const { data, error } = await supabase
      .from('novels')
      .select('*')
      .order('total_votes', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    setRankings(data || []);
  } catch (error) {
    console.error('Error loading rankings:', error);
  } finally {
    setLoading(false);
  }
};
```

### Example: WalletScreen.tsx

**Before (Mock Data):**
```typescript
const mockRecentTransactions = [
  { id: '1', type: 'earning', amount: 0.5, ... },
  // ... more mock data
];
```

**After (Real Data):**
```typescript
const [transactions, setTransactions] = useState([]);

useEffect(() => {
  loadTransactions();
}, []);

const loadTransactions = async () => {
  const user = await authService.getCurrentUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (!error) {
    setTransactions(data || []);
  }
};
```

## Priority Order

Fix these in this order for best user experience:

1. **HIGH PRIORITY:**
   - ChapterScreen.tsx (users read chapters)
   - NovelDetailScreen.tsx (users view novel details)
   - WalletScreen.tsx (financial data)

2. **MEDIUM PRIORITY:**
   - RankingScreen.tsx (discovery feature)
   - TagsSectionScreen.tsx (discovery feature)
   - RecentSearchScreen.tsx (search feature)

3. **LOW PRIORITY:**
   - NovelManageScreen.tsx (author feature)
   - ChapterManageScreen.tsx (author feature)

## Services Already Available

You already have services that can help:
- `services/novelService.ts` - Novel operations
- `services/chapterService.ts` - Chapter operations
- `services/walletService.ts` - Wallet operations
- `services/searchService.ts` - Search operations

Use these services instead of direct Supabase calls for consistency.

## Testing After Cleanup

After removing mock data:

1. **Test each screen:**
   - Does it load real data?
   - Does it show loading state?
   - Does it handle errors gracefully?
   - Does it show empty state when no data?

2. **Test with no data:**
   - New user with no novels
   - No transactions yet
   - No search history

3. **Test with real data:**
   - Create test novels
   - Make test transactions
   - Perform searches

## Quick Command to Find All Mock Data

```bash
# Search for mock data in your project
grep -r "mock" mantra-mobile/components --include="*.tsx" --include="*.ts"
```

---

**Status:** Documentation complete  
**Next Step:** Start removing mock data from high-priority screens
