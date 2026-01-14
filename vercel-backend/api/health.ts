/**
 * Health Check API Endpoint
 * GET /api/health
 * 
 * Returns system health and Stellar network status
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCurrentNetwork, getAdminBalance } from '../lib/stellar';
import { supabase } from '../lib/supabase';
import { ApiResponse } from '../lib/types';

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    network: string;
    services: {
        stellar: { status: string; balance?: string; error?: string };
        supabase: { status: string; error?: string };
    };
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
): Promise<void> {
    // Only allow GET
    if (req.method !== 'GET') {
        res.status(405).json({ success: false, error: 'Method not allowed' } as ApiResponse);
        return;
    }

    const healthStatus: HealthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        network: getCurrentNetwork(),
        services: {
            stellar: { status: 'unknown' },
            supabase: { status: 'unknown' },
        },
    };

    // Check Stellar connection
    try {
        const balance = await getAdminBalance();
        healthStatus.services.stellar = {
            status: 'connected',
            balance,
        };
    } catch (error: any) {
        healthStatus.services.stellar = {
            status: 'error',
            error: error.message || 'Failed to connect to Stellar',
        };
        healthStatus.status = 'degraded';
    }

    // Check Supabase connection
    try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error) throw error;
        healthStatus.services.supabase = { status: 'connected' };
    } catch (error: any) {
        healthStatus.services.supabase = {
            status: 'error',
            error: error.message || 'Failed to connect to Supabase',
        };
        healthStatus.status = 'degraded';
    }

    // Overall status
    const allUnhealthy =
        healthStatus.services.stellar.status === 'error' &&
        healthStatus.services.supabase.status === 'error';

    if (allUnhealthy) {
        healthStatus.status = 'unhealthy';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 :
        healthStatus.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
        success: healthStatus.status !== 'unhealthy',
        data: healthStatus,
    } as ApiResponse<HealthStatus>);
}
