import { supabase } from '../config/supabase';
import { handleSupabaseError } from '../utils/supabaseHelpers';

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  created_at: string;
}

export interface ContactFormData {
  subject: string;
  message: string;
}

export interface ContactResponse {
  success: boolean;
  message: string;
}

/**
 * Support Service
 * Handles FAQ queries and contact form submissions
 */
class SupportService {
  /**
   * Get all FAQs
   */
  async getAllFAQs(): Promise<FAQ[]> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('category', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting FAQs:', error);
      return [];
    }
  }

  /**
   * Get FAQs by category
   */
  async getFAQsByCategory(category: string): Promise<FAQ[]> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting FAQs by category:', error);
      return [];
    }
  }

  /**
   * Search FAQs
   */
  async searchFAQs(query: string): Promise<FAQ[]> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .or(`question.ilike.%${query}%,answer.ilike.%${query}%,keywords.cs.{${query}}`);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching FAQs:', error);
      return [];
    }
  }

  /**
   * Get FAQ categories
   */
  async getFAQCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('category')
        .order('category', { ascending: true });

      if (error) throw error;

      // Get unique categories
      const categories = [...new Set(data?.map(faq => faq.category) || [])];
      return categories;
    } catch (error) {
      console.error('Error getting FAQ categories:', error);
      return [];
    }
  }

  /**
   * Submit contact form
   */
  async submitContactForm(
    userId: string,
    formData: ContactFormData
  ): Promise<ContactResponse> {
    try {
      // Validate form data
      if (!formData.subject.trim()) {
        return {
          success: false,
          message: 'Subject is required',
        };
      }

      if (!formData.message.trim()) {
        return {
          success: false,
          message: 'Message is required',
        };
      }

      if (formData.message.length < 10) {
        return {
          success: false,
          message: 'Message must be at least 10 characters',
        };
      }

      // Submit contact form
      const { error } = await supabase
        .from('contact_submissions')
        .insert({
          user_id: userId,
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          status: 'pending',
        });

      if (error) throw error;

      return {
        success: true,
        message: 'Your message has been sent successfully. We\'ll get back to you soon!',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Get user's contact submissions
   */
  async getUserSubmissions(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user submissions:', error);
      return [];
    }
  }
}

export default new SupportService();
