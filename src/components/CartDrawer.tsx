'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Store,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import { formatINR } from '@/lib/demoData';

export function CartDrawer() {
  const router = useRouter();
  const isOpen = useCartStore((s) => s.isCartOpen);
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const getGroupedByStall = useCartStore((s) => s.getGroupedByStall);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getShippingTotal = useCartStore((s) => s.getShippingTotal);
  const getGrandTotal = useCartStore((s) => s.getGrandTotal);
  const totalItems = useCartStore((s) => s.getTotalItems());

  if (!isOpen) return null;

  const stallGroups = getGroupedByStall();
  const subtotal = getSubtotal();
  const shipping = getShippingTotal();
  const grandTotal = getGrandTotal();

  const handleCheckoutClick = () => {
    setCartOpen(false);
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={() => setCartOpen(false)}
        className="absolute inset-0 bg-[#18181B]/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FAFAF8] border-l border-[#E5E5E0] shadow-elevated flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-[#FFFFFF] border-b border-[#E5E5E0]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#18181B]" />
              <h2 className="text-base font-bold text-[#18181B]">
                Your Shopping Bag ({totalItems})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              className="p-1.5 rounded-full hover:bg-[#F2F0EB] text-[#71717A] hover:text-[#18181B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content: Grouped by Artisan Stall */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {stallGroups.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#F2F0EB] flex items-center justify-center text-[#71717A]">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-[#18181B]">
                  Your bag is empty
                </h3>
                <p className="text-xs text-[#71717A] max-w-xs leading-relaxed">
                  Support independent artisans by exploring hand-crafted canvas, crochet, and waxed totes.
                </p>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="mt-2 py-2.5 px-6 rounded-full bg-[#18181B] text-white text-xs font-semibold shadow-subtle hover:bg-[#27272A] transition-colors"
                >
                  Explore Stalls
                </button>
              </div>
            ) : (
              stallGroups.map((group) => {
                const freeShippingRemaining = Math.max(0, 1500 - group.subtotal);
                return (
                  <div
                    key={group.stallId}
                    className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] p-4 shadow-subtle space-y-3"
                  >
                    {/* Stall Header Badge */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E0]/60">
                      <div className="flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-amber-700" />
                        <span className="text-xs font-bold text-[#18181B]">
                          {group.stallName}
                        </span>
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-[10px] text-[#71717A]">
                        Dispatches directly
                      </span>
                    </div>

                    {/* Shipping Tier Progress */}
                    <div className="px-2.5 py-1.5 rounded-lg bg-[#F2F0EB]/60 border border-[#E5E5E0]/40 flex items-center justify-between text-[11px]">
                      <span className="text-[#71717A] flex items-center gap-1">
                        <Truck className="w-3 h-3 text-[#18181B]" />
                        {group.shipping === 0 ? (
                          <span className="text-emerald-700 font-medium">Free Artisan Shipping unlocked!</span>
                        ) : (
                          <span>Artisan Shipping: {formatINR(group.shipping)}</span>
                        )}
                      </span>
                      {group.shipping > 0 && (
                        <span className="text-[10px] text-[#71717A]">
                          Add {formatINR(freeShippingRemaining)} for free delivery
                        </span>
                      )}
                    </div>

                    {/* Items in this Stall */}
                    <div className="divide-y divide-[#E5E5E0]/40">
                      {group.items.map(({ product, quantity }) => (
                        <div key={product.id} className="py-2.5 flex items-center gap-3">
                          {/* Image */}
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#F2F0EB] shrink-0 border border-[#E5E5E0]/60">
                            <Image
                              src={product.images[0]}
                              alt={product.title}
                              fill
                              className="object-cover"
                            />
                          </div>

                          {/* Title & Price */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-[#18181B] truncate">
                              {product.title}
                            </h4>
                            <p className="text-[11px] text-[#71717A] mt-0.5">
                              {product.material.split('&')[0]}
                            </p>
                            <p className="text-xs font-bold text-[#18181B] mt-1">
                              {formatINR(product.price * quantity)}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center rounded-full border border-[#E5E5E0] bg-[#FFFFFF] p-0.5">
                              <button
                                type="button"
                                onClick={() => updateQuantity(product.id, quantity - 1)}
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[#71717A] hover:text-[#18181B]"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center text-[11px] font-bold text-[#18181B]">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                disabled={quantity >= product.stock}
                                onClick={() => updateQuantity(product.id, quantity + 1)}
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[#71717A] hover:text-[#18181B] disabled:opacity-30"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeItem(product.id)}
                              className="p-1.5 text-[#71717A] hover:text-rose-600 rounded-full hover:bg-rose-50 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {stallGroups.length > 0 && (
            <div className="p-4 sm:p-5 bg-[#FFFFFF] border-t border-[#E5E5E0] space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#71717A]">
                  <span>Items Subtotal</span>
                  <span className="text-[#18181B] font-medium">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#71717A]">
                  <span>Artisan Shipping ({stallGroups.length} stall{stallGroups.length > 1 ? 's' : ''})</span>
                  <span className="text-[#18181B] font-medium">
                    {shipping === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE</span>
                    ) : (
                      formatINR(shipping)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#18181B] pt-1.5 border-t border-[#E5E5E0]">
                  <span>Total Due</span>
                  <span>{formatINR(grandTotal)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  className="w-full py-3 px-4 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-elevated active:scale-98 transition-all"
                >
                  <span>Proceed to Multi-Stall Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  href="/cart"
                  onClick={() => setCartOpen(false)}
                  className="w-full text-center py-2 text-xs font-semibold text-[#71717A] hover:text-[#18181B] transition-colors"
                >
                  View Full Cart & Breakdown
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
