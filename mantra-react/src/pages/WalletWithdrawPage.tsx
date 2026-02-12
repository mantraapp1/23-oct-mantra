import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { ChevronLeft, CheckCircle, Bookmark, Edit2, Trash2, X, Check } from 'lucide-react';

// Stellar address validation - must start with G and be 56 characters
const validateStellarAddress = (address: string): boolean => {
    const stellarRegex = /^G[A-Z0-9]{55}$/;
    return stellarRegex.test(address);
};

interface SavedAddress {
    label: string;
    address: string;
}

const SAVED_ADDRESSES_KEY = 'mantra_saved_wallet_addresses';

export default function WalletWithdrawPage() {
    const navigate = useNavigate();

    const [userId, setUserId] = useState<string | null>(null);
    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState('');
    const [stellarAddress, setStellarAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Saved addresses state
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
    const [showSavedAddresses, setShowSavedAddresses] = useState(false);
    const [saveAddress, setSaveAddress] = useState(false);
    const [label, setLabel] = useState('');

    // Edit modal state
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editLabel, setEditLabel] = useState('');
    const [editAddress, setEditAddress] = useState('');

    // Delete modal state
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

    const networkFee = 0.00001;
    const minimumWithdrawal = 10;

    useEffect(() => {
        loadWallet();
        loadSavedAddresses();
    }, []);

    const loadSavedAddresses = () => {
        try {
            const stored = localStorage.getItem(SAVED_ADDRESSES_KEY);
            if (stored) {
                setSavedAddresses(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading saved addresses:', error);
        }
    };

    const saveSavedAddressesToStorage = (addresses: SavedAddress[]) => {
        try {
            localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(addresses));
            setSavedAddresses(addresses);
        } catch (error) {
            console.error('Error saving addresses:', error);
        }
    };

    const loadWallet = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/login');
            return;
        }
        setUserId(user.id);

        // Get or create wallet
        let { data: wallet } = await supabase
            .from('wallets')
            .select('balance, stellar_address')
            .eq('user_id', user.id)
            .single();

        // Create wallet if it doesn't exist (matching mobile behavior)
        if (!wallet) {
            const { data: newWallet } = await supabase
                .from('wallets')
                .insert({ user_id: user.id })
                .select('balance, stellar_address')
                .single();
            wallet = newWallet;
        }

        if (wallet) {
            setBalance(wallet.balance || 0);
            setStellarAddress(wallet.stellar_address || '');
        }
        setIsLoading(false);
    };

    const useAddress = (index: number) => {
        setStellarAddress(savedAddresses[index].address);
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
            return;
        }

        if (editingIndex !== null) {
            const updated = [...savedAddresses];
            updated[editingIndex] = { label: editLabel.trim(), address: editAddress.trim() };
            saveSavedAddressesToStorage(updated);
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
            saveSavedAddressesToStorage(updated);
            setDeleteModalVisible(false);
            setDeletingIndex(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const withdrawAmount = parseFloat(amount);

        if (!withdrawAmount || withdrawAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }
        if (withdrawAmount < minimumWithdrawal) {
            setError(`Minimum withdrawal is ${minimumWithdrawal} XLM`);
            return;
        }
        if (withdrawAmount > balance) {
            setError('Insufficient balance');
            return;
        }
        if (!stellarAddress.trim()) {
            setError('Stellar address is required');
            return;
        }
        if (!validateStellarAddress(stellarAddress.trim())) {
            setError('Invalid Stellar address format. Must start with G and be 56 characters.');
            return;
        }

        // Save address if checkbox is checked
        if (saveAddress) {
            if (!label.trim()) {
                setError('Please enter a label for this address');
                return;
            }

            // Check if address already exists
            const exists = savedAddresses.some(addr => addr.address === stellarAddress);
            if (!exists) {
                const updated = [...savedAddresses, { label: label.trim(), address: stellarAddress }];
                saveSavedAddressesToStorage(updated);
            }
        }

        setIsSubmitting(true);

        try {
            if (!userId) throw new Error('Not authenticated');

            // Create withdrawal request (matching mobile walletService)
            const { error: reqError } = await supabase
                .from('withdrawal_requests')
                .insert({
                    user_id: userId,
                    amount: withdrawAmount,
                    stellar_address: stellarAddress.trim(),
                    network_fee: networkFee,
                    total_amount: withdrawAmount,
                });

            if (reqError) throw reqError;

            // Create pending transaction record for history
            await supabase
                .from('transactions')
                .insert({
                    user_id: userId,
                    type: 'withdrawal',
                    amount: withdrawAmount,
                    status: 'pending',
                    description: `Withdrawal to ${stellarAddress.slice(0, 8)}...`,
                });

            // Update wallet stellar address if changed
            await supabase
                .from('wallets')
                .update({ stellar_address: stellarAddress.trim() })
                .eq('user_id', userId);

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Withdrawal failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex justify-center items-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="max-w-md mx-auto px-4 py-20 text-center font-inter">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Withdrawal Requested</h1>
                    <p className="text-foreground-secondary mb-6">
                        Your withdrawal of {amount} XLM is being processed. It may take 24-48 hours.
                    </p>
                    <Link to="/wallet" className="text-primary font-semibold hover:underline">
                        Back to Wallet
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-xl mx-auto px-4 py-8 font-inter text-foreground">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/wallet" className="p-2 -ml-2 rounded-lg hover:bg-background-secondary transition-colors text-foreground-secondary hover:text-foreground">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-bold text-foreground">Withdraw Funds</h1>
                </div>

                {/* Balance Card */}
                <div className="bg-card border border-border rounded-2xl p-5 mb-6">
                    <p className="text-foreground-secondary text-sm mb-1">Available Balance</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-foreground">{balance.toLocaleString()}</span>
                        <span className="text-foreground-secondary font-medium">XLM</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {error && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Amount */}
                    <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-2">Amount (XLM)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                min="10"
                                step="0.01"
                                className="w-full px-4 py-3 pr-16 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-lg text-foreground"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground-secondary">XLM</span>
                        </div>
                    </div>

                    {/* Stellar Address with Saved Addresses Toggle */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-foreground-secondary">Stellar Wallet Address</label>
                            {savedAddresses.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowSavedAddresses(!showSavedAddresses)}
                                    className="flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors"
                                >
                                    <Bookmark className="w-3.5 h-3.5" />
                                    <span className="text-xs font-medium">{savedAddresses.length} Saved</span>
                                </button>
                            )}
                        </div>
                        <input
                            type="text"
                            value={stellarAddress}
                            onChange={(e) => setStellarAddress(e.target.value.toUpperCase())}
                            placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                            maxLength={56}
                            className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm text-foreground"
                        />

                        {/* Save Address Checkbox */}
                        <button
                            type="button"
                            onClick={() => setSaveAddress(!saveAddress)}
                            className="flex items-center gap-2 mt-3"
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${saveAddress ? 'bg-primary border-primary' : 'bg-card border-border'}`}>
                                {saveAddress && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-xs text-foreground-secondary">Save this address for future use</span>
                        </button>

                        {/* Label Input */}
                        {saveAddress && (
                            <div className="mt-3">
                                <input
                                    type="text"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    placeholder="Label (e.g., Main Wallet)"
                                    className="w-full px-4 py-2.5 bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-foreground"
                                />
                            </div>
                        )}
                    </div>

                    {/* Saved Addresses List */}
                    {showSavedAddresses && savedAddresses.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-1.5 text-foreground-secondary">
                                <Bookmark className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">Saved Addresses</span>
                            </div>
                            {savedAddresses.map((addr, index) => (
                                <div
                                    key={index}
                                    className="flex items-start justify-between gap-3 p-3 bg-card border border-border rounded-xl"
                                >
                                    <button
                                        type="button"
                                        onClick={() => useAddress(index)}
                                        className="flex-1 text-left min-w-0"
                                    >
                                        <p className="text-xs font-medium text-foreground mb-0.5">{addr.label}</p>
                                        <p className="text-xs text-foreground-secondary font-mono truncate">{addr.address}</p>
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => openEditModal(index)}
                                            className="p-1.5 rounded-lg hover:bg-background-secondary transition-colors text-foreground-secondary"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openDeleteModal(index)}
                                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-rose-500"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Info Card */}
                    <div className="bg-background-secondary rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-foreground-secondary">Network Fee</span>
                            <span className="text-xs font-medium text-foreground">~{networkFee} XLM</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-foreground-secondary">Minimum Withdrawal</span>
                            <span className="text-xs font-medium text-foreground">{minimumWithdrawal} XLM</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
                    >
                        {isSubmitting ? 'Processing...' : 'Request Withdrawal'}
                    </button>
                </form>
            </div>

            {/* Edit Modal */}
            {editModalVisible && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-card w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-foreground">Edit Address</h3>
                            <button
                                onClick={() => setEditModalVisible(false)}
                                className="p-2 rounded-lg hover:bg-background-secondary transition-colors text-foreground-secondary"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-foreground-secondary mb-1.5">Label</label>
                            <input
                                type="text"
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                placeholder="e.g., Main Wallet"
                                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm text-foreground"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-foreground-secondary mb-1.5">Address</label>
                            <input
                                type="text"
                                value={editAddress}
                                onChange={(e) => setEditAddress(e.target.value.toUpperCase())}
                                placeholder="G..."
                                className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono text-foreground"
                            />
                        </div>

                        <button
                            onClick={saveEdit}
                            className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalVisible && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card w-full max-w-sm rounded-2xl p-6 text-center space-y-4">
                        <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto">
                            <Trash2 className="w-6 h-6 text-rose-600" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">Delete Address?</h3>
                        <p className="text-sm text-foreground-secondary">This action cannot be undone.</p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModalVisible(false)}
                                className="flex-1 py-3 bg-background-secondary border border-border rounded-xl font-semibold text-foreground-secondary hover:bg-background transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
