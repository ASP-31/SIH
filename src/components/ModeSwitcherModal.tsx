'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  User,
  Store,
  Video,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { UserSession, switchRole, setUserSession } from '@/lib/userSession';

interface ModeSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: UserSession | null;
}

export function ModeSwitcherModal({
  isOpen,
  onClose,
  currentSession,
}: ModeSwitcherModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const currentRole = currentSession?.role || 'buyer';

  const handleSelectMode = (targetRole: 'buyer' | 'seller' | 'influencer') => {
    onClose();

    // If already in target role
    if (currentSession && currentSession.role === targetRole) {
      if (targetRole === 'seller') router.push('/dashboard');
      else if (targetRole === 'influencer') router.push('/influencer');
      else router.push('/');
      return;
    }

    // Try switching if user already has registered account for target role
    const switchRes = switchRole(targetRole);
    if (switchRes.success && switchRes.user) {
      if (targetRole === 'seller') router.push('/dashboard');
      else if (targetRole === 'influencer') router.push('/influencer');
      else router.push('/');
      return;
    }

    // Otherwise require Login / Signup for target role
    const redirectMap = {
      buyer: '/',
      seller: '/dashboard',
      influencer: '/influencer',
    };
    router.push(`/login?role=${targetRole}&redirect=${encodeURIComponent(redirectMap[targetRole])}`);
  };

  const handleLogout = () => {
    setUserSession(null);
    onClose();
    router.push('/');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#18181B]/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative w-full max-w-lg bg-white border-2 border-[#18181B] shadow-[6px_6px_0px_0px_#18181B] z-10 p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#18181B]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-400 border border-[#18181B] animate-pulse" />
            <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-[#18181B]">
              Switch Platform Mode
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 border border-[#18181B] hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#71717A] leading-relaxed">
          Tote provides 3 distinct dedicated operating modes. To enter or switch into a mode, you must be logged into or register an account for that persona.
        </p>

        {/* 3 Modes List */}
        <div className="space-y-3">
          {/* 1. Buyer Mode */}
          <div
            className={`p-3.5 border-2 transition-all ${
              currentRole === 'buyer'
                ? 'border-emerald-600 bg-emerald-50/60'
                : 'border-[#18181B] bg-[#FAFAF8] hover:bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 border border-[#18181B] bg-emerald-100 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-emerald-800" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs uppercase text-[#18181B]">
                      Buyer Market
                    </span>
                    {currentRole === 'buyer' && (
                      <span className="px-1.5 py-0.2 text-[9px] font-black bg-emerald-600 text-white uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#71717A] mt-0.5">
                    Browse authentic GI handloom totes, buy directly from artisans, and track dispatches.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectMode('buyer')}
                className={`py-1.5 px-3 text-[11px] font-black uppercase border transition-all shrink-0 ${
                  currentRole === 'buyer'
                    ? 'border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800'
                    : 'border-[#18181B] bg-[#18181B] text-white hover:bg-zinc-800 shadow-[2px_2px_0px_0px_#18181B]'
                }`}
              >
                {currentRole === 'buyer' ? 'Stay in Market' : 'Switch Mode'}
              </button>
            </div>
          </div>

          {/* 2. Artisan Mode */}
          <div
            className={`p-3.5 border-2 transition-all ${
              currentRole === 'seller'
                ? 'border-amber-600 bg-amber-50/60'
                : 'border-[#18181B] bg-[#FAFAF8] hover:bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 border border-[#18181B] bg-amber-100 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs uppercase text-[#18181B]">
                      Artisan Workbench
                    </span>
                    {currentRole === 'seller' && (
                      <span className="px-1.5 py-0.2 text-[9px] font-black bg-amber-600 text-white uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#71717A] mt-0.5">
                    Production pipeline, GeM government POs, and creator collaboration approval.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectMode('seller')}
                className={`py-1.5 px-3 text-[11px] font-black uppercase border transition-all shrink-0 ${
                  currentRole === 'seller'
                    ? 'border-amber-700 bg-amber-700 text-white hover:bg-amber-800'
                    : 'border-[#18181B] bg-amber-400 text-black hover:bg-amber-300 shadow-[2px_2px_0px_0px_#18181B]'
                }`}
              >
                {currentRole === 'seller' ? 'In Studio' : 'Enter Studio'}
              </button>
            </div>
          </div>

          {/* 3. Creator Studio Mode */}
          <div
            className={`p-3.5 border-2 transition-all ${
              currentRole === 'influencer'
                ? 'border-orange-600 bg-orange-50/60'
                : 'border-[#18181B] bg-[#FAFAF8] hover:bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 border border-[#18181B] bg-orange-100 flex items-center justify-center shrink-0">
                  <Video className="w-5 h-5 text-orange-800" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs uppercase text-[#18181B]">
                      Creator Studio
                    </span>
                    {currentRole === 'influencer' && (
                      <span className="px-1.5 py-0.2 text-[9px] font-black bg-orange-600 text-white uppercase">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#71717A] mt-0.5">
                    Pitch artisans, generate real-time tracked affiliate links, and earn commission.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectMode('influencer')}
                className={`py-1.5 px-3 text-[11px] font-black uppercase border transition-all shrink-0 ${
                  currentRole === 'influencer'
                    ? 'border-orange-700 bg-orange-700 text-white hover:bg-orange-800'
                    : 'border-[#18181B] bg-orange-600 text-white hover:bg-orange-500 shadow-[2px_2px_0px_0px_#18181B]'
                }`}
              >
                {currentRole === 'influencer' ? 'In Studio' : 'Enter Studio'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer info & Logout */}
        <div className="pt-2 border-t border-[#E5E5E0] flex items-center justify-between text-xs">
          {currentSession ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-zinc-500 truncate">
                Signed in as <strong>{currentSession.name}</strong> ({currentSession.role})
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 font-bold flex items-center gap-1 hover:underline"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-zinc-500">Browsing as Guest</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push('/login');
                }}
                className="text-amber-800 hover:text-black font-bold flex items-center gap-1 hover:underline"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In / Register</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
