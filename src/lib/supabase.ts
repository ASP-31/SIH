'use client';

import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabaseUrl = rawSupabaseUrl;

export const supabaseKey = rawSupabaseKey;

export const isSupabaseConfigured =
  Boolean(supabaseUrl) && Boolean(supabaseKey) && supabaseUrl !== 'undefined';

let clientInstance: SupabaseClient | null = null;

/**
 * Client-side Supabase client for use in Client Components.
 * Uses @supabase/ssr to ensure session persistence via cookies.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!clientInstance) {
    clientInstance = createBrowserClient(supabaseUrl, supabaseKey);
  }
  return clientInstance;
}
