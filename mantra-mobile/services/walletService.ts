import { supabase } from '../config/supabase';
import { handleSupabaseError, paginateQuery } from '../utils/supabaseHelpers';
import { Wallet, Transaction, SavedWalletAddress, WithdrawalRequest } from '../types/supabase';
import { PAGINATION, VALIDATION } from '../constants/supabase';

/**
 * Wallet Service
 * Handles wallet, transactions, and withdrawals
 */
class WalletService {
  /**
   * Get user's wallet
   */
  async getWallet(userId: string): Promise<Wallet | null> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      // Create wallet if it doesn't exist
      if (!data) {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({ user_id: userId })
          .select()
          .single();

        if (createError) throw createError;
        return newWallet;
      }

      return data;
    } catch (error) {
      console.error('Error getting wallet:', error);
      return null;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    userId: string,
    page: number = 1,
    pageSize: number = PAGINATION.TRANSACTIONS_PAGE_SIZE,
    type?: 'earning' | 'withdrawal'
  ): Promise<Transaction[]> {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId);

      if (type) {
        query = query.eq('type', type);
      }

      query = paginateQuery(query, page, pageSize);
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  /**
   * Get recent transactions (last 10)
   */
  async getRecentTransactions(userId: string): Promise<Transaction[]> {
    return this.getTransactions(userId, 1, 10);
  }

  /**
   * Save wallet address
   */
  async saveWalletAddress(
    userId: string,
    label: string,
    stellarAddress: string,
    isDefault: boolean = false
  ): Promise<{ success: boolean; message: string; address?: SavedWalletAddress }> {
    try {
      // Validate Stellar address format
      if (!this.validateStellarAddress(stellarAddress)) {
        return {
          success: false,
          message: 'Invalid Stellar address format',
        };
      }

      // If setting as default, unset other defaults
      if (isDefault) {
        await supabase
          .from('saved_wallet_addresses')
          .update({ is_default: false })
          .eq('user_id', userId);
      }

      const { data: address, error } = await supabase
        .from('saved_wallet_addresses')
        .insert({
          user_id: userId,
          label,
          stellar_address: stellarAddress,
          is_default: isDefault,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Wallet address saved successfully',
        address,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Get saved wallet addresses
   */
  async getSavedAddresses(userId: string): Promise<SavedWalletAddress[]> {
    try {
      const { data, error } = await supabase
        .from('saved_wallet_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting saved addresses:', error);
      return [];
    }
  }

  /**
   * Get default wallet address
   */
  async getDefaultAddress(userId: string): Promise<SavedWalletAddress | null> {
    try {
      const { data, error } = await supabase
        .from('saved_wallet_addresses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting default address:', error);
      return null;
    }
  }

  /**
   * Update wallet address
   */
  async updateWalletAddress(
    addressId: string,
    label?: string,
    isDefault?: boolean
  ): Promise<{ success: boolean; message: string }> {
    try {
      const updateData: any = {};
      if (label) updateData.label = label;
      if (isDefault !== undefined) updateData.is_default = isDefault;

      // If setting as default, unset other defaults
      if (isDefault) {
        const { data: address } = await supabase
          .from('saved_wallet_addresses')
          .select('user_id')
          .eq('id', addressId)
          .single();

        if (address) {
          await supabase
            .from('saved_wallet_addresses')
            .update({ is_default: false })
            .eq('user_id', address.user_id);
        }
      }

      const { error } = await supabase
        .from('saved_wallet_addresses')
        .update(updateData)
        .eq('id', addressId);

      if (error) throw error;

      return {
        success: true,
        message: 'Wallet address updated successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Delete wallet address
   */
  async deleteWalletAddress(addressId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('saved_wallet_addresses')
        .delete()
        .eq('id', addressId);

      if (error) throw error;

      return {
        success: true,
        message: 'Wallet address deleted successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Create withdrawal request
   */
  async createWithdrawalRequest(
    userId: string,
    amount: number,
    stellarAddress: string
  ): Promise<{ success: boolean; message: string; request?: WithdrawalRequest }> {
    try {
      // Validate amount
      if (amount < VALIDATION.MIN_WITHDRAWAL_AMOUNT) {
        return {
          success: false,
          message: `Minimum withdrawal amount is ${VALIDATION.MIN_WITHDRAWAL_AMOUNT} XLM`,
        };
      }

      // Validate Stellar address
      if (!this.validateStellarAddress(stellarAddress)) {
        return {
          success: false,
          message: 'Invalid Stellar address format',
        };
      }

      // Check wallet balance
      const wallet = await this.getWallet(userId);
      if (!wallet || wallet.balance < amount) {
        return {
          success: false,
          message: 'Insufficient balance',
        };
      }

      // Calculate network fee
      const networkFee = 0.00001; // Stellar network fee
      const totalAmount = amount + networkFee;

      if (wallet.balance < totalAmount) {
        return {
          success: false,
          message: 'Insufficient balance to cover network fee',
        };
      }

      // Create withdrawal request
      const { data: request, error } = await supabase
        .from('withdrawal_requests')
        .insert({
          user_id: userId,
          amount,
          stellar_address: stellarAddress,
          network_fee: networkFee,
          total_amount: totalAmount,
        })
        .select()
        .single();
      if (error) throw error;

      // Verify balance was deducted (should be handled by DB trigger)
      // Re-check wallet balance to confirm deduction
      const updatedWallet = await this.getWallet(userId);
      if (updatedWallet && updatedWallet.balance >= wallet.balance) {
        // Balance wasn't deducted - this could indicate a DB trigger issue
        console.warn('Withdrawal created but balance may not be properly deducted. Review DB triggers.');
      }

      return {
        success: true,
        message: 'Withdrawal request submitted successfully',
        request: request ?? undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Get withdrawal requests
   */
  async getWithdrawalRequests(
    userId: string,
    page: number = 1,
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<WithdrawalRequest[]> {
    try {
      let query = supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', userId);

      query = paginateQuery(query, page, pageSize);
      query = query.order('requested_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting withdrawal requests:', error);
      return [];
    }
  }

  /**
   * Validate Stellar address format
   */
  private validateStellarAddress(address: string): boolean {
    // Stellar addresses start with 'G' and are 56 characters long
    const stellarRegex = /^G[A-Z0-9]{55}$/;
    return stellarRegex.test(address);
  }

  /**
   * Get earnings by novel
   */
  async getEarningsByNovel(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('novel_id, novel_name, amount')
        .eq('user_id', userId)
        .eq('type', 'earning')
        .eq('status', 'successful')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by novel
      const grouped: { [key: string]: { novel_name: string; total: number } } = {};

      data?.forEach(transaction => {
        const key = transaction.novel_id || 'unknown';
        if (!grouped[key]) {
          grouped[key] = {
            novel_name: transaction.novel_name || 'Unknown',
            total: 0,
          };
        }
        grouped[key].total += transaction.amount;
      });

      return Object.entries(grouped).map(([novel_id, data]) => ({
        novel_id,
        ...data,
      }));
    } catch (error) {
      console.error('Error getting earnings by novel:', error);
      return [];
    }
  }
}

export default new WalletService();
