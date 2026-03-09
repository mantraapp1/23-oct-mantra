// Service Worker Unregistration Script
// This removes any stale service workers that may be caching error responses

export async function unregisterAllServiceWorkers(): Promise<void> {
    if ('serviceWorker' in navigator) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();

            for (const registration of registrations) {
                await registration.unregister();
            }

            if (registrations.length > 0) {
                // Clear all caches
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                }
            }
        } catch {
        }
    }
}

// Clear all browser caches for this origin
export async function clearAllCaches(): Promise<void> {
    try {
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
    } catch {
    }
}

// Clear storage and reload (nuclear option)
export function clearStorageAndReload(): void {
    // Clear localStorage
    localStorage.clear();

    // Clear sessionStorage
    sessionStorage.clear();

    // Clear cookies for this domain
    document.cookie.split(";").forEach((c) => {
        document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Clear caches and reload
    clearAllCaches().then(() => {
        window.location.reload();
    });
}
