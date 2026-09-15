'use client';

import { CollabProposal, CollabMessage, ReferralClick } from './types';

const COLLABS_STORAGE_KEY = 'tote_collab_proposals_v5';
const CLICKS_STORAGE_KEY = 'tote_referral_clicks_v5';

export const INITIAL_COLLAB_PROPOSALS: CollabProposal[] = [];

export function getCollabProposals(): CollabProposal[] {
  if (typeof window === 'undefined') return INITIAL_COLLAB_PROPOSALS;
  try {
    const raw = localStorage.getItem(COLLABS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(COLLABS_STORAGE_KEY, JSON.stringify(INITIAL_COLLAB_PROPOSALS));
      return INITIAL_COLLAB_PROPOSALS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_COLLAB_PROPOSALS;
  }
}

export function saveCollabProposals(collabs: CollabProposal[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(COLLABS_STORAGE_KEY, JSON.stringify(collabs));
    window.dispatchEvent(new Event('tote_collabs_updated'));
  }
}

export function getCollabProposalsForSeller(stallId?: string): CollabProposal[] {
  const all = getCollabProposals();
  if (!stallId) return all;
  return all.filter((c) => c.stall_id === stallId || !c.stall_id);
}

export function getCollabProposalsForInfluencer(influencerHandleOrId?: string): CollabProposal[] {
  const all = getCollabProposals();
  if (!influencerHandleOrId) return all;
  const clean = influencerHandleOrId.replace('@', '').toLowerCase();
  return all.filter(
    (c) =>
      c.influencer_id === influencerHandleOrId ||
      c.influencer_handle.toLowerCase().replace('@', '') === clean
  );
}

export function submitCollabProposal(payload: {
  influencer_id: string;
  influencer_name: string;
  influencer_handle: string;
  influencer_avatar: string;
  influencer_followers: string;
  influencer_niche: string;
  seller_id: string;
  stall_id: string;
  stall_name: string;
  product_id: string;
  product_title: string;
  product_image: string;
  product_price: number;
  promo_format: CollabProposal['promo_format'];
  pitch_message: string;
  sample_requested: boolean;
  commission_pct: number;
}): CollabProposal {
  const collabs = getCollabProposals();
  const cleanHandle = payload.influencer_handle.replace('@', '').toLowerCase();
  const code = `${cleanHandle.toUpperCase().slice(0, 5)}-${payload.product_id.toUpperCase()}-${Date.now().toString(36).slice(-3).toUpperCase()}`;
  const trackingUrl = `/?ref=${cleanHandle}&prod=${payload.product_id}`;

  const newProposal: CollabProposal = {
    id: `collab_${Date.now().toString(36)}`,
    ...payload,
    tracking_code: code,
    tracking_url: trackingUrl,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    clicks: 0,
    orders_count: 0,
    revenue_generated: 0,
    messages: [
      {
        id: `msg_${Date.now()}`,
        sender_role: 'influencer',
        sender_name: payload.influencer_name,
        text: payload.pitch_message,
        created_at: new Date().toISOString(),
      },
    ],
  };

  const updated = [newProposal, ...collabs];
  saveCollabProposals(updated);
  return newProposal;
}

export function updateCollabStatus(collabId: string, status: CollabProposal['status']): void {
  const collabs = getCollabProposals();
  const updated = collabs.map((c) => (c.id === collabId ? { ...c, status, updated_at: new Date().toISOString() } : c));
  saveCollabProposals(updated);
}

export function sendCollabMessage(
  collabId: string,
  senderRole: 'influencer' | 'seller',
  senderName: string,
  text: string
): CollabMessage | null {
  if (!text.trim()) return null;
  const collabs = getCollabProposals();
  const index = collabs.findIndex((c) => c.id === collabId);
  if (index === -1) return null;

  const newMsg: CollabMessage = {
    id: `msg_${Date.now()}`,
    sender_role: senderRole,
    sender_name: senderName,
    text: text.trim(),
    created_at: new Date().toISOString(),
  };

  const target = collabs[index];
  const updatedProposal: CollabProposal = {
    ...target,
    status: target.status === 'pending' && senderRole === 'seller' ? 'in_discussion' : target.status,
    updated_at: new Date().toISOString(),
    messages: [...(target.messages || []), newMsg],
  };

  collabs[index] = updatedProposal;
  saveCollabProposals([...collabs]);
  return newMsg;
}

export function recordReferralClick(refHandleOrCode: string, productId?: string): void {
  if (!refHandleOrCode || typeof window === 'undefined') return;
  const clean = refHandleOrCode.replace('@', '').toLowerCase();

  // Store raw click log
  try {
    const raw = localStorage.getItem(CLICKS_STORAGE_KEY);
    const clicks: ReferralClick[] = raw ? JSON.parse(raw) : [];
    clicks.push({
      id: `click_${Date.now().toString(36)}`,
      ref_code: clean,
      product_id: productId,
      timestamp: new Date().toISOString(),
      source: 'social_reel',
    });
    localStorage.setItem(CLICKS_STORAGE_KEY, JSON.stringify(clicks.slice(-200)));
  } catch {}

  // Update in Collab proposals
  const collabs = getCollabProposals();
  let matched = false;
  const updated = collabs.map((c) => {
    const influencerMatch = c.influencer_handle.toLowerCase().replace('@', '') === clean;
    const productMatch = !productId || c.product_id === productId;
    if (influencerMatch && productMatch) {
      matched = true;
      return { ...c, clicks: (c.clicks || 0) + 1, updated_at: new Date().toISOString() };
    }
    return c;
  });

  if (matched) {
    saveCollabProposals(updated);
  }

  window.dispatchEvent(new Event('tote_clicks_updated'));
}

export function recordReferralOrder(refHandle: string, amount: number, productId?: string): void {
  if (!refHandle || typeof window === 'undefined') return;
  const clean = refHandle.replace('@', '').toLowerCase();
  const collabs = getCollabProposals();

  const updated = collabs.map((c) => {
    const influencerMatch = c.influencer_handle.toLowerCase().replace('@', '') === clean;
    const productMatch = !productId || c.product_id === productId;
    if (influencerMatch && productMatch) {
      return {
        ...c,
        orders_count: (c.orders_count || 0) + 1,
        revenue_generated: (c.revenue_generated || 0) + amount,
        updated_at: new Date().toISOString(),
      };
    }
    return c;
  });

  saveCollabProposals(updated);
  window.dispatchEvent(new Event('tote_clicks_updated'));
}
