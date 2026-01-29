/**
 * UserAvatar Component
 * Centralized avatar component matching mobile app's UserAvatar.tsx
 * 
 * Features:
 * - Graceful fallback to initials when image fails to load
 * - Consistent styling across the app
 * - Theme-aware colors
 * - Multiple size presets with custom size support
 */

import React, { useState } from 'react';
import { getProfilePicture } from '@/lib/defaultImages';

export interface UserAvatarProps {
    /** Image URI - can be null/undefined, will show initials fallback */
    uri?: string | null;
    /** User's name for generating initials fallback */
    name?: string;
    /** Preset size or custom number */
    size?: 'xs' | 'small' | 'medium' | 'large' | 'xl' | number;
    /** Optional additional CSS classes */
    className?: string;
    /** Show border around avatar */
    showBorder?: boolean;
    /** Border color class (defaults to border-sky-500) */
    borderColorClass?: string;
}

const SIZE_MAP = {
    xs: 24,
    small: 32,
    medium: 40,
    large: 56,
    xl: 80,
};

const FONT_SIZE_MAP = {
    xs: '10px',
    small: '12px',
    medium: '16px',
    large: '20px',
    xl: '28px',
};

/**
 * Get initials from a name
 * Handles single words, multiple words, and edge cases
 */
const getInitials = (name: string): string => {
    if (!name || name.trim() === '' || name === 'Anonymous') {
        return 'U';
    }

    const words = name.trim().split(/\s+/).filter(w => w.length > 0);

    if (words.length === 0) {
        return 'U';
    }

    if (words.length === 1) {
        return words[0].charAt(0).toUpperCase();
    }

    // Take first letter of first and last word
    const firstInitial = words[0].charAt(0).toUpperCase();
    const lastInitial = words[words.length - 1].charAt(0).toUpperCase();

    return firstInitial + lastInitial;
};

const UserAvatar: React.FC<UserAvatarProps> = ({
    uri,
    name = 'User',
    size = 'medium',
    className = '',
    showBorder = false,
    borderColorClass = 'border-sky-500',
}) => {
    const [hasError, setHasError] = useState(false);

    // Calculate actual size
    const avatarSize = typeof size === 'number' ? size : SIZE_MAP[size];
    const fontSize = typeof size === 'number'
        ? `${Math.max(10, size * 0.4)}px`
        : FONT_SIZE_MAP[size];

    // Get the initials for fallback
    const initials = getInitials(name);

    // Get the image URL - use centralized function for consistency
    const imageUri = getProfilePicture(uri, name);

    // If image failed to load or no URI provided, show initials fallback
    if (hasError || !uri) {
        return (
            <div
                className={`flex items-center justify-center bg-sky-500 text-white font-bold rounded-full flex-shrink-0 ${showBorder ? `border-2 ${borderColorClass}` : ''} ${className}`}
                style={{
                    width: avatarSize,
                    height: avatarSize,
                    fontSize,
                }}
            >
                {initials}
            </div>
        );
    }

    return (
        <div
            className={`rounded-full overflow-hidden flex-shrink-0 ${showBorder ? `border-2 ${borderColorClass}` : ''} ${className}`}
            style={{
                width: avatarSize,
                height: avatarSize,
            }}
        >
            <img
                src={imageUri}
                alt={name}
                className="w-full h-full object-cover"
                onError={() => setHasError(true)}
            />
        </div>
    );
};

export default UserAvatar;
