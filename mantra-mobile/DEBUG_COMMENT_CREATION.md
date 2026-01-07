# Debug Guide: Comment Creation Not Working

## Issue
Comments are not being saved to the database when posted.

## Step-by-Step Debugging

### Step 1: Check if User is Logged In

Add this console.log at the start of `handleSendComment`:

```typescript
const handleSendComment = async () => {
  console.log('[DEBUG] Starting handleSendComment');
  console.log('[DEBUG] currentUserId:', currentUserId);
  console.log('[DEBUG] commentText:', commentText);
  console.log('[DEBUG] chapter?.id:', chapter?.id);
  
  if (!commentText.trim()) {
    console.log('[DEBUG] Comment text is empty');
    return;
  }

  if (!currentUserId) {
    console.log('[DEBUG] User not logged in');
    Alert.alert('Login Required', 'Please log in to comment');
    return;
  }

  if (!chapter?.id) {
    console.log('[DEBUG] Chapter not loaded');
    Alert.alert('Error', 'Chapter not loaded');
    return;
  }
  
  // ... rest of function
};
```

**Expected Output:**
```
[DEBUG] Starting handleSendComment
[DEBUG] currentUserId: "abc-123-def-456"  // Should be a UUID
[DEBUG] commentText: "My comment text"
[DEBUG] chapter?.id: "chapter-uuid-here"
```

**If currentUserId is null:**
- User is not logged in
- Check authentication flow
- Verify `useEffect` that sets `currentUserId` is running

### Step 2: Check Service Call

Add logging before and after the service call:

```typescript
// Add new comment
console.log('[DEBUG] Calling commentService.createComment with:', {
  userId: currentUserId,
  chapter_id: chapter.id,
  comment_text: commentText,
});

const result = await commentService.createComment(currentUserId, {
  chapter_id: chapter.id,
  comment_text: commentText,
});

console.log('[DEBUG] Service result:', result);

if (result.success && result.comment) {
  console.log('[DEBUG] Comment created successfully:', result.comment);
  // ... add to state
} else {
  console.log('[DEBUG] Comment creation failed:', result.message);
  Alert.alert('Error', result.message);
}
```

**Expected Output (Success):**
```
[DEBUG] Calling commentService.createComment with: {
  userId: "abc-123",
  chapter_id: "chapter-123",
  comment_text: "My comment"
}
[DEBUG] Service result: { success: true, message: "Comment posted successfully", comment: {...} }
[DEBUG] Comment created successfully: { id: "comment-123", ... }
```

**Expected Output (Failure):**
```
[DEBUG] Service result: { success: false, message: "Error message here" }
[DEBUG] Comment creation failed: Error message here
```

### Step 3: Check Database Insert

Add logging in the service (`commentService.ts`):

```typescript
async createComment(
  userId: string,
  data: CreateCommentData
): Promise<{ success: boolean; message: string; comment?: Comment }> {
  try {
    console.log('[CommentService] Creating comment:', {
      userId,
      data,
      timestamp: new Date().toISOString()
    });

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        ...data,
      })
      .select()
      .single();

    console.log('[CommentService] Supabase response:', {
      comment,
      error,
      timestamp: new Date().toISOString()
    });

    if (error) {
      console.error('[CommentService] Supabase error:', error);
      throw error;
    }

    return {
      success: true,
      message: 'Comment posted successfully',
      comment,
    };
  } catch (error: any) {
    console.error('[CommentService] Exception:', error);
    return {
      success: false,
      message: handleSupabaseError(error),
    };
  }
}
```

**Expected Output (Success):**
```
[CommentService] Creating comment: {
  userId: "abc-123",
  data: { chapter_id: "chapter-123", comment_text: "My comment" }
}
[CommentService] Supabase response: {
  comment: { id: "comment-123", user_id: "abc-123", ... },
  error: null
}
```

**Expected Output (Failure):**
```
[CommentService] Creating comment: { ... }
[CommentService] Supabase error: {
  code: "42501",
  message: "new row violates row-level security policy",
  details: "..."
}
```

### Step 4: Check Database Permissions

Run this query in Supabase SQL Editor:

```sql
-- Check if comments table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'comments';

-- Check RLS policies on comments table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'comments';

-- Try to insert a test comment manually
INSERT INTO comments (user_id, chapter_id, comment_text)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  (SELECT id FROM chapters LIMIT 1),
  'Test comment'
)
RETURNING *;
```

**Expected:** 
- Table should exist
- RLS policies should allow INSERT for authenticated users
- Manual insert should work

### Step 5: Check Required Fields

Verify the comments table schema:

```sql
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'comments'
ORDER BY ordinal_position;
```

**Check for:**
- `user_id` - Should be UUID, NOT NULL
- `chapter_id` - Should be UUID, NOT NULL
- `comment_text` - Should be TEXT, NOT NULL
- Any other required fields without defaults

## Common Issues

### Issue 1: RLS Policy Blocking Insert
**Symptom:** Error code 42501 or "new row violates row-level security policy"
**Solution:** Add INSERT policy for authenticated users:

```sql
CREATE POLICY "Users can insert their own comments"
ON comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### Issue 2: Missing Required Fields
**Symptom:** Error about null value in non-null column
**Solution:** Check if any required fields are missing from the insert

### Issue 3: Foreign Key Violation
**Symptom:** Error about foreign key constraint
**Solution:** Verify that `chapter_id` exists in chapters table

### Issue 4: User Not Authenticated
**Symptom:** `currentUserId` is null
**Solution:** Check authentication state before allowing comment

### Issue 5: Chapter ID Not Set
**Symptom:** `chapter?.id` is undefined
**Solution:** Ensure chapter data is loaded before showing comment input

## Quick Test

Add this test button to your screen temporarily:

```typescript
const testCommentCreation = async () => {
  console.log('=== COMMENT CREATION TEST ===');
  console.log('1. Current User ID:', currentUserId);
  console.log('2. Chapter ID:', chapter?.id);
  
  if (!currentUserId) {
    console.log('ERROR: No user ID');
    return;
  }
  
  if (!chapter?.id) {
    console.log('ERROR: No chapter ID');
    return;
  }
  
  try {
    const testData = {
      chapter_id: chapter.id,
      comment_text: 'Test comment ' + Date.now(),
    };
    
    console.log('3. Calling service with:', testData);
    const result = await commentService.createComment(currentUserId, testData);
    console.log('4. Result:', result);
    
    if (result.success) {
      console.log('SUCCESS: Comment created!');
      Alert.alert('Success', 'Test comment created');
    } else {
      console.log('FAILED:', result.message);
      Alert.alert('Failed', result.message);
    }
  } catch (error) {
    console.log('EXCEPTION:', error);
    Alert.alert('Error', String(error));
  }
};

// Add button in your UI
<TouchableOpacity onPress={testCommentCreation}>
  <Text>Test Comment Creation</Text>
</TouchableOpacity>
```

## Next Steps

1. Add the console.logs from Step 1-3
2. Try to post a comment
3. Check the console output
4. Share the console logs to identify where it's failing
5. Check database permissions if Supabase error occurs
