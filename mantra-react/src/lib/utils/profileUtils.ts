/**
 * Profile Utility Functions
 * Matches the mobile app's profile utilities for consistent avatar handling
 */

// Color palette for avatar backgrounds (diverse, visually distinct colors)
const AVATAR_COLORS = [
    '6366f1', // Indigo
    '8b5cf6', // Violet
    'ec4899', // Pink
    'f43f5e', // Rose
    'ef4444', // Red
    'f97316', // Orange
    'eab308', // Yellow
    '22c55e', // Green
    '14b8a6', // Teal
    '0ea5e9', // Sky
    '3b82f6', // Blue
    '06b6d4', // Cyan
];

/**
 * Get a consistent color based on the user's name
 * Uses a simple hash to ensure the same name always gets the same color
 */
function getColorForName(name: string): string {
    if (!name || name === 'Anonymous') {
        return AVATAR_COLORS[0]; // Default to indigo
    }

    // Simple hash based on character codes
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Use absolute value and modulo to get index
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
}

/**
 * Extract initials from a name
 */
function getInitials(name: string): string {
    if (!name || name === 'Anonymous') {
        return 'U';
    }

    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
        return words[0].charAt(0).toUpperCase();
    }

    const firstInitial = words[0].charAt(0).toUpperCase();
    const lastInitial = words[words.length - 1].charAt(0).toUpperCase();

    return firstInitial + lastInitial;
}

/**
 * Get profile picture URL with fallback to ui-avatars.com
 * Uses a consistent color per user based on their name
 */
export function getProfilePicture(
    profilePictureUrl?: string | null,
    userName?: string
): string {
    if (profilePictureUrl) {
        return profilePictureUrl;
    }

    // Generate avatar with user's initials and unique color
    if (userName && userName !== 'Anonymous') {
        const initials = getInitials(userName);
        const color = getColorForName(userName);
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&size=128&bold=true`;
    }

    return `https://ui-avatars.com/api/?name=U&background=0ea5e9&color=fff&size=128`;
}

/**
 * Get user display name with fallback logic
 */
export function getUserDisplayName(profile: {
    display_name?: string | null;
    username?: string | null;
} | null): string {
    if (!profile) {
        return 'Anonymous';
    }
    return profile.display_name || profile.username || 'Anonymous';
}

/**
 * Get user profile image with consistent default
 */
export function getUserProfileImage(profile: {
    profile_picture_url?: string | null;
    display_name?: string | null;
    username?: string | null;
} | null): string {
    if (!profile) {
        return getProfilePicture(null, 'Anonymous');
    }

    const displayName = getUserDisplayName(profile);
    return getProfilePicture(profile.profile_picture_url, displayName);
}
