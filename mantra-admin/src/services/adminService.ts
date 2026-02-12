import { createClient } from '@/lib/supabase/client';
import { Profile, Novel, Report } from '@/types/supabase';

class AdminService {
    private supabase = createClient();

    async getAllUsers(page = 1, limit = 20, query = '') {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let queryBuilder = this.supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .range(from, to)
            .order('created_at', { ascending: false });

        if (query) {
            queryBuilder = queryBuilder.or(`username.ilike.%${query}%,email.ilike.%${query}%`);
        }

        const { data, error, count } = await queryBuilder;

        if (error) throw error;

        return { users: data as Profile[], count };
    }

    async getUserById(userId: string) {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data as Profile;
    }

    async updateUserRole(userId: string, role: 'user' | 'author' | 'admin') {
        const { error } = await this.supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId);

        if (error) throw error;
    }

    // Placeholder for gifting (needs backend function usually)
    async giftUser(userId: string, amount: number, reason: string) {
        // Logic to add transaction and update wallet
        // For now, just logging
        console.log(`Gifting ${amount} to ${userId} for ${reason}`);
        return { success: true };
    }
}

export const adminService = new AdminService();
