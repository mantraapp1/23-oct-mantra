import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../ToastManager';
import { useTheme } from '../../../context/ThemeContext';

interface CoinPackage {
  id: string;
  coins: number;
  price: number;
  bonus?: number;
  popular?: boolean;
  bestValue?: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

const TopUpScreen = () => {
  const navigation = useNavigation();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('card');
  const [isLoading, setIsLoading] = useState(false);

  const coinPackages: CoinPackage[] = [
    {
      id: 'small',
      coins: 100,
      price: 0.99,
    },
    {
      id: 'medium',
      coins: 500,
      price: 4.99,
      bonus: 50,
      popular: true,
    },
    {
      id: 'large',
      coins: 1000,
      price: 9.99,
      bonus: 150,
    },
    {
      id: 'xlarge',
      coins: 2500,
      price: 19.99,
      bonus: 500,
      bestValue: true,
    },
    {
      id: 'mega',
      coins: 5000,
      price: 39.99,
      bonus: 1200,
    },
    {
      id: 'ultimate',
      coins: 10000,
      price: 69.99,
      bonus: 3000,
    },
  ];

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: 'credit-card',
      enabled: true,
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: 'dollar-sign',
      enabled: true,
    },
    {
      id: 'apple',
      name: 'Apple Pay',
      icon: 'smartphone',
      enabled: true,
    },
    {
      id: 'google',
      name: 'Google Pay',
      icon: 'smartphone',
      enabled: true,
    },
  ];

  const handlePurchase = async () => {
    if (!selectedPackage) {
      showToast('error', 'Please select a coin package');
      return;
    }

    const packageData = coinPackages.find(pkg => pkg.id === selectedPackage);
    if (!packageData) return;

    Alert.alert(
      'Confirm Purchase',
      `Purchase ${packageData.coins}${packageData.bonus ? ` + ${packageData.bonus} bonus` : ''} coins for $${packageData.price}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Simulate payment processing
              await new Promise(resolve => setTimeout(resolve, 2000));
              showToast('success', 'Purchase successful! Coins added to your wallet.');
              navigation.goBack();
            } catch (error) {
              showToast('error', 'Purchase failed. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        },
      ]
    );
  };

  const renderCoinPackage = (pkg: CoinPackage) => (
    <TouchableOpacity
      key={pkg.id}
      style={[
        styles.packageCard,
        { backgroundColor: theme.card, borderColor: theme.border },
        selectedPackage === pkg.id && { borderColor: colors.sky500, backgroundColor: theme.primaryLight },
        pkg.popular && styles.popularPackage,
        pkg.bestValue && styles.bestValuePackage,
      ]}
      onPress={() => setSelectedPackage(pkg.id)}
    >
      {pkg.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>Most Popular</Text>
        </View>
      )}
      {pkg.bestValue && (
        <View style={styles.bestValueBadge}>
          <Text style={styles.bestValueText}>Best Value</Text>
        </View>
      )}
      <View style={styles.packageHeader}>
        <View style={[styles.coinIcon, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="dollar-sign" size={24} color={colors.amber500} />
        </View>
        <Text style={[styles.coinAmount, { color: theme.text }]}>{pkg.coins.toLocaleString()}</Text>
        <Text style={[styles.coinLabel, { color: theme.textSecondary }]}>coins</Text>
      </View>
      {pkg.bonus && (
        <View style={styles.bonusSection}>
          <Text style={styles.bonusText}>+{pkg.bonus} bonus coins</Text>
        </View>
      )}
      <View style={styles.packageFooter}>
        <Text style={[styles.packagePrice, { color: theme.text }]}>${pkg.price}</Text>
        <Text style={[styles.pricePerCoin, { color: theme.textSecondary }]}>
          ${(pkg.price / (pkg.coins + (pkg.bonus || 0))).toFixed(3)}/coin
        </Text>
      </View>
      {selectedPackage === pkg.id && (
        <View style={styles.selectedIndicator}>
          <Feather name="check" size={16} color={colors.white} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderPaymentMethod = (method: PaymentMethod) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentMethod,
        { backgroundColor: theme.card, borderColor: theme.border },
        selectedPayment === method.id && { borderColor: colors.sky500, backgroundColor: theme.primaryLight },
        !method.enabled && styles.disabledPayment,
      ]}
      onPress={() => method.enabled && setSelectedPayment(method.id)}
      disabled={!method.enabled}
    >
      <View style={[styles.paymentIcon, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name={method.icon as any} size={20} color={theme.textSecondary} />
      </View>
      <Text style={[
        styles.paymentName,
        { color: theme.text },
        !method.enabled && styles.disabledText
      ]}>
        {method.name}
      </Text>
      {selectedPayment === method.id && (
        <Feather name="check-circle" size={20} color={colors.sky500} />
      )}
      {!method.enabled && (
        <Text style={styles.comingSoonText}>Coming Soon</Text>
      )}
    </TouchableOpacity>
  );

  const selectedPackageData = coinPackages.find(pkg => pkg.id === selectedPackage);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Top Up Coins</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Balance */}
        <View style={[styles.balanceSection, { backgroundColor: theme.backgroundSecondary, borderBottomColor: theme.border }]}>
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Current Balance</Text>
          <Text style={[styles.balanceAmount, { color: theme.text }]}>1,250 coins</Text>
        </View>

        {/* Coin Packages */}
        <View style={[styles.packagesSection, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Choose Package</Text>
          <View style={styles.packagesGrid}>
            {coinPackages.map(renderCoinPackage)}
          </View>
        </View>

        {/* Payment Methods */}
        <View style={[styles.paymentSection, { borderBottomColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Payment Method</Text>
          <View style={styles.paymentMethods}>
            {paymentMethods.map(renderPaymentMethod)}
          </View>
        </View>

        {/* Purchase Summary */}
        {selectedPackageData && (
          <View style={[styles.summarySection, { borderBottomColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Purchase Summary</Text>
            <View style={[styles.summaryCard, { backgroundColor: theme.backgroundSecondary }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Coins</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>
                  {selectedPackageData.coins.toLocaleString()}
                </Text>
              </View>
              {selectedPackageData.bonus && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Bonus Coins</Text>
                  <Text style={[styles.summaryValue, styles.bonusValue]}>
                    +{selectedPackageData.bonus.toLocaleString()}
                  </Text>
                </View>
              )}
              <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryTotal, { color: theme.text }]}>Total Coins</Text>
                <Text style={[styles.summaryTotalValue, { color: theme.text }]}>
                  {(selectedPackageData.coins + (selectedPackageData.bonus || 0)).toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryTotal, { color: theme.text }]}>Amount</Text>
                <Text style={[styles.summaryTotalValue, { color: theme.text }]}>
                  ${selectedPackageData.price}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Security Notice */}
        <View style={[styles.securitySection, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={[styles.securityIcon, { backgroundColor: theme.card }]}>
            <Feather name="shield" size={16} color={colors.emerald500} />
          </View>
          <Text style={[styles.securityText, { color: theme.textSecondary }]}>
            Your payment is secured with 256-bit SSL encryption. We never store your payment information.
          </Text>
        </View>
      </ScrollView>

      {/* Purchase Button */}
      <View style={styles.purchaseSection}>
        <TouchableOpacity
          style={[
            styles.purchaseButton,
            (!selectedPackage || isLoading) && { backgroundColor: theme.border, shadowOpacity: 0, elevation: 0 }
          ]}
          onPress={handlePurchase}
          disabled={!selectedPackage || isLoading}
        >
          <Text style={styles.purchaseButtonText}>
            {isLoading ? 'Processing...' : selectedPackageData ? `Purchase for $${selectedPackageData.price}` : 'Select Package'}
          </Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  backButton: {
    padding: spacing[2],
    borderRadius: borderRadius.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  balanceSection: {
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: colors.slate50,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  balanceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.slate600,
    marginBottom: spacing[1],
  },
  balanceAmount: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.slate900,
  },
  packagesSection: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    marginBottom: spacing[4],
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  packageCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 2,
    borderColor: colors.slate200,
    position: 'relative',
  },
  selectedPackage: {
    borderColor: colors.sky500,
    backgroundColor: colors.sky50,
  },
  popularPackage: {
    borderColor: colors.emerald500,
  },
  bestValuePackage: {
    borderColor: colors.purple500,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: spacing[2],
    right: spacing[2],
    backgroundColor: colors.emerald500,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing[1],
    alignItems: 'center',
  },
  popularText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -8,
    left: spacing[2],
    right: spacing[2],
    backgroundColor: colors.purple500,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing[1],
    alignItems: 'center',
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  packageHeader: {
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  coinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.amber100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  coinAmount: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.slate900,
  },
  coinLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.slate600,
  },
  bonusSection: {
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  bonusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.emerald600,
  },
  packageFooter: {
    alignItems: 'center',
  },
  packagePrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.slate900,
    marginBottom: spacing[0.5],
  },
  pricePerCoin: {
    fontSize: typography.fontSize.xs,
    color: colors.slate500,
  },
  selectedIndicator: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.sky500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentSection: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  paymentMethods: {
    gap: spacing[2],
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  selectedPayment: {
    borderColor: colors.sky500,
    backgroundColor: colors.sky50,
  },
  disabledPayment: {
    opacity: 0.5,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.slate50,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  paymentName: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate900,
  },
  disabledText: {
    color: colors.slate500,
  },
  comingSoonText: {
    fontSize: typography.fontSize.sm,
    color: colors.slate500,
    fontStyle: 'italic',
  },
  summarySection: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.slate100,
  },
  summaryCard: {
    backgroundColor: colors.slate50,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  summaryLabel: {
    fontSize: typography.fontSize.base,
    color: colors.slate600,
  },
  summaryValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate900,
  },
  bonusValue: {
    color: colors.emerald600,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.slate200,
    marginVertical: spacing[2],
  },
  summaryTotal: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  summaryTotalValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.slate900,
  },
  securitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    backgroundColor: colors.emerald50,
    margin: spacing[4],
    borderRadius: borderRadius.lg,
  },
  securityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.emerald700,
    lineHeight: 18,
  },
  purchaseSection: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  purchaseButton: {
    backgroundColor: colors.sky500,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    shadowColor: colors.sky500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  purchaseButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default TopUpScreen;