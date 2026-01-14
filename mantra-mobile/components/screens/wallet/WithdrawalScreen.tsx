import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, typography } from '../../../constants';
import walletService from '../../../services/walletService';
import authService from '../../../services/authService';
import { useTheme } from '../../../context/ThemeContext';
import { useAlert } from '../../../context/AlertContext';

interface SavedAddress {
  label: string;
  address: string;
}

interface WithdrawalScreenProps {
  navigation: any;
}

const WithdrawalScreen: React.FC<WithdrawalScreenProps> = ({ navigation }) => {
  const { theme, isDarkMode } = useTheme();
  const { showAlert } = useAlert();
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  const [label, setLabel] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const networkFee = 0.00001;
  const minimumWithdrawal = 10;

  useEffect(() => {
    initializeUser();
    loadSavedAddresses();
  }, []);

  const initializeUser = async () => {
    const user = await authService.getCurrentUser();
    if (user) {
      setCurrentUserId(user.id);
      await loadWalletBalance(user.id);
    }
    setIsLoading(false);
  };

  const loadWalletBalance = async (userId: string) => {
    try {
      const wallet = await walletService.getWallet(userId);
      if (wallet) {
        setAvailableBalance(wallet.balance);
      }
    } catch (error) {
      console.error('Error loading wallet balance:', error);
    }
  };

  const loadSavedAddresses = async () => {
    try {
      const stored = await AsyncStorage.getItem('walletAddresses');
      if (stored) {
        setSavedAddresses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading saved addresses:', error);
    }
  };

  const saveSavedAddresses = async (addresses: SavedAddress[]) => {
    try {
      await AsyncStorage.setItem('walletAddresses', JSON.stringify(addresses));
      setSavedAddresses(addresses);
    } catch (error) {
      console.error('Error saving addresses:', error);
    }
  };

  const useAddress = (index: number) => {
    setWalletAddress(savedAddresses[index].address);
    setShowSavedAddresses(false);
    setSaveAddress(false);
    setLabel('');
  };

  const openEditModal = (index: number) => {
    setEditingIndex(index);
    setEditLabel(savedAddresses[index].label);
    setEditAddress(savedAddresses[index].address);
    setEditModalVisible(true);
  };

  const saveEdit = () => {
    if (!editLabel.trim() || !editAddress.trim()) {
      showAlert('error', 'Error', 'Please fill in all fields');
      return;
    }

    if (editingIndex !== null) {
      const updated = [...savedAddresses];
      updated[editingIndex] = { label: editLabel.trim(), address: editAddress.trim() };
      saveSavedAddresses(updated);
      setEditModalVisible(false);
      setEditingIndex(null);
    }
  };

  const openDeleteModal = (index: number) => {
    setDeletingIndex(index);
    setDeleteModalVisible(true);
  };

  const confirmDelete = () => {
    if (deletingIndex !== null) {
      const updated = savedAddresses.filter((_, i) => i !== deletingIndex);
      saveSavedAddresses(updated);
      setDeleteModalVisible(false);
      setDeletingIndex(null);
    }
  };

  const handleWithdrawal = async () => {
    if (!currentUserId) {
      showAlert('error', 'Error', 'Please login to make a withdrawal');
      return;
    }

    const withdrawAmount = parseFloat(amount);

    if (!amount || isNaN(withdrawAmount)) {
      showAlert('error', 'Error', 'Please enter a valid amount');
      return;
    }

    if (withdrawAmount < minimumWithdrawal) {
      showAlert('error', 'Error', `Minimum withdrawal is ${minimumWithdrawal} XLM`);
      return;
    }

    if (withdrawAmount > availableBalance) {
      showAlert('error', 'Error', 'Insufficient balance');
      return;
    }

    if (!walletAddress.trim()) {
      showAlert('error', 'Error', 'Please enter your Stellar wallet address');
      return;
    }

    if (!walletAddress.startsWith('G') || walletAddress.length !== 56) {
      showAlert('error', 'Error', 'Please enter a valid Stellar address (starts with G and is 56 characters)');
      return;
    }

    // Save address if checkbox is checked
    if (saveAddress) {
      if (!label.trim()) {
        showAlert('error', 'Error', 'Please enter a label for this address');
        return;
      }

      // Check if address already exists
      const exists = savedAddresses.some(addr => addr.address === walletAddress);
      if (!exists) {
        const updated = [...savedAddresses, { label: label.trim(), address: walletAddress }];
        await saveSavedAddresses(updated);
      }
    }

    try {
      // Submit withdrawal request to backend
      const result = await walletService.createWithdrawalRequest(
        currentUserId,
        withdrawAmount,
        walletAddress
      );

      if (result.success) {
        const total = (withdrawAmount + networkFee).toFixed(7);
        showAlert(
          'success',
          'Withdrawal Requested',
          `Withdrawal request submitted successfully!\n\nAmount: ${withdrawAmount} XLM\nNetwork Fee: ~${networkFee} XLM\nTotal: ${total} XLM\n\nStatus: Pending approval`,
          [
            {
              text: 'OK',
              onPress: () => {
                setAmount('');
                setWalletAddress('');
                setSaveAddress(false);
                setLabel('');
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        showAlert('error', 'Error', result.message || 'Failed to process withdrawal');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      showAlert('error', 'Error', 'Failed to process withdrawal. Please try again.');
    }
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Withdraw Funds</Text>
      </View>

      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: isDarkMode ? theme.card : colors.white, borderColor: theme.border }]}>
          <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>Available Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={[styles.balanceAmount, { color: theme.text }]}>{availableBalance.toLocaleString()}</Text>
            <Text style={[styles.balanceCurrency, { color: theme.textSecondary }]}>XLM</Text>
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Amount (XLM)</Text>
          <View style={styles.amountContainer}>
            <TextInput
              style={[styles.amountInput, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.4)' : colors.slate400}
            />
            <Text style={[styles.currencyLabel, { color: theme.textSecondary }]}>XLM</Text>
          </View>
        </View>

        {/* Wallet Address */}
        <View style={styles.inputGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Stellar Wallet Address</Text>
            {savedAddresses.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowSavedAddresses(!showSavedAddresses)}
                style={styles.savedButton}
                activeOpacity={0.7}
              >
                <Feather name="bookmark" size={14} color={theme.primary} />
                <Text style={[styles.savedButtonText, { color: theme.primary }]}>{savedAddresses.length} Saved</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            placeholder="G..."
            value={walletAddress}
            onChangeText={setWalletAddress}
            autoCapitalize="characters"
            placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.4)' : colors.slate400}
          />

          {/* Save Address Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setSaveAddress(!saveAddress)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, { backgroundColor: saveAddress ? theme.primary : theme.card, borderColor: saveAddress ? theme.primary : theme.border }]}>
              {saveAddress && <Feather name="check" size={12} color={colors.white} />}
            </View>
            <Text style={[styles.checkboxLabel, { color: theme.textSecondary }]}>Save this address for future use</Text>
          </TouchableOpacity>

          {/* Label Input */}
          {saveAddress && (
            <View style={styles.labelContainer}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                placeholder="Label (e.g., Main Wallet)"
                value={label}
                onChangeText={setLabel}
                placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.4)' : colors.slate400}
              />
            </View>
          )}
        </View>

        {/* Saved Addresses List */}
        {showSavedAddresses && savedAddresses.length > 0 && (
          <View style={styles.savedAddressesSection}>
            <View style={styles.savedAddressesHeader}>
              <Feather name="bookmark" size={14} color={theme.textSecondary} />
              <Text style={[styles.savedAddressesTitle, { color: theme.textSecondary }]}>Saved Addresses</Text>
            </View>
            {savedAddresses.map((addr, index) => (
              <View key={index} style={[styles.savedAddressItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <TouchableOpacity
                  style={styles.savedAddressContent}
                  onPress={() => useAddress(index)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.savedAddressLabel, { color: theme.text }]}>{addr.label}</Text>
                  <Text style={[styles.savedAddressText, { color: theme.textSecondary }]} numberOfLines={1}>{addr.address}</Text>
                </TouchableOpacity>
                <View style={styles.savedAddressActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditModal(index)}
                    activeOpacity={0.7}
                  >
                    <Feather name="edit-2" size={16} color={theme.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openDeleteModal(index)}
                    activeOpacity={0.7}
                  >
                    <Feather name="trash-2" size={16} color={colors.red500} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Withdrawal Info */}
        <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Network Fee</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>~{networkFee} XLM</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Minimum Withdrawal</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{minimumWithdrawal} XLM</Text>
          </View>
        </View>

        {/* Withdrawal Button */}
        <TouchableOpacity
          style={[styles.withdrawButton, { backgroundColor: theme.primary }]}
          onPress={handleWithdrawal}
          activeOpacity={0.7}
        >
          <Text style={styles.withdrawButtonText}>Request Withdrawal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Address Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Address</Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Feather name="x" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Label</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                placeholder="e.g., Main Wallet"
                value={editLabel}
                onChangeText={setEditLabel}
                placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.4)' : colors.slate400}
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                placeholder="G..."
                value={editAddress}
                onChangeText={setEditAddress}
                autoCapitalize="characters"
                placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.4)' : colors.slate400}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalSaveButton, { backgroundColor: theme.primary }]}
              onPress={saveEdit}
              activeOpacity={0.7}
            >
              <Text style={styles.modalSaveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.deleteModalOverlay}>
          <View style={[styles.deleteModalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.deleteIconContainer, { backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : colors.red100 }]}>
              <Feather name="trash-2" size={24} color={colors.red600} />
            </View>
            <Text style={[styles.deleteModalTitle, { color: theme.text }]}>Delete Address?</Text>
            <Text style={[styles.deleteModalMessage, { color: theme.textSecondary }]}>This action cannot be undone.</Text>

            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteCancelButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                onPress={() => setDeleteModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.deleteCancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={confirmDelete}
                activeOpacity={0.7}
              >
                <Text style={styles.deleteConfirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: spacing[4],
  },
  balanceCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate100,
    padding: spacing[4],
    backgroundColor: colors.white,
  },
  balanceLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.slate500,
    marginBottom: spacing[1],
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[2],
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  balanceCurrency: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate500,
  },
  inputGroup: {
    gap: spacing[1],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.slate500,
  },
  savedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  savedButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.sky500,
  },
  amountContainer: {
    position: 'relative',
  },
  amountInput: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    paddingHorizontal: spacing[3],
    paddingRight: spacing[12],
    paddingVertical: spacing[2],
    fontSize: typography.fontSize.sm,
    color: colors.slate900,
    backgroundColor: colors.white,
  },
  currencyLabel: {
    position: 'absolute',
    right: spacing[3],
    top: '50%',
    transform: [{ translateY: -8 }],
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate400,
  },
  input: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: typography.fontSize.sm,
    color: colors.slate900,
    backgroundColor: colors.white,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.sky500,
    borderColor: colors.sky500,
  },
  checkboxLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.slate600,
  },
  labelContainer: {
    marginTop: spacing[2],
  },
  savedAddressesSection: {
    gap: spacing[2],
  },
  savedAddressesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  savedAddressesTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate700,
  },
  savedAddressItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[2],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    padding: spacing[3],
    backgroundColor: colors.white,
  },
  savedAddressContent: {
    flex: 1,
    minWidth: 0,
  },
  savedAddressLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate700,
    marginBottom: spacing[1],
  },
  savedAddressText: {
    fontSize: typography.fontSize.xs,
    color: colors.slate500,
  },
  savedAddressActions: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  actionButton: {
    padding: spacing[1.5],
    borderRadius: borderRadius.lg,
  },
  infoCard: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.slate50,
    padding: spacing[3],
    gap: spacing[1],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.slate500,
  },
  infoValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.slate700,
  },
  withdrawButton: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.sky500,
    paddingVertical: spacing[5],
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  withdrawButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius['3xl'],
    borderTopRightRadius: borderRadius['3xl'],
    padding: spacing[6],
    gap: spacing[4],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
  },
  modalCloseButton: {
    padding: spacing[2],
    borderRadius: borderRadius.lg,
  },
  modalInputGroup: {
    gap: spacing[1],
  },
  modalSaveButton: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.sky500,
    paddingVertical: spacing[5],
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modalSaveButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  deleteModalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    padding: spacing[6],
    width: '100%',
    maxWidth: 400,
    gap: spacing[4],
  },
  deleteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.red100,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing[3],
  },
  deleteModalTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate900,
    textAlign: 'center',
    marginBottom: spacing[1],
  },
  deleteModalMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.slate500,
    textAlign: 'center',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  deleteCancelButton: {
    flex: 1,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.slate200,
    paddingVertical: spacing[5],
    alignItems: 'center',
  },
  deleteCancelButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.slate700,
  },
  deleteConfirmButton: {
    flex: 1,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.red500,
    paddingVertical: spacing[5],
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default WithdrawalScreen;
