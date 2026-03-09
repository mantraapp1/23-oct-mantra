/**
 * viewTracker.ts
 * Utility to track recent chapter views in localStorage to prevent view inflation
 * by debouncing multiple views of the same chapter within a 24-hour window.
 */

const RECENT_VIEWS_KEY = 'mantra_recent_views';
const DEBOUNCE_HOURS = 24;

interface RecentView {
    chapterId: string;
    viewedAt: number;
}

/**
 * Checks if a chapter has been viewed recently (within the debounce window).
 * If it hasn't, it records the new view.
 * 
 * @param chapterId - The ID of the chapter being viewed
 * @returns true if this is a fresh view that should be counted, false if it's a duplicate
 */
export const trackUniqueView = (chapterId: string): boolean => {
    try {
        const now = Date.now();
        const storedViewsStr = localStorage.getItem(RECENT_VIEWS_KEY);
        let recentViews: RecentView[] = storedViewsStr ? JSON.parse(storedViewsStr) : [];

        // Clean up old views (older than DEBOUNCE_HOURS)
        const cutoffTime = now - (DEBOUNCE_HOURS * 60 * 60 * 1000);
        recentViews = recentViews.filter(view => view.viewedAt > cutoffTime);

        // Check if the current chapter is in the recent views list
        const isDuplicateView = recentViews.some(view => view.chapterId === chapterId);

        if (isDuplicateView) {
            return false; // Don't count this view again
        }

        // Record the new view
        recentViews.push({ chapterId, viewedAt: now });

        // Save back to local storage
        localStorage.setItem(RECENT_VIEWS_KEY, JSON.stringify(recentViews));

        return true; // This is a fresh view
    } catch {
        // Fail open: let the view count happen if local storage fails
        return true;
    }
};
