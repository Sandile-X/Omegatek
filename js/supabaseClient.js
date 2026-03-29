/**
 * Supabase Client — shared across all pages.
 * Uses the PUBLIC anon key (safe in frontend JS by design).
 * Import this module wherever Supabase is needed.
 *
 * Usage (ES module):
 *   import { supabase } from '/js/supabaseClient.js';
 *
 * Usage (classic UMD global, after loading the CDN script):
 *   const { createClient } = window.supabase;
 *   window._sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 */

// ── Config (anon / public key — intentionally exposed) ─────
const SUPABASE_URL      = 'https://pefjkiijqratjixskmdx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZmpraWlqcXJhdGppeHNrbWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MzkwNDQsImV4cCI6MjA4ODAxNTA0NH0.x6s38k7avvoszJATabbUcp2zv9kjUVYRjKPT7n-pQJA';

// ── ESM build (for <script type="module"> pages) ───────────
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expose globally so legacy (non-module) scripts can also access it
window._sb = supabase;
