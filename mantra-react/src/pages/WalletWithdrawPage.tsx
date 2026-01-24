import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createClient } from '@/lib/supabase/client';

// Stellar address validation - must start with G and be 56 characters
const validateStellarAddress = (address: string): boolean => {
    const stellarRegex = /^G[A-Z0-9]{55}$/;
    return stellarRegex.test(address);
};

export default function WalletWithdrawPage() {
    const navigate = useNavigate();
    const supabase = createClient();

    const [userId, setUserId] = useState<string | null>(null);
    const [balance, setBalance] = useState(0);
    const [amount, setAmount] = useState('');
    const [stellarAddress, setStellarAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        loadWallet();
    }, []);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const withdrawAmount = parseFloat(amount);
        const MIN_WITHDRAWAL = 10; // Matching mobile app

        if (!withdrawAmount || withdrawAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }
        if (withdrawAmount < MIN_WITHDRAWAL) {
            setError(`Minimum withdrawal is ${MIN_WITHDRAWAL} XLM`);
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

        setIsSubmitting(true);

        try {
            if (!userId) throw new Error('Not authenticated');

            const networkFee = 0.00001; // Stellar network fee

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
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center font-inter">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Withdrawal Requested</h1>
                <p className="text-slate-500 mb-6">
                    Your withdrawal of {amount} XLM is being processed. It may take 24-48 hours.
                </p>
                <Link to="/wallet" className="text-sky-600 font-semibold hover:underline">
                    Back to Wallet
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto px-4 py-8 font-inter text-slate-800">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link to="/wallet" className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
                </Link>
                <h1 className="text-xl font-bold text-slate-900">Withdraw</h1>
            </div>

            {/* Balance Card */}
            <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl p-6 text-white mb-8">
                <p className="text-white/80 text-sm mb-1">Available Balance</p>
                <p className="text-3xl font-bold">{balance.toFixed(2)} XLM</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Amount */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Amount (XLM)</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        min="10"
                        step="0.01"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-lg"
                    />
                    <p className="text-xs text-slate-500 mt-1">Minimum withdrawal: 10 XLM</p>
                </div>

                {/* Stellar Address */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Stellar Wallet Address</label>
                    <input
                        type="text"
                        value={stellarAddress}
                        onChange={(e) => setStellarAddress(e.target.value.toUpperCase())}
                        placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                        maxLength={56}
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">Must start with G and be 56 characters</p>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-sky-500 text-white rounded-xl font-bold hover:bg-sky-600 transition-colors disabled:opacity-50"
                >
                    {isSubmitting ? 'Processing...' : 'Request Withdrawal'}
                </button>
            </form>
        </div>
    );
}
