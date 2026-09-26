import { OrderMessage } from './types';
import { getSupabaseClient } from './supabase';

const MESSAGES_KEY = 'tote_order_messages_v2';

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
      sender_id: 'seller_1',
      sender_name: 'Liam Chen (Minimalist Bag Works)',
      sender_role: 'seller',
      message: 'Hello Tara, we are saddlery-stitching the laptop partition in our Pondicherry studio right now.',
      created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    },
  ],
};

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

export async function fetchOrderMessages(orderId: string): Promise<OrderMessage[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return getOrderMessages(orderId);

  const { data, error } = await supabase
    .from('order_messages')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching order messages:', error.message);
    return getOrderMessages(orderId);
  }

  const rows = ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    order_id: String(row.order_id),
    sender_id: String(row.sender_id ?? 'system'),
    sender_name: String(row.sender_name ?? 'Tote'),
    sender_role: row.sender_role as OrderMessage['sender_role'],
    message: String(row.message),
    created_at: String(row.created_at),
  }));

  if (rows.length === 0) {
    return getOrderMessages(orderId);
  }

  return rows;
}

async function persistMessage(message: OrderMessage): Promise<void> {
  if (message.sender_role === 'system') return;

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('id', message.order_id)
    .maybeSingle();

  if (!order) return;

  const { error } = await supabase.from('order_messages').insert({
    order_id: message.order_id,
    sender_id: user.id,
    sender_name: message.sender_name,
    sender_role: message.sender_role,
    message: message.message,
  });

  if (error) {
    console.error('Error persisting order message:', error.message);
  }
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
    sender_id: senderRole === 'system' ? 'system' : senderRole,
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

  void persistMessage(newMessage);

  return newMessage;
}
