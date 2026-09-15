'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  ShoppingBag,
  Package,
  Store,
  Video,
  Layers,
  Share2,
  FileSpreadsheet,
  TrendingUp,
  MessageSquare,
  SlidersHorizontal,
} from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import { getUserSession, UserSession } from '@/lib/userSession';
import { ModeSwitcherModal } from './ModeSwitcherModal';

export function MobileBottomNav() {
  const pathname = usePathname();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const setCartOpen = useCartStore((s) => s.setCartOpen);
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSession(getUserSession());
    const handleUpdate = () => setSession(getUserSession());
    window.addEventListener('tote_session_changed', handleUpdate);
    return () => window.removeEventListener('tote_session_changed', handleUpdate);
  }, []);

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname?.startsWith(path)) return true;
    return false;
  };

  const isInfluencer = session?.role === 'influencer';
  const isSeller = session?.role === 'seller';

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FCFAF6]/98 backdrop-blur-md border-t-2 border-[#18181B] px-2 py-1.5 pb-safe shadow-[0_-4px_16px_rgba(24,24,27,0.08)] font-mono">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* 1. SELLER MODE MOBILE NAVIGATION */}
          {isSeller ? (
            <>
              <Link
                href="/dashboard"
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded transition-colors ${
                  pathname === '/dashboard' && !pathname?.includes('tab=')
                    ? 'text-amber-700 font-black'
                    : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span className="text-[9px] tracking-tight uppercase font-bold">Pipeline</span>
              </Link>

              <Link
                href="/dashboard?tab=collabs"
                className="flex flex-col items-center gap-0.5 py-1 px-2 rounded text-[#71717A] hover:text-[#18181B] transition-colors"
              >
                <Share2 className="w-4 h-4 text-orange-600" />
                <span className="text-[9px] tracking-tight uppercase font-bold">Collabs</span>
              </Link>

              <Link
                href="/dashboard?tab=b2b_hub"
                className="flex flex-col items-center gap-0.5 py-1 px-2 rounded text-[#71717A] hover:text-[#18181B] transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="text-[9px] tracking-tight uppercase font-bold">GeM/B2B</span>
              </Link>

              <Link
                href="/dashboard?tab=catalog"
                className="flex flex-col items-center gap-0.5 py-1 px-2 rounded text-[#71717A] hover:text-[#18181B] transition-colors"
              >
                <Store className="w-4 h-4" />
                <span className="text-[9px] tracking-tight uppercase font-bold">Catalog</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsModeModalOpen(true)}
                className="flex flex-col items-center gap-0.5 py-1 px-2 rounded text-amber-900 bg-amber-100/80 border border-amber-300 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-[9px] tracking-tight uppercase font-black">Mode</span>
              </button>
            </>
          ) : isInfluencer ? (
            /* 2. INFLUENCER MODE MOBILE NAVIGATION */
            <>
              <Link
                href="/influencer"
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded transition-colors ${
                  pathname === '/influencer'
                    ? 'text-orange-600 font-black'
                    : 'text-[#71717A] hover:text-orange-600'
                }`}
              >
                <Video className="w-4 h-4" />
                <span className="text-[9px] tracking-tight uppercase font-bold">Pitch Hub</span>
              </Link>

              <Link
                href="/influencer#creator-portfolio"
                className="flex flex-col items-center gap-0.5 py-1 px-2 rounded text-[#71717A] hover:text-[#18181B] transition-colors"
              >
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-[9px] tracking-tight uppercase font-bold">Reel Links</span>
              </Link>

              <Link
                href="/influencer#collabs-channel"
                className="flex flex-col items-center gap-0.5 py-1 px-2 rounded text-[#71717A] hover:text-[#18181B] transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span className="text-[9px] tracking-tight uppercase font-bold">Chats</span>
              </Link>

              <Link
                href="/"
                className="flex flex-col items-center gap-0.5 py-1 px-2 rounded text-[#71717A] hover:text-[#18181B] transition-colors"
              >
                <Compass className="w-4 h-4" />
                <span className="text-[9px] tracking-tight uppercase font-bold">Store</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsModeModalOpen(true)}
                className="flex flex-col items-center gap-0.5 py-1 px-2 rounded text-orange-950 bg-orange-100 border border-orange-400 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-[9px] tracking-tight uppercase font-black">Mode</span>
              </button>
            </>
          ) : (
            /* 3. BUYER MODE MOBILE NAVIGATION */
            <>
              <Link
                href="/"
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded transition-colors ${
                  isActive('/') && !pathname?.startsWith('/orders')
                    ? 'text-[#EA580C] font-black'
                    : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <Compass className="w-4 h-4" />
                <span className="text-[9px] tracking-tight uppercase font-bold">Market</span>
              </Link>

              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative flex flex-col items-center gap-0.5 py-1 px-2 rounded text-[#71717A] hover:text-[#18181B] transition-colors"
                aria-label="Open Shopping Bag"
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4" />
                  {mounted && totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-amber-500 text-black text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-black">
                      {totalItems > 9 ? '9+' : totalItems}
                    </span>
                  )}
                </div>
                <span className="text-[9px] tracking-tight uppercase font-bold">Bag</span>
              </button>

              <Link
                href="/orders"
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded transition-colors ${
                  isActive('/orders')
                    ? 'text-[#EA580C] font-black'
                    : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <Package className="w-4 h-4" />
                <span className="text-[9px] tracking-tight uppercase font-bold">Orders</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsModeModalOpen(true)}
                className="flex flex-col items-center gap-0.5 py-1 px-2 rounded text-zinc-900 bg-zinc-100 border border-zinc-300 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="text-[9px] tracking-tight uppercase font-black">Mode</span>
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Mode Switcher Modal */}
      <ModeSwitcherModal
        isOpen={isModeModalOpen}
        onClose={() => setIsModeModalOpen(false)}
        currentSession={session}
      />
    </>
  );
}
