import { createClient } from '@/lib/supabase/client';
import type {
    Profile, Novel, Chapter, Report, WithdrawalRequest,
    Transaction, Wallet, HomeSection, SectionNovel,
    FeaturedBanner, FAQ, ContactSubmission, Notification,
    DashboardStats, ChartDataPoint, ActivityItem,
    NovelWithAuthor, ReportWithDetails, WithdrawalWithUser,
} from '@/types/supabase';
import { subDays, format } from 'date-fns';

class AdminService {
    private get supabase() {
        return createClient();
    }

    // ═══════════════════════════════════════════
    // DASHBOARD
    // ═══════════════════════════════════════════

    async getDashboardStats(): Promise<DashboardStats> {
        const now = new Date();
        const weekAgo = subDays(now, 7).toISOString();

        const [
            usersRes,
            novelsRes,
            chaptersRes,
            reportsRes,
            withdrawalsRes,
            revenueRes,
            newUsersRes,
            newNovelsRes,
        ] = await Promise.all([
            this.supabase.from('profiles').select('*', { count: 'exact', head: true }),
            this.supabase.from('novels').select('*', { count: 'exact', head: true }),
            this.supabase.from('chapters').select('*', { count: 'exact', head: true }),
            this.supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            this.supabase.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            this.supabase.from('transactions').select('amount').eq('type', 'earning').eq('status', 'successful'),
            this.supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
            this.supabase.from('novels').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
        ]);

        const totalRevenue = (revenueRes.data || []).reduce((sum, t) => sum + (t.amount || 0), 0);

        return {
            totalUsers: usersRes.count || 0,
            totalNovels: novelsRes.count || 0,
            totalChapters: chaptersRes.count || 0,
            pendingReports: reportsRes.count || 0,
            pendingWithdrawals: withdrawalsRes.count || 0,
            totalRevenue,
            newUsersThisWeek: newUsersRes.count || 0,
            newNovelsThisWeek: newNovelsRes.count || 0,
        };
    }

    async getRevenueChart(days = 30): Promise<ChartDataPoint[]> {
        const startDate = subDays(new Date(), days).toISOString();
        const { data } = await this.supabase
            .from('transactions')
            .select('amount, created_at')
            .eq('type', 'earning')
            .eq('status', 'successful')
            .gte('created_at', startDate)
            .order('created_at', { ascending: true });

        if (!data) return [];

        const grouped: Record<string, number> = {};
        data.forEach(t => {
            const date = format(new Date(t.created_at), 'MMM dd');
            grouped[date] = (grouped[date] || 0) + t.amount;
        });

        return Object.entries(grouped).map(([date, value]) => ({ date, value }));
    }

    async getUserGrowthChart(days = 30): Promise<ChartDataPoint[]> {
        const startDate = subDays(new Date(), days).toISOString();
        const { data } = await this.supabase
            .from('profiles')
            .select('created_at')
            .gte('created_at', startDate)
            .order('created_at', { ascending: true });

        if (!data) return [];

        const grouped: Record<string, number> = {};
        data.forEach(p => {
            if (p.created_at) {
                const date = format(new Date(p.created_at), 'MMM dd');
                grouped[date] = (grouped[date] || 0) + 1;
            }
        });

        return Object.entries(grouped).map(([date, value]) => ({ date, value }));
    }

