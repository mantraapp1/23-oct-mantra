/**
 * Default Images Utilities
 * Matches mobile app's defaultImages.ts for consistent avatars
 * Uses correct Supabase column names: profile_picture_url (not avatar_url)
 */

export const DEFAULT_IMAGES = {
    PROFILE: 'https://ui-avatars.com/api/?name=User&background=0ea5e9&color=fff&size=200',
    NOVEL_COVER: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&q=80',
    BANNER: 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=1200&auto=format&fit=crop',
};

/**
 * Extract initials from a name
 * @param name - User's full name or username
 * @returns Initials (e.g., "Pankaj Rajput" -> "PR", "Ganesh" -> "G")
 */
const getInitials = (name: string): string => {
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
};

/**
 * Get profile picture URL with fallback to generated avatar
 * Works with both avatar_url (website) and profile_picture_url (Supabase schema)
 * @param pictureUrl - User's avatar/profile picture URL from database
 * @param userName - User's display name or username for generating initials
 * @returns Avatar URL (actual or generated via ui-avatars.com)
 */
export const getProfilePicture = (pictureUrl?: string | null, userName?: string): string => {
    if (pictureUrl) {
        return pictureUrl;
    }

    // Generate avatar with user's initials if name is provided
    if (userName && userName !== 'Anonymous') {
        const initials = getInitials(userName);
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=fff&size=128&bold=true`;
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

/**
 * Default banners for contests. High-quality images themed around writing, books, libraries, and magic.
 */
export const CONTEST_BANNERS = [
    'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1200&auto=format&fit=crop', // Magical glowing open book
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop', // Fountain pen writing on paper
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=1200&auto=format&fit=crop', // Mystical open book with celestial light
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1200&auto=format&fit=crop', // Aesthetic old library with rows of books
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1200&auto=format&fit=crop', // Vintage writing typewriter
    'https://images.unsplash.com/photo-1516414447565-b14be0adf13e?q=80&w=1200&auto=format&fit=crop'  // Collection of vintage journals and keys
];

/**
 * Get contest banner based on hash of contest ID
 * @param id - Contest ID
 * @returns Default contest banner URL
 */
export const getContestBanner = (id: string): string => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % CONTEST_BANNERS.length;
    return CONTEST_BANNERS[index];
};

