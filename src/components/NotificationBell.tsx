'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Loader2 } from 'lucide-react';
import { BELL_PREVIEW_SIZE, useNotificationStore } from '@/hooks/useNotificationStore';
import { AppNotification, NotificationType } from '@/lib/types';

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

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

interface NotificationBellProps {
  variant?: 'light' | 'dark';
}

export default function NotificationBell({ variant = 'light' }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const openNotification = useNotificationStore((s) => s.openNotification);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const isDark = variant === 'dark';

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleSelect = async (notification: AppNotification) => {
    setOpen(false);
    await openNotification(notification.id);
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative p-2 border-2 ${
          isDark
            ? 'border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800'
            : 'border-[#18181B] bg-white text-[#18181B] hover:bg-[#FAFAF8]'
        }`}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 flex items-center justify-center bg-amber-500 text-[9px] font-bold text-[#18181B] rounded-full ring-1 ring-[#18181B]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 border-2 border-[#18181B] p-3 z-50 shadow-[4px_4px_0px_0px_#18181B] max-h-[70vh] overflow-y-auto ${
            isDark ? 'bg-[#18181B] text-white' : 'bg-white text-[#18181B]'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-700 font-mono sticky top-0 bg-inherit">
            <span className="text-xs font-bold uppercase">Alerts ({unreadCount})</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="divide-y divide-zinc-700 mt-2 font-mono">
            {isLoading && notifications.length === 0 ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-zinc-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-4 text-center text-xs text-zinc-400">No notifications.</div>
            ) : (
              notifications.slice(0, BELL_PREVIEW_SIZE).map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void handleSelect(notification)}
                  className={`block w-full text-left py-2 px-1 text-xs ${
                    notification.read_at ? 'opacity-60' : ''
                  } ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-[#FAFAF8]'}`}
                >
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-bold">
                      <span aria-hidden="true">{TYPE_ICONS[notification.type] ?? '🔔'}</span>{' '}
                      {notification.title}
                    </span>
                    <span className="text-[10px] text-zinc-400 shrink-0">
                      {relativeTime(notification.created_at)}
                    </span>
                  </div>
                  {notification.body && (
                    <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-2">{notification.body}</p>
                  )}
                </button>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push('/notifications');
            }}
            className="mt-2 w-full border-t border-zinc-700 pt-2 text-[10px] font-bold uppercase text-amber-400 hover:underline"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
