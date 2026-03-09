import { useEffect, useRef, useState } from 'react';

interface ExoclickVideoAdProps {
    onComplete: () => void;
    onError: (error: string) => void;
    onClose: () => void;
}

// TODO: Replace with actual Exoclick zone ID
const EXOCLICK_ZONE_ID = 'YOUR_EXOCLICK_ZONE_ID';

/**
 * Exoclick Video Ad Component
 * 
 * Displays a video ad from Exoclick network.
 * Call onComplete when the video finishes playing.
 * 
 * Integration docs: https://www.exoclick.com/
 */
export default function ExoclickVideoAd({ onComplete, onError, onClose }: ExoclickVideoAdProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [canSkip, setCanSkip] = useState(false);

    useEffect(() => {
        // Simulate video ad loading and playing
        // Replace this with actual Exoclick SDK integration

        if (EXOCLICK_ZONE_ID === 'YOUR_EXOCLICK_ZONE_ID') {
            // Demo mode - simulate a 5 second video


            setIsLoading(false);

            const duration = 5000; // 5 seconds for demo
            const interval = 100; // Update every 100ms
            let elapsed = 0;

            const timer = setInterval(() => {
                elapsed += interval;
                const newProgress = Math.min((elapsed / duration) * 100, 100);
                setProgress(newProgress);

                if (elapsed >= 3000) {
                    setCanSkip(true);
                }

                if (elapsed >= duration) {
                    clearInterval(timer);
                    onComplete();
                }
            }, interval);

            return () => clearInterval(timer);
        }

        // Actual Exoclick integration would go here
        // Load the Exoclick SDK script and initialize video ad
        const script = document.createElement('script');
        script.src = `https://a.magsrv.com/ad-provider.js`;
        script.async = true;
        script.onerror = () => {
            onError('Failed to load ad provider');
        };

        document.head.appendChild(script);

        script.onload = () => {
            try {
                // Initialize Exoclick video ad
                // @ts-ignore - Exoclick global
                if (window.ExoLoader) {
                    // @ts-ignore
                    window.ExoLoader.addZone({ id: EXOCLICK_ZONE_ID });
                }
                setIsLoading(false);
            } catch {
                onError('Failed to initialize ad');
            }
        };

        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, [onComplete, onError]);

    const handleSkip = () => {
        if (canSkip) {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
            {/* Close button - only if allowed */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white text-sm"
            >
                ✕ Close
            </button>

            {/* Video container */}
            <div
                ref={containerRef}
                className="w-full max-w-2xl aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center"
            >
                {isLoading ? (
                    <div className="text-white">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-sm">Loading ad...</p>
                    </div>
                ) : (
                    <div className="text-center text-white">
                        <div className="text-6xl mb-4">🎬</div>
                        <p className="text-lg font-semibold mb-2">Demo Video Ad</p>
                        <p className="text-sm text-white/60">
                            {EXOCLICK_ZONE_ID === 'YOUR_EXOCLICK_ZONE_ID'
                                ? 'Configure EXOCLICK_ZONE_ID for real ads'
                                : 'Ad playing...'}
                        </p>
                    </div>
                )}
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-2xl mt-4">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-sky-500 transition-all duration-100"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-sm text-white/60">
                    <span>Ad playing...</span>
                    {canSkip ? (
                        <button
                            onClick={handleSkip}
                            className="text-sky-400 hover:text-sky-300 font-medium"
                        >
                            Skip Ad →
                        </button>
                    ) : (
                        <span>Skip in {Math.ceil((3000 - (progress / 100 * 5000)) / 1000)}s</span>
                    )}
                </div>
            </div>
        </div>
    );
}
