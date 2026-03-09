/**
 * adBlocker.ts
 * Utility to detect the presence of Ad Blockers.
 * It injects a bait DOM element with classes commonly hidden by ad blockers.
 */

export const detectAdBlocker = async (): Promise<boolean> => {
    return new Promise((resolve) => {
        // Create an element with classes commonly targeted by ad blockers
        const baitElement = document.createElement('div');
        baitElement.className = 'ad-banner adsbox sponsor ad-placement google-ad ads ad-container';

        // Add random text so it has dimensions if not blocked
        baitElement.innerHTML = '&nbsp;';

        // Position it off-screen
        baitElement.style.position = 'absolute';
        baitElement.style.left = '-9999px';
        baitElement.style.top = '-9999px';
        baitElement.style.height = '10px';
        baitElement.style.width = '10px';

        // Append to body
        document.body.appendChild(baitElement);

        // Check after a short delay to allow ad blockers to do their work
        setTimeout(() => {
            const getComputedStyle = window.getComputedStyle(baitElement);

            // Typical signs an ad blocker hit it:
            // 1. display: none
            // 2. height or width: 0
            // 3. offsetParent is null (hidden)
            const isBlocked =
                getComputedStyle.display === 'none' ||
                baitElement.offsetHeight === 0 ||
                baitElement.offsetWidth === 0 ||
                baitElement.offsetParent === null;

            // Clean up
            if (document.body.contains(baitElement)) {
                document.body.removeChild(baitElement);
            }

            resolve(isBlocked);
        }, 150); // Small delay
    });
};
