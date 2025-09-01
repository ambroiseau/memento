import { createClient } from '@supabase/supabase-js';

// Get environment variables (strict mode - no fallbacks)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ✅ SECURITY: Strict environment variable validation
const validateEnvironment = () => {
  const isDev = import.meta.env.DEV;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isDev) {
      console.error('❌ SECURITY ERROR: Missing Supabase environment variables in development');
      console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
    } else {
      console.error('❌ SECURITY ERROR: Missing Supabase environment variables in production');
    }
    throw new Error('Missing required Supabase environment variables');
  }
  
  console.log('✅ SECURITY: Using environment variables for Supabase configuration');
};

// Run validation
validateEnvironment();

// Create a single Supabase client instance that can be shared across the app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
