import { OrderMessage, OrderNotification } from './types';

const MESSAGES_KEY = 'tote_order_messages_v2';
const NOTIFICATIONS_KEY = 'tote_notifications_v2';

const INITIAL_MESSAGES: Record<string, OrderMessage[]> = {
  'TOT-84920': [
    {
      id: 'msg_1',
      order_id: 'TOT-84920',
      sender_id: 'system',
      sender_name: 'Tote System',
      sender_role: 'system',
      message: '🎉 Order #TOT-84920 placed by Tara Mukherjee. Payment of ₹3,400 confirmed via UPI.',
      created_at: new Date(Date.now() - 3600 * 1000 * 36).toISOString(),
    },
    {
      id: 'msg_2',
      order_id: 'TOT-84920',
      sender_id: 'seller_1',
      sender_name: 'Mira Shenoy (EarthStitch)',
      sender_role: 'seller',
      message: 'Namaste Tara! Thank you for supporting our Fort Kochi handloom workshop. We are hand-dipping your Indigo Horizon canvas today.',
      created_at: new Date(Date.now() - 3600 * 1000 * 30).toISOString(),
    },
    {
      id: 'msg_3',
      order_id: 'TOT-84920',
      sender_id: 'buyer_demo',
      sender_name: 'Tara Mukherjee',
      sender_role: 'buyer',
      message: 'Thank you Mira! Can you please ensure the leather handles are conditioned before packing? So excited to receive it!',
      created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    },
    {
      id: 'msg_4',
      order_id: 'TOT-84920',
      sender_id: 'seller_1',
      sender_name: 'Mira Shenoy (EarthStitch)',
      sender_role: 'seller',
      message: 'Absolutely! Conditioned with natural beeswax cream and copper-riveted. Handing over to BlueDart Express now.',
      created_at: new Date(Date.now() - 3600 * 1000 * 13).toISOString(),
    },
    {
      id: 'msg_5',
      order_id: 'TOT-84920',
      sender_id: 'system',
      sender_name: 'Tote Delivery Bot',
      sender_role: 'system',
      message: '🚚 Status Update: Artisan has marked this order as OUT FOR DELIVERY via BlueDart Express (Waybill: BLUEDART-882194301).',
      created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    },
  ],
  'TOT-84921': [
    {
      id: 'msg_6',
      order_id: 'TOT-84921',
      sender_id: 'system',
      sender_name: 'Tote System',
      sender_role: 'system',
      message: '🎉 Order #TOT-84921 placed by Tara Mukherjee for Atelier Structured Laptop Tote 16".',
      created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    },
    {
      id: 'msg_7',
      order_id: 'TOT-84921',
      sender_id: 'seller_5',
      sender_name: 'Liam Chen (Minimalist Bag Works)',
      sender_role: 'seller',
      message: 'Hello Tara, we are saddlery-stitching the laptop partition in our Pondicherry studio right now.',
      created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    },
  ],
};

const INITIAL_NOTIFICATIONS: OrderNotification[] = [
  {
    id: 'notif_1',
    target_role: 'seller',
    order_id: 'TOT-84921',
    title: 'New Order Received! 🛍️',
    message: 'Tara Mukherjee purchased "Atelier Structured Laptop Tote 16"" (₹2,850). Please prepare for dispatch.',
    created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    read: false,
  },
  {
    id: 'notif_2',
    target_role: 'buyer',
    order_id: 'TOT-84920',
    title: 'Out for Delivery! 🚚',
    message: 'Your Indigo Horizon Canvas Tote is out for delivery with BlueDart. Please mark as received when delivered.',
    created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    read: false,
  },
];

// Messages Helpers
export function getAllOrderMessages(): Record<string, OrderMessage[]> {
  if (typeof window === 'undefined') return INITIAL_MESSAGES;
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(INITIAL_MESSAGES));
      return INITIAL_MESSAGES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MESSAGES;
  }
}

export function getOrderMessages(orderId: string): OrderMessage[] {
  const all = getAllOrderMessages();
  return all[orderId] || [];
}

export function sendOrderMessage(
  orderId: string,
  senderName: string,
  senderRole: 'buyer' | 'seller' | 'system',
  messageText: string
): OrderMessage {
  const all = getAllOrderMessages();
  const currentList = all[orderId] || [];

  const newMessage: OrderMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    order_id: orderId,
    sender_id: senderRole === 'system' ? 'system' : senderRole === 'buyer' ? 'buyer_demo' : 'seller_1',
    sender_name: senderName,
    sender_role: senderRole,
    message: messageText,
    created_at: new Date().toISOString(),
  };

  const updatedList = [...currentList, newMessage];
  all[orderId] = updatedList;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
      window.dispatchEvent(
        new CustomEvent('tote_messages_updated', { detail: { orderId, message: newMessage } })
      );
    } catch {}
  }

  return newMessage;
}

// Notifications Helpers
export function getNotifications(role?: 'buyer' | 'seller'): OrderNotification[] {
  if (typeof window === 'undefined') {
    return role ? INITIAL_NOTIFICATIONS.filter((n) => n.target_role === role) : INITIAL_NOTIFICATIONS;
  }
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    const list: OrderNotification[] = raw ? JSON.parse(raw) : INITIAL_NOTIFICATIONS;
    if (!raw) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    if (role) {
      return list.filter((n) => n.target_role === role);
    }
    return list;
  } catch {
    return role ? INITIAL_NOTIFICATIONS.filter((n) => n.target_role === role) : INITIAL_NOTIFICATIONS;
  }
}

export function addNotification(
  notif: Omit<OrderNotification, 'id' | 'created_at' | 'read'>
): OrderNotification {
  const current = getNotifications();
  const newNotif: OrderNotification = {
    ...notif,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    read: false,
  };

  const updated = [newNotif, ...current];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('tote_notifications_updated', { detail: newNotif })
      );
    } catch {}
  }
  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const current = getNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('tote_notifications_updated'));
    } catch {}
  }
}

export function markAllNotificationsAsRead(role?: 'buyer' | 'seller'): void {
  const current = getNotifications();
  const updated = current.map((n) => (role ? (n.target_role === role ? { ...n, read: true } : n) : { ...n, read: true }));
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('tote_notifications_updated'));
    } catch {}
  }
}
