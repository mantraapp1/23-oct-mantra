import { supabase } from '../config/supabase';
import { handleSupabaseError, paginateQuery } from '../utils/supabaseHelpers';
import { Report } from '../types/supabase';
import { PAGINATION } from '../constants/supabase';

export interface CreateReportData {
  reported_type: 'novel' | 'chapter' | 'review' | 'comment' | 'user';
  reported_id: string;
  reason: string;
  description?: string;
}

/**
 * Report Service
 * Handles content reporting and moderation
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
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<Report[]> {
    try {
      let query = supabase
        .from('reports')
        .select('*')
        .eq('reporter_id', userId);

      query = paginateQuery(query, page, pageSize);
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

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
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE,
    status?: string
  ): Promise<Report[]> {
    try {
      let query = supabase
        .from('reports')
        .select('*');

      if (status) {
        query = query.eq('status', status);
      }

      query = paginateQuery(query, page, pageSize);
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

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
    pageSize: number = PAGINATION.DEFAULT_PAGE_SIZE
  ): Promise<Report[]> {
    try {
      let query = supabase
        .from('reports')
        .select('*')
        .eq('reported_type', reportedType);

      query = paginateQuery(query, page, pageSize);
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

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
}

export default new ReportService();
