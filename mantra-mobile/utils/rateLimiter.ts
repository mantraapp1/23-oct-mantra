/**
 * Rate limiter for sensitive operations
 */
export class RateLimiter {
  private static attempts: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Check if action is allowed
   */
  static isAllowed(
    key: string,
    maxAttempts: number,
    windowMs: number
  ): { allowed: boolean; remainingAttempts: number; resetTime?: number } {
    const now = Date.now();
    const record = this.attempts.get(key);

    // No previous attempts or window expired
    if (!record || now > record.resetTime) {
      this.attempts.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });

      return {
        allowed: true,
        remainingAttempts: maxAttempts - 1,
      };
    }

    // Within window
    if (record.count < maxAttempts) {
      record.count++;
      return {
        allowed: true,
        remainingAttempts: maxAttempts - record.count,
      };
    }

    // Rate limit exceeded
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: record.resetTime,
    };
  }

  /**
   * Reset rate limit for a key
   */
  static reset(key: string): void {
    this.attempts.delete(key);
  }

  /**
   * Clear all rate limits
   */
  static clearAll(): void {
    this.attempts.clear();
  }

  /**
   * Rate limit OTP resend
   */
  static canResendOTP(email: string): { allowed: boolean; message?: string; resetTime?: number } {
    const key = `otp_resend_${email}`;
    const result = this.isAllowed(key, 3, 10 * 60 * 1000); // 3 attempts per 10 minutes

    if (!result.allowed) {
      const minutesLeft = Math.ceil((result.resetTime! - Date.now()) / 60000);
      return {
        allowed: false,
        message: `Too many attempts. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
        resetTime: result.resetTime,
      };
    }

    return { allowed: true };
  }

  /**
   * Rate limit password reset
   */
  static canRequestPasswordReset(email: string): { allowed: boolean; message?: string } {
    const key = `password_reset_${email}`;
    const result = this.isAllowed(key, 3, 60 * 60 * 1000); // 3 attempts per hour

    if (!result.allowed) {
      const minutesLeft = Math.ceil((result.resetTime! - Date.now()) / 60000);
      return {
        allowed: false,
        message: `Too many password reset attempts. Please try again in ${minutesLeft} minutes.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Rate limit withdrawal requests
   */
  static canRequestWithdrawal(userId: string): { allowed: boolean; message?: string } {
    const key = `withdrawal_${userId}`;
    const result = this.isAllowed(key, 5, 24 * 60 * 60 * 1000); // 5 per day

    if (!result.allowed) {
      return {
        allowed: false,
        message: 'Daily withdrawal limit reached. Please try again tomorrow.',
      };
    }

    return { allowed: true };
  }

  /**
   * Rate limit report submissions
   */
  static canSubmitReport(userId: string): { allowed: boolean; message?: string } {
    const key = `report_${userId}`;
    const result = this.isAllowed(key, 10, 60 * 60 * 1000); // 10 per hour

    if (!result.allowed) {
      return {
        allowed: false,
        message: 'Too many reports submitted. Please try again later.',
      };
    }

    return { allowed: true };
  }

  /**
   * Rate limit comment/review submissions
   */
  static canSubmitContent(userId: string, type: 'comment' | 'review'): { allowed: boolean; message?: string } {
    const key = `${type}_${userId}`;
    const result = this.isAllowed(key, 20, 60 * 60 * 1000); // 20 per hour

    if (!result.allowed) {
      return {
        allowed: false,
        message: `Too many ${type}s submitted. Please slow down.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Rate limit login attempts
   */
  static canAttemptLogin(email: string): { allowed: boolean; message?: string } {
    const key = `login_${email}`;
    const result = this.isAllowed(key, 5, 15 * 60 * 1000); // 5 attempts per 15 minutes

    if (!result.allowed) {
      const minutesLeft = Math.ceil((result.resetTime! - Date.now()) / 60000);
      return {
        allowed: false,
        message: `Too many login attempts. Please try again in ${minutesLeft} minutes.`,
      };
    }

    return { allowed: true };
  }

  /**
   * Rate limit API calls
   */
  static canMakeAPICall(userId: string, endpoint: string): { allowed: boolean; message?: string } {
    const key = `api_${userId}_${endpoint}`;
    const result = this.isAllowed(key, 100, 60 * 1000); // 100 per minute

    if (!result.allowed) {
      return {
        allowed: false,
        message: 'Too many requests. Please slow down.',
      };
    }

    return { allowed: true };
  }
}

/**
 * Request timeout handler
 */
export class TimeoutHandler {
  /**
   * Execute function with timeout
   */
  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 30000,
    errorMessage: string = 'Request timed out'
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
      ),
    ]);
  }

  /**
   * Execute API call with timeout
   */
  static async apiCallWithTimeout<T>(
    apiCall: () => Promise<T>,
    timeoutMs: number = 30000
  ): Promise<T> {
    return this.withTimeout(
      apiCall(),
      timeoutMs,
      'API request timed out. Please check your connection and try again.'
    );
  }
}
