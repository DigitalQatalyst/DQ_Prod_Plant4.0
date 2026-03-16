import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Force 'supabase' backend to ensure live data is used even if env var is stale in dev server
const dataBackend = 'supabase'; // import.meta.env.VITE_DATA_BACKEND || 'mock';

// Debug logging
console.log('=== Supabase Configuration ===');
console.log('VITE_SUPABASE_URL:', supabaseUrl);
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET');
console.log('VITE_DATA_BACKEND:', dataBackend);
console.log('==============================');

/**
 * Supabase client instance.
 * 
 * When VITE_DATA_BACKEND=mock, the client may be null if credentials aren't configured.
 * When VITE_DATA_BACKEND=supabase, missing credentials will throw an error.
 */
function createSupabaseClient(): SupabaseClient | null {
  // In mock mode, allow missing credentials (client won't be used)
  if (dataBackend === 'mock') {
    if (!supabaseUrl || !supabaseAnonKey ||
      supabaseUrl === 'your-project-url' ||
      supabaseAnonKey === 'your-anon-key') {
      console.info('[Supabase] Running in mock mode - Supabase client not initialized');
      return null;
    }
  }

  // In supabase or hybrid mode, credentials are required
  if (dataBackend === 'supabase' || dataBackend === 'hybrid') {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      );
    }

    if (supabaseUrl === 'your-project-url' || supabaseAnonKey === 'your-anon-key') {
      throw new Error(
        'Supabase credentials not configured. Please update VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY with your actual project values.'
      );
    }
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();

/**
 * Helper to check if Supabase is available
 */
export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

/**
 * Get the current data backend mode
 */
export function getDataBackend(): 'mock' | 'supabase' | 'hybrid' {
  return dataBackend as 'mock' | 'supabase' | 'hybrid';
}
