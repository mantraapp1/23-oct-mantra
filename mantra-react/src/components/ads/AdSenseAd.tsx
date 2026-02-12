import { useEffect, useRef } from 'react';

type AdFormat = 'horizontal' | 'rectangle' | 'vertical' | 'in-article' | 'multiplex';
type AdPosition = 'before-content' | 'in-content' | 'after-content' | 'sidebar' | 'footer';

interface AdSenseAdProps {
    format: AdFormat;
    position: AdPosition;
    className?: string;
    slotId?: string;
}

// TODO: Replace with actual AdSense credentials
const ADSENSE_CLIENT = 'ca-pub-XXXXXXXXXXXXXXXX';
const AD_SLOTS = {
    'before-content': 'SLOT_BEFORE_CONTENT',
    'in-content': 'SLOT_IN_CONTENT',
    'after-content': 'SLOT_AFTER_CONTENT',
    'sidebar': 'SLOT_SIDEBAR',
    'footer': 'SLOT_FOOTER',
};

/**
 * Flexible AdSense Ad Component
 * 
 * Supports multiple ad formats and positions following Google's best practices:
 * - 30% ads to 70% content ratio
 * - 4-5 ad units on desktop
 * - 1-3 on mobile (responsive hiding)
 */
export default function AdSenseAd({ format, position, className = '', slotId }: AdSenseAdProps) {
    const adRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    // Ad size configurations
    const getAdDimensions = () => {
        switch (format) {
            case 'horizontal':
                return { width: '100%', height: '90px', minHeight: '90px' };
            case 'rectangle':
                return { width: '300px', height: '250px', minHeight: '250px' };
            case 'vertical':
                return { width: '160px', height: '600px', minHeight: '600px' };
            case 'in-article':
                return { width: '100%', height: 'auto', minHeight: '250px' };
            case 'multiplex':
                return { width: '100%', height: 'auto', minHeight: '200px' };
            default:
                return { width: '100%', height: 'auto', minHeight: '100px' };
        }
    };

    useEffect(() => {
        if (initialized.current) return;

        // Check if AdSense is configured
        if (ADSENSE_CLIENT === 'ca-pub-XXXXXXXXXXXXXXXX') {
            console.log(`[AdSenseAd] Demo mode - position: ${position}, format: ${format}`);
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

        // Push the ad after a short delay
        const timer = setTimeout(() => {
            try {
                // @ts-ignore
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                initialized.current = true;
            } catch (err) {
                console.error('[AdSenseAd] Failed to push ad:', err);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [format, position]);

    const dimensions = getAdDimensions();
    const actualSlot = slotId || AD_SLOTS[position] || AD_SLOTS['in-content'];

    // Demo placeholder
    if (ADSENSE_CLIENT === 'ca-pub-XXXXXXXXXXXXXXXX') {
        return (
            <div
                className={`ad-container ad-${format} ad-${position} ${className}`}
                style={{
                    width: dimensions.width,
                    minHeight: dimensions.minHeight,
                    maxWidth: '100%',
                }}
            >
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-4 text-center"
                    style={{ minHeight: dimensions.minHeight }}
                >
                    <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wider">
                        Advertisement
                    </div>
                    <div className="text-3xl mb-2 opacity-30">📢</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format} • {position}
                    </p>
                </div>
            </div>
        );
    }

    // Real AdSense ad
    return (
        <div
            ref={adRef}
            className={`ad-container ad-${format} ad-${position} ${className}`}
            style={{
                width: dimensions.width,
                minHeight: dimensions.minHeight,
                maxWidth: '100%',
            }}
        >
            <ins
                className="adsbygoogle"
                style={{
                    display: 'block',
                    width: dimensions.width,
                    height: dimensions.height,
                }}
                data-ad-client={ADSENSE_CLIENT}
                data-ad-slot={actualSlot}
                data-ad-format={format === 'in-article' ? 'fluid' : 'auto'}
                data-full-width-responsive="true"
            />
        </div>
    );
}

/**
 * In-Content Ad - Inserted between paragraphs
 */
export function InContentAd({ className = '' }: { className?: string }) {
    return (
        <div className={`my-8 ${className}`}>
            <AdSenseAd format="in-article" position="in-content" />
        </div>
    );
}

/**
 * Before Content Banner - Shown at top of chapter
 */
export function BeforeContentAd({ className = '' }: { className?: string }) {
    return (
        <div className={`mb-6 ${className}`}>
            <AdSenseAd format="horizontal" position="before-content" />
        </div>
    );
}

/**
 * After Content Banner - Shown at end of chapter
 */
export function AfterContentAd({ className = '' }: { className?: string }) {
    return (
        <div className={`mt-8 mb-4 ${className}`}>
            <AdSenseAd format="horizontal" position="after-content" />
        </div>
    );
}

/**
 * Sidebar Ad - Vertical format for sidebars
 */
export function SidebarAd({ className = '' }: { position: 'left' | 'right', className?: string }) {
    return (
        <div className={`hidden lg:block sticky top-20 ${className}`}>
            <AdSenseAd format="vertical" position="sidebar" />
        </div>
    );
}

/**
 * Multiplex Ad - Grid of recommended content ads
 */
export function MultiplexAd({ className = '' }: { className?: string }) {
    return (
        <div className={`my-6 ${className}`}>
            <AdSenseAd format="multiplex" position="footer" />
        </div>
    );
}