    async getRecentActivity(limit = 10): Promise<ActivityItem[]> {
        const activities: ActivityItem[] = [];

        const [usersRes, novelsRes, reportsRes] = await Promise.all([
            this.supabase.from('profiles').select('id, username, display_name, created_at')
                .order('created_at', { ascending: false }).limit(5),
            this.supabase.from('novels').select('id, title, created_at, author_id')
                .order('created_at', { ascending: false }).limit(5),
            this.supabase.from('reports').select('id, reported_type, reason, created_at')
                .order('created_at', { ascending: false }).limit(5),
        ]);

        usersRes.data?.forEach(u => {
            activities.push({
                id: `user-${u.id}`,
                type: 'new_user',
                title: 'New User Registered',
                description: u.display_name || u.username || 'Unknown',
                timestamp: u.created_at || new Date().toISOString(),
            });
        });

        novelsRes.data?.forEach(n => {
            activities.push({
                id: `novel-${n.id}`,
                type: 'new_novel',
                title: 'Novel Published',
                description: n.title,
                timestamp: n.created_at,
            });
        });

        reportsRes.data?.forEach(r => {
            activities.push({
                id: `report-${r.id}`,
                type: 'new_report',
                title: 'New Report',
                description: `${r.reported_type}: ${r.reason}`,
                timestamp: r.created_at,
            });
        });

        return activities
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
    }

    // ═══════════════════════════════════════════
    // USER MANAGEMENT
    // ═══════════════════════════════════════════

    async getAllUsers(page = 1, limit = 20, query = '', roleFilter = '') {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let queryBuilder = this.supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .range(from, to)
            .order('created_at', { ascending: false });

        if (query) {
            queryBuilder = queryBuilder.or(`username.ilike.%${query}%,display_name.ilike.%${query}%`);
        }

        if (roleFilter === 'admin') {
            const { data: admins } = await this.supabase.from('admins').select('user_id');
            const adminIds = admins?.map(a => a.user_id) || [];
            if (adminIds.length === 0) {
                return { users: [], count: 0 };
            }
            queryBuilder = queryBuilder.in('id', adminIds);
        } else if (roleFilter === 'author') {
            const { data: novels } = await this.supabase.from('novels').select('author_id');
            const authorIds = Array.from(new Set(novels?.map(n => n.author_id) || []));
            if (authorIds.length === 0) {
                return { users: [], count: 0 };
            }
            queryBuilder = queryBuilder.in('id', authorIds);
        } else if (roleFilter === 'user') {
            const [adminsRes, novelsRes] = await Promise.all([
                this.supabase.from('admins').select('user_id'),
                this.supabase.from('novels').select('author_id'),
            ]);
            const excludedIds = [
                ...(adminsRes.data?.map(a => a.user_id) || []),
                ...(novelsRes.data?.map(n => n.author_id) || []),
            ];
            if (excludedIds.length > 0) {
                queryBuilder = queryBuilder.not('id', 'in', `(${excludedIds.join(',')})`);
            }
        }

        const { data, error, count } = await queryBuilder;
        if (error) throw error;

        // Fetch all admins and authors in this batch to map roles
        const userIds = data?.map(u => u.id) || [];
        
        let adminIds = new Set<string>();
        let authorIds = new Set<string>();

        if (userIds.length > 0) {
            const [adminsRes, novelsRes] = await Promise.all([
                this.supabase.from('admins').select('user_id').in('user_id', userIds),
                this.supabase.from('novels').select('author_id').in('author_id', userIds),
            ]);
            adminIds = new Set(adminsRes.data?.map(a => a.user_id) || []);
            authorIds = new Set(novelsRes.data?.map(n => n.author_id) || []);
        }

        const users = (data || []).map((u: any) => ({
            ...u,
            role: adminIds.has(u.id) ? 'admin' : (authorIds.has(u.id) ? 'author' : 'user'),
            is_verified: !!u.email_confirmed_at,
        })) as unknown as Profile[];

        return { users, count: count || 0 };
    }

    async getUserById(userId: string) {
        const { data, error } = await this.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        // Fetch if admin
        const { data: admin } = await this.supabase
            .from('admins')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        // Fetch if author (check if has novels)
        const { count } = await this.supabase
            .from('novels')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', userId);

        return {
            ...data,
            role: admin ? 'admin' : ((count || 0) > 0 ? 'author' : 'user'),
            is_verified: !!data.email_confirmed_at,
        } as unknown as Profile;
    }

