'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Store,
  MapPin,
  FileText,
  User,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  MessageSquare,
  AlertTriangle,
  Calendar,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { Order, OrderItemStatus } from '@/lib/types';
import {
  getDemoOrders,
  saveDemoOrders,
  removeProductFromMarketplace,
  formatINR,
  reportOrderDispute,
} from '@/lib/demoData';
import { sendOrderMessage, addNotification } from '@/lib/conversationService';
import { getUserSession } from '@/lib/userSession';
import { useToastStore } from '@/hooks/useToastStore';
import { OrderChatModal } from '@/components/OrderChatModal';

export default function BuyerOrdersPage() {
  const addToast = useToastStore((s) => s.addToast);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [session, setSession] = useState(getUserSession());
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [disputeModalOrder, setDisputeModalOrder] = useState<Order | null>(null);
  const [disputeReason, setDisputeReason] = useState('Stitching or fabric defect');
  const [disputeNotes, setDisputeNotes] = useState('');

  useEffect(() => {
    const loaded = getDemoOrders();
    setOrders(loaded);
    if (loaded.length > 0) {
      setSelectedOrder(loaded[0]);
    }
  }, []);

  const getStatusBadge = (status: OrderItemStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending Artisan
          </span>
        );
      case 'ready_to_pack':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
            <Package className="w-3 h-3" />
            Crafted &amp; Packing
          </span>
        );
      case 'out_for_delivery':
      case 'shipped':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <Truck className="w-3 h-3" />
            Out for Delivery
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Delivered &amp; Received
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
    }
  };

  const getStepNumber = (status: OrderItemStatus) => {
    switch (status) {
      case 'pending':
        return 1;
      case 'ready_to_pack':
        return 2;
      case 'out_for_delivery':
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 1;
    }
  };

  const handleMarkItemReceived = (
    orderId: string,
    itemId: string,
    productId: string,
    productTitle: string
  ) => {
    // 1. Update order status
    const updatedOrders = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          items: o.items.map((it) =>
            it.id === itemId ? { ...it, status: 'delivered' as OrderItemStatus } : it
          ),
        };
      }
      return o;
    });

    saveDemoOrders(updatedOrders);
    setOrders(updatedOrders);

    const updatedSelected = updatedOrders.find((o) => o.id === orderId) || null;
    setSelectedOrder(updatedSelected);

    // 2. CRITICAL USER REQUIREMENT: remove the item from marketplace!
    removeProductFromMarketplace(productId);

    // 3. Post system message to conversation
    sendOrderMessage(
      orderId,
      'Tote Delivery Bot',
      'system',
      `✅ Delivery Confirmed: ${selectedOrder?.buyer_name || 'Buyer'} confirmed receipt of "${productTitle}". This unique handcrafted piece has been delivered and removed from the active marketplace!`
    );

    // 4. Send notification to seller
    addNotification({
      target_role: 'seller',
      order_id: orderId,
      product_id: productId,
      title: 'Order Confirmed Received! 🎉',
      message: `${selectedOrder?.buyer_name || 'Buyer'} marked "${productTitle}" as received. Handcrafted piece removed from marketplace.`,
    });

    addToast({
      title: 'Order Marked as Received!',
      message: `Confirmed! "${productTitle}" has been archived and removed from the marketplace.`,
      type: 'success',
    });
  };

  const handleReportDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalOrder) return;
    const fullIssue = `${disputeReason}${disputeNotes ? `: ${disputeNotes}` : ''}`;
    reportOrderDispute(disputeModalOrder.id, fullIssue);

    sendOrderMessage(
      disputeModalOrder.id,
      session?.name || 'Buyer',
      'buyer',
      `⚠️ ISSUE REPORTED: "${fullIssue}". I would like to discuss and resolve this directly.`
    );

    addNotification({
      target_role: 'seller',
      order_id: disputeModalOrder.id,
      title: 'Issue Reported by Buyer ⚠️',
      message: `Buyer reported an issue on Order #${disputeModalOrder.id}: ${fullIssue}`,
    });

    const updated = orders.map((o) =>
      o.id === disputeModalOrder.id
        ? {
            ...o,
            dispute_status: 'reported' as const,
            dispute_issue: fullIssue,
            dispute_created_at: new Date().toISOString(),
          }
        : o
    );
    setOrders(updated);
    const updatedSel = updated.find((o) => o.id === disputeModalOrder.id) || null;
    setSelectedOrder(updatedSel);

    addToast({
      title: 'Dispute / Issue Reported',
      message: 'Your report has been logged and sent to the artisan. Direct chat has been opened.',
      type: 'info',
    });

    const targetOrder = disputeModalOrder;
    setDisputeModalOrder(null);
    setDisputeNotes('');
    if (targetOrder) {
      setChatOrder(targetOrder);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-8 pb-28 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Title & Nav Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E0] pb-5">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-amber-800">
              Buyer Account Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#18181B] tracking-tight">
              Order History & Delivery Tracker
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-4 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'orders'
                  ? 'bg-[#18181B] text-white shadow-subtle'
                  : 'bg-[#FFFFFF] border border-[#E5E5E0] text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              My Orders ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-4 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-[#18181B] text-white shadow-subtle'
                  : 'bg-[#FFFFFF] border border-[#E5E5E0] text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              Saved Addresses & Profile
            </button>
          </div>
        </div>

        {/* TAB 1: ORDERS & VISUAL TRACKER */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Orders List Column */}
            <div className="lg:col-span-5 space-y-4">
              {orders.length === 0 ? (
                <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] p-8 text-center shadow-subtle space-y-3">
                  <Package className="w-10 h-10 text-[#71717A] mx-auto" />
                  <p className="font-semibold text-sm text-[#18181B]">No orders yet</p>
                  <p className="text-xs text-[#71717A]">
                    When you purchase a tote, track its journey from the loom to your doorstep here.
                  </p>
                  <Link
                    href="/"
                    className="inline-block mt-2 py-2 px-4 rounded-full bg-[#18181B] text-white text-xs font-semibold"
                  >
                    Browse Totes
                  </Link>
                </div>
              ) : (
                orders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  const firstItem = order.items[0];
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer shadow-subtle ${
                        isSelected
                          ? 'bg-[#FFFFFF] border-[#18181B] shadow-elevated'
                          : 'bg-[#FFFFFF] border-[#E5E5E0] hover:border-[#71717A]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-xs text-[#18181B]">
                          #{order.id}
                        </span>
                        <span className="text-[11px] text-[#71717A]">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {firstItem && (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#F2F0EB] shrink-0 border border-[#E5E5E0]">
                            <Image
                              src={firstItem.image_url}
                              alt={firstItem.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs text-[#18181B] truncate">
                            {firstItem?.title}
                            {order.items.length > 1 && ` +${order.items.length - 1} more`}
                          </p>
                          <p className="text-[11px] text-[#71717A] mt-0.5">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''} • {formatINR(order.total_amount)}
                          </p>
                          {order.payment_status === 'pending_verification' && (
                            <p className="text-[10px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                              <span>⏳ UTR Verif. Pending</span>
                            </p>
                          )}
                          {order.dispute_status === 'reported' && (
                            <p className="text-[10px] text-rose-700 font-bold mt-1 flex items-center gap-1">
                              <span>⚠️ Issue Active</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#E5E5E0]/60 flex items-center justify-between">
                        {getStatusBadge(firstItem?.status || 'pending')}
                        <span className="text-xs font-semibold text-[#18181B] flex items-center gap-1">
                          View Journey <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Order Detailed Tracking Panel */}
            <div className="lg:col-span-7">
              {selectedOrder ? (
                <div className="bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] p-6 sm:p-8 shadow-elevated space-y-6">
                  {/* Order Title & Receipt Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E5E0] gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-[#18181B]">
                          Order #{selectedOrder.id}
                        </h2>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${
                            selectedOrder.payment_status === 'confirmed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {selectedOrder.payment_status === 'pending_verification'
                            ? 'Awaiting UPI Verification'
                            : selectedOrder.payment_status}
                        </span>
                      </div>
                      <p className="text-xs text-[#71717A] mt-0.5">
                        Placed on {new Date(selectedOrder.created_at).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      <button
                        type="button"
                        onClick={() => setChatOrder(selectedOrder)}
                        className="py-1.5 px-3 rounded-xl border border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-xs font-semibold text-amber-900 flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                        <span>Chat with Artisan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDisputeModalOrder(selectedOrder)}
                        className="py-1.5 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-800 flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Report Issue ⚠️</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="py-1.5 px-3 rounded-xl border border-[#E5E5E0] text-xs font-semibold text-[#18181B] hover:bg-[#F2F0EB] flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Receipt
                      </button>
                    </div>
                  </div>

                  {/* Payment Verification Banner */}
                  {selectedOrder.payment_status === 'pending_verification' ? (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs text-amber-950">
                        <p className="font-bold">
                          Peer-to-Peer UPI Payment Pending Artisan Confirmation
                        </p>
                        <p className="text-amber-800 leading-relaxed">
                          You provided Transaction UTR ending in{' '}
                          <span className="font-mono font-bold bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-950">
                            ...{selectedOrder.buyer_transaction_last5 || '84920'}
                          </span>
                          . The artisan will verify this in their bank / UPI records to confirm payment before dispatching your handcrafted bag.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="text-xs text-emerald-950">
                        <span className="font-bold">UPI Payment Verified & Confirmed ✅</span>
                        <span className="text-emerald-800 ml-1.5">
                          Artisan confirmed matching UTR digits ({selectedOrder.buyer_transaction_last5 || '84920'}).
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Scheduled Delivery Status Alert */}
                  {selectedOrder.delivery_scheduled_date && (
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs text-blue-950">
                        <p className="font-bold flex items-center gap-2">
                          <span>Scheduled Delivery Arrival: {selectedOrder.delivery_scheduled_date}</span>
                          <span className="font-normal text-blue-700">via {selectedOrder.carrier || 'SpeedPost Express'}</span>
                        </p>
                        <p className="text-blue-800 font-mono text-[11px]">
                          Tracking Waybill: {selectedOrder.tracking_number || 'INP-849204'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Active Dispute Banner */}
                  {selectedOrder.dispute_status === 'reported' && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 text-xs text-rose-950">
                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-bold">Active Dispute Reported: {selectedOrder.dispute_issue}</p>
                          <p className="text-rose-800">
                            Direct artisan resolution is ongoing. Use the chat window to communicate directly with the artisan.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChatOrder(selectedOrder)}
                        className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shrink-0 whitespace-nowrap"
                      >
                        Open Dispute Chat
                      </button>
                    </div>
                  )}

                  {/* Visual Step-by-Step Delivery Tracker for each item/stall */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A]">
                      Dispatches from Artisans:
                    </h3>

                    {selectedOrder.items.map((item) => {
                      const step = getStepNumber(item.status);
                      return (
                        <div
                          key={item.id}
                          className="bg-[#FAFAF8] rounded-2xl border border-[#E5E5E0] p-4 sm:p-5 space-y-4"
                        >
                          {/* Item Meta */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#FFFFFF] border border-[#E5E5E0] shrink-0">
                                <Image
                                  src={item.image_url}
                                  alt={item.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <p className="font-bold text-xs sm:text-sm text-[#18181B]">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-[#71717A]">
                                  Artisan Workshop: <span className="font-medium text-[#18181B]">{item.stall_name}</span>
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(item.status)}
                          </div>

                          {/* Step Progress Tracker Graphic */}
                          <div className="pt-2">
                            <div className="grid grid-cols-4 gap-2 text-center text-[10px] sm:text-[11px] mb-2 font-medium">
                              <span className={step >= 1 ? 'text-[#18181B] font-bold' : 'text-[#71717A]'}>
                                1. Confirmed
                              </span>
                              <span className={step >= 2 ? 'text-[#18181B] font-bold' : 'text-[#71717A]'}>
                                2. Packed
                              </span>
                              <span className={step >= 3 ? 'text-[#18181B] font-bold' : 'text-[#71717A]'}>
                                3. In Transit
                              </span>
                              <span className={step >= 4 ? 'text-emerald-700 font-bold' : 'text-[#71717A]'}>
                                4. Delivered
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-[#E5E5E0] h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#18181B] h-full rounded-full transition-all duration-700"
                                style={{
                                  width: `${(step / 4) * 100}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Carrier Tracking Link */}
                          {item.tracking_number && (
                            <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#E5E5E0] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                              <div className="space-y-0.5">
                                <p className="font-bold text-[#18181B] flex items-center gap-1.5">
                                  <Truck className="w-4 h-4 text-blue-600" />
                                  <span>{item.carrier || 'Express Courier'}</span>
                                </p>
                                <p className="font-mono text-[11px] text-[#71717A]">
                                  Waybill: {item.tracking_number}
                                </p>
                              </div>

                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(item.tracking_number)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="py-1.5 px-3 rounded-lg bg-[#F2F0EB] hover:bg-[#E5E5E0] text-xs font-semibold text-[#18181B] inline-flex items-center gap-1 self-start sm:self-auto transition-colors"
                              >
                                <span>Track on Carrier Website</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          {/* Delivery Action: Mark as Received */}
                          {(item.status === 'out_for_delivery' || item.status === 'shipped') && (
                            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-subtle">
                              <div className="space-y-0.5">
                                <p className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                                  <Package className="w-4 h-4 text-emerald-700" />
                                  <span>Item is Out for Delivery!</span>
                                </p>
                                <p className="text-[11px] text-emerald-800">
                                  Package arrived? Click below to confirm receipt. The item will then be archived and removed from the active marketplace.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  handleMarkItemReceived(
                                    selectedOrder.id,
                                    item.id,
                                    item.product_id,
                                    item.title
                                  )
                                }
                                className="py-2.5 px-5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-elevated flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Mark as Received ✅</span>
                              </button>
                            </div>
                          )}

                          {item.status === 'delivered' && (
                            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2 text-emerald-900">
                              <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>Delivered &amp; Received • Item removed from marketplace</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setChatOrder(selectedOrder)}
                                className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3" />
                                Message Artisan
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Shipping Address & Cost Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#E5E5E0] text-xs">
                    <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E5E5E0] space-y-1">
                      <p className="font-bold text-[#18181B] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-700" />
                        Delivery Destination
                      </p>
                      <p className="font-medium text-[#18181B]">{selectedOrder.shipping_address.name}</p>
                      <p className="text-[#71717A] leading-relaxed">
                        {selectedOrder.shipping_address.street}, {selectedOrder.shipping_address.city} - {selectedOrder.shipping_address.postalCode}
                      </p>
                      <p className="text-[#71717A]">Phone: {selectedOrder.shipping_address.phone}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E5E5E0] space-y-1">
                      <p className="font-bold text-[#18181B]">Payment Breakdown</p>
                      <div className="flex justify-between text-[#71717A]">
                        <span>Bags Subtotal</span>
                        <span>{formatINR(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-[#71717A]">
                        <span>Artisan Shipping</span>
                        <span>{formatINR(selectedOrder.shipping_total)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-[#18181B] pt-1 border-t border-[#E5E5E0]">
                        <span>Total Paid</span>
                        <span>{formatINR(selectedOrder.total_amount)}</span>
                      </div>
                      <p className="text-[10px] text-emerald-700 font-medium pt-1">
                        Settled via {selectedOrder.payment_method.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] p-12 text-center text-[#71717A] text-xs">
                  Select an order on the left to inspect its live journey.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SAVED ADDRESSES & PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] p-6 sm:p-8 shadow-subtle space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#18181B]">Profile & Saved Addresses</h2>
              <p className="text-xs text-[#71717A]">
                Manage your shipping destinations for instant 1-click checkout on all artisan stalls.
              </p>
            </div>

            {!session ? (
              <div className="p-8 text-center bg-[#FAFAF8] rounded-2xl border border-[#E5E5E0] space-y-3">
                <User className="w-10 h-10 text-[#71717A] mx-auto" />
                <p className="font-bold text-sm text-[#18181B]">No Buyer Account Signed In</p>
                <p className="text-xs text-[#71717A]">
                  Sign in or create a buyer account to manage your delivery addresses and track past orders.
                </p>
                <Link
                  href="/login?role=buyer&redirect=/orders"
                  className="inline-block mt-2 py-2 px-5 rounded-full bg-[#18181B] text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Sign In / Create Account
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#FAFAF8] border border-[#E5E5E0] flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F2F0EB] shrink-0 relative border border-[#E5E5E0]">
                    <Image
                      src={session.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                      alt={session.name || 'Buyer'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#18181B]">{session.name}</h3>
                    <p className="text-xs text-[#71717A]">{session.email} • {session.phone || 'No phone registered'}</p>
                  </div>
                </div>

                <h3 className="font-bold text-xs uppercase tracking-wider text-[#71717A] pt-2">
                  Saved Shipping Addresses
                </h3>

                {session.addresses && session.addresses.length > 0 ? (
                  session.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-4 rounded-2xl border border-[#E5E5E0] bg-[#FFFFFF] shadow-subtle flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#18181B]">{addr.name}</span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[#71717A] leading-relaxed">
                      {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                    <p className="text-[#71717A]">Phone: {addr.phone}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#71717A] italic">No saved addresses on file.</p>
            )}
          </div>
        )}
          </div>
        )}

        {/* Buyer-Seller Order Chat Modal */}
        {chatOrder && (
          <OrderChatModal
            order={chatOrder}
            currentRole="buyer"
            onClose={() => setChatOrder(null)}
            onOrderUpdated={(updated) => {
              const updatedList = orders.map((o) => (o.id === updated.id ? updated : o));
              setOrders(updatedList);
              if (selectedOrder?.id === updated.id) {
                setSelectedOrder(updated);
              }
            }}
          />
        )}

        {/* Dispute / Issue Reporting Modal */}
        {disputeModalOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="p-6 bg-rose-50/80 border-b border-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#18181B] text-base">Report Issue on Order #{disputeModalOrder.id}</h3>
                    <p className="text-xs text-rose-800">Direct artisan dispute &amp; quality resolution</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDisputeModalOrder(null)}
                  className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#71717A] flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleReportDisputeSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#71717A] tracking-wider">
                    Select Issue Category
                  </label>
                  <select
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full text-xs font-medium bg-[#FAFAF8] border border-[#E5E5E0] rounded-xl px-3 py-2.5 text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  >
                    <option value="Damaged in transit / Torn packaging">Damaged in transit / Torn packaging</option>
                    <option value="Stitching or fabric defect">Stitching or fabric defect</option>
                    <option value="Incorrect tote bag design/color sent">Incorrect tote bag design/color sent</option>
                    <option value="Severe delay beyond scheduled delivery">Severe delay beyond scheduled delivery</option>
                    <option value="Payment verification discrepancy">Payment verification discrepancy</option>
                    <option value="Other craft inquiry">Other craft inquiry</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#71717A] tracking-wider">
                    Details &amp; Notes for Artisan
                  </label>
                  <textarea
                    rows={4}
                    value={disputeNotes}
                    onChange={(e) => setDisputeNotes(e.target.value)}
                    placeholder="Describe what you observed with the bag or parcel. The artisan will reply directly in the chat to resolve or replace it."
                    className="w-full text-xs bg-[#FAFAF8] border border-[#E5E5E0] rounded-xl p-3 text-[#18181B] focus:outline-none focus:border-[#18181B] resize-none"
                    required
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                  🛡️ <strong>Tote Buyer Protection:</strong> Submitting this flags the order as disputed on the seller&apos;s dashboard and immediately initiates direct chat resolution with the workshop.
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDisputeModalOrder(null)}
                    className="px-4 py-2 rounded-full border border-[#E5E5E0] text-xs font-semibold text-[#71717A] hover:bg-[#FAFAF8]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit &amp; Open Chat</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
