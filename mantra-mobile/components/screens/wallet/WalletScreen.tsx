import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import walletService from '../../../services/walletService';
import authService from '../../../services/authService';
import { useToast } from '../../ToastManager';
import { useTheme } from '../../../context/ThemeContext';

interface WalletScreenProps {
  navigation: any;
}

interface Transaction {
  id: string;
  type: 'earning' | 'withdrawal';
  title: string;
  subtitle: string;
  amount: number;
  status: string;
  icon: string;
}

const WalletScreen: React.FC<WalletScreenProps> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadWalletData();
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

  const loadWalletData = async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      // Get wallet info
      const wallet = await walletService.getWallet(currentUserId);
      if (wallet) {
        setBalance(wallet.balance);
        setTotalEarned(wallet.total_earned);
      }

      // Get recent transactions
      const transactions = await walletService.getRecentTransactions(currentUserId);
      const formattedTransactions: Transaction[] = transactions.map((tx: any) => ({
        id: tx.id,
        type: tx.type,
        title: tx.type === 'earning' ? 'Novel Earnings' : 'Withdrawal',
        subtitle: tx.description || (tx.type === 'earning' ? 'From readers' : 'To Stellar Wallet'),
        amount: tx.type === 'earning' ? tx.amount : -tx.amount,
        status: tx.status,
        icon: tx.type === 'earning' ? 'trending-up' : 'arrow-down-right',
      }));
      setRecentTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      showToast('error', 'Failed to load wallet data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWalletData();
    setIsRefreshing(false);
  };

  const mockRecentTransactions = [
    {
      id: '1',
      type: 'earning',
      title: 'Novel Earnings',
      subtitle: 'Crimson Ledger',
      amount: 412.50,
      status: 'successful',
      icon: 'trending-up',
    },
    {
      id: '2',
      type: 'withdrawal',
      title: 'Withdrawal',
      subtitle: 'To Stellar Wallet',
      amount: -1650,
      status: 'pending',
      icon: 'arrow-down-right',
    },
    {
      id: '3',
      type: 'earning',
      title: 'Novel Earnings',
      subtitle: 'Crimson Ledger',
      amount: 370.20,
      status: 'successful',
      icon: 'trending-up',
    },
    {
      id: '4',
      type: 'withdrawal',
      title: 'Withdrawal',
      subtitle: 'To Stellar Wallet',
      amount: -2475,
      status: 'failed',
      icon: 'arrow-down-right',
    },
    {
      id: '5',
      type: 'earning',
      title: 'Novel Earnings',
      subtitle: 'Night Vault',
      amount: 294.50,
      status: 'successful',
      icon: 'trending-up',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'successful':
        return colors.emerald600;
      case 'pending':
        return '#d97706'; // amber-600 color
      case 'failed':
        return colors.red600;
      default:
        return colors.slate600;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'successful':
        return 'check-circle';
      case 'pending':
        return 'clock';
      case 'failed':
        return 'x-circle';
      default:
        return 'circle';
    }
  };

  const getTransactionItemStyle = (status: string) => {
    // HTML shows specific background colors for pending and failed transactions
    switch (status) {
      case 'pending':
        return {
          backgroundColor: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.075)',
          borderColor: isDarkMode ? 'rgba(245, 158, 11, 0.3)' : '#fef3c7',
        };
      case 'failed':
        return {
          backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.075)',
          borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : '#fecaca',
        };
      default:
        return {
          backgroundColor: theme.card,
          borderColor: theme.border,
        };
    }
  };

  const getTransactionIconBg = (status: string) => {
    switch (status) {
      case 'successful':
        return isDarkMode ? 'rgba(16, 185, 129, 0.15)' : colors.emerald50;
      case 'pending':
        return isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7';
      case 'failed':
        return isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fecaca';
      default:
        return theme.backgroundSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Wallet</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: theme.background }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.sky500}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.sky500} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading wallet...</Text>
          </View>
        ) : (
          <>
            {/* Balance Card */}
            <LinearGradient
              colors={[colors.sky500, '#4f46e5']} // sky-500 to indigo-600
              style={styles.balanceCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.balanceLabel, { color: 'rgba(255, 255, 255, 0.9)' }]}>Total Balance</Text>
              <View style={styles.balanceRow}>
                <Text style={[styles.balanceAmount, { color: '#ffffff' }]}>{balance.toLocaleString()}</Text>
                <Text style={[styles.balanceCurrency, { color: 'rgba(255, 255, 255, 0.9)' }]}>XLM</Text>
              </View>
              <Text style={[styles.totalEarned, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                Total Earned: {totalEarned.toLocaleString()} XLM
              </Text>
            </LinearGradient>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => navigation.navigate('TransactionHistory')}
              >
                <Feather name="clock" size={20} color={theme.textSecondary} />
                <Text style={[styles.actionButtonText, { color: theme.text }]}>History</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => navigation.navigate('Withdrawal')}
              >
                <Feather name="arrow-up-right" size={20} color={theme.textSecondary} />
                <Text style={[styles.actionButtonText, { color: theme.text }]}>Withdraw</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Transactions */}
            <View style={styles.transactionsSection}>
              <Text style={[styles.transactionsTitle, { color: theme.text }]}>Recent Transactions</Text>
              <View style={styles.transactionsList}>
                {recentTransactions.map((transaction) => (
                  <View
                    key={transaction.id}
                    style={[
                      styles.transactionItem,
                      getTransactionItemStyle(transaction.status),
                    ]}
                  >
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor: getTransactionIconBg(transaction.status),
                        },
                      ]}
                    >
                      <Feather
                        name={transaction.icon as any}
                        size={16}
                        color={getStatusColor(transaction.status)}
                      />
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={[styles.transactionTitle, { color: theme.text }]}>
                        {transaction.title}
                      </Text>
                      <Text style={[styles.transactionSubtitle, { color: theme.textSecondary }]}>
                        {transaction.subtitle}
                      </Text>
                      <View style={styles.transactionStatus}>
                        <Feather
                          name={getStatusIcon(transaction.status)}
                          size={12}
                          color={getStatusColor(transaction.status)}
                        />
                        <Text
                          style={[
                            styles.transactionStatusText,
                            { color: getStatusColor(transaction.status) },
                          ]}
                        >
                          {transaction.status.charAt(0).toUpperCase() +
                            transaction.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.transactionAmount,
                        {
                          color: getStatusColor(transaction.status),
                        },
                      ]}
                    >
                      {transaction.amount > 0 ? '+' : ''}
                      {transaction.amount} XLM
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
    gap: spacing[2],
  },
  backButton: {
    padding: spacing[2],
    borderRadius: borderRadius.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[24],
  },
  balanceCard: {
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  balanceAmount: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    letterSpacing: -0.5,
  },
  balanceCurrency: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  totalEarned: {
    fontSize: typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing[3],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[6],
  },
  actionButton: {
    flex: 1,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    padding: spacing[3],
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  actionButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate800,
    marginTop: spacing[1],
  },
  transactionsSection: {
    marginTop: spacing[6],
  },
  transactionsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    marginBottom: spacing[2],
  },
  transactionsList: {
    gap: spacing[2],
  },
  transactionItem: {
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
  transactionDetails: {
    flex: 1,
    minWidth: 0,
  },
  transactionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  transactionSubtitle: {
    fontSize: 11,
    color: colors.slate500,
  },
  transactionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: 4,
  },
  transactionStatusText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
  transactionAmount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    flexShrink: 0,
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

export default WalletScreen;