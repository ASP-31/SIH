'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Eye, ShieldCheck, Building2, Volume2 } from 'lucide-react';
import { Product } from '@/lib/types';
import { formatINR } from '@/lib/demoData';
import { useCartStore } from '@/hooks/useCartStore';
import { useToastStore } from '@/hooks/useToastStore';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openQuickView = useCartStore((s) => s.openQuickView);
  const addToast = useToastStore((s) => s.addToast);

  const isSoldOut = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const firstMoq = product.b2b_moq_tiers?.[0];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSoldOut) return;
    addItem(product, 1);
    addToast({
      title: 'Added to your bag',
      message: `${product.title} (${product.stall_name || 'Artisan Stall'})`,
      type: 'success',
    });
  };

  return (
    <div
      onClick={() => openQuickView(product)}
      className="group relative flex flex-col bg-white border-2 border-[#18181B] shadow-[4px_4px_0px_0px_#18181B] hover:shadow-[6px_6px_0px_0px_#18181B] transition-all cursor-pointer"
    >
      {/* Product Image Block */}
      <div className="relative aspect-square w-full bg-[#F4F4F1] border-b-2 border-[#18181B] overflow-hidden">
        <Image
          src={product.images[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover object-center group-hover:scale-102 transition-transform duration-300"
        />

        {/* Minimal Block Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-white border border-[#18181B] text-[#18181B] shadow-[1px_1px_0px_0px_#18181B]">
            {product.category}
          </span>

          {isSoldOut ? (
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-red-100 text-red-900 border border-red-900">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-amber-200 text-amber-950 border border-[#18181B]">
              Only {product.stock} Left
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-950 border border-[#18181B]">
              In Stock
            </span>
          )}
        </div>

        {/* Desktop Quick View Overlay */}
        <div className="hidden sm:flex absolute inset-0 items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="py-2 px-4 bg-white border-2 border-[#18181B] text-xs font-mono font-bold uppercase text-[#18181B] shadow-[3px_3px_0px_0px_#18181B] flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Inspect Bag
          </span>
        </div>
      </div>

      {/* Card Content Details */}
      <div className="flex flex-col flex-1 p-4 space-y-3">
        {/* Stall & GI Tag */}
        <div className="flex items-center justify-between gap-1 flex-wrap font-mono">
          <Link
            href={`/stall/${product.stall_slug || 'earthstitch-studio'}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#18181B] hover:underline"
          >
            <span>{product.stall_name || 'Independent Artisan'}</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          </Link>

          {product.is_gi_tagged && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-800 uppercase">
              GI Provenance
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-mono font-bold text-base text-[#18181B] line-clamp-1">
          {product.title}
        </h3>

        {/* Origin & Craft Technique */}
        <div className="text-xs font-mono text-[#52525B] space-y-0.5">
          <p className="flex items-center gap-1 text-amber-900 font-semibold">
            <span>📍 {product.state_origin}</span>
            {product.odop_cluster && (
              <span className="truncate">&middot; {product.odop_cluster.split('Cluster')[0]}</span>
            )}
          </p>
          <p className="truncate text-[11px] text-[#71717A]">{product.material}</p>
        </div>

        {/* Artisan Voice Narration (recorded in the seller's native language) */}
        {product.audio_story_url && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openQuickView(product);
            }}
            className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-1 border border-[#18181B] bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors"
          >
            <Volume2 className="w-3 h-3" />
            <span>♪ Hear the Artisan</span>
            {product.audio_story_title && (
              <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-100 px-1 py-0.5 border border-amber-300">
                {product.audio_story_title}
              </span>
            )}
          </button>
        )}

        {/* B2B Wholesale MOQ Callout Block */}
        {firstMoq && (
          <div className="border border-dashed border-[#18181B] bg-[#FAFAF8] p-2 text-[11px] font-mono flex items-center justify-between">
            <span className="flex items-center gap-1 text-[#18181B] font-bold">
              <Building2 className="w-3 h-3 text-amber-700" />
              B2B / GeM MOQ {firstMoq.min_qty}+:
            </span>
            <span className="font-bold text-emerald-800">
              {formatINR(firstMoq.price_per_unit)}/unit
            </span>
          </div>
        )}

        {/* Footer: Price & Action Button */}
        <div className="mt-auto pt-3 border-t-2 border-[#18181B] flex items-center justify-between gap-2">
          <div>
            <span className="font-mono text-lg font-black text-[#18181B]">
              {formatINR(product.price)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="font-mono text-xs text-[#71717A] line-through ml-2">
                {formatINR(product.original_price)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={isSoldOut}
            onClick={handleQuickAdd}
            className={`py-2 px-3 text-xs font-mono font-bold uppercase flex items-center gap-1 border-2 border-[#18181B] transition-transform ${
              isSoldOut
                ? 'bg-zinc-200 text-zinc-500 cursor-not-allowed'
                : 'bg-[#18181B] text-white hover:bg-zinc-800 shadow-[2px_2px_0px_0px_#18181B] active:translate-x-0.5 active:translate-y-0.5'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Bag</span>
          </button>
        </div>
      </div>
    </div>
  );
}
