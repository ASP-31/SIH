'use client';

import { CollabProposal, CollabMessage } from './types';
import { getSupabaseClient } from './supabase';

export const INITIAL_COLLAB_PROPOSALS: CollabProposal[] = [];

const COLLAB_SELECT =
  'id, influencer_id, influencer_name, influencer_handle, influencer_avatar, influencer_followers, influencer_niche, seller_id, stall_id, stall_name, product_id, product_title, product_image, product_price, promo_format, pitch_message, sample_requested, commission_pct, tracking_code, tracking_url, status, created_at, updated_at, clicks, orders_count, revenue_generated';

interface CollabMessageRow {
  id: string;
  collab_id: string;
  sender_role: CollabMessage['sender_role'];
  sender_name: string;
  text: string;
  created_at: string;
}

function toCollabMessage(row: CollabMessageRow): CollabMessage {
  return {
    id: row.id,
    sender_role: row.sender_role,
    sender_name: row.sender_name,
    text: row.text,
    created_at: row.created_at,
  };
}

function toCollab(row: Record<string, unknown>, messages: CollabMessage[]): CollabProposal {
  return {
    id: String(row.id),
    influencer_id: String(row.influencer_id),
    influencer_name: String(row.influencer_name ?? ''),
    influencer_handle: String(row.influencer_handle ?? ''),
    influencer_avatar: String(row.influencer_avatar ?? ''),
    influencer_followers: String(row.influencer_followers ?? ''),
    influencer_niche: String(row.influencer_niche ?? ''),
    seller_id: String(row.seller_id),
    stall_id: row.stall_id ? String(row.stall_id) : '',
    stall_name: String(row.stall_name ?? ''),
    product_id: row.product_id ? String(row.product_id) : '',
    product_title: String(row.product_title ?? ''),
    product_image: String(row.product_image ?? ''),
    product_price: Number(row.product_price ?? 0),
    promo_format: row.promo_format as CollabProposal['promo_format'],
    pitch_message: String(row.pitch_message ?? ''),
    sample_requested: Boolean(row.sample_requested),
    commission_pct: Number(row.commission_pct ?? 0),
    tracking_code: String(row.tracking_code ?? ''),
    tracking_url: String(row.tracking_url ?? ''),
    status: row.status as CollabProposal['status'],
    created_at: String(row.created_at),
    updated_at: String(row.updated_at ?? row.created_at),
    clicks: Number(row.clicks ?? 0),
    orders_count: Number(row.orders_count ?? 0),
    revenue_generated: Number(row.revenue_generated ?? 0),
    messages,
  };
}

async function loadMessages(collabIds: string[]): Promise<Map<string, CollabMessage[]>> {
  const grouped = new Map<string, CollabMessage[]>();
  if (collabIds.length === 0) return grouped;

  const supabase = getSupabaseClient();
  if (!supabase) return grouped;

  const { data, error } = await supabase
    .from('collab_messages')
    .select('id, collab_id, sender_role, sender_name, text, created_at')
    .in('collab_id', collabIds)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error loading collab messages:', error.message);
    return grouped;
  }

  for (const row of (data ?? []) as unknown as CollabMessageRow[]) {
    const list = grouped.get(row.collab_id) ?? [];
    list.push(toCollabMessage(row));
    grouped.set(row.collab_id, list);
  }

  return grouped;
}

async function hydrate(rows: Record<string, unknown>[]): Promise<CollabProposal[]> {
  const messages = await loadMessages(rows.map((r) => String(r.id)));
  return rows.map((row) => toCollab(row, messages.get(String(row.id)) ?? []));
}

async function resolveInfluencerUserId(handleOrId?: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  if (!handleOrId) return user.id;
  if (handleOrId === user.id) return user.id;

  const clean = handleOrId.replace('@', '').toLowerCase();
  const { data } = await supabase
    .from('influencer_profiles')
    .select('user_id')
    .eq('handle', `@${clean}`)
    .maybeSingle();

  return data ? String((data as { user_id: string }).user_id) : null;
}

export async function getCollabProposals(): Promise<CollabProposal[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return INITIAL_COLLAB_PROPOSALS;

  const { data, error } = await supabase
    .from('collab_proposals')
    .select(COLLAB_SELECT)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading collab proposals:', error.message);
    return INITIAL_COLLAB_PROPOSALS;
  }

  return hydrate((data ?? []) as unknown as Record<string, unknown>[]);
}

export async function getCollabProposalsForSeller(stallId?: string): Promise<CollabProposal[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return INITIAL_COLLAB_PROPOSALS;

  let query = supabase.from('collab_proposals').select(COLLAB_SELECT);
  if (stallId) query = query.eq('stall_id', stallId);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading seller collabs:', error.message);
    return INITIAL_COLLAB_PROPOSALS;
  }

  return hydrate((data ?? []) as unknown as Record<string, unknown>[]);
}

