/**
 * API Authentication middleware
 * Validates API secret key for protected endpoints
 */

import { VercelRequest } from '@vercel/node';
import { timingSafeEqual } from 'crypto';

const API_SECRET_KEY = process.env.API_SECRET_KEY || '';

/**
 * Constant-time string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }
    try {
        return timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
        return false;
    }
}

/**
 * Validate API request authentication
 */
export function validateApiAuth(req: VercelRequest): { valid: boolean; error?: string } {
    // Check for Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return { valid: false, error: 'Missing Authorization header' };
    }

    // Expect format: "Bearer <key>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return { valid: false, error: 'Invalid Authorization header format' };
    }

    const providedKey = parts[1] || '';

    if (!API_SECRET_KEY || !providedKey) {
        return { valid: false, error: 'API secret key not configured' };
    }

    // Use constant-time comparison to prevent timing attacks
    if (!secureCompare(providedKey, API_SECRET_KEY)) {
        return { valid: false, error: 'Invalid API key' };
    }

    return { valid: true };
}

/**
 * Validate Vercel Cron request
 * Cron requests include a special header from Vercel
 */
export function validateCronRequest(req: VercelRequest): boolean {
    // In production, Vercel adds this header for cron requests
    const cronSecret = req.headers['x-vercel-cron'];

    // Allow if cron header present or if in development
    if (cronSecret) return true;

    // Also allow authenticated requests (for manual testing)
    const authResult = validateApiAuth(req);
    return authResult.valid;
}
