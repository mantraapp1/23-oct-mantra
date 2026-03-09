import { useEffect, useRef } from 'react';

interface AdSenseSidebarProps {
    position: 'left' | 'right';
    className?: string;
}

// TODO: Replace with actual AdSense publisher ID and ad slot
const ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';
const ADSENSE_SLOT = 'XXXXXXXXXX';

/**
 * Google AdSense Sidebar Ad Component
 * 
 * Displays a vertical banner ad on chapter reading pages.
 * Position can be 'left' or 'right'.
 * 
 * To configure:
 * 1. Replace ADSENSE_CLIENT with your publisher ID (ca-pub-XXXXX)
 * 2. Replace ADSENSE_SLOT with your ad unit slot ID
 */
export default function AdSenseSidebar({ position, className = '' }: AdSenseSidebarProps) {
    const adRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    useEffect(() => {
        // Only initialize once
        if (initialized.current) return;

        // Check if AdSense is configured
        if (ADSENSE_CLIENT === 'ca-pub-XXXXXXXXXXXXXXXX') {

            return;
        }

        // Load AdSense script if not already loaded
        if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
            const script = document.createElement('script');
            script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
            script.async = true;
            script.crossOrigin = 'anonymous';
            script.setAttribute('data-ad-client', ADSENSE_CLIENT);
            document.head.appendChild(script);
        }

        // Push the ad
        try {
            // @ts-ignore
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            initialized.current = true;
        } catch {
        }
    }, []);

    // Demo placeholder when not configured
    if (ADSENSE_CLIENT === 'ca-pub-XXXXXXXXXXXXXXXX') {
        return (
            <div
                className={`hidden lg:block w-[160px] min-h-[600px] bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-border ${className}`}
            >
                <div className="sticky top-20 p-4 text-center">
                    <div className="text-xs text-muted-foreground mb-2">AD</div>
                    <div className="text-4xl mb-4 opacity-20">📢</div>
                    <p className="text-xs text-muted-foreground">
                        AdSense Placeholder
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-2 opacity-60">
                        {position} sidebar
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={adRef}
            className={`hidden lg:block w-[160px] min-h-[600px] ${className}`}
        >
            <div className="sticky top-20">
                <ins
                    className="adsbygoogle"
                    style={{ display: 'block', width: '160px', height: '600px' }}
                    data-ad-client={ADSENSE_CLIENT}
                    data-ad-slot={ADSENSE_SLOT}
                    data-ad-format="vertical"
                />
            </div>
        </div>
    );
}
