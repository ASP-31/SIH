import React from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Layers,
  Share2,
  Sparkles,
  TrendingUp,
  Video,
} from 'lucide-react';
import { NavPersona } from './navConfig';

interface NavLinksProps {
  persona: NavPersona;
  /** Seller only: pending creator collab proposals badge. */
  pendingCollabsCount?: number;
  /** Seller only: stall slug for the preview link. */
  sellerStallSlug?: string;
}

export function NavLinks({ persona, pendingCollabsCount = 0, sellerStallSlug }: NavLinksProps) {
  if (persona === 'seller') {
    return (
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
          href={`/stall/${sellerStallSlug || 'earthstitch-studio'}`}
          className="hover:text-amber-300 transition-colors text-zinc-400"
        >
          Stall Preview
        </Link>
      </nav>
    );
  }

  if (persona === 'creator') {
    return (
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
        <Link href="/" className="hover:text-black transition-colors text-zinc-500">
          Public Store
        </Link>
      </nav>
    );
  }

  return (
    <nav className="hidden md:flex items-center gap-5 text-xs font-mono font-bold uppercase text-[#52525B]">
      <Link href="/" className="hover:text-[#18181B] transition-colors text-[#18181B]">
        Handmade Catalog
      </Link>
      <Link href="/orders" className="hover:text-[#18181B] transition-colors">
        Track Orders
      </Link>
      <Link
        href="/influencer"
        className="hover:text-orange-600 transition-colors text-orange-700 flex items-center gap-1 font-bold"
      >
        <Video className="w-3.5 h-3.5" />
        <span>Influencer Program</span>
      </Link>
      <Link href="/#sih-statements" className="hover:text-[#18181B] transition-colors text-amber-800">
        6 SIH Statements
      </Link>
    </nav>
  );
}
