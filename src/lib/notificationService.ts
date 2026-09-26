'use client';

import { RealtimeChannel } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase';
import { AppNotification, NotificationCategory } from './types';

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  'orders',
  'messages',
  'sellers',
  'collabs',
  'referrals',
];

export const NOTIFICATION_PAGE_SIZE = 20;

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  orders: 'Orders',
  messages: 'Messages',
  sellers: 'Sellers',
  collabs: 'Collabs',
  referrals: 'Referrals',
};

export interface FetchNotificationsOptions {
  category?: NotificationCategory | 'all';
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

function normalise(row: Record<string, unknown>): AppNotification {
  return {
    id: String(row.id),
    recipient_id: String(row.recipient_id),
    actor_id: row.actor_id ? String(row.actor_id) : null,
    type: row.type as AppNotification['type'],
    category: row.category as NotificationCategory,
    title: String(row.title ?? ''),
    body: String(row.body ?? ''),
    action_url: row.action_url ? String(row.action_url) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    read_at: row.read_at ? String(row.read_at) : null,
    created_at: String(row.created_at),
  };
}

export async function fetchNotifications(
  options: FetchNotificationsOptions = {}
): Promise<AppNotification[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { category = 'all', unreadOnly = false, page = 0, limit = NOTIFICATION_PAGE_SIZE } = options;

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .range(page * limit, page * limit + limit - 1);

  if (category !== 'all') {
    query = query.eq('category', category);
  }

  if (unreadOnly) {
    query = query.is('read_at', null);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching notifications:', error.message);
    return [];
  }

  return ((data ?? []) as Record<string, unknown>[]).map(normalise);
}

export async function fetchUnreadCount(): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);

  if (error) {
    console.error('Error fetching unread count:', error.message);
    return 0;
  }

  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null);

  if (error) {
    console.error('Error marking notification read:', error.message);
  }
}

export async function markAllNotificationsRead(category?: NotificationCategory): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  let query = supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);

  if (category) {
    query = query.eq('category', category);
  }

  const { error } = await query;
  if (error) {
    console.error('Error marking all notifications read:', error.message);
  }
}

export async function fetchPreferences(): Promise<Record<NotificationCategory, boolean>> {
  const defaults = NOTIFICATION_CATEGORIES.reduce(
    (acc, category) => ({ ...acc, [category]: true }),
    {} as Record<NotificationCategory, boolean>
  );

  const supabase = getSupabaseClient();
  if (!supabase) return defaults;

  const { data, error } = await supabase.from('notification_preferences').select('category, enabled');
  if (error) {
    console.error('Error fetching notification preferences:', error.message);
    return defaults;
  }

  for (const row of (data ?? []) as { category: NotificationCategory; enabled: boolean }[]) {
    if (row.category in defaults) {
      defaults[row.category] = row.enabled;
    }
  }

  return defaults;
}

export async function setNotificationPreference(
  category: NotificationCategory,
  enabled: boolean
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from('notification_preferences').upsert(
    { user_id: user.id, category, enabled, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,category' }
  );

  if (error) {
    console.error('Error saving notification preference:', error.message);
  }
}

export async function isFollowingStall(stallId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('seller_subscriptions')
    .select('stall_id')
    .eq('buyer_id', user.id)
    .eq('stall_id', stallId)
    .maybeSingle();

  if (error) {
    console.error('Error checking stall subscription:', error.message);
    return false;
  }

  return Boolean(data);
}

export async function setStallSubscription(stallId: string, following: boolean): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  if (following) {
    const { error } = await supabase
      .from('seller_subscriptions')
      .upsert({ buyer_id: user.id, stall_id: stallId }, { onConflict: 'buyer_id,stall_id' });
    if (error) {
      console.error('Error following stall:', error.message);
      return false;
    }
    return true;
  }

  const { error } = await supabase
    .from('seller_subscriptions')
    .delete()
    .eq('buyer_id', user.id)
    .eq('stall_id', stallId);

  if (error) {
    console.error('Error unfollowing stall:', error.message);
    return false;
  }

  return false;
}

export async function fetchStallFollowerCount(stallId: string): Promise<number> {
  const supabase = getSupabaseClient();
  if (!supabase) return 0;

  const { data, error } = await supabase.rpc('stall_follower_count', { p_stall_id: stallId });

  if (error) {
    console.error('Error fetching stall follower count:', error.message);
    return 0;
  }

  return typeof data === 'number' ? data : 0;
}

export function subscribeToNotifications(
  userId: string,
  onInsert: (notification: AppNotification) => void,
  onChange: () => void
): () => void {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  const channel: RealtimeChannel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        if (!row?.id) return;
        onInsert(normalise(row));
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${userId}`,
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
