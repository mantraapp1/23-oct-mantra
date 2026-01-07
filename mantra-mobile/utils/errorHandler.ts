import NetInfo from '@react-native-community/netinfo';

export interface AppError {
  type: 'network' | 'auth' | 'validation' | 'server' | 'unknown';
  message: string;
  originalError?: any;
  retryable: boolean;
}

/**
 * Centralized error handler
 */
export class ErrorHandler {
  /**
   * Parse and categorize errors
   */
  static async handleError(error: any): Promise<AppError> {
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      return {
        type: 'network',
        message: 'No internet connection. Please check your network and try again.',
        originalError: error,
        retryable: true,
      };
    }

    // Handle Supabase/PostgreSQL errors
    if (error?.code) {
      return this.handleSupabaseError(error);
    }

    // Handle network errors
    if (error?.message?.includes('Network') || error?.message?.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network error. Please check your connection and try again.',
        originalError: error,
        retryable: true,
      };
    }

    // Handle authentication errors
    if (error?.message?.includes('auth') || error?.message?.includes('token')) {
      return {
        type: 'auth',
        message: 'Authentication error. Please log in again.',
        originalError: error,
        retryable: false,
      };
    }

    // Default unknown error
    return {
      type: 'unknown',
      message: error?.message || 'An unexpected error occurred. Please try again.',
      originalError: error,
      retryable: true,
    };
  }

  /**
   * Handle Supabase-specific errors
   */
  private static handleSupabaseError(error: any): AppError {
    const code = error.code;
    const message = error.message;

    // Authentication errors
    if (code === 'PGRST301' || message?.includes('JWT')) {
      return {
        type: 'auth',
        message: 'Session expired. Please log in again.',
        originalError: error,
        retryable: false,
      };
    }

    // Validation errors
    if (code === '23505') {
      return {
        type: 'validation',
        message: 'This item already exists.',
        originalError: error,
        retryable: false,
      };
    }

    if (code === '23503') {
      return {
        type: 'validation',
        message: 'Referenced item not found.',
        originalError: error,
        retryable: false,
      };
    }

    if (code === '23514') {
      return {
        type: 'validation',
        message: 'Invalid data provided.',
        originalError: error,
        retryable: false,
      };
    }

    // Server errors
    if (code?.startsWith('5') || code === 'PGRST') {
      return {
        type: 'server',
        message: 'Server error. Please try again later.',
        originalError: error,
        retryable: true,
      };
    }

    return {
      type: 'unknown',
      message: message || 'An error occurred. Please try again.',
      originalError: error,
      retryable: true,
    };
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: AppError): string {
    return error.message;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: AppError): boolean {
    return error.retryable;
  }

  /**
   * Log error for monitoring
   */
  static logError(error: AppError, context?: string): void {
    console.error(`[${error.type.toUpperCase()}] ${context || 'Error'}:`, {
      message: error.message,
      originalError: error.originalError,
      timestamp: new Date().toISOString(),
    });

    // TODO: Send to error tracking service (e.g., Sentry)
  }
}

/**
 * Retry logic for failed requests
 */
export class RetryHandler {
  /**
   * Retry a function with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        const appError = await ErrorHandler.handleError(error);
        
        // Don't retry if error is not retryable
        if (!appError.retryable) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxAttempts) {
          throw error;
        }

        // Wait before retrying with exponential backoff
        const delay = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

/**
 * Network detection utility
 */
export class NetworkDetector {
  private static listeners: ((isConnected: boolean) => void)[] = [];

  /**
   * Initialize network monitoring
   */
  static initialize(): void {
    NetInfo.addEventListener(state => {
      const isConnected = state.isConnected ?? false;
      this.listeners.forEach(listener => listener(isConnected));
    });
  }

  /**
   * Check current network status
   */
  static async isConnected(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  /**
   * Add network status listener
   */
  static addListener(listener: (isConnected: boolean) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}
