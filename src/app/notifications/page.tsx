'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BellOff, Check, Loader2, Settings2 } from 'lucide-react';
import { useNotificationStore } from '@/hooks/useNotificationStore';
import {
  CATEGORY_LABELS,
  NOTIFICATION_CATEGORIES,
  fetchNotifications,
} from '@/lib/notificationService';
import { AppNotification, NotificationCategory, NotificationType } from '@/lib/types';

const PAGE_SIZE = 20;

const TYPE_ICONS: Record<NotificationType, string> = {
  order_placed: '🛍',
  order_accepted: '✅',
  order_declined: '⚠',
  payment_submitted: '💳',
  payment_verified: '✔',
  payment_failed: '✖',
  order_shipped: '📮',
  out_for_delivery: '🚚',
  delivered: '📦',
  dispute_raised: '⚠',
  dispute_resolved: '🤝',
  chat_message: '💬',
  seller_new_product: '✨',
  collab_proposal: '📨',
  collab_accepted: '🎉',
  collab_declined: '👋',
  referral_click: '🔗',
  referral_order: '💰',
  referral_delivered: '🏆',
};

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const preferences = useNotificationStore((s) => s.preferences);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const togglePreference = useNotificationStore((s) => s.togglePreference);
  const openNotification = useNotificationStore((s) => s.openNotification);
  const refreshUnreadCount = useNotificationStore((s) => s.refreshUnreadCount);

  const [category, setCategory] = useState<NotificationCategory | 'all'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreferences, setShowPreferences] = useState(false);

  const load = useCallback(
    async (nextPage: number, append: boolean) => {
      setIsLoading(true);
      const rows = await fetchNotifications({
        category,
        unreadOnly,
        page: nextPage,
        limit: PAGE_SIZE,
      });
      setItems((prev) => (append ? [...prev, ...rows] : rows));
      setHasMore(rows.length === PAGE_SIZE);
      setPage(nextPage);
      setIsLoading(false);
    },
    [category, unreadOnly]
  );

  useEffect(() => {
    void load(0, false);
  }, [load]);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  const handleOpen = async (notification: AppNotification) => {
    await openNotification(notification.id);
    setItems((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n))
    );
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const activePreferenceCategory = category === 'all' ? null : category;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-[#18181B] pb-4">
        <div>
          <h1 className="font-mono text-2xl md:text-3xl font-black uppercase tracking-tight">
            Notifications
          </h1>
          <p className="font-mono text-xs text-[#71717A] mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreferences((prev) => !prev)}
            className="flex items-center gap-1.5 border-2 border-[#18181B] bg-white px-3 py-2 font-mono text-[11px] font-bold uppercase hover:bg-[#FAFAF8]"
          >
            <Settings2 className="w-3.5 h-3.5" /> Preferences
          </button>
          <button
            type="button"
            onClick={() => void markAllRead(activePreferenceCategory ?? undefined)}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 border-2 border-[#18181B] bg-[#18181B] text-white px-3 py-2 font-mono text-[11px] font-bold uppercase hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-[#18181B]"
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </button>
        </div>
      </div>

      {showPreferences && (
        <div className="mt-4 border-2 border-[#18181B] bg-white p-4 shadow-[4px_4px_0px_0px_#18181B]">
          <h2 className="font-mono text-xs font-bold uppercase mb-3">In-app preferences</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {NOTIFICATION_CATEGORIES.map((prefCategory) => (
              <label
                key={prefCategory}
                className="flex items-center justify-between gap-3 border-2 border-[#F2F0EB] px-3 py-2 cursor-pointer"
              >
                <span className="font-mono text-xs">{CATEGORY_LABELS[prefCategory]}</span>
                <input
                  type="checkbox"
                  checked={preferences[prefCategory]}
                  onChange={(event) =>
                    void togglePreference(prefCategory, event.target.checked)
                  }
                  className="w-4 h-4 accent-[#18181B]"
                />
              </label>
            ))}
          </div>
          <p className="mt-3 font-mono text-[10px] text-[#71717A]">
            Muting a category stops new alerts for it. Existing alerts stay in your history.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`border-2 px-3 py-1.5 font-mono text-[11px] font-bold uppercase ${
            category === 'all'
              ? 'border-[#18181B] bg-[#18181B] text-white'
              : 'border-[#18181B] bg-white hover:bg-[#FAFAF8]'
          }`}
        >
          All
        </button>
        {NOTIFICATION_CATEGORIES.map((prefCategory) => (
          <button
            key={prefCategory}
            type="button"
            onClick={() => setCategory(prefCategory)}
            className={`border-2 px-3 py-1.5 font-mono text-[11px] font-bold uppercase ${
              category === prefCategory
                ? 'border-[#18181B] bg-[#18181B] text-white'
                : 'border-[#18181B] bg-white hover:bg-[#FAFAF8]'
            }`}
          >
            {CATEGORY_LABELS[prefCategory]}
          </button>
        ))}

        <label className="ml-auto flex items-center gap-2 font-mono text-[11px] cursor-pointer">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(event) => setUnreadOnly(event.target.checked)}
            className="w-3.5 h-3.5 accent-[#18181B]"
          />
          Unread only
        </label>
      </div>

      <div className="mt-4 border-2 border-[#18181B] bg-white">
        {isLoading && items.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-12 font-mono text-xs text-[#71717A]">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading notifications
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <BellOff className="w-6 h-6 text-[#71717A]" />
            <p className="font-mono text-xs text-[#71717A]">
              {unreadOnly ? 'No unread notifications.' : 'Nothing here yet.'}
            </p>
            <Link
              href="/"
              className="font-mono text-[11px] font-bold uppercase underline hover:no-underline"
            >
              Browse the marketplace
            </Link>
          </div>
        ) : (
          <ul className="divide-y-2 divide-[#F2F0EB]">
            {items.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => void handleOpen(notification)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-[#FAFAF8] ${
                    notification.read_at ? 'opacity-60' : ''
                  }`}
                >
                  <span aria-hidden="true" className="text-lg leading-none pt-0.5">
                    {TYPE_ICONS[notification.type] ?? '🔔'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-mono text-xs font-bold">
                        {notification.title}
                        {!notification.read_at && (
                          <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-amber-500 align-middle" />
                        )}
                      </span>
                      <span className="font-mono text-[10px] text-[#71717A] shrink-0">
                        {formatTimestamp(notification.created_at)}
                      </span>
                    </span>
                    {notification.body && (
                      <span className="block mt-1 font-mono text-[11px] text-[#71717A]">
                        {notification.body}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {hasMore && (
          <div className="border-t-2 border-[#F2F0EB] p-3 text-center">
            <button
              type="button"
              onClick={() => void load(page + 1, true)}
              disabled={isLoading}
              className="border-2 border-[#18181B] bg-white px-4 py-2 font-mono text-[11px] font-bold uppercase hover:bg-[#FAFAF8] disabled:opacity-50"
            >
              {isLoading ? 'Loading' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
