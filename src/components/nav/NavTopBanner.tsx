import React from 'react';
import Link from 'next/link';
import { Landmark, Sparkles } from 'lucide-react';

/** Tricolor accent bar + the dark national initiative banner. Shared by every persona. */
export function NavTopBanner() {
  return (
    <>
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
    </>
  );
}
