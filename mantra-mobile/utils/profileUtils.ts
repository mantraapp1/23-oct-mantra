/**
 * Profile Utility Functions
 * Centralized functions for consistent profile data handling across the application
 * 
 * These utilities ensure:
 * - Consistent display names with proper fallback logic
 * - Consistent profile images using the same default image generation
 * - Standardized profile data formatting for UI components
 */

import { Profile } from '../types/database';
import { getProfilePicture } from '../constants/defaultImages';

/**
 * Get user's display name with fallback logic
 * Priority: display_name -> username -> "Anonymous"
 * 
 * @param profile - User profile object (can be null or undefined)
 * @returns Display name string (never null)
 */
export function getUserDisplayName(profile: Profile | null | undefined): string {
  if (!profile) {
    return 'Anonymous';
  }
  
  // Priority: display_name first, then username, then Anonymous
  return profile.display_name || profile.username || 'Anonymous';
}

/**
 * Get user's profile image with consistent default
 * Uses getProfilePicture from defaultImages.ts for consistency
 * 
 * @param profile - User profile object (can be null or undefined)
 * @returns Profile image URL (never null, includes default with user initials)
 */
export function getUserProfileImage(profile: Profile | null | undefined): string {
  if (!profile) {
    return getProfilePicture(null, 'Anonymous');
  }
  
  // Use the centralized getProfilePicture function with display name for avatar generation
  const displayName = getUserDisplayName(profile);
  return getProfilePicture(profile.profile_picture_url, displayName);
}

/**
 * Formatted user profile data for UI display
 */
export interface FormattedUserProfile {
  id: string;
  displayName: string;
  username: string;
  profileImage: string;
  isCurrentUser: boolean;
}

/**
 * Format complete user profile data for UI display
 * Returns standardized object with name, image, and metadata
 * 
 * @param profile - User profile object (can be null or undefined)
 * @param currentUserId - Current logged-in user's ID (optional)
 * @returns Formatted profile object with all necessary UI data
 */
export function formatUserProfile(
  profile: Profile | null | undefined,
  currentUserId?: string | null
): FormattedUserProfile {
  const id = profile?.id || '';
  const displayName = getUserDisplayName(profile);
  const username = profile?.username || 'anonymous';
  const profileImage = getUserProfileImage(profile);
  const isCurrent = isCurrentUser(id, currentUserId);
  
  return {
    id,
    displayName,
    username,
    profileImage,
    isCurrentUser: isCurrent,
  };
}

/**
 * Check if a user ID matches the current user
 * 
 * @param userId - User ID to check
 * @param currentUserId - Current logged-in user's ID (optional)
 * @returns True if the user ID matches the current user
 */
export function isCurrentUser(userId: string, currentUserId?: string | null): boolean {
  if (!userId || !currentUserId) {
    return false;
  }
  
  return userId === currentUserId;
}
