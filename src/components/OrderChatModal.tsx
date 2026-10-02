'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  X,
  Send,
  Truck,
  CheckCircle2,
  Package,
  Clock,
  ShieldCheck,
  Sparkles,
  Store,
  User,
} from 'lucide-react';
import { Order, OrderItemStatus, OrderMessage } from '@/lib/types';
import {
  fetchOrderMessages,
  sendOrderMessage,
} from '@/lib/conversationService';
import { removeProductFromMarketplace, formatINR } from '@/lib/demoData';
import { useToastStore } from '@/hooks/useToastStore';

interface OrderChatModalProps {
  order: Order;
  currentRole: 'buyer' | 'seller';
  onClose: () => void;
  onOrderUpdated?: (updatedOrder: Order) => void;
}

export function OrderChatModal({
  order,
  currentRole,
  onClose,
  onOrderUpdated,
}: OrderChatModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [localOrder, setLocalOrder] = useState<Order>(order);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const firstItem = localOrder.items[0];
  const isOutForDelivery =
    firstItem?.status === 'out_for_delivery' || firstItem?.status === 'shipped';
  const isDelivered = firstItem?.status === 'delivered';

  const loadMessages = () => {
    void fetchOrderMessages(localOrder.id).then(setMessages);
  };

  useEffect(() => {
    loadMessages();
    const handleUpdate = (e: any) => {
      if (e.detail?.orderId === localOrder.id) {
        loadMessages();
      }
    };
    window.addEventListener('tote_messages_updated', handleUpdate);
    return () => {
      window.removeEventListener('tote_messages_updated', handleUpdate);
    };
  }, [localOrder.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const senderName =
      currentRole === 'buyer'
        ? localOrder.buyer_name || 'Buyer'
        : firstItem?.stall_name || 'Artisan';

    sendOrderMessage(localOrder.id, senderName, currentRole, inputMessage.trim());

    setInputMessage('');
  };

  // 1. Seller Marks as Out for Delivery
  const handleMarkOutForDelivery = () => {
    const tracking = `IND-${Math.floor(100000000 + Math.random() * 900000000)}`;
    const carrierName = 'BlueDart Express Handloom Wing';

    const updatedItems = localOrder.items.map((it) => ({
      ...it,
      status: 'out_for_delivery' as OrderItemStatus,
      tracking_number: tracking,
      carrier: carrierName,
      shipped_at: new Date().toISOString(),
    }));

    const updatedOrder: Order = {
      ...localOrder,
      items: updatedItems,
    };

    setLocalOrder(updatedOrder);
    onOrderUpdated?.(updatedOrder);

    // Add system chat notification
    sendOrderMessage(
      localOrder.id,
      'Tote Dispatch Bot',
      'system',
      `🚚 Status Update: Artisan has marked this order as OUT FOR DELIVERY via ${carrierName} (Waybill: ${tracking}).`
    );

    addToast({
      title: 'Marked Out for Delivery',
      message: `Order #${localOrder.id} dispatched. Buyer notified!`,
      type: 'success',
    });
  };

  // 2. Buyer Marks as Received
  const handleMarkReceived = () => {
    const updatedItems = localOrder.items.map((it) => ({
      ...it,
      status: 'delivered' as OrderItemStatus,
    }));

    const updatedOrder: Order = {
      ...localOrder,
      items: updatedItems,
    };

    setLocalOrder(updatedOrder);
    onOrderUpdated?.(updatedOrder);

    // CRITICAL REQUIREMENT: Item gets removed from marketplace!
    if (firstItem?.product_id) {
      removeProductFromMarketplace(firstItem.product_id);
    }

    // Add system chat message
    sendOrderMessage(
      localOrder.id,
      'Tote Delivery Bot',
      'system',
      `✅ Delivery Confirmed: ${localOrder.buyer_name} has received the bag. This slow-crafted artisan item has been completed and removed from the active marketplace!`
    );

    addToast({
      title: 'Order Marked as Received!',
      message: `Thank you for confirming! Handcrafted piece has been removed from marketplace.`,
      type: 'success',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-3xl border border-border shadow-elevated max-w-2xl w-full h-[620px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-background flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {firstItem && (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-card border border-border shrink-0">
                <Image
                  src={firstItem.image_url}
                  alt={firstItem.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-foreground truncate">
                  Order #{localOrder.id}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isDelivered
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : isOutForDelivery
                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  {isDelivered
                    ? 'Delivered & Completed'
                    : isOutForDelivery
                    ? 'Out for Delivery'
                    : 'Crafting / Pending'}
                </span>
              </div>
              <p className="text-[11px] text-muted truncate">
                {firstItem?.title} • {formatINR(localOrder.total_amount)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-accent text-foreground">
              You: {currentRole === 'buyer' ? 'Buyer' : 'Artisan'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-accent text-muted hover:text-foreground transition-colors"
              aria-label="Close conversation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Status Bar (Lifecycle Shortcuts) */}
        <div className="px-5 py-2.5 bg-card border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted">
              {currentRole === 'seller' ? (
                <>Connected with buyer: <strong className="text-foreground">{localOrder.buyer_name}</strong></>
              ) : (
                <>Connected with artisan: <strong className="text-foreground">{firstItem?.stall_name || 'Maker'}</strong></>
              )}
            </span>
          </div>

          {/* Lifecycle Action Buttons */}
          <div>
            {currentRole === 'seller' && !isOutForDelivery && !isDelivered && (
              <button
                type="button"
                onClick={handleMarkOutForDelivery}
                className="py-1.5 px-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Mark Out for Delivery</span>
              </button>
            )}

            {currentRole === 'buyer' && isOutForDelivery && !isDelivered && (
              <button
                type="button"
                onClick={handleMarkReceived}
                className="py-1.5 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 animate-pulse"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark as Received ✅</span>
              </button>
            )}

            {isDelivered && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Received • Removed from Marketplace
              </span>
            )}
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-background">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted">
              <p>No messages in this order yet. Send a message to coordinate delivery!</p>
            </div>
          ) : (
            messages.map((msg) => {
              if (msg.sender_role === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <div className="max-w-md px-3.5 py-1.5 rounded-full bg-card border border-border text-[11px] text-muted text-center shadow-subtle flex items-center gap-1.5 font-medium">
                      <span>{msg.message}</span>
                    </div>
                  </div>
                );
              }

              const isMine =
                (currentRole === 'buyer' && msg.sender_role === 'buyer') ||
                (currentRole === 'seller' && msg.sender_role === 'seller');

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-muted mb-0.5 px-1">
                    {msg.sender_name} •{' '}
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-subtle ${
                      isMine
                        ? 'bg-foreground text-background rounded-br-none'
                        : 'bg-card border border-border text-foreground rounded-bl-none'
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Footer */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-card border-t border-border flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              currentRole === 'buyer'
                ? 'Message artisan about loom craft, delivery...'
                : 'Message buyer with packing/dispatch updates...'
            }
            className="flex-1 py-2.5 px-4 rounded-full bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ring)] placeholder:text-muted"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="p-2.5 rounded-full bg-foreground text-background disabled:bg-border disabled:text-muted transition-colors"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
