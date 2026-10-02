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
import { getUserSession, UserSession } from '@/lib/userSession';
import { saveNewOrder, formatINR } from '@/lib/demoData';
import { sendOrderMessage } from '@/lib/conversationService';
import { clearReferralAttribution } from '@/lib/referralAttribution';
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

  const [session, setSession] = useState<UserSession | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Shipping Address Form
  const [shippingAddress, setShippingAddress] = useState<Address>({
    id: '',
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

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
    let cancelled = false;

    const hydrateSession = async () => {
      const currentSession = await getUserSession();
      if (cancelled) return;

      setSession(currentSession);
      setShippingAddress(
        currentSession?.addresses?.[0] || {
          id: 'addr_new',
          name: currentSession?.name || '',
          phone: currentSession?.phone || '',
          street: '',
          city: '',
          state: 'Karnataka',
          postalCode: '',
          country: 'India',
        }
      );
    };

    void hydrateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // If cart is empty and not on confirmation step, redirect home
    if (items.length === 0 && currentStep !== 4) {
      router.push('/cart');
    }
  }, [items, currentStep, router]);

  const handlePlaceOrder = () => {
    if (!session) {
      addToast({
        title: 'Sign in to place your order',
        message: 'Orders are tied to your account so you can track delivery and message the artisan.',
        type: 'error',
      });
      router.push('/login?redirect=/checkout');
      return;
    }

    if (paymentMethod === 'upi' && buyerTransactionLast5.trim().length !== 5) {
      addToast({
        title: 'UPI UTR Required',
        message: 'Please enter the exact last 5 digits of your UPI transaction ID / UTR.',
        type: 'error',
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(async () => {
      const generatedOrderId = `pending_${Date.now()}`;
      // A UTR is real payment evidence and must never be invented. The guard
      // above already rejects a UPI order without exactly 5 digits, so this is
      // only ever null for card/Apple Pay, which settle immediately.
      const enteredLast5 = paymentMethod === 'upi' ? buyerTransactionLast5.trim() : '';

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

      let placedOrder: Order;
      try {
        placedOrder = await saveNewOrder(newOrder);
      } catch (error) {
        setIsProcessing(false);
        addToast({
          title: 'Could not place order',
          message: error instanceof Error ? error.message : 'Please try again in a moment.',
          type: 'error',
        });
        return;
      }

      setCompletedOrder(placedOrder);
      clearCart();
      clearReferralAttribution();
      setIsProcessing(false);
      setCurrentStep(4);

      // Seed the order conversation thread. Seller and buyer alerts are
      // generated by database triggers, not the client.
      sendOrderMessage(
        placedOrder.id,
        'Tote Payment Bot',
        'system',
        paymentMethod === 'upi'
          ? `💰 UPI Payment verification submitted by buyer ${shippingAddress.name}. Buyer reported UTR ending in ...${enteredLast5}. Artisan verification pending.`
          : `💳 Order placed and paid by ${shippingAddress.name} via ${paymentMethod === 'apple_pay' ? 'Apple Pay' : 'card'}. Awaiting dispatch.`
      );

      addToast({
        title: 'Order Submitted!',
        message: paymentMethod === 'upi'
          ? `Payment proof submitted (UTR: ...${enteredLast5}). Artisan notified for verification.`
          : 'Payment received. The artisan has been notified and will start preparing your order.',
        type: 'success',
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        {currentStep < 4 && (
          <div className="mb-8">
            <Link
              href="/cart"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Bag
            </Link>

            {/* Stepper Wizard Header */}
            <div className="flex items-center justify-between max-w-md mx-auto pt-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= 1 ? 'bg-foreground text-background' : 'bg-accent text-muted'
                  }`}
                >
                  1
                </div>
                <span className="text-xs font-semibold text-foreground">Shipping</span>
              </div>
              <div className="h-0.5 w-12 bg-accent" />
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= 2 ? 'bg-foreground text-background' : 'bg-accent text-muted'
                  }`}
                >
                  2
                </div>
                <span className="text-xs font-semibold text-foreground">Dispatch</span>
              </div>
              <div className="h-0.5 w-12 bg-accent" />
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep >= 3 ? 'bg-foreground text-background' : 'bg-accent text-muted'
                  }`}
                >
                  3
                </div>
                <span className="text-xs font-semibold text-foreground">Payment</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: ORDER CONFIRMATION SUCCESS VIEW */}
        {currentStep === 4 && completedOrder && (
          <div className="max-w-2xl mx-auto bg-card rounded-3xl border border-border p-6 sm:p-10 shadow-elevated space-y-6 text-center animate-fade-in">
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
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                {completedOrder.payment_status === 'pending_verification'
                  ? 'Payment proof submitted to artisan!'
                  : 'Thank you for supporting slow fashion!'}
              </h1>
              <p className="text-xs sm:text-sm text-muted">
                Order <span className="font-mono font-bold text-foreground">#{completedOrder.id}</span> has been broadcast directly to the artisan workshop.
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
            <div className="bg-background rounded-2xl border border-border p-4 text-left space-y-3 text-xs">
              <div className="flex justify-between font-semibold text-foreground pb-2 border-b border-border">
                <span>Recipient: {completedOrder.shipping_address.name}</span>
                <span>Total: {formatINR(completedOrder.total_amount)}</span>
              </div>
              <div className="text-muted space-y-1">
                <p>
                  {completedOrder.shipping_address.street}, {completedOrder.shipping_address.city} - {completedOrder.shipping_address.postalCode}
                </p>
                <p>Phone: {completedOrder.shipping_address.phone}</p>
                <p>Payment: {completedOrder.payment_method.toUpperCase()} ({completedOrder.payment_status})</p>
              </div>

              {/* Items Breakdown */}
              <div className="pt-2 border-t border-border space-y-2">
                <p className="font-semibold text-foreground">Ordered Bags:</p>
                {completedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-muted">
                    <span>
                      {item.quantity}x {item.title} ({item.stall_name})
                    </span>
                    <span className="font-medium text-foreground">
                      {formatINR(item.price_at_purchase * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/orders"
                className="flex-1 py-3 px-6 rounded-full bg-foreground hover:bg-[#27272A] text-background text-xs sm:text-sm font-semibold shadow-elevated flex items-center justify-center gap-2 transition-all"
              >
                <Package className="w-4 h-4" />
                <span>Track Order &amp; Chat with Artisan</span>
              </Link>
              <Link
                href="/"
                className="py-3 px-6 rounded-full bg-card border border-border hover:bg-accent text-foreground text-xs sm:text-sm font-semibold shadow-subtle transition-all"
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
            <div className="lg:col-span-7 bg-card rounded-2xl border border-border p-5 sm:p-7 shadow-subtle space-y-6">
              {/* STEP 1: SHIPPING ADDRESS */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <h2 className="text-base font-bold text-foreground">
                      Step 1: Shipping Address
                    </h2>
                    {session?.addresses && session.addresses.length > 1 && (
                      <span className="text-xs text-muted">Saved Address Loaded</span>
                    )}
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="font-semibold text-foreground block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-background border border-border focus:ring-1 focus:ring-[var(--ring)] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-foreground block mb-1">Mobile Phone</label>
                        <input
                          type="text"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-background border border-border focus:ring-1 focus:ring-[var(--ring)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-foreground block mb-1">PIN / Postal Code</label>
                        <input
                          type="text"
                          value={shippingAddress.postalCode}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-background border border-border focus:ring-1 focus:ring-[var(--ring)] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-foreground block mb-1">Street / House Address</label>
                      <input
                        type="text"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-background border border-border focus:ring-1 focus:ring-[var(--ring)] outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-foreground block mb-1">City</label>
                        <input
                          type="text"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-background border border-border focus:ring-1 focus:ring-[var(--ring)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-foreground block mb-1">State</label>
                        <input
                          type="text"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-background border border-border focus:ring-1 focus:ring-[var(--ring)] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="w-full py-3 px-4 rounded-full bg-foreground text-background text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#27272A] shadow-elevated transition-all"
                  >
                    <span>Continue to Delivery Options</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: DELIVERY METHOD */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <h2 className="text-base font-bold text-foreground">
                      Step 2: Dispatch Method
                    </h2>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs text-muted hover:underline"
                    >
                      Edit Address
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label
                      onClick={() => setDeliveryMethod('standard')}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        deliveryMethod === 'standard'
                          ? 'border-foreground bg-accent/50 shadow-subtle'
                          : 'border-border hover:bg-background'
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
                        <div className="flex justify-between font-bold text-foreground">
                          <span>Standard Eco Artisan Dispatch</span>
                          <span>{baseShipping === 0 ? 'FREE' : formatINR(baseShipping)}</span>
                        </div>
                        <p className="text-muted mt-0.5">
                          Plastic-free biodegradable packing. Delivery in 4-6 business days via India Post / Delhivery.
                        </p>
                      </div>
                    </label>

                    <label
                      onClick={() => setDeliveryMethod('express')}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        deliveryMethod === 'express'
                          ? 'border-foreground bg-accent/50 shadow-subtle'
                          : 'border-border hover:bg-background'
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
                        <div className="flex justify-between font-bold text-foreground">
                          <span>Priority Courier (BlueDart Express Air)</span>
                          <span>+{formatINR(120)}</span>
                        </div>
                        <p className="text-muted mt-0.5">
                          Insured express transport. Delivery in 1-2 business days with SMS tracking updates.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="py-3 px-5 rounded-full border border-border text-xs font-semibold text-foreground hover:bg-accent"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="flex-1 py-3 px-4 rounded-full bg-foreground text-background text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#27272A] shadow-elevated transition-all"
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
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <h2 className="text-base font-bold text-foreground">
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
                          ? 'border-foreground bg-accent text-foreground shadow-sm'
                          : 'border-border text-muted hover:bg-background'
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
                          ? 'border-foreground bg-accent text-foreground shadow-sm'
                          : 'border-border text-muted hover:bg-background'
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
                          ? 'border-foreground bg-accent text-foreground shadow-sm'
                          : 'border-border text-muted hover:bg-background'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>GPay / Apple Pay</span>
                    </button>
                  </div>

                  {/* Payment Specific Input */}
                  {paymentMethod === 'upi' && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-background border border-border space-y-4 text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <span className="font-bold text-foreground text-xs">
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
                                ? 'border-foreground bg-card shadow-sm ring-1 ring-[var(--ring)]'
                                : `${app.color} hover:opacity-90`
                            }`}
                          >
                            <span>{app.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* UPI Payee Details & Dynamic QR Code Box */}
                      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                              Artisan Beneficiary VPA
                            </span>
                            <span className="font-mono font-bold text-xs sm:text-sm text-foreground">
                              earthstitch.mira@okhdfcbank
                            </span>
                            <p className="text-[11px] text-muted">
                              Payee: Mira Shenoy (EarthStitch Studio) • Verified Handloom
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-muted tracking-wider block">
                              Payable Total
                            </span>
                            <span className="text-base sm:text-lg font-black text-emerald-700">
                              {formatINR(grandTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Interactive QR Code Display */}
                        {selectedUpiApp === 'qr' && (
                          <div className="p-4 rounded-xl bg-accent border border-zinc-200 flex flex-col items-center text-center space-y-2 animate-fade-in">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                                `upi://pay?pa=earthstitch.mira@okhdfcbank&pn=Mira+Shenoy&am=${grandTotal}&cu=INR&tn=ToteOrder`
                              )}`}
                              alt="UPI QR Code"
                              className="w-32 h-32 rounded-lg border border-zinc-300 p-1 bg-card shadow-sm"
                            />
                            <p className="text-[11px] text-muted font-medium">
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
                            className="w-44 p-2.5 text-center font-mono font-bold text-base rounded-xl bg-card border border-amber-300 focus:ring-2 focus:ring-amber-500 outline-none tracking-widest text-foreground"
                          />
                          <div className="flex gap-1">
                            {[0, 1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={`w-6 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs border ${
                                  buyerTransactionLast5[i]
                                    ? 'bg-amber-100 border-amber-400 text-amber-950 shadow-xs'
                                    : 'bg-card border-dashed border-amber-200 text-amber-300'
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
                    <div className="p-4 rounded-xl bg-background border border-border space-y-3 text-xs">
                      <div>
                        <label className="font-semibold text-foreground block mb-1">Card Number</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-card border border-border focus:ring-1 focus:ring-[var(--ring)] outline-none font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-semibold text-foreground block mb-1">Expiry</label>
                          <input
                            type="text"
                            defaultValue="08/28"
                            className="w-full p-2.5 rounded-xl bg-card border border-border text-center font-mono outline-none"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-foreground block mb-1">CVV</label>
                          <input
                            type="password"
                            defaultValue="•••"
                            className="w-full p-2.5 rounded-xl bg-card border border-border text-center font-mono outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'apple_pay' && (
                    <div className="p-4 rounded-xl bg-background border border-border text-center text-xs space-y-1">
                      <p className="font-semibold text-foreground">Biometric One-Touch Checkout</p>
                      <p className="text-[11px] text-muted">
                        Confirming payment will trigger device Touch ID / Face ID verification.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="py-3 px-5 rounded-full border border-border text-xs font-semibold text-foreground hover:bg-accent"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing || (paymentMethod === 'upi' && buyerTransactionLast5.length !== 5)}
                      onClick={handlePlaceOrder}
                      className="flex-1 py-3.5 px-4 rounded-full bg-foreground hover:bg-[#27272A] text-background text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-elevated transition-all active:scale-98 disabled:opacity-40"
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
              <div className="bg-card rounded-2xl border border-border p-5 shadow-subtle space-y-4">
                <h3 className="font-bold text-sm text-foreground">
                  Bags in Order ({items.length})
                </h3>

                <div className="divide-y divide-border/60 max-h-60 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.product.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-accent shrink-0 border border-border">
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate max-w-[170px]">
                            {item.product.title}
                          </p>
                          <p className="text-[10px] text-muted">
                            Qty {item.quantity} • {item.product.stall_name}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-foreground">
                        {formatINR(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5 text-xs pt-3 border-t border-border">
                  <div className="flex justify-between text-muted">
                    <span>Bags Subtotal</span>
                    <span className="text-foreground font-medium">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Artisan Shipping</span>
                    <span className="text-foreground font-medium">
                      {shippingTotal === 0 ? (
                        <span className="text-emerald-700 font-bold">FREE</span>
                      ) : (
                        formatINR(shippingTotal)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border">
                    <span>Grand Total</span>
                    <span>{formatINR(grandTotal)}</span>
                  </div>
                </div>

                <div className="pt-2 text-center text-[11px] text-muted space-y-1 border-t border-border/60">
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
