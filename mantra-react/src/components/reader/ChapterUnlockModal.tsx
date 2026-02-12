import { useState, useEffect } from 'react';
import { Clock, Play, Lock, X, Loader2 } from 'lucide-react';
import ExoclickVideoAd from '@/components/ads/ExoclickVideoAd';

interface ChapterUnlockModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUnlock: (method: 'timer' | 'ad') => void;
    chapterNumber: number;
    waitHours: number;
    timerEndTime?: Date | null;
    isUnlocking: boolean;
}

/**
 * Chapter Unlock Modal
 * 
 * Shows when a user tries to access a locked chapter.
 * Provides two unlock options:
 * 1. Wait for timer (3hrs for ch 8-30, 24hrs for ch 31+)
 * 2. Watch an ad to unlock immediately
 */
export default function ChapterUnlockModal({
    isOpen,
    onClose,
    onUnlock,
    chapterNumber,
    waitHours,
    timerEndTime,
    isUnlocking,
}: ChapterUnlockModalProps) {
    const [showVideoAd, setShowVideoAd] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [isTimerActive, setIsTimerActive] = useState(false);

    // Format time remaining
    useEffect(() => {
        if (!timerEndTime) {
            setIsTimerActive(false);
            return;
        }

        const updateTimer = () => {
            const now = new Date();
            const diff = timerEndTime.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('Ready!');
                setIsTimerActive(false);
                return;
            }

            setIsTimerActive(true);
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
            } else if (minutes > 0) {
                setTimeLeft(`${minutes}m ${seconds}s`);
            } else {
                setTimeLeft(`${seconds}s`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [timerEndTime]);

    const handleStartTimer = () => {
        onUnlock('timer');
    };

    const handleWatchAd = () => {
        setShowVideoAd(true);
    };

    const handleAdComplete = () => {
        setShowVideoAd(false);
        onUnlock('ad');
    };

    const handleAdError = (error: string) => {
        console.error('Ad error:', error);
        setShowVideoAd(false);
        alert('Failed to load ad. Please try again.');
    };

    const handleAdClose = () => {
        setShowVideoAd(false);
    };

    if (!isOpen) return null;

    // Show video ad fullscreen
    if (showVideoAd) {
        return (
            <ExoclickVideoAd
                onComplete={handleAdComplete}
                onError={handleAdError}
                onClose={handleAdClose}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-background-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="p-6 pb-4 text-center border-b border-border">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                        Chapter {chapterNumber} is Locked
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                        Choose how you'd like to unlock this chapter
                    </p>
                </div>

                {/* Options */}
                <div className="p-6 space-y-4">
                    {/* Timer Option */}
                    <button
                        onClick={handleStartTimer}
                        disabled={isUnlocking || isTimerActive}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:bg-background-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-6 h-6 text-sky-500" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="font-semibold text-foreground">
                                {isTimerActive ? 'Timer Active' : `Wait ${waitHours} Hour${waitHours > 1 ? 's' : ''}`}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {isTimerActive
                                    ? `Unlocks in ${timeLeft}`
                                    : 'Start a timer to unlock for free'
                                }
                            </p>
                        </div>
                        {isUnlocking && (
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        )}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground font-medium">OR</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Watch Ad Option */}
                    <button
                        onClick={handleWatchAd}
                        disabled={isUnlocking}
                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Play className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                            <h3 className="font-semibold text-white">Watch an Ad</h3>
                            <p className="text-sm text-white/80">Unlock instantly by watching a short video</p>
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <p className="text-xs text-center text-muted-foreground">
                        First 7 chapters are always free. Unlocks expire after 72 hours.
                    </p>
                </div>
            </div>
        </div>
    );
}
