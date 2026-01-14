/**
 * AdMob Rewarded Ad Hook
 * CRITICAL: Only records ad view AFTER user earns reward (watched completely)
 * 
 * This ensures authors only get paid for ads that AdMob pays for
 * 
 * NOTE: Requires react-native-google-mobile-ads package to be installed:
 *   npm install react-native-google-mobile-ads
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import adService from '../services/adService';
import unlockService from '../services/unlockService';
import { useToast } from '../components/ToastManager';

// Test Ad Unit IDs (replace with real ones in production via env)
const TEST_REWARDED_AD_ID = 'ca-app-pub-3940256099942544/5224354917';

// Dynamic import for AdMob (graceful fallback if not installed)
let RewardedAd: any = null;
let RewardedAdEventType: any = null;
let AdEventType: any = null;

try {
    const AdMob = require('react-native-google-mobile-ads');
    RewardedAd = AdMob.RewardedAd;
    RewardedAdEventType = AdMob.RewardedAdEventType;
    AdEventType = AdMob.AdEventType;
} catch (e) {
    console.warn('react-native-google-mobile-ads not installed. AdMob features will use simulation mode.');
}

interface UseRewardedAdOptions {
    adUnitId?: string;
    userId: string;
    novelId: string;
    chapterId: string;
    authorId: string;
}

interface RewardedAdState {
    isLoaded: boolean;
    isLoading: boolean;
    isShowing: boolean;
    error: string | null;
}

export function useRewardedAd({
    adUnitId = TEST_REWARDED_AD_ID,
    userId,
    novelId,
    chapterId,
    authorId,
}: UseRewardedAdOptions) {
    const { showToast } = useToast();
    const rewardedAdRef = useRef<any>(null);

    const [state, setState] = useState<RewardedAdState>({
        isLoaded: RewardedAd === null, // If AdMob not installed, pretend loaded for simulation
        isLoading: false,
        isShowing: false,
        error: null,
    });

    // Track if reward was earned (user watched completely)
    const rewardEarnedRef = useRef(false);

    /**
     * Load a new rewarded ad
     */
    const loadAd = useCallback(() => {
        // If AdMob not installed, skip loading (simulation mode)
        if (!RewardedAd) {
            setState(prev => ({ ...prev, isLoaded: true, isLoading: false }));
            return;
        }

        if (state.isLoading || state.isLoaded) return;

        setState(prev => ({ ...prev, isLoading: true, error: null }));
        rewardEarnedRef.current = false;

        try {
            const rewarded = RewardedAd.createForAdRequest(adUnitId, {
                requestNonPersonalizedAdsOnly: true,
            });

            rewardedAdRef.current = rewarded;

            const loadedUnsubscribe = rewarded.addAdEventListener(
                RewardedAdEventType.LOADED,
                () => {
                    setState(prev => ({ ...prev, isLoaded: true, isLoading: false }));
                }
            );

            const errorUnsubscribe = rewarded.addAdEventListener(
                AdEventType.ERROR,
                (error: any) => {
                    console.error('Rewarded ad error:', error);
                    setState(prev => ({
                        ...prev,
                        isLoading: false,
                        isLoaded: false,
                        error: error?.message || 'Failed to load ad',
                    }));
                }
            );

            const closedUnsubscribe = rewarded.addAdEventListener(
                AdEventType.CLOSED,
                async () => {
                    setState(prev => ({ ...prev, isShowing: false, isLoaded: false }));

                    // CRITICAL: Only record view if reward was earned
                    if (rewardEarnedRef.current) {
                        await recordAdViewAndUnlock();
                    } else {
                        showToast('info', 'Ad was not completed. No reward earned.');
                    }

                    loadedUnsubscribe();
                    errorUnsubscribe();
                    closedUnsubscribe();
                    rewardUnsubscribe();

                    setTimeout(() => loadAd(), 1000);
                }
            );

            // CRITICAL: Listen for reward earned
            const rewardUnsubscribe = rewarded.addAdEventListener(
                RewardedAdEventType.EARNED_REWARD,
                (reward: any) => {
                    console.log('User earned reward:', reward);
                    rewardEarnedRef.current = true;
                }
            );

            rewarded.load();

        } catch (error: any) {
            console.error('Failed to create rewarded ad:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: error?.message || 'Failed to create ad',
            }));
        }
    }, [adUnitId, state.isLoading, state.isLoaded]);

    /**
     * Record ad view and unlock chapter
     */
    const recordAdViewAndUnlock = async () => {
        try {
            // Record the ad view for author earnings
            const adResult = await adService.recordAdView(
                userId,
                novelId,
                chapterId,
                authorId,
                adUnitId
            );

            if (!adResult.success) {
                showToast('warning', adResult.message);
            }

            // Unlock the chapter
            const unlockResult = await unlockService.unlockWithAd(
                userId,
                novelId,
                chapterId,
                authorId,
                adUnitId
            );

            if (unlockResult.success) {
                showToast('success', 'Chapter unlocked! Thanks for watching.');
            } else {
                showToast('error', unlockResult.message);
            }
        } catch (error: any) {
            console.error('Failed to record ad view:', error);
            showToast('error', 'Failed to record ad view');
        }
    };

    /**
     * Show the loaded ad (or simulate if AdMob not installed)
     */
    const showAd = useCallback(async (): Promise<boolean> => {
        // Simulation mode if AdMob not installed
        if (!RewardedAd) {
            setState(prev => ({ ...prev, isShowing: true }));
            showToast('info', '🎬 Simulating ad view (AdMob not installed)...');

            // Simulate 3-second ad
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Simulate reward earned
            rewardEarnedRef.current = true;
            await recordAdViewAndUnlock();

            setState(prev => ({ ...prev, isShowing: false }));
            return true;
        }

        if (!state.isLoaded || !rewardedAdRef.current) {
            showToast('error', 'Ad not ready yet. Please wait...');
            return false;
        }

        try {
            setState(prev => ({ ...prev, isShowing: true }));
            rewardEarnedRef.current = false;
            await rewardedAdRef.current.show();
            return true;
        } catch (error: any) {
            console.error('Failed to show ad:', error);
            setState(prev => ({ ...prev, isShowing: false }));
            showToast('error', 'Failed to show ad');
            return false;
        }
    }, [state.isLoaded, showToast, userId, novelId, chapterId, authorId, adUnitId]);

    // Load ad on mount
    useEffect(() => {
        loadAd();
    }, []);

    return {
        isLoaded: state.isLoaded,
        isLoading: state.isLoading,
        isShowing: state.isShowing,
        error: state.error,
        showAd,
        loadAd,
    };
}
