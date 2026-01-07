/**
 * Default Images Constants
 * Centralized default images for the application
 */

export const DEFAULT_IMAGES = {
  // Default profile picture for users without a profile image
  PROFILE: 'https://ui-avatars.com/api/?name=User&background=0ea5e9&color=fff&size=200',
  
  // Default novel cover image
  NOVEL_COVER: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80',
  
  // Default banner image
  BANNER: 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=1200&auto=format&fit=crop',
};

/**
 * Extract initials from a name (first letter of first name + first letter of last name)
 * @param name - User's full name
 * @returns Initials (e.g., "Pankaj Rajput" -> "PR")
 */
const getInitials = (name: string): string => {
  if (!name || name === 'Anonymous') {
    return 'U'; // Default to 'U' for User
  }
  
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    // Single word: take first letter
    return words[0].charAt(0).toUpperCase();
  }
  
  // Multiple words: take first letter of first word + first letter of last word
  const firstInitial = words[0].charAt(0).toUpperCase();
  const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
  
  return firstInitial + lastInitial;
};

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
    const initials = getInitials(userName);
    return `https://ui-avatars.com/api/?name=${initials}&background=6366f1&color=fff&size=128&bold=true`;
  }
  
  return DEFAULT_IMAGES.PROFILE;
};

/**
 * Get novel cover image with fallback to default
 * @param coverImageUrl - Novel's cover image URL from database
 * @returns Cover image URL or default cover
 */
export const getNovelCover = (coverImageUrl?: string | null): string => {
  return coverImageUrl || DEFAULT_IMAGES.NOVEL_COVER;
};

/**
 * Get banner image with fallback to default
 * @param bannerImageUrl - Banner image URL from database
 * @returns Banner image URL or default banner
 */
export const getBannerImage = (bannerImageUrl?: string | null): string => {
  return bannerImageUrl || DEFAULT_IMAGES.BANNER;
};
