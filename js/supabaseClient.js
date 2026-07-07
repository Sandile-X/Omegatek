/**
 * supabaseClient.js — Singleton Supabase client
 *
 * The anon key is a PUBLIC identifier by design (equivalent to a public API
 * key). It does NOT bypass Row Level Security. All data access restrictions
 * are enforced server-side via Supabase RLS policies.
 */
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL      = 'https://pefjkiijqratjixskmdx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZmpraWlqcXJhdGppeHNrbWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MzkwNDQsImV4cCI6MjA4ODAxNTA0NH0.x6s38k7avvoszJATabbUcp2zv9kjUVYRjKPT7n-pQJA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession  : true,
        autoRefreshToken: true,
        detectSessionInUrl: false
    }
});

// Expose on window for pages that use UMD builds or inline scripts
window._sb = supabase;
