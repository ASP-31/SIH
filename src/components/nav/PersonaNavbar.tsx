'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, ShoppingBag, TrendingUp } from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import { getUserSession, UserSession } from '@/lib/userSession';
import { getCollabProposals } from '@/lib/influencerService';
import { ModeSwitcherModal } from '@/components/ModeSwitcherModal';
import NotificationBell from '@/components/NotificationBell';
import { NavTopBanner } from './NavTopBanner';
import { NavBrand } from './NavBrand';
import { NavLinks } from './NavLinks';
import { UserMenu } from './UserMenu';
import { PERSONA_CHROME, NavPersona } from './navConfig';

export function PersonaNavbar({ persona }: { persona: NavPersona }) {
  const router = useRouter();
  const chrome = PERSONA_CHROME[persona];

  const totalItems = useCartStore((s) => s.getTotalItems());
  const setCartOpen = useCartStore((s) => s.setCartOpen);

  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [pendingCollabsCount, setPendingCollabsCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      const initialSession = await getUserSession();
      if (cancelled) return;

      setMounted(true);
      setSession(initialSession);
    };

    const handleSessionUpdate = () => {
      void (async () => {
        const nextSession = await getUserSession();
        if (cancelled) return;
        setSession(nextSession);
      })();
    };

    const handleCollabsUpdate = async () => {
      if (persona !== 'seller') return;
      const collabs = await getCollabProposals();
      if (cancelled) return;
      setPendingCollabsCount(collabs.filter((c) => c.status === 'pending').length);
    };

    void loadSession();
    void handleCollabsUpdate();

    window.addEventListener('tote_session_changed', handleSessionUpdate);
    window.addEventListener('tote_collabs_updated', handleCollabsUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener('tote_session_changed', handleSessionUpdate);
      window.removeEventListener('tote_collabs_updated', handleCollabsUpdate);
    };
  }, [persona]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = navSearch.trim();
    if (query && chrome.searchTarget) {
      router.push(`${chrome.searchTarget}${encodeURIComponent(query)}`);
    }
  };

  const showCart = persona === 'buyer' || persona === 'shared';

  return (
    <header className="sticky top-0 z-40 bg-card border-b-2 border-border transition-all">
      <NavTopBanner />

      {/* MAIN NAVIGATION BAR */}
      <div
        className={`transition-colors ${chrome.barBorderClass ?? 'border-b border-foreground'} ${chrome.barClass}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            {/* Left: Brand Identity & Active Persona Title */}
            <div className="flex items-center gap-4 sm:gap-6">
              <NavBrand persona={persona} />
              <NavLinks
                persona={persona}
                pendingCollabsCount={pendingCollabsCount}
                sellerStallSlug={session?.sellerStallSlug}
              />
            </div>

            {/* Middle: Search Input (Buyer & Creator) */}
            {chrome.searchPlaceholder && (
              <form
                onSubmit={handleSearchSubmit}
                className="hidden sm:flex flex-1 max-w-xs relative items-center"
              >
                <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder={chrome.searchPlaceholder}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border-2 border-[#18181B] bg-[#FAFAF8] focus:bg-white outline-none placeholder-[#71717A] text-[#18181B]"
                />
              </form>
            )}

            {/* Right: Actions, Notifications, Role Switcher, Cart */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher (Google Translate) */}
              <div id="google_translate_element" className="hidden sm:block text-left" />

              <NotificationBell variant={chrome.bellVariant} />

              <UserMenu
                persona={persona}
                mounted={mounted}
                session={session}
                onOpenModeSwitcher={() => setIsModeModalOpen(true)}
              />

              {/* Cart Button: Buyer marketplace only */}
              {showCart && (
                <button
                  type="button"
                  onClick={() => setCartOpen(true)}
                  className="relative p-2 border-2 border-[#18181B] bg-[#18181B] text-white hover:bg-zinc-800 shadow-[2px_2px_0px_0px_#71717A] active:translate-x-0.5 active:translate-y-0.5 transition-all"
                  aria-label="Open Cart"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {mounted && totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-[#18181B] text-[10px] font-mono font-black w-4 h-4 rounded-full flex items-center justify-center border border-[#18181B]">
                      {totalItems}
                    </span>
                  )}
                </button>
              )}

              {/* Artisan mode: direct link to the buyer marketplace */}
              {persona === 'seller' && (
                <Link
                  href="/"
                  className="hidden sm:flex items-center gap-1 py-1.5 px-2.5 text-xs font-mono font-bold uppercase border-2 border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white"
                >
                  <span>Public Store</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}

              {/* Creator mode: direct link to reel links anchor */}
              {persona === 'creator' && (
                <Link
                  href="/influencer#creator-portfolio"
                  className="hidden sm:flex items-center gap-1 py-1.5 px-2.5 text-xs font-mono font-bold uppercase border-2 border-orange-500 bg-orange-500 text-white hover:bg-orange-600"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>My Portfolio</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mode Switcher Modal */}
      <ModeSwitcherModal
        isOpen={isModeModalOpen}
        onClose={() => setIsModeModalOpen(false)}
        currentSession={session}
      />
    </header>
  );
}
