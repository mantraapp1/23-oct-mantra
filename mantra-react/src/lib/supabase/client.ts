// Supabase client configuration for Mantra Website
// EXACT 1:1 PORT FROM MOBILE APP - only difference is localStorage instead of AsyncStorage

/**
 * SINGLETON SUPABASE CLIENT
 * 
 * CRITICAL: This is the ONLY Supabase client instance for the entire app.
 * DO NOT create additional clients - import this singleton directly.
 * 
 * Why singleton matters:
 * - Multiple clients = multiple auth listeners = race conditions on reload
 * - Each client attaches its own auth state change listener
 * - On page reload, multiple listeners conflict causing "signal aborted" errors
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
}

/**
 * Singleton Supabase client instance
 * 
 * Configuration:
 * - autoRefreshToken: Automatically refresh tokens before expiry
 * - persistSession: Store session in localStorage for reload persistence
 * - detectSessionInUrl: Handle OAuth callback URLs automatically
 * - flowType: 'pkce' for enhanced security (recommended for SPAs)
 * 
 * NOTE: No custom Content-Type header - Supabase manages headers internally.
 * Adding custom headers can break token refresh on reload.
 */
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'supabase.auth.token',
        flowType: 'pkce',
    },
    realtime: {
        timeout: 60000
    }
})