    async getUserDetails(userId: string) {
        const [profileRes, novelsRes, walletRes, followersRes, followingRes, adminRes] = await Promise.all([
            this.supabase.from('profiles').select('*').eq('id', userId).single(),
            this.supabase.from('novels').select('*', { count: 'exact' }).eq('author_id', userId),
            this.supabase.from('wallets').select('*').eq('user_id', userId).single(),
            this.supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
            this.supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
            this.supabase.from('admins').select('id').eq('user_id', userId).maybeSingle(),
        ]);

        const profileData = profileRes.data;
        let mappedProfile: Profile | null = null;
        
        if (profileData) {
            const isAdmin = !!adminRes.data;
            const isAuthor = (novelsRes.count || 0) > 0;
            mappedProfile = {
                ...profileData,
                role: isAdmin ? 'admin' : (isAuthor ? 'author' : 'user'),
                is_verified: !!profileData.email_confirmed_at,
            } as unknown as Profile;
        }

        return {
            profile: mappedProfile,
            novels: novelsRes.data as Novel[],
            novelCount: novelsRes.count || 0,
            wallet: walletRes.data as Wallet | null,
            followersCount: followersRes.count || 0,
            followingCount: followingRes.count || 0,
        };
    }

    async updateUserRole(userId: string, role: 'user' | 'author' | 'admin') {
        if (role === 'admin') {
            // Check if already admin to avoid duplicate key errors
            const { data: existing } = await this.supabase
                .from('admins')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle();
            
            if (!existing) {
                const { data: { user } } = await this.supabase.auth.getUser();
                const { error } = await this.supabase
                    .from('admins')
                    .insert({
                        user_id: userId,
                        granted_by: user?.id || null,
                        notes: 'Granted via Admin Panel'
                    });
                if (error) throw error;
            }
        } else {
            // Remove from admins table if role is changed to user or author
            const { error } = await this.supabase
                .from('admins')
                .delete()
                .eq('user_id', userId);
            if (error) throw error;
        }
    }

    async toggleUserVerification(userId: string, isVerified: boolean) {
        const { error } = await this.supabase
            .from('profiles')
            .update({ email_confirmed_at: isVerified ? new Date().toISOString() : null })
            .eq('id', userId);
        if (error) throw error;
    }

