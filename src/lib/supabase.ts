'use client';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Indian ISP Block Bypass (JioBase Proxy)
 * Major Indian ISPs (Jio, Airtel, ACT) DNS-block *.supabase.co subdomains.
 * We configure the URL using the JioBase proxy format:
 * NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].jiobase.com
 */
const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawSupabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Automatically rewrite *.supabase.co to *.jiobase.com if needed for Indian ISP bypass
export const supabaseUrl = rawSupabaseUrl.includes('.supabase.co')
  ? rawSupabaseUrl.replace('.supabase.co', '.jiobase.com')
  : rawSupabaseUrl;

export const supabaseKey = rawSupabaseKey;

export const isSupabaseConfigured =
  Boolean(supabaseUrl) && Boolean(supabaseKey) && supabaseUrl !== 'undefined';

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
}
