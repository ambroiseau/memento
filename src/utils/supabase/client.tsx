import { createClient } from '@supabase/supabase-js';

// Get environment variables with fallbacks for development
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://zcyalwewcdgbftaaneet.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjeWFsd2V3Y2RnYmZ0YWFuZWV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNTMzNzUsImV4cCI6MjA3MTYyOTM3NX0.5GfuW2uqtbvLfV1nZ9d9uecQnvit1GDZmtD1lGaw3SU';

// ✅ SECURITY: Validate environment variables (keeping fallbacks for now)
const validateEnvironment = () => {
  const isDev = import.meta.env.DEV;
  const hasEnvVars =
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!hasEnvVars) {
    if (isDev) {
      console.warn(
        '⚠️ SECURITY WARNING: Using hardcoded Supabase keys in development'
      );
    } else {
      console.error(
        '❌ SECURITY ERROR: Missing Supabase environment variables in production'
      );
      // In production, we should throw an error, but keeping fallbacks for now
    }
  } else {
    console.log(
      '✅ SECURITY: Using environment variables for Supabase configuration'
    );
  }
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
