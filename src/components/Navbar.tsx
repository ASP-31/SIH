'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Store,
  User,
  Package,
  Sparkles,
  ArrowRight,
  LogOut,
  ChevronDown,
  Bell,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Video,
  Share2,
  TrendingUp,
  Landmark,
} from 'lucide-react';
import { useCartStore } from '@/hooks/useCartStore';
import { getUserSession, setUserSession, switchRole, UserSession } from '@/lib/userSession';
import { OrderNotification } from '@/lib/types';
import {
  getNotifications,
  markAllNotificationsAsRead,
} from '@/lib/conversationService';
import { getCollabProposals } from '@/lib/influencerService';
import { ModeSwitcherModal } from './ModeSwitcherModal';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const setCartOpen = useCartStore((s) => s.setCartOpen);

  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [pendingCollabsCount, setPendingCollabsCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    const initialSession = getUserSession();
    setSession(initialSession);

    const roleTarget = initialSession?.role === 'seller' ? 'seller' : 'buyer';
    setNotifications(getNotifications(roleTarget));

    const handleSessionUpdate = () => {
      const s = getUserSession();
      setSession(s);
      setNotifications(getNotifications(s?.role === 'seller' ? 'seller' : 'buyer'));
    };
    const handleNotifUpdate = () => {
      const current = getUserSession();
      setNotifications(getNotifications(current?.role === 'seller' ? 'seller' : 'buyer'));
    };
    const handleCollabsUpdate = () => {
      const collabs = getCollabProposals();
      setPendingCollabsCount(collabs.filter((c) => c.status === 'pending').length);
    };

    handleCollabsUpdate();

    window.addEventListener('tote_session_changed', handleSessionUpdate);
    window.addEventListener('tote_notifications_updated', handleNotifUpdate);
    window.addEventListener('tote_collabs_updated', handleCollabsUpdate);
    return () => {
      window.removeEventListener('tote_session_changed', handleSessionUpdate);
      window.removeEventListener('tote_notifications_updated', handleNotifUpdate);
      window.removeEventListener('tote_collabs_updated', handleCollabsUpdate);
    };
  }, []);

  const handleRoleToggle = (targetRole: 'buyer' | 'seller' | 'influencer') => {
    setIsDropdownOpen(false);
    
    // Check if currently authenticated with targetRole
    if (session && session.role === targetRole) {
      if (targetRole === 'seller') router.push('/dashboard');
      else if (targetRole === 'influencer') router.push('/influencer');
      else router.push('/');
      return;
    }

    // Try auto-switch if registered account exists for that role
    const switchRes = switchRole(targetRole);
    if (switchRes.success && switchRes.user) {
      if (targetRole === 'seller') router.push('/dashboard');
      else if (targetRole === 'influencer') router.push('/influencer');
      else router.push('/');
      return;
    }

    // Role switch requires login/signup into that specific persona
    if (targetRole === 'seller') {
      router.push('/login?role=seller&redirect=/dashboard');
    } else if (targetRole === 'influencer') {
      router.push('/login?role=influencer&redirect=/influencer');
    } else {
      router.push('/login?role=buyer&redirect=/');
    }
  };

  const handleSignOut = () => {
    setUserSession(null);
    setSession(null);
    setIsDropdownOpen(false);
    router.push('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearch.trim()) {
      if (session?.role === 'influencer') {
        router.push(`/influencer?search=${encodeURIComponent(navSearch.trim())}`);
      } else {
        router.push(`/?search=${encodeURIComponent(navSearch.trim())}`);
      }
    }
  };

  const isSeller = session?.role === 'seller';
  const isInfluencer = session?.role === 'influencer';
  const isBuyer = !session || session?.role === 'buyer';

  return (
    <header className="sticky top-0 z-40 bg-white border-b-2 border-[#18181B] transition-all">
      {/* Indian National Tricolor Minimal Accent Bar */}
      <div className="w-full h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      {/* MODI GOVT & PRIME MINISTER NARENDRA MODI MAIN HEADER BANNER */}
      <div className="bg-[#18181B] text-white py-2 px-3 sm:px-6 font-mono border-b border-[#27272A] relative overflow-hidden">
        {/* Subtle geometric Indian jaali / saffron glow background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FF9933_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 relative z-10">
          {/* PM Modi & Government Leadership Info */}
          <div className="flex items-center gap-3">
            {/* PM Narendra Modi Circular Portrait */}
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-amber-400 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.3)] bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/pm_modi.jpg"
                alt="Hon'ble Prime Minister Narendra Modi"
                className="w-full h-full object-cover object-top"
              />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/emblem_india.svg"
                  alt="National Emblem of India"
                  className="w-3.5 h-3.5 object-contain brightness-0 invert"
                />
                <span className="font-bold tracking-tight text-xs sm:text-[13px] text-amber-300 uppercase">
                  आत्मनिर्भर भारत • Vocal for Local
                </span>
                <span className="text-zinc-500 text-[10px] hidden sm:inline">|</span>
                <span className="text-[11px] text-zinc-300 hidden md:inline">
                  PM Vishwakarma &amp; GeM National Initiative
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 hidden sm:block">
                Under the Visionary Leadership of <strong className="text-white">Shri Narendra Modi</strong>, Prime Minister of India
              </span>
            </div>
          </div>

          {/* Quick Action Badges & SIH Link */}
          <div className="flex items-center gap-2.5 text-[11px] font-bold">
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px]">
              <Landmark className="w-3 h-3" />
              <span>Make in India 2024</span>
            </div>

            <Link
              href="/#sih-statements"
              className="hover:text-amber-300 transition-colors flex items-center gap-1 text-zinc-300 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">6 SIH Statements</span>
            </Link>

            <span className="text-zinc-600">|</span>

            <Link
              href="/#pm-modi-vision"
              className="text-amber-400 hover:text-amber-300 transition-colors text-xs flex items-center gap-1"
            >
              <span>PM Vision</span>
            </Link>
          </div>
        </div>
      </div>

      {/* MAIN NAVIGATION BAR: Trifurcated Buyer vs Artisan vs Influencer */}
      <div
        className={`border-b border-[#18181B] transition-colors ${
          isSeller
            ? 'bg-[#18181B] text-white'
            : isInfluencer
            ? 'bg-[#FFF7ED] text-[#18181B]'
            : 'bg-white text-[#18181B]'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
            {/* Left: Brand Identity & Active Persona Title */}
            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                href={isSeller ? '/dashboard' : isInfluencer ? '/influencer' : '/'}
                className="flex items-center gap-2.5"
              >
                <div
                  className={`w-8 h-8 flex items-center justify-center font-serif text-lg font-black border-2 ${
                    isSeller
                      ? 'bg-amber-400 text-[#18181B] border-amber-400'
                      : isInfluencer
                      ? 'bg-orange-500 text-white border-[#18181B]'
                      : 'bg-[#18181B] text-white border-[#18181B]'
                  }`}
                >
                  T
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-base sm:text-lg font-black tracking-tight uppercase leading-none">
                      {isSeller
                        ? 'ARTISAN WORKBENCH'
                        : isInfluencer
                        ? 'CREATOR STUDIO'
                        : 'TOTE MARKET'}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border ${
                        isSeller
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : isInfluencer
                          ? 'bg-orange-100 text-orange-950 border-orange-500'
                          : 'bg-[#F4F4F1] text-[#18181B] border-[#18181B]'
                      }`}
                    >
                      {isSeller
                        ? 'MAKER / B2B'
                        : isInfluencer
                        ? 'INFLUENCER / REELS'
                        : 'BUYER MODE'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 hidden sm:block">
                    {isSeller
                      ? 'Production Pipeline, GeM & Influencer Collabs'
                      : isInfluencer
                      ? 'Reel Links, Clicks & Artisan Partnerships'
                      : 'Handcrafted Totes • Direct Vishwakarma Route'}
                  </span>
                </div>
              </Link>

              {/* Navigation Links: Strict Trifurcation */}
              {isSeller ? (
                /* SELLER / ARTISAN NAVIGATION */
                <nav className="hidden md:flex items-center gap-4 text-xs font-mono font-bold uppercase">
                  <Link
                    href="/dashboard"
                    className="hover:text-amber-300 transition-colors flex items-center gap-1 text-amber-300"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Live Pipeline</span>
                  </Link>
                  <Link
                    href="/dashboard?tab=collabs"
                    className="hover:text-amber-300 transition-colors flex items-center gap-1 text-orange-300 relative"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Creator Collabs</span>
                    {pendingCollabsCount > 0 && (
                      <span className="bg-amber-500 text-black text-[9px] font-bold px-1 rounded-full">
                        {pendingCollabsCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/dashboard?tab=b2b_hub"
                    className="hover:text-amber-300 transition-colors flex items-center gap-1 text-zinc-300"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>GeM Hub</span>
                  </Link>
                  <Link
                    href={`/stall/${session?.sellerStallSlug || 'earthstitch-studio'}`}
                    className="hover:text-amber-300 transition-colors text-zinc-400"
                  >
                    Stall Preview
                  </Link>
                </nav>
              ) : isInfluencer ? (
                /* INFLUENCER / CREATOR NAVIGATION */
                <nav className="hidden md:flex items-center gap-4 text-xs font-mono font-bold uppercase text-[#52525B]">
                  <Link
                    href="/influencer"
                    className="text-orange-900 font-black flex items-center gap-1 hover:text-black transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                    <span>Product Discovery</span>
                  </Link>
                  <Link
                    href="/influencer#creator-portfolio"
                    className="hover:text-black transition-colors flex items-center gap-1 text-zinc-700"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reel Links &amp; Clicks</span>
                  </Link>
                  <Link
                    href="/influencer#collabs-channel"
                    className="hover:text-black transition-colors flex items-center gap-1 text-zinc-700"
                  >
                    <Video className="w-3.5 h-3.5 text-amber-600" />
                    <span>Collab Discussions</span>
                  </Link>
                  <Link
                    href="/"
                    className="hover:text-black transition-colors text-zinc-500"
                  >
                    Public Store
                  </Link>
                </nav>
              ) : (
                /* BUYER NAVIGATION */
                <nav className="hidden md:flex items-center gap-5 text-xs font-mono font-bold uppercase text-[#52525B]">
                  <Link href="/" className="hover:text-[#18181B] transition-colors text-[#18181B]">
                    Handmade Catalog
                  </Link>
                  <Link href="/orders" className="hover:text-[#18181B] transition-colors">
                    Track Orders
                  </Link>
                  <Link href="/influencer" className="hover:text-orange-600 transition-colors text-orange-700 flex items-center gap-1 font-bold">
                    <Video className="w-3.5 h-3.5" />
                    <span>Influencer Program</span>
                  </Link>
                  <Link href="/#sih-statements" className="hover:text-[#18181B] transition-colors text-amber-800">
                    6 SIH Statements
                  </Link>
                </nav>
              )}
            </div>

            {/* Middle: Search Input (Buyer & Influencer) */}
            {!isSeller && (
              <form
                onSubmit={handleSearchSubmit}
                className="hidden sm:flex flex-1 max-w-xs relative items-center"
              >
                <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder={
                    isInfluencer
                      ? 'Search craft to collab...'
                      : 'Search craft, GI-tag...'
                  }
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border-2 border-[#18181B] bg-[#FAFAF8] focus:bg-white outline-none placeholder-[#71717A] text-[#18181B]"
                />
              </form>
            )}

            {/* Right: Actions, Notifications, Role Switcher, Cart */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher (Google Translate) */}
              <div id="google_translate_element" className="hidden sm:block text-left" />

              {/* Notification Bell (Seller & Buyer) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`p-2 border-2 ${
                    isSeller
                      ? 'border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800'
                      : 'border-[#18181B] bg-white text-[#18181B] hover:bg-[#FAFAF8]'
                  }`}
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-1 ring-[#18181B] animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotifOpen && (
                  <div
                    className={`absolute right-0 mt-2 w-80 sm:w-96 border-2 border-[#18181B] p-3 z-50 shadow-[4px_4px_0px_0px_#18181B] ${
                      isSeller ? 'bg-[#18181B] text-white' : 'bg-white text-[#18181B]'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-700 font-mono">
                      <span className="text-xs font-bold uppercase">
                        Alerts ({notifications.filter((n) => !n.read).length})
                      </span>
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const r = session?.role === 'seller' ? 'seller' : 'buyer';
                            markAllNotificationsAsRead(r);
                            setNotifications(getNotifications(r));
                          }}
                          className="text-[10px] text-amber-400 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-zinc-700 mt-2 font-mono">
                      {notifications.length === 0 ? (
                        <div className="py-4 text-center text-xs text-zinc-400">
                          No notifications.
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((notif) => (
                          <div key={notif.id} className="py-2 text-xs">
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold">{notif.title}</span>
                              <span className="text-[10px] text-zinc-400">
                                {new Date(notif.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 3-WAY ROLE SWITCHER BUTTON & USER MENU */}
              <div className="relative">
                {mounted && session ? (
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`flex items-center gap-1.5 py-1.5 px-3 border-2 font-mono text-xs font-bold uppercase transition-all ${
                      isSeller
                        ? 'border-amber-400 bg-zinc-900 text-amber-300 hover:bg-zinc-800'
                        : isInfluencer
                        ? 'border-orange-500 bg-orange-100 text-orange-950 hover:bg-orange-200'
                        : 'border-[#18181B] bg-[#FAFAF8] text-[#18181B] hover:bg-white'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full animate-pulse ${
                        isSeller
                          ? 'bg-amber-400'
                          : isInfluencer
                          ? 'bg-orange-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <span className="hidden sm:inline">
                      {isSeller
                        ? 'Artisan Studio'
                        : isInfluencer
                        ? 'Creator Studio'
                        : 'Buyer Account'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                ) : mounted ? (
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 py-1.5 px-3 border-2 border-[#18181B] bg-amber-400 hover:bg-amber-300 text-[#18181B] font-mono text-xs font-black uppercase transition-all shadow-[2px_2px_0px_0px_#18181B]"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Link>
                ) : (
                  <div className="h-8 w-20 bg-zinc-100 animate-pulse border-2 border-zinc-200" />
                )}

                {mounted && isDropdownOpen && session && (
                  <div className="absolute right-0 mt-2 w-72 border-2 border-[#18181B] bg-white text-[#18181B] shadow-[4px_4px_0px_0px_#18181B] p-3 z-50 font-mono">
                    <div className="border-b-2 border-[#E5E5E0] pb-2 mb-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase truncate">{session.name}</p>
                        <span className="text-[9px] px-1.5 py-0.2 border border-[#18181B] bg-amber-100 font-black">
                          {session.role.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#71717A] truncate">
                        {session.role === 'influencer'
                          ? session.influencerProfile?.handle || '@creator'
                          : session.email}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs font-bold uppercase">
                      <p className="text-[10px] text-zinc-400 font-bold">SWITCH MODE (AUTH REQUIRED):</p>
                      {/* Buyer Mode Switch */}
                      <button
                        type="button"
                        onClick={() => handleRoleToggle('buyer')}
                        className={`w-full text-left p-2 border border-[#18181B] flex items-center justify-between transition-colors ${
                          session.role === 'buyer'
                            ? 'bg-[#18181B] text-white'
                            : 'hover:bg-[#FAFAF8]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Buyer Store</span>
                        </span>
                        {session.role === 'buyer' && (
                          <span className="text-[10px] text-emerald-300">ACTIVE</span>
                        )}
                      </button>

                      {/* Artisan Workbench Switch */}
                      <button
                        type="button"
                        onClick={() => handleRoleToggle('seller')}
                        className={`w-full text-left p-2 border border-[#18181B] flex items-center justify-between transition-colors ${
                          session.role === 'seller'
                            ? 'bg-[#18181B] text-white'
                            : 'hover:bg-[#FAFAF8]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Store className="w-3.5 h-3.5 text-amber-400" />
                          <span>Artisan Workbench</span>
                        </span>
                        {session.role === 'seller' && (
                          <span className="text-[10px] text-amber-300">ACTIVE</span>
                        )}
                      </button>

                      {/* Influencer Studio Switch */}
                      <button
                        type="button"
                        onClick={() => handleRoleToggle('influencer')}
                        className={`w-full text-left p-2 border border-[#18181B] flex items-center justify-between transition-colors ${
                          session.role === 'influencer'
                            ? 'bg-orange-600 text-white'
                            : 'hover:bg-orange-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Video className="w-3.5 h-3.5 text-orange-400" />
                          <span>Creator Studio</span>
                        </span>
                        {session.role === 'influencer' && (
                          <span className="text-[10px] text-white">ACTIVE</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsModeModalOpen(true);
                        }}
                        className="w-full text-center py-1.5 text-[11px] text-amber-900 hover:text-black font-bold uppercase hover:bg-amber-50 border border-dashed border-amber-400 mt-1"
                      >
                        ⚡ Mode Switch Hub
                      </button>
                    </div>

                    <div className="mt-3 pt-2 border-t-2 border-[#E5E5E0] space-y-1.5 text-xs">
                      <Link
                        href={`/login?role=${session.role}`}
                        onClick={() => setIsDropdownOpen(false)}
                        className="block p-1.5 text-zinc-600 hover:text-black font-bold uppercase hover:bg-zinc-50"
                      >
                        &rarr; Switch / Sign In Different Account
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full text-left p-1.5 text-red-600 hover:text-red-800 font-bold uppercase flex items-center gap-1.5 hover:bg-red-50"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out Session</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cart Button: ONLY in Buyer Mode - Guarded with mounted */}
              {isBuyer && (
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

              {/* In Artisan Mode: Direct Link to Buyer Marketplace */}
              {isSeller && (
                <Link
                  href="/"
                  className="hidden sm:flex items-center gap-1 py-1.5 px-2.5 text-xs font-mono font-bold uppercase border-2 border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white"
                >
                  <span>Public Store</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}

              {/* In Influencer Mode: Direct Link to Reel Links Anchor */}
              {isInfluencer && (
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

