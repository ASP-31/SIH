'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Zap,
  Plus,
  Minus,
  Volume2,
} from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import { useToastStore } from '@/hooks/useToastStore';
import { formatINR } from '@/lib/demoData';

export function QuickViewModal() {
  const router = useRouter();
  const isOpen = useCartStore((s) => s.isQuickViewOpen);
  const product = useCartStore((s) => s.selectedProductForQuickView);
  const closeQuickView = useCartStore((s) => s.closeQuickView);
  const addItem = useCartStore((s) => s.addItem);
  const addToast = useToastStore((s) => s.addToast);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !product) return null;

  const isSoldOut = product.stock <= 0;

  const handleAddToCart = () => {
    if (isSoldOut) return;
    addItem(product, quantity);
    addToast({
      title: 'Added to your bag',
      message: `${quantity}x ${product.title}`,
      type: 'success',
    });
    closeQuickView();
  };

  const handleBuyNow = () => {
    if (isSoldOut) return;
    addItem(product, quantity);
    closeQuickView();
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-[#18181B]/40 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] shadow-elevated p-4 sm:p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeQuickView}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#F2F0EB] text-[#71717A] hover:text-[#18181B] transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
          {/* Gallery Column */}
          <div className="flex flex-col gap-3">
            <div className="relative aspect-square w-full rounded-2xl bg-[#F2F0EB] overflow-hidden border border-[#E5E5E0]/60">
              <Image
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center"
              />
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#FFFFFF]/90 text-[#18181B] shadow-sm">
                {product.category}
              </span>
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIndex === idx
                        ? 'border-[#18181B] shadow-sm'
                        : 'border-transparent hover:border-[#E5E5E0]'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Angle ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="flex flex-col">
            {/* Stall Information */}
            <div className="flex items-center gap-2 mb-2">
              <Link
                href={`/stall/${product.stall_slug || 'earthstitch-studio'}`}
                onClick={closeQuickView}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#71717A] hover:text-[#18181B] transition-colors"
              >
                <span>{product.stall_name || 'Artisan Stall'}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              </Link>
              <span className="text-[#E5E5E0]">•</span>
              <span className="text-[11px] text-[#71717A]">Handmade in India</span>
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-[#18181B] leading-tight">
              {product.title}
            </h2>

            {/* Pricing */}
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl sm:text-2xl font-black text-[#18181B]">
                {formatINR(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm text-[#71717A] line-through">
                  {formatINR(product.original_price)}
                </span>
              )}
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium ml-1">
                Zero Middlemen Fee
              </span>
            </div>

            {/* Description */}
            <p className="mt-3 text-xs sm:text-sm text-[#71717A] leading-relaxed">
              {product.description}
            </p>

            {/* Artisan Voice Narration Player (originally recorded in seller's native language) */}
            {product.audio_story_url && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-amber-700" />
                    Hear the Artisan's Own Words
                  </span>
                  {product.audio_story_title && (
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                      {product.audio_story_title}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-amber-900/80 mb-2">
                  Spoken by the artisan in their native language. Text is auto-translated to your chosen site language.
                </p>
                <audio controls src={product.audio_story_url} className="w-full h-10" />
              </div>
            )}

            {/* Specifications Grid */}
            <div className="mt-4 p-3.5 rounded-2xl bg-[#F2F0EB]/60 border border-[#E5E5E0] space-y-2 text-xs">
              <div className="flex justify-between py-0.5 border-b border-[#E5E5E0]/60">
                <span className="text-[#71717A]">Material:</span>
                <span className="font-medium text-[#18181B] text-right">{product.material}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-[#E5E5E0]/60">
                <span className="text-[#71717A]">Dimensions:</span>
                <span className="font-medium text-[#18181B]">{product.dimensions}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-[#E5E5E0]/60">
                <span className="text-[#71717A]">Capacity:</span>
                <span className="font-medium text-[#18181B]">{product.capacity_liters} Liters</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-[#71717A]">Strap Drop:</span>
                <span className="font-medium text-[#18181B]">{product.strap_drop}</span>
              </div>
            </div>

            {/* Color Swatches */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-4">
                <label className="text-xs font-semibold text-[#18181B] block mb-1.5">
                  Artisan Dye / Colorway:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedColorIndex(idx)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        selectedColorIndex === idx
                          ? 'bg-[#18181B] text-white shadow-sm'
                          : 'bg-[#F2F0EB] text-[#18181B] hover:bg-[#E5E5E0]'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs font-semibold text-[#18181B]">Quantity:</span>
              <div className="flex items-center rounded-full border border-[#E5E5E0] bg-[#FFFFFF] shadow-subtle p-0.5">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:bg-[#F2F0EB] disabled:opacity-30"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-xs font-bold text-[#18181B]">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= product.stock}
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:bg-[#F2F0EB] disabled:opacity-30"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-[11px] text-[#71717A]">
                ({product.stock} available)
              </span>
            </div>

            {/* Action CTAs */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                disabled={isSoldOut}
                onClick={handleAddToCart}
                className="flex-1 py-3 px-4 rounded-full border border-[#18181B] text-[#18181B] hover:bg-[#F2F0EB] text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-subtle"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Bag
              </button>

              <button
                type="button"
                disabled={isSoldOut}
                onClick={handleBuyNow}
                className="flex-1 py-3 px-4 rounded-full bg-[#18181B] hover:bg-[#27272A] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-elevated"
              >
                <Zap className="w-4 h-4" />
                Instant Buy
              </button>
            </div>

            {/* Reassurance notes */}
            <div className="mt-4 pt-3 border-t border-[#E5E5E0]/60 flex items-center justify-between text-[11px] text-[#71717A]">
              <span className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                Direct dispatch from artisan
              </span>
              <span className="flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                7-day artisanal craft guarantee
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
