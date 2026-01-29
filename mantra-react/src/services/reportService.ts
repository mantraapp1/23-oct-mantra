import { supabase } from '@/lib/supabase/client';
import { handleSupabaseError } from '@/utils/supabaseHelpers';

export interface CreateReportData {
    reported_type: 'novel' | 'chapter' | 'review' | 'comment' | 'user';
    reported_id: string;
    reason: string;
    description?: string;
}

class ReportService {

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

    async quickReport(
        reporterId: string,
        reportedType: 'review' | 'comment',
        reportedId: string
    ): Promise<{ success: boolean; message: string }> {
        try {
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
}

export default new ReportService();
