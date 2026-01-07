import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import walletService from '../../../services/walletService';
import authService from '../../../services/authService';
import { useToast } from '../../ToastManager';
import { useTheme } from '../../../context/ThemeContext';

interface TransactionHistoryScreenProps {
  navigation: any;
}

interface Transaction {
  id: string;
  type: string;
  novelName: string;
  amount: number;
  status: 'Successful' | 'Pending' | 'Failed';
  date: string;
}

const TransactionHistoryScreen: React.FC<TransactionHistoryScreenProps> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadTransactions();
    }
  }, [currentUserId]);

  const initializeUser = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
    } else {
      setIsLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      const txData = await walletService.getTransactions(currentUserId, 1, 100);

      const formattedTransactions: Transaction[] = txData.map((tx: any) => ({
        id: tx.id,
        type: tx.type === 'earning' ? 'Novel Earnings' : 'Withdrawal',
        novelName: tx.description || 'Unknown',
        amount: Math.abs(tx.amount),
        status: capitalizeStatus(tx.status),
        date: formatDate(tx.created_at),
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      showToast('error', 'Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  };

  const capitalizeStatus = (status: string): 'Successful' | 'Pending' | 'Failed' => {
    const normalized = status.toLowerCase();
    if (normalized === 'successful' || normalized === 'completed') return 'Successful';
    if (normalized === 'pending') return 'Pending';
    return 'Failed';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTransactions();
    setIsRefreshing(false);
  };

  const getStatusConfig = (status: Transaction['status']) => {
    const configs = {
      Successful: {
        borderColor: theme.border,
        bgColor: theme.card,
        iconBg: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5',
        iconColor: '#059669',
        textColor: '#059669',
        icon: 'check-circle' as const,
      },
      Pending: {
        borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
        bgColor: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB',
        iconBg: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#FDE68A',
        iconColor: '#D97706',
        textColor: '#D97706',
        icon: 'clock' as const,
      },
      Failed: {
        borderColor: isDarkMode ? 'rgba(225, 29, 72, 0.3)' : '#FECDD3',
        bgColor: isDarkMode ? 'rgba(225, 29, 72, 0.1)' : '#FFF1F2',
        iconBg: isDarkMode ? 'rgba(225, 29, 72, 0.2)' : '#FECDD3',
        iconColor: '#E11D48',
        textColor: '#E11D48',
        icon: 'x-circle' as const,
      },
    };
    return configs[status];
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Transaction History</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.sky500} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading transactions...</Text>
        </View>
      ) : (
        <ScrollView
          style={[styles.scrollView, { backgroundColor: theme.background }]}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.sky500}
            />
          }
        >
          {/* Summary Card */}
          <View style={[styles.summaryCard, { backgroundColor: theme.primary }]}>
            <Text style={[styles.summaryLabel, { color: '#ffffff', opacity: 0.9 }]}>Total Transactions</Text>
            <Text style={[styles.summaryValue, { color: '#ffffff' }]}>{transactions.length}</Text>
            <Text style={[styles.summaryDate, { color: '#ffffff', opacity: 0.8 }]}>Last updated: Oct 21, 2025</Text>
          </View>

          {/* Transactions List */}
          <View style={styles.transactionsSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>All Transactions</Text>
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => {
                const config = getStatusConfig(transaction.status);
                const sign = transaction.status === 'Failed' ? '-' : '+';

                return (
                  <View
                    key={transaction.id}
                    style={[
                      styles.transactionCard,
                      { backgroundColor: config.bgColor, borderColor: config.borderColor },
                    ]}
                  >
                    <View style={[styles.transactionIcon, { backgroundColor: config.iconBg }]}>
                      <Feather name="trending-up" size={16} color={config.iconColor} />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={[styles.transactionType, { color: theme.text }]}>{transaction.type}</Text>
                      <Text style={[styles.transactionNovel, { color: theme.textSecondary }]} numberOfLines={1}>
                        {transaction.novelName}
                      </Text>
                      <View style={styles.transactionMeta}>
                        <Feather name={config.icon as any} size={12} color={config.textColor} />
                        <Text style={[styles.transactionStatus, { color: config.textColor }]}>
                          {transaction.status}
                        </Text>
                        <Text style={[styles.transactionDate, { color: theme.textSecondary, opacity: 0.6 }]}>{transaction.date}</Text>
                      </View>
                    </View>
                    <Text style={[styles.transactionAmount, { color: config.textColor }]}>
                      {sign}{transaction.amount.toFixed(2)} XLM
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  backButton: {
    padding: spacing[2],
    marginLeft: -spacing[2],
    borderRadius: borderRadius.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[24],
  },
  summaryCard: {
    borderRadius: borderRadius['2xl'],
    padding: spacing[5],
    marginBottom: spacing[4],
    backgroundColor: colors.sky500,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    opacity: 0.9,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    marginTop: spacing[1],
    letterSpacing: -0.5,
  },
  summaryDate: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    opacity: 0.8,
    marginTop: spacing[2],
  },
  transactionsSection: {
    marginTop: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    marginBottom: spacing[3],
  },
  transactionsList: {
    gap: spacing[2],
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },
  transactionType: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  transactionNovel: {
    fontSize: 11,
    color: colors.slate500,
    marginTop: spacing[0.5],
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[0.5],
  },
  transactionStatus: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
  transactionDate: {
    fontSize: 10,
    color: colors.slate400,
    marginLeft: spacing[1],
  },
  transactionAmount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[10],
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.sm,
    color: colors.slate500,
  },
});

export default TransactionHistoryScreen;
