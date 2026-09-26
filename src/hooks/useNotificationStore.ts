'use client';

import { create } from 'zustand';
import {
  fetchNotifications,
  fetchPreferences,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  setNotificationPreference,
  subscribeToNotifications,
} from '@/lib/notificationService';
import { AppNotification, NotificationCategory } from '@/lib/types';

const POLL_INTERVAL_MS = 60000;
const BELL_PREVIEW_SIZE = 8;

const teardownRegistry = new Map<string, () => void>();

interface NotificationStore {
  notifications: AppNotification[];
  unreadCount: number;
  preferences: Record<NotificationCategory, boolean>;
  isLoading: boolean;
  isReady: boolean;
  activeUserId: string | null;

  initialise: (userId: string) => void;
  teardown: () => void;
  refresh: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  openNotification: (id: string) => Promise<void>;
  markAllRead: (category?: NotificationCategory) => Promise<void>;
  togglePreference: (category: NotificationCategory, enabled: boolean) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  preferences: {
    orders: true,
    messages: true,
    sellers: true,
    collabs: true,
    referrals: true,
  },
  isLoading: false,
  isReady: false,
  activeUserId: null,

  initialise: (userId) => {
    if (get().activeUserId === userId && get().isReady) return;

    get().teardown();
    set({ activeUserId: userId, isLoading: true, isReady: false });

    void get().refresh();
    void fetchPreferences().then((preferences) => set({ preferences }));

    const handleFocus = () => {
      void get().refresh();
    };

    const unsubscribe = subscribeToNotifications(
      userId,
      (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + 1,
        }));
      },
      () => {
        void get().refreshUnreadCount();
      }
    );

    const poll = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void get().refresh();
      }
    }, POLL_INTERVAL_MS);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    teardownRegistry.set(userId, () => {
      unsubscribe();
      clearInterval(poll);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    });

    set({ isReady: true, isLoading: false });
  },

  teardown: () => {
    const userId = get().activeUserId;
    if (userId) {
      teardownRegistry.get(userId)?.();
      teardownRegistry.delete(userId);
    }
    set({ activeUserId: null, isReady: false, notifications: [], unreadCount: 0 });
  },

  refresh: async () => {
    if (!get().activeUserId) return;
    set({ isLoading: true });

    const [notifications, unreadCount] = await Promise.all([
      fetchNotifications({ limit: 50 }),
      fetchUnreadCount(),
    ]);

    set({ notifications, unreadCount, isLoading: false });
  },

  refreshUnreadCount: async () => {
    if (!get().activeUserId) return;
    set({ unreadCount: await fetchUnreadCount() });
  },

  openNotification: async (id) => {
    const target = get().notifications.find((n) => n.id === id);
    if (!target) return;

    if (!target.read_at) {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    }

    await markNotificationRead(id);
  },

  markAllRead: async (category) => {
    const stamp = new Date().toISOString();
    set((state) => ({
      notifications: state.notifications.map((n) => {
        const matches = !category || n.category === category;
        return matches && !n.read_at ? { ...n, read_at: stamp } : n;
      }),
      unreadCount: 0,
    }));

    await markAllNotificationsRead(category);
  },

  togglePreference: async (category, enabled) => {
    const previous = get().preferences;
    set({ preferences: { ...previous, [category]: enabled } });
    await setNotificationPreference(category, enabled);
  },
}));

export { BELL_PREVIEW_SIZE };
