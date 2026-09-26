'use client';

import { getSupabaseClient } from './supabase';

const ATTRIBUTION_KEY = 'tote_referral_attribution_v1';
const VISITOR_KEY = 'tote_referral_visitor_v1';
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface ReferralAttribution {
  trackingCode: string;
  refCode: string;
  productId: string | null;
  capturedAt: number;
}

function randomUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';

  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const created = randomUuid();
    localStorage.setItem(VISITOR_KEY, created);
    return created;
  } catch {
    return '';
  }
}

export function readReferralAttribution(): ReferralAttribution | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ReferralAttribution;
    if (!parsed?.trackingCode) return null;

    if (Date.now() - parsed.capturedAt > ATTRIBUTION_TTL_MS) {
      localStorage.removeItem(ATTRIBUTION_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function captureReferralAttribution(params: {
  trackingCode: string;
  refCode: string;
  productId?: string | null;
}): ReferralAttribution | null {
  if (typeof window === 'undefined' || !params.trackingCode) return null;

  const attribution: ReferralAttribution = {
    trackingCode: params.trackingCode,
    refCode: params.refCode || params.trackingCode,
    productId: params.productId ?? null,
    capturedAt: Date.now(),
  };

  try {
    localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {}

  return attribution;
}

export function clearReferralAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ATTRIBUTION_KEY);
  } catch {}
}

export async function recordReferralClick(params: {
  trackingCode: string;
  refCode: string;
  productId?: string | null;
}): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase || !params.trackingCode) return;

  const { data: collab } = await supabase
    .from('collab_proposals')
    .select('id, influencer_id')
    .eq('tracking_code', params.trackingCode)
    .maybeSingle();

  if (!collab) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('referral_clicks').insert({
    collab_id: collab.id,
    influencer_id: collab.influencer_id,
    product_id: params.productId ?? null,
    visitor_id: user?.id ?? getVisitorId(),
    ref_code: params.refCode,
    source: typeof document !== 'undefined' ? document.referrer || 'direct' : 'direct',
  });

  if (error && error.code !== '23505') {
    console.error('Error recording referral click:', error.message);
  }
}