export async function getCollabProposalsForInfluencer(
  influencerHandleOrId?: string
): Promise<CollabProposal[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return INITIAL_COLLAB_PROPOSALS;

  const influencerId = await resolveInfluencerUserId(influencerHandleOrId);
  if (!influencerId) return INITIAL_COLLAB_PROPOSALS;

  const { data, error } = await supabase
    .from('collab_proposals')
    .select(COLLAB_SELECT)
    .eq('influencer_id', influencerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading influencer collabs:', error.message);
    return INITIAL_COLLAB_PROPOSALS;
  }

  return hydrate((data ?? []) as unknown as Record<string, unknown>[]);
}

export async function submitCollabProposal(payload: {
  influencer_name: string;
  influencer_handle: string;
  influencer_avatar: string;
  influencer_followers: string;
  influencer_niche: string;
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
}): Promise<CollabProposal> {
  const supabase = getSupabaseClient();
  const cleanHandle = payload.influencer_handle.replace('@', '').toLowerCase();

  if (!supabase) {
    throw new Error('Supabase client not initialized.');
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('You must be signed in to pitch a collaboration.');
  }

  // The seller is derived from the stall, never trusted from the client payload.
  const { data: stall, error: stallError } = await supabase
    .from('stalls')
    .select('id, user_id')
    .eq('id', payload.stall_id)
    .single();

  if (stallError || !stall) {
    throw new Error('Could not resolve the artisan stall for this pitch.');
  }

  const { data, error } = await supabase
    .from('collab_proposals')
    .insert({
      influencer_id: user.id,
      influencer_name: payload.influencer_name,
      influencer_handle: payload.influencer_handle,
      influencer_avatar: payload.influencer_avatar,
      influencer_followers: payload.influencer_followers,
      influencer_niche: payload.influencer_niche,
      seller_id: stall.user_id,
      stall_id: payload.stall_id || null,
      stall_name: payload.stall_name,
      product_id: payload.product_id || null,
      product_title: payload.product_title,
      product_image: payload.product_image,
      product_price: payload.product_price,
      promo_format: payload.promo_format,
      pitch_message: payload.pitch_message,
      sample_requested: payload.sample_requested,
      commission_pct: payload.commission_pct,
      tracking_code: `${cleanHandle.toUpperCase().slice(0, 5)}`,
      tracking_url: `/?ref=${cleanHandle}`,
      status: 'pending',
    })
    .select(COLLAB_SELECT)
    .single();

  if (error) throw new Error(error.message);

  const row = data as unknown as Record<string, unknown>;
  const collabId = String(row.id);

  if (payload.pitch_message.trim()) {
    await supabase.from('collab_messages').insert({
      collab_id: collabId,
      sender_id: user.id,
      sender_role: 'influencer',
      sender_name: payload.influencer_name,
      text: payload.pitch_message.trim(),
    });
  }

  dispatchUpdate();

  return toCollab(row, [
    {
      id: `${collabId}-pitch`,
      sender_role: 'influencer',
      sender_name: payload.influencer_name,
      text: payload.pitch_message,
      created_at: String(row.created_at),
    },
  ]);
}

export async function updateCollabStatus(
  collabId: string,
  status: CollabProposal['status']
): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from('collab_proposals')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', collabId);

  if (error) {
    console.error('Error updating collab status:', error.message);
    return false;
  }

  dispatchUpdate();
  return true;
}

export async function sendCollabMessage(
  collabId: string,
  senderRole: 'influencer' | 'seller',
  senderName: string,
  text: string
): Promise<CollabMessage | null> {
  if (!text.trim()) return null;

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('collab_messages')
    .insert({
      collab_id: collabId,
      sender_id: user?.id ?? null,
      sender_role: senderRole,
      sender_name: senderName,
      text: text.trim(),
    })
    .select('id, sender_role, sender_name, text, created_at')
    .single();

  if (error) {
    console.error('Error sending collab message:', error.message);
    return null;
  }

  if (senderRole === 'seller') {
    await supabase
      .from('collab_proposals')
      .update({ status: 'in_discussion', updated_at: new Date().toISOString() })
      .eq('id', collabId)
      .eq('status', 'pending');
  }

  dispatchUpdate();

  const row = data as unknown as CollabMessageRow;
  return {
    id: row.id,
    sender_role: row.sender_role,
    sender_name: row.sender_name,
    text: row.text,
    created_at: row.created_at,
  };
}

function dispatchUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tote_collabs_updated'));
  }
}

export async function fetchCreatorFunnel(): Promise<{
  tracking_code: string;
  clicks: number;
  orders: number;
  revenue: number;
  delivered_orders: number;
}[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('creator_funnel')
    .select('tracking_code, clicks, orders, revenue, delivered_orders')
    .order('revenue', { ascending: false });

  if (error) {
    console.error('Error loading creator funnel:', error.message);
    return [];
  }

  return (data ?? []) as {
    tracking_code: string;
    clicks: number;
    orders: number;
    revenue: number;
    delivered_orders: number;
  }[];
}
