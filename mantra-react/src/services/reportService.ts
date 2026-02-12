import { supabase } from '@/lib/supabase/client';
import { handleSupabaseError } from '@/utils/supabaseHelpers';

export interface CreateReportData {
    reported_type: 'novel' | 'chapter' | 'review' | 'comment' | 'user';
    reported_id: string;
    reason: string;
    description?: string;
    evidence_url?: string;
}

export interface Report {
    id: string;
    reporter_id: string;
    reported_type: string;
    reported_id: string;
    reason: string;
    description?: string;
    evidence_url?: string;
    status: string;
    created_at: string;
    resolved_at?: string;
    resolved_by?: string;
    resolution_notes?: string;
}

/**
 * Report Service
 * Handles content reporting and moderation
 * Synced with mobile app implementation
 */
class ReportService {

    /**
     * Submit a report
     */
    async submitReport(
        reporterId: string,
        data: CreateReportData
    ): Promise<{ success: boolean; message: string }> {
        try {
            const { error } = await supabase
                .from('reports')
                .insert({
                    reporter_id: reporterId,
                    ...data,
                });

            if (error) throw error;

            return {
                success: true,
                message: 'Report submitted successfully',
            };
        } catch (error: any) {
            return {
                success: false,
                message: handleSupabaseError(error),
            };
        }
    }

    /**
     * Get user's reports
     */
    async getUserReports(
        userId: string,
        page: number = 1,
        pageSize: number = 20
    ): Promise<Report[]> {
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('reporter_id', userId)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting user reports:', error);
            return [];
        }
    }

    /**
     * Get report count for a specific item
     */
    async getReportCount(reportedType: string, reportedId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true })
                .eq('reported_type', reportedType)
                .eq('reported_id', reportedId);

            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error getting report count:', error);
            return 0;
        }
    }

    /**
     * Check if user has already reported an item
     */
    async hasUserReported(
        userId: string,
        reportedType: string,
        reportedId: string
    ): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('id')
                .eq('reporter_id', userId)
                .eq('reported_type', reportedType)
                .eq('reported_id', reportedId)
                .maybeSingle();

            if (error) throw error;
            return !!data;
        } catch (error) {
            console.error('Error checking if user reported:', error);
            return false;
        }
    }

    /**
     * Quick report (one-click report for reviews and comments)
     */
    async quickReport(
        reporterId: string,
        reportedType: 'review' | 'comment',
        reportedId: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            // Check if already reported
            const hasReported = await this.hasUserReported(reporterId, reportedType, reportedId);
            if (hasReported) {
                return {
                    success: false,
                    message: 'You have already reported this content',
                };
            }

            return await this.submitReport(reporterId, {
                reported_type: reportedType,
                reported_id: reportedId,
                reason: 'Inappropriate Content',
                description: 'Quick report',
            });
        } catch (error: any) {
            return {
                success: false,
                message: handleSupabaseError(error),
            };
        }
    }

    /**
     * Report a novel
     */
    async reportNovel(
        reporterId: string,
        novelId: string,
        reason: string,
        description?: string
    ): Promise<{ success: boolean; message: string }> {
        return this.submitReport(reporterId, {
            reported_type: 'novel',
            reported_id: novelId,
            reason,
            description,
        });
    }

    /**
     * Report a chapter
     */
    async reportChapter(
        reporterId: string,
        chapterId: string,
        reason: string,
        description?: string
    ): Promise<{ success: boolean; message: string }> {
        return this.submitReport(reporterId, {
            reported_type: 'chapter',
            reported_id: chapterId,
            reason,
            description,
        });
    }

    /**
     * Report a review
     */
    async reportReview(
        reporterId: string,
        reviewId: string,
        reason: string,
        description?: string
    ): Promise<{ success: boolean; message: string }> {
        return this.submitReport(reporterId, {
            reported_type: 'review',
            reported_id: reviewId,
            reason,
            description,
        });
    }

    /**
     * Report a comment
     */
    async reportComment(
        reporterId: string,
        commentId: string,
        reason: string,
        description?: string
    ): Promise<{ success: boolean; message: string }> {
        return this.submitReport(reporterId, {
            reported_type: 'comment',
            reported_id: commentId,
            reason,
            description,
        });
    }

    /**
     * Report a user
     */
    async reportUser(
        reporterId: string,
        userId: string,
        reason: string,
        description?: string
    ): Promise<{ success: boolean; message: string }> {
        return this.submitReport(reporterId, {
            reported_type: 'user',
            reported_id: userId,
            reason,
            description,
        });
    }

    /**
     * Get all reports (admin only)
     */
    async getAllReports(
        page: number = 1,
        pageSize: number = 20,
        status?: string
    ): Promise<Report[]> {
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase.from('reports').select('*');

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting all reports:', error);
            return [];
        }
    }

    /**
     * Get reports by type
     */
    async getReportsByType(
        reportedType: string,
        page: number = 1,
        pageSize: number = 20
    ): Promise<Report[]> {
        try {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('reported_type', reportedType)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting reports by type:', error);
            return [];
        }
    }

    /**
     * Get reports for a specific item
     */
    async getReportsForItem(
        reportedType: string,
        reportedId: string
    ): Promise<Report[]> {
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('*')
                .eq('reported_type', reportedType)
                .eq('reported_id', reportedId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting reports for item:', error);
            return [];
        }
    }
    /**
     * Get details for report context
     */
    async getReportContext(type: string, id: string): Promise<{ name: string; extra?: string } | null> {
        try {
            if (type === 'novel') {
                const { data } = await supabase.from('novels').select('title').eq('id', id).single();
                return data ? { name: data.title } : null;
            } else if (type === 'chapter') {
                // For chapter, we need chapter title AND novel title
                const { data } = await supabase
                    .from('chapters')
                    .select('title, novel:novels(title, id)')
                    .eq('id', id)
                    .single();

                if (data) {
                    // Start of workaround for nested data typing
                    const novelData = data.novel as any;
                    const novelTitle = novelData?.title || 'Unknown Novel';
                    // End of workaround
                    return {
                        name: `Chapter: ${data.title}`,
                        extra: novelTitle
                    };
                }
                return null;
            } else if (type === 'user') {
                const { data } = await supabase.from('profiles').select('username, display_name').eq('id', id).single();
                return data ? { name: data.display_name || data.username || 'Unknown User' } : null;
            }
            return null;
        } catch (error) {
            console.error('Error fetching report context:', error);
            return null;
        }
    }
}

export default new ReportService();