    async sendUserNotification(userId: string, title: string, message: string) {
        const { error } = await this.supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type: 'admin_message',
                title,
                message,
                is_read: false,
            });
        if (error) throw error;
    }

    async giftUser(userId: string, amount: number, reason: string) {
        // Create transaction record
        const { error: txError } = await this.supabase
            .from('transactions')
            .insert({
                user_id: userId,
                type: 'earning',
                amount,
                novel_name: `Admin Gift: ${reason}`,
                status: 'successful',
            });
        if (txError) throw txError;

        // Update wallet balance
        const { data: wallet } = await this.supabase
            .from('wallets')
            .select('balance, total_earned')
            .eq('user_id', userId)
            .single();

        if (wallet) {
            const { error: walletError } = await this.supabase
                .from('wallets')
                .update({
                    balance: wallet.balance + amount,
                    total_earned: wallet.total_earned + amount,
                })
                .eq('user_id', userId);
            if (walletError) throw walletError;
        }

        // Send notification
        await this.sendUserNotification(userId, 'Gift Received! 🎁', `You received ${amount} coins. Reason: ${reason}`);
    }

    // ═══════════════════════════════════════════
    // NOVEL MANAGEMENT
    // ═══════════════════════════════════════════

    async getAllNovels(page = 1, limit = 20, query = '', statusFilter = '', featuredFilter = '') {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let queryBuilder = this.supabase
            .from('novels')
            .select('*, author:profiles!author_id(id, username, display_name, profile_picture_url)', { count: 'exact' })
            .range(from, to)
            .order('created_at', { ascending: false });

        if (query) {
            queryBuilder = queryBuilder.ilike('title', `%${query}%`);
        }

        if (statusFilter) {
            queryBuilder = queryBuilder.eq('status', statusFilter);
        }

        if (featuredFilter === 'featured') {
            queryBuilder = queryBuilder.eq('is_featured', true);
        } else if (featuredFilter === 'editors_pick') {
            queryBuilder = queryBuilder.eq('is_editors_pick', true);
        }

        const { data, error, count } = await queryBuilder;
        if (error) throw error;
        return { novels: data as NovelWithAuthor[], count: count || 0 };
    }

    async getNovelById(novelId: string) {
        const [novelRes, chaptersRes, reviewsRes] = await Promise.all([
            this.supabase
                .from('novels')
                .select('*, author:profiles!author_id(id, username, display_name, profile_picture_url)')
                .eq('id', novelId)
                .single(),
            this.supabase
                .from('chapters')
                .select('*')
                .eq('novel_id', novelId)
                .order('chapter_number', { ascending: true }),
            this.supabase
                .from('reviews')
                .select('*, user:profiles!user_id(id, username, display_name, profile_picture_url)')
                .eq('novel_id', novelId)
                .order('created_at', { ascending: false })
                .limit(20),
        ]);

        return {
            novel: novelRes.data as NovelWithAuthor,
            chapters: chaptersRes.data as Chapter[],
            reviews: reviewsRes.data || [],
        };
    }

    async toggleFeatured(novelId: string, isFeatured: boolean) {
        const { error } = await this.supabase
            .from('novels')
            .update({ is_featured: isFeatured })
            .eq('id', novelId);
        if (error) throw error;
    }

    async toggleEditorsPick(novelId: string, isEditorsPick: boolean) {
        const { error } = await this.supabase
            .from('novels')
            .update({ is_editors_pick: isEditorsPick })
            .eq('id', novelId);
        if (error) throw error;
    }

    async updateNovelStatus(novelId: string, status: 'ongoing' | 'completed' | 'hiatus') {
        const { error } = await this.supabase
            .from('novels')
            .update({ status })
            .eq('id', novelId);
        if (error) throw error;
    }

    async deleteNovel(novelId: string) {
        // Delete chapters first
        await this.supabase.from('chapters').delete().eq('novel_id', novelId);
        // Delete reviews
        await this.supabase.from('reviews').delete().eq('novel_id', novelId);
        // Delete the novel
        const { error } = await this.supabase.from('novels').delete().eq('id', novelId);
        if (error) throw error;
    }

    // ═══════════════════════════════════════════
    // REPORTS & MODERATION
    // ═══════════════════════════════════════════

    async getAllReports(page = 1, limit = 20, statusFilter = '', typeFilter = '') {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let queryBuilder = this.supabase
            .from('reports')
            .select('*, reporter:profiles!reporter_id(id, username, display_name, profile_picture_url)', { count: 'exact' })
            .range(from, to)
            .order('created_at', { ascending: false });

        if (statusFilter) {
            queryBuilder = queryBuilder.eq('status', statusFilter);
        }

        if (typeFilter) {
            queryBuilder = queryBuilder.eq('reported_type', typeFilter);
        }

        const { data, error, count } = await queryBuilder;
        if (error) throw error;
        return { reports: data as ReportWithDetails[], count: count || 0 };
    }

    async getReportById(reportId: string) {
        const { data: report, error } = await this.supabase
            .from('reports')
            .select('*, reporter:profiles!reporter_id(id, username, display_name, profile_picture_url)')
            .eq('id', reportId)
            .single();

        if (error) throw error;

        // Fetch reported content based on type
        let reportedContent = null;
        if (report) {
            switch (report.reported_type) {
                case 'novel':
                    const { data: novel } = await this.supabase
                        .from('novels').select('*').eq('id', report.reported_id).single();
                    reportedContent = novel;
                    break;
                case 'user':
                    const { data: user } = await this.supabase
                        .from('profiles').select('*').eq('id', report.reported_id).single();
                    reportedContent = user;
                    break;
                case 'chapter':
                    const { data: chapter } = await this.supabase
                        .from('chapters').select('*').eq('id', report.reported_id).single();
                    reportedContent = chapter;
                    break;
                case 'comment':
                    const { data: comment } = await this.supabase
                        .from('comments').select('*').eq('id', report.reported_id).single();
                    reportedContent = comment;
                    break;
                case 'review':
                    const { data: review } = await this.supabase
                        .from('reviews').select('*').eq('id', report.reported_id).single();
                    reportedContent = review;
                    break;
            }
        }

        return { report: report as ReportWithDetails, reportedContent };
    }

    async resolveReport(reportId: string, adminId: string) {
        const { error } = await this.supabase
            .from('reports')
            .update({
                status: 'resolved',
                resolved_at: new Date().toISOString(),
                resolved_by: adminId,
            })
            .eq('id', reportId);
        if (error) throw error;
    }

    async dismissReport(reportId: string, adminId: string) {
        const { error } = await this.supabase
            .from('reports')
            .update({
                status: 'dismissed',
                resolved_at: new Date().toISOString(),
                resolved_by: adminId,
            })
            .eq('id', reportId);
        if (error) throw error;
    }

    // ═══════════════════════════════════════════
    // FINANCIALS
    // ═══════════════════════════════════════════

    async getFinancialSummary() {
        const [earningsRes, withdrawalsRes, pendingRes, walletsRes] = await Promise.all([
            this.supabase.from('transactions').select('amount').eq('type', 'earning').eq('status', 'successful'),
            this.supabase.from('transactions').select('amount').eq('type', 'withdrawal').eq('status', 'successful'),
            this.supabase.from('withdrawal_requests').select('amount', { count: 'exact' }).eq('status', 'pending'),
            this.supabase.from('wallets').select('balance'),
        ]);

        const totalEarnings = (earningsRes.data || []).reduce((s, t) => s + t.amount, 0);
        const totalWithdrawals = (withdrawalsRes.data || []).reduce((s, t) => s + t.amount, 0);
        const pendingAmount = (pendingRes.data || []).reduce((s, t) => s + t.amount, 0);
        const totalBalance = (walletsRes.data || []).reduce((s, w) => s + w.balance, 0);

        return {
            totalEarnings,
            totalWithdrawals,
            pendingWithdrawals: pendingRes.count || 0,
            pendingAmount,
            platformBalance: totalBalance,
        };
    }

    async getAllWithdrawals(page = 1, limit = 20, statusFilter = '') {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let queryBuilder = this.supabase
            .from('withdrawal_requests')
            .select('*, user:profiles!user_id(id, username, display_name, profile_picture_url)', { count: 'exact' })
            .range(from, to)
            .order('requested_at', { ascending: false });

        if (statusFilter) {
            queryBuilder = queryBuilder.eq('status', statusFilter);
        }

        const { data, error, count } = await queryBuilder;
        if (error) throw error;
        return { withdrawals: data as WithdrawalWithUser[], count: count || 0 };
    }

    async approveWithdrawal(withdrawalId: string, adminId: string) {
        const { error } = await this.supabase
            .from('withdrawal_requests')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString(),
                approved_by: adminId,
            })
            .eq('id', withdrawalId);
        if (error) throw error;
    }

    async rejectWithdrawal(withdrawalId: string, reason: string) {
        const { error } = await this.supabase
            .from('withdrawal_requests')
            .update({
                status: 'rejected',
                rejection_reason: reason,
            })
            .eq('id', withdrawalId);
        if (error) throw error;
    }

    async completeWithdrawal(withdrawalId: string, stellarTxId: string) {
        const { error } = await this.supabase
            .from('withdrawal_requests')
            .update({
                status: 'completed',
                stellar_transaction_id: stellarTxId,
                completed_at: new Date().toISOString(),
            })
            .eq('id', withdrawalId);
        if (error) throw error;
    }

    async getAllTransactions(page = 1, limit = 20, typeFilter = '', statusFilter = '') {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let queryBuilder = this.supabase
            .from('transactions')
            .select('*, user:profiles!user_id(id, username, display_name)', { count: 'exact' })
            .range(from, to)
            .order('created_at', { ascending: false });

        if (typeFilter) {
            queryBuilder = queryBuilder.eq('type', typeFilter);
        }
        if (statusFilter) {
            queryBuilder = queryBuilder.eq('status', statusFilter);
        }

        const { data, error, count } = await queryBuilder;
        if (error) throw error;
        return { transactions: data || [], count: count || 0 };
    }

    // ═══════════════════════════════════════════
    // CMS - HOME SECTIONS
    // ═══════════════════════════════════════════

    async getHomeSections() {
        const { data, error } = await this.supabase
            .from('home_sections')
            .select('*')
            .order('priority_order', { ascending: true });
        if (error) throw error;
        return data as HomeSection[];
    }

    async createHomeSection(sectionName: string, isManual: boolean, priorityOrder: number) {
        const { data, error } = await this.supabase
            .from('home_sections')
            .insert({ section_name: sectionName, is_manual: isManual, priority_order: priorityOrder })
            .select()
            .single();
        if (error) throw error;
        return data as HomeSection;
    }

    async updateHomeSection(sectionId: string, updates: Partial<HomeSection>) {
        const { error } = await this.supabase
            .from('home_sections')
            .update(updates)
            .eq('id', sectionId);
        if (error) throw error;
    }

    async deleteHomeSection(sectionId: string) {
        await this.supabase.from('section_novels').delete().eq('section_id', sectionId);
        const { error } = await this.supabase.from('home_sections').delete().eq('id', sectionId);
        if (error) throw error;
    }

    async getSectionNovels(sectionId: string) {
        const { data, error } = await this.supabase
            .from('section_novels')
            .select('*, novel:novels!novel_id(id, title, cover_image_url, author_id)')
            .eq('section_id', sectionId)
            .order('display_order', { ascending: true });
        if (error) throw error;
        return data || [];
    }

    async addNovelToSection(sectionId: string, novelId: string, displayOrder: number) {
        const { error } = await this.supabase
            .from('section_novels')
            .insert({ section_id: sectionId, novel_id: novelId, display_order: displayOrder });
        if (error) throw error;
    }

    async removeNovelFromSection(sectionNovelId: string) {
        const { error } = await this.supabase
            .from('section_novels')
            .delete()
            .eq('id', sectionNovelId);
        if (error) throw error;
    }

    // ═══════════════════════════════════════════
    // CMS - FEATURED BANNERS
    // ═══════════════════════════════════════════

    async getFeaturedBanners() {
        const { data, error } = await this.supabase
            .from('featured_banners')
            .select('*')
            .order('display_order', { ascending: true });
        if (error) throw error;
        return data as FeaturedBanner[];
    }

    async createFeaturedBanner(banner: Omit<FeaturedBanner, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await this.supabase
            .from('featured_banners')
            .insert(banner)
            .select()
            .single();
        if (error) throw error;
        return data as FeaturedBanner;
    }

    async updateFeaturedBanner(bannerId: string, updates: Partial<FeaturedBanner>) {
        const { error } = await this.supabase
            .from('featured_banners')
            .update(updates)
            .eq('id', bannerId);
        if (error) throw error;
    }

    async deleteFeaturedBanner(bannerId: string) {
        const { error } = await this.supabase
            .from('featured_banners')
            .delete()
            .eq('id', bannerId);
        if (error) throw error;
    }

    // ═══════════════════════════════════════════
    // CMS - FAQs
    // ═══════════════════════════════════════════

    async getFAQs(category?: string) {
        let queryBuilder = this.supabase
            .from('faqs')
            .select('*')
            .order('display_order', { ascending: true });

        if (category) {
            queryBuilder = queryBuilder.eq('category', category);
        }

        const { data, error } = await queryBuilder;
        if (error) throw error;
        return data as FAQ[];
    }

    async createFAQ(faq: Omit<FAQ, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await this.supabase
            .from('faqs')
            .insert(faq)
            .select()
            .single();
        if (error) throw error;
        return data as FAQ;
    }

    async updateFAQ(faqId: string, updates: Partial<FAQ>) {
        const { error } = await this.supabase
            .from('faqs')
            .update(updates)
            .eq('id', faqId);
        if (error) throw error;
    }

    async deleteFAQ(faqId: string) {
        const { error } = await this.supabase
            .from('faqs')
            .delete()
            .eq('id', faqId);
        if (error) throw error;
    }

    // ═══════════════════════════════════════════
    // COMMUNICATION
    // ═══════════════════════════════════════════

    async getContactSubmissions(page = 1, limit = 20, statusFilter = '') {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let queryBuilder = this.supabase
            .from('contact_submissions')
            .select('*', { count: 'exact' })
            .range(from, to)
            .order('created_at', { ascending: false });

        if (statusFilter) {
            queryBuilder = queryBuilder.eq('status', statusFilter);
        }

        const { data, error, count } = await queryBuilder;
        if (error) throw error;
        return { submissions: data as ContactSubmission[], count: count || 0 };
    }

    async updateContactStatus(submissionId: string, status: 'responded' | 'resolved', adminId: string) {
        const { error } = await this.supabase
            .from('contact_submissions')
            .update({
                status,
                responded_at: new Date().toISOString(),
                responded_by: adminId,
            })
            .eq('id', submissionId);
        if (error) throw error;
    }

    async sendBroadcastNotification(title: string, message: string, roleFilter?: string) {
        // Get all users (or filtered by role)
        let queryBuilder = this.supabase.from('profiles').select('id');
        
        if (roleFilter === 'admin') {
            const { data: admins } = await this.supabase.from('admins').select('user_id');
            const adminIds = admins?.map(a => a.user_id) || [];
            queryBuilder = queryBuilder.in('id', adminIds);
        } else if (roleFilter === 'author') {
            const { data: novels } = await this.supabase.from('novels').select('author_id');
            const authorIds = Array.from(new Set(novels?.map(n => n.author_id) || []));
            queryBuilder = queryBuilder.in('id', authorIds);
        } else if (roleFilter === 'user') {
            const [adminsRes, novelsRes] = await Promise.all([
                this.supabase.from('admins').select('user_id'),
                this.supabase.from('novels').select('author_id'),
            ]);
            const excludedIds = [
                ...(adminsRes.data?.map(a => a.user_id) || []),
                ...(novelsRes.data?.map(n => n.author_id) || []),
            ];
            if (excludedIds.length > 0) {
                queryBuilder = queryBuilder.not('id', 'in', `(${excludedIds.join(',')})`);
            }
        }

        const { data: users, error: userError } = await queryBuilder;
        if (userError) throw userError;
        if (!users || users.length === 0) return;

        // Batch insert notifications (Supabase handles arrays)
        const notifications = users.map(u => ({
            user_id: u.id,
            type: 'admin_message' as const,
            title,
            message,
            is_read: false,
        }));

        // Insert in chunks of 500 to avoid payload limits
        for (let i = 0; i < notifications.length; i += 500) {
            const chunk = notifications.slice(i, i + 500);
            const { error } = await this.supabase.from('notifications').insert(chunk);
            if (error) throw error;
        }
    }

    // ═══════════════════════════════════════════
    // SEARCH (for CMS novel picker etc.)
    // ═══════════════════════════════════════════

    async searchNovels(query: string, limit = 10) {
        const { data, error } = await this.supabase
            .from('novels')
            .select('id, title, cover_image_url')
            .ilike('title', `%${query}%`)
            .limit(limit);
        if (error) throw error;
        return data || [];
    }
}

export const adminService = new AdminService();
