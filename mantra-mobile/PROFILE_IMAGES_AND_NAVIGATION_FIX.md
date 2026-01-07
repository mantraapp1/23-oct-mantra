# Profile Images and Author Navigation Fix

## Issues Fixed

### 1. "View Author" Navigation Failure
**Problem**: Clicking "View Author" in Novel Detail screen showed "no user found" error.

**Root Cause**: The navigation was passing a hardcoded string `'author-id'` instead of the actual author ID from the novel data.

**Solution**:
- Added `author_id` to the transformed novel object
- Updated navigation to use `novel.author_id` instead of hardcoded value
- Added error handling for missing author information

```typescript
// Before
(navigation.navigate as any)('OtherUserProfile', { userId: 'author-id' });

// After
if (novel?.author_id) {
  (navigation.navigate as any)('OtherUserProfile', { userId: novel.author_id });
} else {
  showToast('error', 'Author information not available');
}
```

### 2. Hardcoded Profile Images
**Problem**: Comments, reviews, and profile screens were using hardcoded Unsplash placeholder images instead of actual user profile pictures from the database.

**Root Cause**: Avatar URLs were hardcoded fallbacks that never checked the database for actual user profile pictures.

**Solution**: Created a centralized profile image utility with smart fallbacks.

## Implementation

### A. Created Default Images Constants
Created `constants/defaultImages.ts` with utility functions:

```typescript
/**
 * Get profile picture URL with fallback to default
 * @param profilePictureUrl - User's profile picture URL from database
 * @param userName - User's name for generating avatar with initials
 * @returns Profile picture URL or default avatar
 */
export const getProfilePicture = (profilePictureUrl?: string | null, userName?: string): string => {
  if (profilePictureUrl) {
    return profilePictureUrl;
  }
  
  // Generate avatar with user's initials if name is provided
  if (userName && userName !== 'Anonymous') {
    const encodedName = encodeURIComponent(userName);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=0ea5e9&color=fff&size=200`;
  }
  
  return DEFAULT_IMAGES.PROFILE;
};
```

### B. Updated ChapterScreen (Comments)

#### Loading Comments
```typescript
const authorName = comment.user?.display_name || comment.user?.username || 'Anonymous';

return {
  // ... other fields
  author: authorName,
  avatar: getProfilePicture(comment.user?.profile_picture_url, authorName),
};
```

#### Creating New Comments
```typescript
// Get current user data for avatar
const currentUser = await authService.getCurrentUser();
const userName = currentUser?.display_name || currentUser?.username || 'You';
const userAvatar = getProfilePicture(currentUser?.profile_picture_url, userName);

const newComment: Comment = {
  // ... other fields
  author: userName,
  avatar: userAvatar,
};
```

#### Comment Input Avatar
```typescript
// Store current user avatar in state
const [currentUserAvatar, setCurrentUserAvatar] = useState<string>('');

// Load on mount
const user = await authService.getCurrentUser();
if (user) {
  const userName = user.display_name || user.username || 'You';
  setCurrentUserAvatar(getProfilePicture(user.profile_picture_url, userName));
}

// Use in UI
<Image
  source={{ uri: currentUserAvatar || getProfilePicture(null, 'User') }}
  style={styles.commentInputAvatar}
/>
```

### C. Updated NovelDetailScreen (Reviews)

#### Loading Reviews
```typescript
const userName = review.profiles?.display_name || review.profiles?.username || 'Anonymous';

return {
  // ... other fields
  userName,
  userAvatar: getProfilePicture(review.profiles?.profile_picture_url, userName),
};
```

#### Creating New Reviews
```typescript
// Get current user data for avatar
const currentUser = await authService.getCurrentUser();
const userName = currentUser?.display_name || currentUser?.username || 'You';

const newReview: Review = {
  // ... other fields
  userName,
  userAvatar: getProfilePicture(currentUser?.profile_picture_url, userName),
};
```

## Benefits

### User Experience
1. **Personalized Avatars**: Users see their actual profile pictures
2. **Smart Fallbacks**: Generated avatars with user initials when no picture is set
3. **Consistent Design**: All avatars follow the same pattern
4. **Working Navigation**: "View Author" now correctly navigates to author profiles

### Technical
1. **Centralized Logic**: Single source of truth for default images
2. **Type Safety**: TypeScript utility functions with proper types
3. **Maintainability**: Easy to update default images in one place
4. **Performance**: Uses ui-avatars.com API for dynamic avatar generation

## Avatar Fallback Hierarchy

```
1. User's uploaded profile picture (from database)
   ↓
2. Generated avatar with user's initials (ui-avatars.com)
   ↓
3. Default generic avatar
```

## Examples

### With Profile Picture
```
User: "John Doe"
Profile Picture: "https://example.com/john.jpg"
Result: Shows john.jpg
```

### Without Profile Picture
```
User: "John Doe"
Profile Picture: null
Result: Shows avatar with "JD" initials on blue background
```

### Anonymous User
```
User: "Anonymous"
Profile Picture: null
Result: Shows default generic avatar
```

## Files Modified

1. **Created**: `mantra-mobile/constants/defaultImages.ts`
   - Centralized default image constants
   - `getProfilePicture()` utility function
   - `getNovelCover()` utility function
   - `getBannerImage()` utility function

2. **Updated**: `mantra-mobile/components/ChapterScreen.tsx`
   - Import `getProfilePicture` helper
   - Use helper in `loadComments()`
   - Use helper in `handleSendComment()`
   - Store and display current user avatar in comment input

3. **Updated**: `mantra-mobile/components/screens/NovelDetailScreen.tsx`
   - Import `getProfilePicture` helper
   - Add `author_id` to transformed novel object
   - Fix "View Author" navigation to use actual author ID
   - Use helper in review loading
   - Use helper in review creation

## Testing Checklist

### Navigation
- [x] Click "View Author" → Navigates to correct author profile
- [x] Novel without author → Shows error message

### Profile Images - Comments
- [x] User with profile picture → Shows their picture
- [x] User without profile picture → Shows avatar with initials
- [x] Anonymous user → Shows default avatar
- [x] New comment → Shows current user's avatar
- [x] Comment input → Shows current user's avatar

### Profile Images - Reviews
- [x] User with profile picture → Shows their picture
- [x] User without profile picture → Shows avatar with initials
- [x] New review → Shows current user's avatar

## API Used

**UI Avatars API**: https://ui-avatars.com/api/
- Generates avatars with user initials
- Customizable colors and sizes
- No authentication required
- Free to use

Example URL:
```
https://ui-avatars.com/api/?name=John+Doe&background=0ea5e9&color=fff&size=200
```

## Future Enhancements

Potential improvements:
1. Cache generated avatars locally
2. Add avatar upload functionality
3. Support for different avatar styles
4. Lazy loading for avatar images
5. Placeholder while loading
