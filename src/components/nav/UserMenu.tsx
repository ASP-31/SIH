'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Store, User, Video } from 'lucide-react';
import { logoutSession, switchRole, UserSession } from '@/lib/userSession';
import { NavPersona } from './navConfig';

interface UserMenuProps {
  persona: NavPersona;
  mounted: boolean;
  session: UserSession | null;
  onOpenModeSwitcher: () => void;
}

export function UserMenu({ persona, mounted, session, onOpenModeSwitcher }: UserMenuProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isSeller = persona === 'seller';
  const isInfluencer = persona === 'creator';

  const handleRoleToggle = async (targetRole: 'buyer' | 'seller' | 'influencer') => {
    setIsDropdownOpen(false);

    // Check if currently authenticated with targetRole
    if (session && session.role === targetRole) {
      if (targetRole === 'seller') router.push('/dashboard');
      else if (targetRole === 'influencer') router.push('/influencer');
      else router.push('/');
      return;
    }

    // Try auto-switch if registered account exists for that role
    const switchRes = await switchRole(targetRole);
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

  const handleSignOut = async () => {
    await logoutSession();
    setIsDropdownOpen(false);
    router.push('/');
  };

  return (
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
              isSeller ? 'bg-amber-400' : isInfluencer ? 'bg-orange-500' : 'bg-emerald-500'
            }`}
          />
          <span className="hidden sm:inline">
            {isSeller ? 'Artisan Studio' : isInfluencer ? 'Creator Studio' : 'Buyer Account'}
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
                session.role === 'buyer' ? 'bg-[#18181B] text-white' : 'hover:bg-[#FAFAF8]'
              }`}
            >
              <span className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                <span>Buyer Store</span>
              </span>
              {session.role === 'buyer' && <span className="text-[10px] text-emerald-300">ACTIVE</span>}
            </button>

            {/* Artisan Workbench Switch */}
            <button
              type="button"
              onClick={() => handleRoleToggle('seller')}
              className={`w-full text-left p-2 border border-[#18181B] flex items-center justify-between transition-colors ${
                session.role === 'seller' ? 'bg-[#18181B] text-white' : 'hover:bg-[#FAFAF8]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Artisan Workbench</span>
              </span>
              {session.role === 'seller' && <span className="text-[10px] text-amber-300">ACTIVE</span>}
            </button>

            {/* Influencer Studio Switch */}
            <button
              type="button"
              onClick={() => handleRoleToggle('influencer')}
              className={`w-full text-left p-2 border border-[#18181B] flex items-center justify-between transition-colors ${
                session.role === 'influencer' ? 'bg-orange-600 text-white' : 'hover:bg-orange-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Video className="w-3.5 h-3.5 text-orange-400" />
                <span>Creator Studio</span>
              </span>
              {session.role === 'influencer' && <span className="text-[10px] text-white">ACTIVE</span>}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(false);
                onOpenModeSwitcher();
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
  );
}
