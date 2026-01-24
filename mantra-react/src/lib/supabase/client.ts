// Supabase client configuration for Mantra Website
// Uses the same Supabase instance as the mobile app

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ CRITICAL: Supabase environment variables are missing!')
    console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ MISSING')
    console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ MISSING')
    throw new Error('Missing Supabase environment variables. Check your .env file.')
}

console.log('✅ Supabase client initialized:', supabaseUrl)

// Create a single instance of the Supabase client
const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

export function createClient() {
    return supabase
}

