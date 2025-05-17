import { createClient } from '@supabase/supabase-js';

// Read Supabase URL and Anon Key from environment variables (provided by Vite)
// Ensure you have a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Basic check to ensure environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase URL or Anon Key is missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env.local file.'
  );
  // Optionally, throw an error or disable functionality if keys are missing
  // throw new Error("Supabase credentials are not configured.");
}

// Create and export the Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  // Optional: Configure storage adapter if needed, e.g., for React Native or server-side
  // auth: {
  //   storage: customStorageAdapter, // Example
  //   autoRefreshToken: true,
  //   persistSession: true,
  //   detectSessionInUrl: false,
  // },
});

// console.log('Supabase client initialized (check warnings if using placeholders).');
