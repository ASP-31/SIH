'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Store,
  ShieldCheck,
  Truck,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import { formatINR } from '@/lib/demoData';

export default function CartPage() {
  const router = useRouter();
  const {
    items,
    updateQuantity,
    removeItem,
    getGroupedByStall,
    getSubtotal,
    getShippingTotal,
    getGrandTotal,
    clearCart,
  } = useCartStore();

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const stallGroups = getGroupedByStall();
  const subtotal = getSubtotal();
  const shippingTotal = getShippingTotal();
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const grandTotal = Math.max(0, subtotal - discount + shippingTotal);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'ARTISAN10') {
      setPromoApplied(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#71717A] hover:text-[#18181B] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Continue Shopping
          </Link>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-rose-600 hover:text-rose-800 transition-colors"
            >
              Empty Bag
            </button>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#18181B] tracking-tight mb-2">
          Your Shopping Bag
        </h1>
        <p className="text-xs sm:text-sm text-[#71717A] mb-8">
          Review your handcrafted items. Bags from multiple artisan stalls will be individually packaged and dispatched directly by the makers.
        </p>

        {items.length === 0 ? (
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] p-12 text-center shadow-subtle max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#F2F0EB] flex items-center justify-center mx-auto text-[#71717A]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-[#18181B]">Your bag is currently empty</h2>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Support slow fashion creators by exploring our organic canvas, crochet, and waxed utility totes.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-[#18181B] text-white text-xs font-semibold hover:bg-[#27272A] shadow-subtle transition-all"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Grouped by Stall */}
            <div className="lg:col-span-8 space-y-6">
              {stallGroups.map((group) => {
                const freeShippingRemaining = Math.max(0, 1500 - group.subtotal);
                return (
                  <div
                    key={group.stallId}
                    className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] p-4 sm:p-6 shadow-subtle space-y-4"
                  >
                    {/* Stall Title Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E0]/80">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-amber-700" />
                        <Link
                          href={`/stall/${group.stallSlug || 'earthstitch-studio'}`}
                          className="font-bold text-sm text-[#18181B] hover:underline flex items-center gap-1"
                        >
                          {group.stallName}
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        </Link>
                      </div>
                      <span className="text-[11px] text-[#71717A]">
                        Independent Creator Stall
                      </span>
                    </div>

                    {/* Shipping Tier Progress */}
                    <div className="p-3 rounded-xl bg-[#F2F0EB]/60 border border-[#E5E5E0] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
                      <span className="flex items-center gap-1.5 text-[#18181B] font-medium">
                        <Truck className="w-4 h-4 text-emerald-600" />
                        {group.shipping === 0 ? (
                          <span className="text-emerald-700 font-semibold">Free Artisan Delivery Unlocked!</span>
                        ) : (
                          <span>Artisan Shipping: {formatINR(group.shipping)}</span>
                        )}
                      </span>
                      {group.shipping > 0 && (
                        <span className="text-[11px] text-[#71717A]">
                          Add {formatINR(freeShippingRemaining)} more from this stall for free delivery
                        </span>
                      )}
                    </div>

                    {/* Stall Product Items */}
                    <div className="divide-y divide-[#E5E5E0]/60">
                      {group.items.map(({ product, quantity }) => (
                        <div
                          key={product.id}
                          className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5 flex-1">
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#F2F0EB] shrink-0 border border-[#E5E5E0]">
                              <Image
                                src={product.images[0]}
                                alt={product.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm text-[#18181B] leading-tight">
                                {product.title}
                              </h3>
                              <p className="text-xs text-[#71717A] mt-0.5">
                                {product.material}
                              </p>
                              <p className="text-xs font-bold text-[#18181B] mt-1 sm:hidden">
                                {formatINR(product.price)} each
                              </p>
                            </div>
                          </div>

                          {/* Controls & Price */}
                          <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-5">
                            {/* Quantity */}
                            <div className="flex items-center rounded-full border border-[#E5E5E0] bg-[#FFFFFF] shadow-subtle p-0.5">
                              <button
                                type="button"
                                onClick={() => updateQuantity(product.id, quantity - 1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:bg-[#F2F0EB]"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center text-xs font-bold text-[#18181B]">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                disabled={quantity >= product.stock}
                                onClick={() => updateQuantity(product.id, quantity + 1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:bg-[#F2F0EB] disabled:opacity-30"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Total per line */}
                            <span className="font-bold text-sm text-[#18181B] min-w-[70px] text-right">
                              {formatINR(product.price * quantity)}
                            </span>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => removeItem(product.id)}
                              className="p-1.5 text-[#71717A] hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-between text-xs text-[#71717A]">
                      <span>Stall Subtotal</span>
                      <span className="font-semibold text-[#18181B]">{formatINR(group.subtotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Master Order Summary */}
            <div className="lg:col-span-4 sticky top-24 space-y-4">
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] p-5 sm:p-6 shadow-subtle space-y-4">
                <h3 className="font-bold text-base text-[#18181B]">
                  Order Summary
                </h3>

                {/* Promo Code Form */}
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Try code: ARTISAN10"
                    disabled={promoApplied}
                    className="flex-1 py-2 px-3 text-xs rounded-xl bg-[#FAFAF8] border border-[#E5E5E0] focus:outline-none focus:ring-1 focus:ring-[#18181B] uppercase font-mono disabled:bg-[#F2F0EB]"
                  />
                  <button
                    type="submit"
                    disabled={promoApplied || !promoCode.trim()}
                    className="py-2 px-3 rounded-xl bg-[#F2F0EB] hover:bg-[#E5E5E0] text-xs font-semibold text-[#18181B] transition-colors disabled:opacity-40"
                  >
                    {promoApplied ? <Check className="w-4 h-4 text-emerald-600" /> : 'Apply'}
                  </button>
                </form>

                {promoApplied && (
                  <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    10% artisan launch coupon applied!
                  </p>
                )}

                {/* Costs Breakdown */}
                <div className="space-y-2 text-xs pt-2 border-t border-[#E5E5E0]">
                  <div className="flex justify-between text-[#71717A]">
                    <span>Bags Subtotal</span>
                    <span className="font-medium text-[#18181B]">{formatINR(subtotal)}</span>
                  </div>

                  {promoApplied && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Artisan Discount (10%)</span>
                      <span>-{formatINR(discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#71717A]">
                    <span>Total Stall Shipping</span>
                    <span className="font-medium text-[#18181B]">
                      {shippingTotal === 0 ? (
                        <span className="text-emerald-700 font-semibold">FREE</span>
                      ) : (
                        formatINR(shippingTotal)
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm sm:text-base font-bold text-[#18181B] pt-3 border-t border-[#E5E5E0]">
                    <span>Total Amount</span>
                    <span>{formatINR(grandTotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/checkout')}
                  className="w-full py-3.5 px-4 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-elevated transition-all active:scale-98"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="pt-2 text-center text-[11px] text-[#71717A] space-y-1">
                  <p className="flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Direct creator support • No middleman markups
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
