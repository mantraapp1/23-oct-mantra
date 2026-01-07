# Mock Data Removal - Implementation Plan

## Summary

Removing mock data from 8 screens requires significant refactoring. Each screen needs:
- State management for real data
- Loading states
- Error handling  
- Empty states
- Supabase queries

## Recommended Approach

### Option 1: Gradual Replacement (RECOMMENDED)
Replace mock data screen-by-screen as you develop features:

1. **Start with authentication** ✅ DONE
   - SignUp, Login, EmailVerification already use real data

2. **Next: User Profile Screens**
   - These are simpler and good practice
   - Profile, AccountSettings, etc.

3. **Then: Content Screens**
   - NovelDetailScreen
   - ChapterScreen
   - WalletScreen

4. **Finally: Discovery Screens**
   - RankingScreen
   - TagsSectionScreen
   - SearchScreen

### Option 2: Keep Mock Data for Development
Keep mock data temporarily for UI development and testing:
- Allows you to test UI without database
- Replace with real data when backend is ready
- Add a toggle to switch between mock/real data

## Quick Wins - Easy Replacements

### 1. WalletScreen - Replace Mock Transactions

**File:** `components/screens/wallet/WalletScreen.tsx`

**Add at top:**
```typescript
import { supabase } from '../../config/supabase';
```

**Replace mock data with:**
```typescript
const [transactions, setTransactions] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadTransactions();
}, []);

const loadTransactions = async () => {
  try {
    const user = await authService.getCurrentUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    setTransactions(data || []);
  } catch (error) {
    console.error('Error loading transactions:', error);
  } finally {
    setLoading(false);
  }
};
```

### 2. RankingScreen - Replace Mock Rankings

**File:** `components/screens/RankingScreen.tsx`

**Replace with:**
```typescript
const [rankings, setRankings] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadRankings();
}, []);

const loadRankings = async () => {
  try {
    const { data, error } = await supabase
      .from('novels')
      .select(`
        *,
        profiles:author_id (username, display_name)
      `)
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

## Complex Replacements - Need More Work

### ChapterScreen.tsx (1357 lines)
**Complexity:** HIGH
**Reason:** 
- Mock novel data
- Mock chapter data  
- Mock comments (100+ lines)
- Many references throughout file

**Recommendation:** 
Create a new spec for "Chapter Screen Real Data Integration"

### NovelDetailScreen.tsx
**Complexity:** MEDIUM
**Reason:**
- Mock novel data
- Mock chapters list
- Mock reviews

**Recommendation:**
Use existing `novelService.ts` to fetch data

## Development Strategy

### Phase 1: Authentication ✅ DONE
- SignUp
- Login
- Email Verification
- Onboarding

### Phase 2: Simple Screens (1-2 days)
- WalletScreen
- RankingScreen
- RecentSearchScreen

### Phase 3: Medium Screens (2-3 days)
- NovelDetailScreen
- TagsSectionScreen
- NovelManageScreen

### Phase 4: Complex Screens (3-5 days)
- ChapterScreen
- ChapterManageScreen

## Testing Strategy

For each screen after removing mock data:

1. **Test with no data:**
   ```
   - New user
   - No novels created
   - No transactions
   - Empty library
   ```

2. **Test with real data:**
   ```
   - Create test novels
   - Add test chapters
   - Make test transactions
   - Add to library
   ```

3. **Test error cases:**
   ```
   - Network offline
   - Invalid IDs
   - Deleted content
   - Permission errors
   ```

## Code Pattern to Follow

```typescript
// 1. Add state
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// 2. Add useEffect
useEffect(() => {
  loadData();
}, []);

// 3. Add load function
const loadData = async () => {
  try {
    setLoading(true);
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('id', id);
    
    if (error) throw error;
    setData(data);
  } catch (err) {
    console.error('Error:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// 4. Add loading UI
if (loading) {
  return <ActivityIndicator />;
}

// 5. Add error UI
if (error) {
  return <Text>Error: {error}</Text>;
}

// 6. Add empty UI
if (!data) {
  return <Text>No data found</Text>;
}

// 7. Render real data
return <View>{/* Use data */}</View>;
```

## Services Available

Use these instead of direct Supabase calls:

```typescript
import novelService from '../services/novelService';
import chapterService from '../services/chapterService';
import walletService from '../services/walletService';
import searchService from '../services/searchService';
import commentService from '../services/commentService';
import reviewService from '../services/reviewService';
```

## Decision: What to Do Now?

### Recommended: Keep Mock Data for Now ✅

**Reasons:**
1. Authentication is working (most important)
2. Mock data allows UI testing
3. Can replace gradually as features are developed
4. Prevents breaking existing UI

### When to Replace:
- When you're ready to test that specific feature
- When you have real data in database
- When you're doing QA testing
- Before production release

## Next Steps

1. ✅ Authentication working with real data
2. ✅ Database setup complete
3. ⏭️ Test signup/login flow
4. ⏭️ Create test content (novels, chapters)
5. ⏭️ Replace mock data screen by screen
6. ⏭️ Test each screen after replacement

---

**Current Status:** Mock data documented, ready to replace when needed  
**Priority:** LOW (authentication is more important and is done)  
**Recommendation:** Replace gradually as you develop each feature
