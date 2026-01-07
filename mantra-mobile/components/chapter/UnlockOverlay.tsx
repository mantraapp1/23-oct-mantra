import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../constants/theme';
import unlockService, { UnlockStatus } from '../../services/unlockService';
import { useToast } from '../ToastManager';
import { UNLOCK_SETTINGS } from '../../constants/supabase';

interface UnlockOverlayProps {
  userId: string;
  novelId: string;
  chapterId: string;
  authorId: string;
  onUnlocked: () => void;
}

const UnlockOverlay: React.FC<UnlockOverlayProps> = ({
  userId,
  novelId,
  chapterId,
  authorId,
  onUnlocked,
}) => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [unlockStatus, setUnlockStatus] = useState<UnlockStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingTimer, setIsStartingTimer] = useState(false);
  const [isUnlockingWithAd, setIsUnlockingWithAd] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const { showToast } = useToast();

  useEffect(() => {
    checkStatus();
  }, [userId, chapterId]);

  useEffect(() => {
    if (unlockStatus?.hasActiveTimer && unlockStatus.remainingTime) {
      setRemainingTime(unlockStatus.remainingTime);

      const interval = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1000) {
            clearInterval(interval);
            // Timer expired, check status again
            checkStatus();
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [unlockStatus]);

  // Auto-refresh status every 30 seconds to catch timer expiration
  useEffect(() => {
    if (unlockStatus?.hasActiveTimer) {
      const refreshInterval = setInterval(() => {
        checkStatus();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(refreshInterval);
    }
  }, [unlockStatus?.hasActiveTimer]);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const status = await unlockService.checkUnlockStatus(userId, chapterId);
      setUnlockStatus(status);

      if (status.isUnlocked) {
        onUnlocked();
      }
    } catch (error) {
      console.error('Error checking unlock status:', error);
      showToast('error', 'Failed to check unlock status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTimer = async () => {
    setIsStartingTimer(true);
    try {
      const response = await unlockService.startTimer(userId, novelId, chapterId);

      if (response.success) {
        showToast('success', response.message);
        await checkStatus();
      } else {
        showToast('error', response.message);
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to start timer');
    } finally {
      setIsStartingTimer(false);
    }
  };

  const handleUnlockWithAd = async () => {
    setIsUnlockingWithAd(true);
    try {
      // TODO: Show AdMob ad here
      // For now, simulate ad viewing
      showToast('info', 'Ad viewing would happen here');

      // TODO: Replace with actual AdMob ad unit ID
      const adUnitId = 'ca-app-pub-3940256099942544/1033173712'; // Test ad unit ID

      const response = await unlockService.unlockWithAd(
        userId,
        novelId,
        chapterId,
        authorId,
        adUnitId
      );

      if (response.success) {
        showToast('success', response.message);
        await checkStatus();
      } else {
        showToast('error', response.message);
      }
    } catch (error: any) {
      showToast('error', error.message || 'Failed to unlock with ad');
    } finally {
      setIsUnlockingWithAd(false);
    }
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      return `00:${String(seconds).padStart(2, '0')}`;
    }
  };

  const getTimerProgress = (): number => {
    if (!unlockStatus?.hasActiveTimer || !unlockStatus.timerExpiresAt) return 0;

    const totalDuration = UNLOCK_SETTINGS.DEFAULT_TIMER_HOURS * 60 * 60 * 1000;
    const elapsed = totalDuration - remainingTime;
    return Math.min(Math.max(elapsed / totalDuration, 0), 1);
  };

  if (isLoading) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Checking unlock status...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (unlockStatus?.isUnlocked) {
    return null;
  }

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Feather name="lock" size={48} color={theme.primary} />
          </View>

          <Text style={styles.title}>Chapter Locked</Text>
          <Text style={styles.description}>
            Unlock this chapter to continue reading
          </Text>

          {unlockStatus?.hasActiveTimer ? (
            <View style={styles.timerSection}>
              <View style={styles.timerIconContainer}>
                <Feather name="clock" size={32} color={theme.primary} />
              </View>
              <Text style={styles.timerLabel}>Timer Active</Text>
              <Text style={styles.timerCountdown}>
                {formatTime(remainingTime)}
              </Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${getTimerProgress() * 100}%` }
                  ]}
                />
              </View>
              <Text style={styles.timerNote}>
                Chapter will unlock automatically when timer expires
              </Text>
            </View>
          ) : (
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.timerButton]}
                onPress={handleStartTimer}
                disabled={isStartingTimer}
              >
                {isStartingTimer ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Feather name="clock" size={20} color={colors.white} />
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonText}>
                        Start {UNLOCK_SETTINGS.DEFAULT_TIMER_HOURS}h Timer
                      </Text>
                      <Text style={styles.buttonSubtext}>Wait to unlock</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.adButton]}
                onPress={handleUnlockWithAd}
                disabled={isUnlockingWithAd}
              >
                {isUnlockingWithAd ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Feather name="play-circle" size={20} color={colors.white} />
                    <View style={styles.buttonTextContainer}>
                      <Text style={styles.buttonText}>Watch Ad to Unlock</Text>
                      <Text style={styles.buttonSubtext}>Instant unlock</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.note}>
            {unlockStatus?.hasActiveTimer
              ? 'Your timer is running. Come back when it expires!'
              : `Choose one option to unlock this chapter for ${UNLOCK_SETTINGS.UNLOCK_DURATION_HOURS} hours`}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (theme: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[5],
  },
  card: {
    backgroundColor: theme.card,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: theme.card,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[3],
  },
  loadingText: {
    fontSize: typography.fontSize.sm,
    color: theme.textSecondary,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: theme.text,
    marginBottom: spacing[2],
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  timerSection: {
    width: '100%',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  timerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  timerLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: theme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timerCountdown: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    color: theme.primary,
    fontVariant: ['tabular-nums'],
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: theme.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing[2],
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: borderRadius.full,
  },
  timerNote: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  buttonsContainer: {
    width: '100%',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
  },
  timerButton: {
    backgroundColor: theme.primary,
  },
  adButton: {
    backgroundColor: colors.emerald500,
  },
  buttonTextContainer: {
    alignItems: 'flex-start',
  },
  buttonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white, // Keep white on primary/emerald
  },
  buttonSubtext: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  note: {
    fontSize: typography.fontSize.xs,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});

export default UnlockOverlay;
