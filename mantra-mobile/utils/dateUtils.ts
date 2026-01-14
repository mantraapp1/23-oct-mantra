/**
 * Centralized Date Utility Functions
 * Eliminates duplicate formatTimeAgo implementations across screens
 */

/**
 * Format a date string as relative time (e.g., "5m ago", "2h ago", "3d ago")
 * @param dateString - ISO date string or Date object
 * @returns Formatted relative time string
 */
export const formatTimeAgo = (dateString: string | Date): string => {
    try {
        // Validation: Check if dateString is valid
        if (!dateString) {
            console.warn('[Format Time Warning] Empty date string provided');
            return 'Unknown';
        }

        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

        // Validation: Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('[Format Time Warning] Invalid date:', { dateString });
            return 'Unknown';
        }

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();

        // Handle future dates
        if (diffMs < 0) {
            return 'Just now';
        }

        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffWeeks < 4) return `${diffWeeks}w ago`;
        if (diffMonths < 12) return `${diffMonths}mo ago`;
        return `${diffYears}y ago`;
    } catch (error) {
        console.error('[Format Time Error] Unexpected error:', { error, dateString });
        return 'Unknown';
    }
};

/**
 * Format a number for display (e.g., 1234 -> "1.2k", 1234567 -> "1.2M")
 * @param num - Number to format
 * @returns Formatted number string
 */
export const formatNumber = (num: number): string => {
    try {
        // Validation: Check if num is a valid number
        if (typeof num !== 'number' || isNaN(num)) {
            console.warn('[Format Number Warning] Invalid number:', { num, type: typeof num });
            return '0';
        }

        // Handle negative numbers
        if (num < 0) {
            return '0';
        }

        if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
        return num.toString();
    } catch (error) {
        console.error('[Format Number Error] Unexpected error:', { error, num });
        return '0';
    }
};

/**
 * Parse a formatted number string back to a number
 * @param formatted - Formatted string like "1.2k" or "3.5M"
 * @returns Parsed number
 */
export const parseFormattedNumber = (formatted: string): number => {
    try {
        if (!formatted || typeof formatted !== 'string') return 0;

        const cleanStr = formatted.trim().toLowerCase();
        const numPart = parseFloat(cleanStr.replace(/[^0-9.]/g, ''));

        if (isNaN(numPart)) return 0;

        if (cleanStr.includes('b')) return numPart * 1000000000;
        if (cleanStr.includes('m')) return numPart * 1000000;
        if (cleanStr.includes('k')) return numPart * 1000;
        return numPart;
    } catch (error) {
        console.error('[Parse Number Error]:', { error, formatted });
        return 0;
    }
};

/**
 * Format a date for display
 * @param dateString - ISO date string
 * @param format - 'short' | 'long' | 'full'
 * @returns Formatted date string
 */
export const formatDate = (
    dateString: string | Date,
    format: 'short' | 'long' | 'full' = 'short'
): string => {
    try {
        if (!dateString) return 'Unknown';

        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

        if (isNaN(date.getTime())) return 'Unknown';

        const options: Intl.DateTimeFormatOptions =
            format === 'short'
                ? { month: 'short', day: 'numeric' }
                : format === 'long'
                    ? { month: 'long', day: 'numeric', year: 'numeric' }
                    : { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };

        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('[Format Date Error]:', { error, dateString });
        return 'Unknown';
    }
};

/**
 * Format duration in milliseconds to human-readable string
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted duration string
 */
export const formatDuration = (milliseconds: number): string => {
    if (milliseconds <= 0) return 'Completed';

    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
};
