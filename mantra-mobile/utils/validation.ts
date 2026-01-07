import { VALIDATION } from '../constants/supabase';

/**
 * Validation utilities for user inputs
 */
export class Validator {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validate password strength
   */
  static isValidPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
      return {
        valid: false,
        message: `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters`,
      };
    }

    if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
      return {
        valid: false,
        message: 'Password must contain both letters and numbers',
      };
    }

    return { valid: true };
  }

  /**
   * Validate username format
   */
  static isValidUsername(username: string): { valid: boolean; message?: string } {
    const trimmed = username.trim();

    if (trimmed.length < VALIDATION.MIN_USERNAME_LENGTH) {
      return {
        valid: false,
        message: `Username must be at least ${VALIDATION.MIN_USERNAME_LENGTH} characters`,
      };
    }

    if (trimmed.length > VALIDATION.MAX_USERNAME_LENGTH) {
      return {
        valid: false,
        message: `Username must be at most ${VALIDATION.MAX_USERNAME_LENGTH} characters`,
      };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return {
        valid: false,
        message: 'Username can only contain letters, numbers, and underscores',
      };
    }

    return { valid: true };
  }

  /**
   * Validate age
   */
  static isValidAge(age: number): { valid: boolean; message?: string } {
    if (age < VALIDATION.MIN_AGE || age > VALIDATION.MAX_AGE) {
      return {
        valid: false,
        message: `Age must be between ${VALIDATION.MIN_AGE} and ${VALIDATION.MAX_AGE}`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate rating
   */
  static isValidRating(rating: number): { valid: boolean; message?: string } {
    if (rating < VALIDATION.MIN_RATING || rating > VALIDATION.MAX_RATING) {
      return {
        valid: false,
        message: `Rating must be between ${VALIDATION.MIN_RATING} and ${VALIDATION.MAX_RATING}`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate Stellar wallet address
   */
  static isValidStellarAddress(address: string): { valid: boolean; message?: string } {
    const trimmed = address.trim();

    if (!trimmed.startsWith('G')) {
      return {
        valid: false,
        message: 'Stellar address must start with G',
      };
    }

    if (trimmed.length !== VALIDATION.STELLAR_ADDRESS_LENGTH) {
      return {
        valid: false,
        message: `Stellar address must be exactly ${VALIDATION.STELLAR_ADDRESS_LENGTH} characters`,
      };
    }

    if (!/^[A-Z0-9]+$/.test(trimmed)) {
      return {
        valid: false,
        message: 'Stellar address can only contain uppercase letters and numbers',
      };
    }

    return { valid: true };
  }

  /**
   * Validate withdrawal amount
   */
  static isValidWithdrawalAmount(
    amount: number,
    balance: number
  ): { valid: boolean; message?: string } {
    if (amount < VALIDATION.MIN_WITHDRAWAL_AMOUNT) {
      return {
        valid: false,
        message: `Minimum withdrawal amount is ${VALIDATION.MIN_WITHDRAWAL_AMOUNT} XLM`,
      };
    }

    if (amount > balance) {
      return {
        valid: false,
        message: 'Insufficient balance',
      };
    }

    return { valid: true };
  }

  /**
   * Validate array length
   */
  static isValidArrayLength(
    array: any[],
    maxLength: number,
    fieldName: string
  ): { valid: boolean; message?: string } {
    if (array.length > maxLength) {
      return {
        valid: false,
        message: `You can select up to ${maxLength} ${fieldName}`,
      };
    }

    return { valid: true };
  }

  /**
   * Sanitize text input (prevent XSS)
   */
  static sanitizeText(text: string): string {
    return text
      .trim()
      .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, ''); // Remove event handlers
  }

  /**
   * Validate and sanitize novel/chapter content
   */
  static sanitizeContent(content: string): string {
    // Allow basic formatting but remove dangerous content
    return content
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }

  /**
   * Validate text length
   */
  static isValidLength(
    text: string,
    minLength: number,
    maxLength: number,
    fieldName: string
  ): { valid: boolean; message?: string } {
    const trimmed = text.trim();

    if (trimmed.length < minLength) {
      return {
        valid: false,
        message: `${fieldName} must be at least ${minLength} characters`,
      };
    }

    if (trimmed.length > maxLength) {
      return {
        valid: false,
        message: `${fieldName} must be at most ${maxLength} characters`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate URL format
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate file size
   */
  static isValidFileSize(sizeInBytes: number, maxSizeMB: number): { valid: boolean; message?: string } {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (sizeInBytes > maxSizeBytes) {
      return {
        valid: false,
        message: `File size must be less than ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Validate image file type
   */
  static isValidImageType(mimeType: string): { valid: boolean; message?: string } {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!validTypes.includes(mimeType.toLowerCase())) {
      return {
        valid: false,
        message: 'Only JPEG, PNG, and WebP images are allowed',
      };
    }

    return { valid: true };
  }
}
