'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  CreditCard,
  QrCode,
  Lock,
  ArrowLeft,
  ArrowRight,
  Package,
  Store,
  Sparkles,
  Clock,
} from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import { useToastStore } from '@/hooks/useToastStore';
import { getUserSession } from '@/lib/userSession';
import { saveNewOrder, formatINR } from '@/lib/demoData';
import { sendOrderMessage, addNotification } from '@/lib/conversationService';
import { Order, OrderItem, Address } from '@/lib/types';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    getGroupedByStall,
    getSubtotal,
    getShippingTotal,
    getGrandTotal,
    clearCart,
  } = useCartStore();
  const addToast = useToastStore((s) => s.addToast);

  const [session, setSession] = useState(getUserSession());
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Shipping Address Form
  const [shippingAddress, setShippingAddress] = useState<Address>(
    session?.addresses?.[0] || {
      id: 'addr_new',
      name: session?.name || '',
      phone: session?.phone || '',
      street: '',
      city: '',
      state: 'Karnataka',
      postalCode: '',
      country: 'India',
    }
  );

  // Step 2: Delivery Option
  const [deliveryMethod, setDeliveryMethod] = useState<'standard' | 'express'>('standard');

  // Step 3: Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'apple_pay'>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'phonepe' | 'gpay' | 'paytm' | 'bhim' | 'qr'>('phonepe');
  const [upiId, setUpiId] = useState('tara@okhdfcbank');
  const [buyerTransactionLast5, setBuyerTransactionLast5] = useState('');
  const [cardNumber, setCardNumber] = useState('•••• •••• •••• 4242');
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 4: Placed Order Result
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const stallGroups = getGroupedByStall();
  const subtotal = getSubtotal();
  const baseShipping = getShippingTotal();
  const expressFee = deliveryMethod === 'express' ? 120 : 0;
  const shippingTotal = baseShipping + expressFee;
  const grandTotal = subtotal + shippingTotal;

  useEffect(() => {
    // If cart is empty and not on confirmation step, redirect home
    if (items.length === 0 && currentStep !== 4) {
      router.push('/cart');
    }
  }, [items, currentStep, router]);

  const handlePlaceOrder = () => {
    if (paymentMethod === 'upi' && buyerTransactionLast5.trim().length !== 5) {
      addToast({
        title: 'UPI UTR Required',
        message: 'Please enter the exact last 5 digits of your UPI transaction ID / UTR.',
        type: 'error',
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const generatedOrderId = `TOT-${Math.floor(10000 + Math.random() * 90000)}`;
      const enteredLast5 = buyerTransactionLast5.trim() || Math.floor(10000 + Math.random() * 90000).toString();

      // Construct OrderItems from cart items
      const orderItems: OrderItem[] = items.map((cartItem, idx) => ({
        id: `item_${Date.now()}_${idx}`,
        order_id: generatedOrderId,
        product_id: cartItem.product.id,
        stall_id: cartItem.product.stall_id,
        stall_name: cartItem.product.stall_name,
        title: cartItem.product.title,
        price_at_purchase: cartItem.product.price,
        quantity: cartItem.quantity,
        image_url: cartItem.product.images[0],
        status: 'pending',
      }));

      const newOrder: Order = {
        id: generatedOrderId,
        buyer_id: session?.id || 'buyer_guest',
        buyer_name: shippingAddress.name || 'Guest Buyer',
        buyer_email: session?.email || (shippingAddress.name ? `${shippingAddress.name.toLowerCase().replace(/\s+/g, '.')}@buyer.local` : 'guest@buyer.local'),
        buyer_phone: shippingAddress.phone || '+91 98000 00000',
        shipping_address: shippingAddress,
        delivery_method: deliveryMethod,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'upi' ? 'pending_verification' : 'paid',
        buyer_transaction_last5: enteredLast5,
        subtotal,
        shipping_total: shippingTotal,
        total_amount: grandTotal,
        created_at: new Date().toISOString(),
        items: orderItems,
      };

      saveNewOrder(newOrder);
      setCompletedOrder(newOrder);
      clearCart();
      setIsProcessing(false);
      setCurrentStep(4);

      // Initialize order conversation & notify seller and buyer
      sendOrderMessage(
        newOrder.id,
        'Tote Payment Bot',
        'system',
        `💰 UPI Payment verification submitted by buyer ${shippingAddress.name}. Buyer reported UTR ending in ...${enteredLast5}. Artisan verification pending.`
      );

      addNotification({
        target_role: 'seller',
        order_id: newOrder.id,
        product_id: orderItems[0]?.product_id,
        title: 'UPI Payment Verification Needed 🔔',
        message: `${shippingAddress.name} reported payment of ${formatINR(grandTotal)} (UTR: ...${enteredLast5}). Please check your UPI app and confirm receipt!`,
      });

      addNotification({
        target_role: 'buyer',
        order_id: newOrder.id,
        product_id: orderItems[0]?.product_id,
        title: 'Order Placed • Verification Pending ⏳',
        message: `Order #${generatedOrderId} submitted. Artisan will verify your UTR (...${enteredLast5}) and schedule dispatch.`,
      });

      addToast({
        title: 'Order Submitted!',
        message: `Payment proof submitted (UTR: ...${enteredLast5}). Artisan notified for verification.`,
        type: 'success',
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        {currentStep < 4 && (
          <div className="mb-8">
            <Link
              href="/cart"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#71717A] hover:text-[#18181B] transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Bag
            </Link>

            {/* Stepper Wizard Header */}
            <div className="flex items-center justify-between max-w-md mx-auto pt-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= 1 ? 'bg-[#18181B] text-white' : 'bg-[#E5E5E0] text-[#71717A]'
                  }`}
                >
                  1
                </div>
                <span className="text-xs font-semibold text-[#18181B]">Shipping</span>
              </div>
              <div className="h-0.5 w-12 bg-[#E5E5E0]" />
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= 2 ? 'bg-[#18181B] text-white' : 'bg-[#E5E5E0] text-[#71717A]'
                  }`}
                >
                  2
                </div>
                <span className="text-xs font-semibold text-[#18181B]">Dispatch</span>
              </div>
              <div className="h-0.5 w-12 bg-[#E5E5E0]" />
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= 3 ? 'bg-[#18181B] text-white' : 'bg-[#E5E5E0] text-[#71717A]'
                  }`}
                >
                  3
                </div>
                <span className="text-xs font-semibold text-[#18181B]">Payment</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: ORDER CONFIRMATION SUCCESS VIEW */}
        {currentStep === 4 && completedOrder && (
          <div className="max-w-2xl mx-auto bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] p-6 sm:p-10 shadow-elevated space-y-6 text-center animate-fade-in">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              completedOrder.payment_status === 'pending_verification'
                ? 'bg-amber-50 border border-amber-200 text-amber-600'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
            }`}>
              {completedOrder.payment_status === 'pending_verification' ? (
                <Clock className="w-8 h-8" />
              ) : (
                <CheckCircle2 className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1">
              <span className={`text-xs uppercase tracking-wider font-bold ${
                completedOrder.payment_status === 'pending_verification'
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}>
                {completedOrder.payment_status === 'pending_verification'
                  ? 'Order Placed • Awaiting Artisan UPI Verification'
                  : 'Payment Confirmed • Dispatched to Makers'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#18181B]">
                {completedOrder.payment_status === 'pending_verification'
                  ? 'Payment proof submitted to artisan!'
                  : 'Thank you for supporting slow fashion!'}
              </h1>
              <p className="text-xs sm:text-sm text-[#71717A]">
                Order <span className="font-mono font-bold text-[#18181B]">#{completedOrder.id}</span> has been broadcast directly to the artisan workshop.
              </p>
            </div>

            {/* 5-Digit UTR Proof Banner */}
            {completedOrder.buyer_transaction_last5 && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-left space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950">
                    UPI Payment Claim (Last 5 Digits):
                  </span>
                  <span className="font-mono font-black text-sm px-2 py-0.5 rounded bg-amber-200 text-amber-950 tracking-wider">
                    ...{completedOrder.buyer_transaction_last5}
                  </span>
                </div>
                <p className="text-amber-900 leading-snug">
                  Artisan Mira Shenoy will match these 5 digits in her UPI transaction history. Once confirmed, your tote will move to packing and dispatch!
                </p>
              </div>
            )}

            {/* Receipt Summary Card */}
            <div className="bg-[#FAFAF8] rounded-2xl border border-[#E5E5E0] p-4 text-left space-y-3 text-xs">
              <div className="flex justify-between font-semibold text-[#18181B] pb-2 border-b border-[#E5E5E0]">
                <span>Recipient: {completedOrder.shipping_address.name}</span>
                <span>Total: {formatINR(completedOrder.total_amount)}</span>
              </div>
              <div className="text-[#71717A] space-y-1">
                <p>
                  {completedOrder.shipping_address.street}, {completedOrder.shipping_address.city} - {completedOrder.shipping_address.postalCode}
                </p>
                <p>Phone: {completedOrder.shipping_address.phone}</p>
                <p>Payment: {completedOrder.payment_method.toUpperCase()} ({completedOrder.payment_status})</p>
              </div>

              {/* Items Breakdown */}
              <div className="pt-2 border-t border-[#E5E5E0] space-y-2">
                <p className="font-semibold text-[#18181B]">Ordered Bags:</p>
                {completedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-[#71717A]">
                    <span>
                      {item.quantity}x {item.title} ({item.stall_name})
                    </span>
                    <span className="font-medium text-[#18181B]">
                      {formatINR(item.price_at_purchase * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/orders"
                className="flex-1 py-3 px-6 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-semibold shadow-elevated flex items-center justify-center gap-2 transition-all"
              >
                <Package className="w-4 h-4" />
                <span>Track Order &amp; Chat with Artisan</span>
              </Link>
              <Link
                href="/"
                className="py-3 px-6 rounded-full bg-[#FFFFFF] border border-[#E5E5E0] hover:bg-[#F2F0EB] text-[#18181B] text-xs sm:text-sm font-semibold shadow-subtle transition-all"
              >
                Back to Marketplace
              </Link>
            </div>
          </div>
        )}

        {/* STEP 1, 2, 3: CHECKOUT FORMS */}
        {currentStep < 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Form Steps */}
            <div className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] p-5 sm:p-7 shadow-subtle space-y-6">
              {/* STEP 1: SHIPPING ADDRESS */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]">
                    <h2 className="text-base font-bold text-[#18181B]">
                      Step 1: Shipping Address
                    </h2>
                    {session?.addresses && session.addresses.length > 1 && (
                      <span className="text-xs text-[#71717A]">Saved Address Loaded</span>
                    )}
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-semibold text-[#18181B] block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] focus:ring-1 focus:ring-[#18181B] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-[#18181B] block mb-1">Mobile Phone</label>
                        <input
                          type="text"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] focus:ring-1 focus:ring-[#18181B] outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#18181B] block mb-1">PIN / Postal Code</label>
                        <input
                          type="text"
                          value={shippingAddress.postalCode}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] focus:ring-1 focus:ring-[#18181B] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-[#18181B] block mb-1">Street / House Address</label>
                      <input
                        type="text"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] focus:ring-1 focus:ring-[#18181B] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-[#18181B] block mb-1">City</label>
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] focus:ring-1 focus:ring-[#18181B] outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#18181B] block mb-1">State</label>
                        <input
                          type="text"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] focus:ring-1 focus:ring-[#18181B] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full py-3 px-4 rounded-full bg-[#18181B] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#27272A] shadow-elevated transition-all"
                  >
                    <span>Continue to Delivery Options</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: DELIVERY METHOD */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]">
                    <h2 className="text-base font-bold text-[#18181B]">
                      Step 2: Dispatch Method
                    </h2>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-[#71717A] hover:underline"
                    >
                      Edit Address
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label
                      onClick={() => setDeliveryMethod('standard')}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        deliveryMethod === 'standard'
                          ? 'border-[#18181B] bg-[#F2F0EB]/50 shadow-subtle'
                          : 'border-[#E5E5E0] hover:bg-[#FAFAF8]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryMethod === 'standard'}
                        onChange={() => setDeliveryMethod('standard')}
                        className="mt-1"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex justify-between font-bold text-[#18181B]">
                          <span>Standard Eco Artisan Dispatch</span>
                          <span>{baseShipping === 0 ? 'FREE' : formatINR(baseShipping)}</span>
                        </div>
                        <p className="text-[#71717A] mt-0.5">
                          Plastic-free biodegradable packing. Delivery in 4-6 business days via India Post / Delhivery.
                        </p>
                      </div>
                    </label>

                    <label
                      onClick={() => setDeliveryMethod('express')}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        deliveryMethod === 'express'
                          ? 'border-[#18181B] bg-[#F2F0EB]/50 shadow-subtle'
                          : 'border-[#E5E5E0] hover:bg-[#FAFAF8]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryMethod === 'express'}
                        onChange={() => setDeliveryMethod('express')}
                        className="mt-1"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex justify-between font-bold text-[#18181B]">
                          <span>Priority Courier (BlueDart Express Air)</span>
                          <span>+{formatINR(120)}</span>
                        </div>
                        <p className="text-[#71717A] mt-0.5">
                          Insured express transport. Delivery in 1-2 business days with SMS tracking updates.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="py-3 px-5 rounded-full border border-[#E5E5E0] text-xs font-semibold text-[#18181B] hover:bg-[#F2F0EB]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="flex-1 py-3 px-4 rounded-full bg-[#18181B] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#27272A] shadow-elevated transition-all"
                    >
                      <span>Proceed to Payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: PAYMENT GATEWAY SIMULATION */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]">
                    <h2 className="text-base font-bold text-[#18181B]">
                      Step 3: Secure Settlement
                    </h2>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                      <Lock className="w-3 h-3" />
                      256-Bit Encrypted
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'upi'
                          ? 'border-[#18181B] bg-[#F2F0EB] text-[#18181B] shadow-sm'
                          : 'border-[#E5E5E0] text-[#71717A] hover:bg-[#FAFAF8]'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span>Direct UPI</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'card'
                          ? 'border-[#18181B] bg-[#F2F0EB] text-[#18181B] shadow-sm'
                          : 'border-[#E5E5E0] text-[#71717A] hover:bg-[#FAFAF8]'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      <span>Cards / Stripe</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('apple_pay')}
                      className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                        paymentMethod === 'apple_pay'
                          ? 'border-[#18181B] bg-[#F2F0EB] text-[#18181B] shadow-sm'
                          : 'border-[#E5E5E0] text-[#71717A] hover:bg-[#FAFAF8]'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>GPay / Apple Pay</span>
                    </button>
                  </div>

                  {/* Payment Specific Input */}
                  {paymentMethod === 'upi' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#FAFAF8] border border-[#E5E5E0] space-y-4 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]">
                        <span className="font-bold text-[#18181B] text-xs">
                          Select Indian UPI Payment Option
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Direct Peer-to-Peer
                        </span>
                      </div>

                      {/* UPI App Buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'phonepe', name: 'PhonePe', color: 'bg-purple-50 text-purple-800 border-purple-200' },
                          { id: 'gpay', name: 'Google Pay', color: 'bg-blue-50 text-blue-800 border-blue-200' },
                          { id: 'paytm', name: 'Paytm UPI', color: 'bg-sky-50 text-sky-800 border-sky-200' },
                          { id: 'qr', name: 'Scan QR Code', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                        ].map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => setSelectedUpiApp(app.id as any)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                              selectedUpiApp === app.id
                                ? 'border-[#18181B] bg-white shadow-sm ring-1 ring-[#18181B]'
                                : `${app.color} hover:opacity-90`
                            }`}
                          >
                            <span>{app.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* UPI Payee Details & Dynamic QR Code Box */}
                      <div className="p-4 rounded-xl bg-white border border-[#E5E5E0] space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider block">
                              Artisan Beneficiary VPA
                            </span>
                            <span className="font-mono font-bold text-xs sm:text-sm text-[#18181B]">
                              earthstitch.mira@okhdfcbank
                            </span>
                            <p className="text-[11px] text-[#71717A]">
                              Payee: Mira Shenoy (EarthStitch Studio) • Verified Handloom
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-[#71717A] tracking-wider block">
                              Payable Total
                            </span>
                            <span className="text-base sm:text-lg font-black text-emerald-700">
                              {formatINR(grandTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Interactive QR Code Display */}
                        {selectedUpiApp === 'qr' && (
                          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col items-center text-center space-y-2 animate-fade-in">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                                `upi://pay?pa=earthstitch.mira@okhdfcbank&pn=Mira+Shenoy&am=${grandTotal}&cu=INR&tn=ToteOrder`
                              )}`}
                              alt="UPI QR Code"
                              className="w-32 h-32 rounded-lg border border-zinc-300 p-1 bg-white shadow-sm"
                            />
                            <p className="text-[11px] text-zinc-600 font-medium">
                              Scan with any UPI App (GPay / PhonePe / Paytm / BHIM)
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 5-DIGIT UTR INPUT: MANDATORY TRANSACTION CONFIRMATION */}
                      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-amber-950 text-xs block">
                            Enter Last 5 Digits of UPI Transaction / UTR ID <span className="text-rose-600">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setBuyerTransactionLast5('84920')}
                            className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline"
                          >
                            Fill Demo UTR (84920)
                          </button>
                        </div>

                        <p className="text-[11px] text-amber-900 leading-snug">
                          After completing the UPI payment in your app, find the 12-digit UTR/UPI Ref ID on your payment receipt and enter the last 5 digits below. The artisan will verify this in their bank history to confirm your order!
                        </p>

                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            required
                            maxLength={5}
                            value={buyerTransactionLast5}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 5);
                              setBuyerTransactionLast5(val);
                            }}
                            placeholder="e.g. 84920"
                            className="w-44 p-2.5 text-center font-mono font-bold text-base rounded-xl bg-white border border-amber-300 focus:ring-2 focus:ring-amber-500 outline-none tracking-widest text-[#18181B]"
                          />
                          <div className="flex gap-1">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={`w-6 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs border ${
                                  buyerTransactionLast5[i]
                                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                                    : 'bg-white border-dashed border-amber-200 text-amber-300'
                                }`}
                              >
                                {buyerTransactionLast5[i] || '•'}
                              </div>
                            ))}
                          </div>
                          <span className="text-[11px] text-amber-800 font-semibold ml-auto">
                            {buyerTransactionLast5.length}/5 digits
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] space-y-3 text-xs">
                      <div>
                        <label className="font-semibold text-[#18181B] block mb-1">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E5E0] focus:ring-1 focus:ring-[#18181B] outline-none font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-semibold text-[#18181B] block mb-1">Expiry</label>
                          <input
                            type="text"
                            defaultValue="08/28"
                            className="w-full p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E5E0] text-center font-mono outline-none"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-[#18181B] block mb-1">CVV</label>
                          <input
                            type="password"
                            defaultValue="•••"
                            className="w-full p-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E5E0] text-center font-mono outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'apple_pay' && (
                    <div className="p-4 rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] text-center text-xs space-y-1">
                      <p className="font-semibold text-[#18181B]">Biometric One-Touch Checkout</p>
                      <p className="text-[11px] text-[#71717A]">
                        Confirming payment will trigger device Touch ID / Face ID verification.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="py-3 px-5 rounded-full border border-[#E5E5E0] text-xs font-semibold text-[#18181B] hover:bg-[#F2F0EB]"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing || (paymentMethod === 'upi' && buyerTransactionLast5.length !== 5)}
                      onClick={handlePlaceOrder}
                      className="flex-1 py-3.5 px-4 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-elevated transition-all active:scale-98 disabled:opacity-40"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Notifying Artisan Studio...</span>
                        </div>
                      ) : paymentMethod === 'upi' ? (
                        buyerTransactionLast5.length === 5 ? (
                          <span>Submit &amp; Confirm UPI (UTR: ...{buyerTransactionLast5}) &rarr;</span>
                        ) : (
                          <span>Enter 5-Digit UTR to Place Order</span>
                        )
                      ) : (
                        <span>Authorize &amp; Pay {formatINR(grandTotal)}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Order Summary Breakdown */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] p-5 shadow-subtle space-y-4">
                <h3 className="font-bold text-sm text-[#18181B]">
                  Bags in Order ({items.length})
                </h3>

                <div className="divide-y divide-[#E5E5E0]/60 max-h-60 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#F2F0EB] shrink-0 border border-[#E5E5E0]">
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#18181B] truncate max-w-[170px]">
                            {item.product.title}
                          </p>
                          <p className="text-[10px] text-[#71717A]">
                            Qty {item.quantity} • {item.product.stall_name}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-[#18181B]">
                        {formatINR(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 text-xs pt-3 border-t border-[#E5E5E0]">
                  <div className="flex justify-between text-[#71717A]">
                    <span>Bags Subtotal</span>
                    <span className="text-[#18181B] font-medium">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#71717A]">
                    <span>Artisan Shipping</span>
                    <span className="text-[#18181B] font-medium">
                      {shippingTotal === 0 ? (
                        <span className="text-emerald-700 font-bold">FREE</span>
                      ) : (
                        formatINR(shippingTotal)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#18181B] pt-2 border-t border-[#E5E5E0]">
                    <span>Grand Total</span>
                    <span>{formatINR(grandTotal)}</span>
                  </div>
                </div>

                <div className="pt-2 text-center text-[11px] text-[#71717A] space-y-1 border-t border-[#E5E5E0]/60">
                  <p className="flex items-center justify-center gap-1 text-emerald-700 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    95% goes directly to independent artisans
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
