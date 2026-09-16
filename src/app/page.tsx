'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Sparkles,
  ShieldCheck,
  Building2,
  ArrowRight,
  SlidersHorizontal,
  X,
  ChevronRight,
  Award,
  CheckCircle2,
  MapPin,
  Leaf,
  Layers,
  Landmark,
  FileSpreadsheet,
} from 'lucide-react';
import { Product, Stall, SihProblemStatement } from '@/lib/types';
import {
  getDemoProducts,
  getDemoStalls,
  INITIAL_PRODUCTS,
  INITIAL_STALLS,
  SIH_PROBLEM_STATEMENTS,
} from '@/lib/demoData';
import { recordReferralClick } from '@/lib/influencerService';
import { ProductCard } from '@/components/ProductCard';

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const initialSearchQuery = searchParams.get('search') || '';
  const referralRef = searchParams.get('ref') || '';
  const referralProd = searchParams.get('prod') || '';

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [stalls, setStalls] = useState<Stall[]>(INITIAL_STALLS);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);
  const [activeSihStatement, setActiveSihStatement] = useState<SihProblemStatement | null>(null);

  useEffect(() => {
    setProducts(getDemoProducts());
    setStalls(getDemoStalls());

    if (referralRef) {
      recordReferralClick(referralRef, referralProd || undefined);
    }

    const handleProductsChange = () => {
      setProducts(getDemoProducts());
    };
    window.addEventListener('tote_products_changed', handleProductsChange);
    return () => {
      window.removeEventListener('tote_products_changed', handleProductsChange);
    };
  }, [referralRef, referralProd]);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q) setSearchQuery(q);
  }, [searchParams]);

  // Filter products by search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.is_active === false || p.stock <= 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchMat = p.material.toLowerCase().includes(q);
        const matchStall = (p.stall_name || '').toLowerCase().includes(q);
        const matchState = (p.state_origin || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchMat && !matchStall && !matchState) {
          return false;
        }
      }
      return true;
    });
  }, [products, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-[#18181B] pb-28 sm:pb-16 font-mono">
      {/* REFERRAL WELCOME BANNER (WHEN VISITING VIA INFLUENCER REEL LINK) */}
      {referralRef && (
        <section className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 max-w-7xl mx-auto">
          <div className="p-4 sm:p-5 border-2 border-orange-500 bg-orange-50 text-orange-950 shadow-[4px_4px_0px_0px_#EA580C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-black text-sm shrink-0 border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B]">
                ★
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-xs sm:text-sm uppercase text-orange-950">
                    Welcome! Curated by @{referralRef}&apos;s Reel Feature
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-300 text-amber-950 border border-amber-900 uppercase">
                    10% Swadeshi Courtesy Applied
                  </span>
                </div>
                <p className="text-xs text-orange-900 mt-0.5">
                  Supporting PM Vishwakarma master weavers &amp; Vocal for Local handloom artisans. Zero middlemen fees.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-bold px-2 py-1 bg-white border border-orange-400 text-orange-900 uppercase">
                Creator Verified Route
              </span>
            </div>
          </div>
        </section>
      )}

      {/* 1. MINIMAL BLOCK HERO SECTION WITH ATMANIRBHAR BHARAT & MODI GOVT AESTHETICS */}
      <section className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 max-w-7xl mx-auto">
        <div className="border-2 border-[#18181B] bg-white p-6 sm:p-10 shadow-[6px_6px_0px_0px_#18181B] space-y-6 relative overflow-hidden">
          {/* Subtle Saffron Minimal Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-100/40 via-orange-100/20 to-transparent pointer-events-none rounded-bl-full" />

          {/* Top National Badge Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#18181B] pb-4 relative z-10">
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100/90 px-3 py-1 border border-amber-400">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>आत्मनिर्भर भारत &middot; MoSJE &middot; PM VISHWAKARMA &amp; GeM NATIONAL INITIATIVE</span>
            </div>
            <div className="font-mono text-xs font-bold text-[#52525B]">
              VERIFIED CATALOG: AUTHENTIC ARTISAN CREATIONS
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase text-amber-800 tracking-wider">
                  MoSJE &middot; Ministry of Social Justice &amp; Empowerment (SIH-26090)
                </span>
                <h1 className="text-3xl sm:text-5xl font-mono font-black text-[#18181B] tracking-tight leading-tight uppercase">
                  AI Virtual Business Manager.{' '}
                  <span className="bg-amber-300 px-1 border border-[#18181B]">
                    Direct Artisan Route.
                  </span>
                </h1>
              </div>

              <p className="font-mono text-xs sm:text-sm text-[#52525B] leading-relaxed">
                Empowering India&apos;s marginalized artisans, weavers, and handicraft micro-entrepreneurs to transition beyond periodic physical exhibitions (Shilp Samagam, Surajkund Mela, Dilli Haat) into continuous year-round digital commerce. Featuring AI studio photo enhancement, regional voice auto-cataloging, dynamic fair pricing, and direct B2B/GeM public procurement. Zero middlemen fees.
              </p>

              {/* Action Buttons Block */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#catalog"
                  className="py-3 px-6 bg-[#18181B] text-white hover:bg-zinc-800 text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#18181B] shadow-[3px_3px_0px_0px_#71717A] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="#b2b-government-hub"
                  className="py-3 px-5 bg-amber-100 hover:bg-amber-200 text-amber-950 text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#18181B] shadow-[3px_3px_0px_0px_#18181B] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-amber-800" />
                  <span>GeM &amp; B2B Procurement</span>
                </a>

                <a
                  href="#sih-statements"
                  className="py-3 px-5 bg-white hover:bg-[#FAFAF8] text-[#18181B] text-xs font-mono font-bold uppercase tracking-wider border-2 border-[#18181B] shadow-[3px_3px_0px_0px_#18181B] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>SIH Solutions</span>
                </a>
              </div>
            </div>

            {/* Right Hero Block Display */}
            <div className="lg:col-span-5">
              <div className="border-2 border-[#18181B] bg-[#FAFAF8] p-4 shadow-[4px_4px_0px_0px_#18181B] space-y-3">
                <div className="relative aspect-[4/3] w-full border-2 border-[#18181B] overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80"
                    alt="Handloom Bag Making"
                    fill
                    priority
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-1 bg-white border border-[#18181B] text-[10px] font-mono font-bold uppercase text-[#18181B]">
                    Kochi Vat Indigo
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center font-mono">
                  <div className="border border-[#18181B] bg-white p-2">
                    <span className="text-[10px] text-[#71717A] uppercase block">GI Provenance</span>
                    <span className="text-xs font-bold text-[#18181B]">100% Certified</span>
                  </div>
                  <div className="border border-[#18181B] bg-white p-2">
                    <span className="text-[10px] text-[#71717A] uppercase block">Direct Payout</span>
                    <span className="text-xs font-bold text-emerald-700">UPI Instant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Pillars Minimal Block Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t-2 border-[#18181B] font-mono">
            <div className="border-2 border-[#18181B] bg-[#FAFAF8] p-3">
              <p className="text-xs font-bold uppercase text-[#18181B]">PM Vishwakarma</p>
              <p className="text-[10px] text-[#52525B] mt-0.5">Grassroots Artisans</p>
            </div>
            <div className="border-2 border-[#18181B] bg-[#FAFAF8] p-3">
              <p className="text-xs font-bold uppercase text-[#18181B]">Vocal for Local</p>
              <p className="text-[10px] text-[#52525B] mt-0.5">100% Indigenous</p>
            </div>
            <div className="border-2 border-[#18181B] bg-[#FAFAF8] p-3">
              <p className="text-xs font-bold uppercase text-[#18181B]">ODOP Clusters</p>
              <p className="text-[10px] text-[#52525B] mt-0.5">750+ Districts</p>
            </div>
            <div className="border-2 border-[#18181B] bg-[#FAFAF8] p-3">
              <p className="text-xs font-bold uppercase text-[#18181B]">Mission LiFE</p>
              <p className="text-[10px] text-[#52525B] mt-0.5">Zero Plastic</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 2-PRODUCT MINIMAL CATALOG SECTION */}
      <section id="catalog" className="px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 max-w-7xl mx-auto">
        <div className="space-y-6">
          {/* Section Header Block */}
          <div className="border-2 border-[#18181B] bg-white p-5 shadow-[4px_4px_0px_0px_#18181B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase text-amber-800">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Handloom Catalog</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-mono font-black uppercase text-[#18181B] mt-1">
                Authentic Artisan Handloom &amp; Craft Showcase
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter collection..."
                  className="pl-8 pr-3 py-1.5 text-xs font-mono border-2 border-[#18181B] bg-[#FAFAF8] outline-none text-[#18181B]"
                />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1.5 border-2 border-[#18181B] bg-white hover:bg-[#FAFAF8]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2 Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. B2B & GOVERNMENT MARKETPLACE (GeM & ONDC) PROCUREMENT BLOCK */}
      <section
        id="b2b-government-hub"
        className="px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 max-w-7xl mx-auto"
      >
        <div className="border-2 border-[#18181B] bg-amber-50/50 p-6 sm:p-8 shadow-[6px_6px_0px_0px_#18181B] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#18181B] pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-800" />
              <h3 className="font-mono text-lg sm:text-xl font-black uppercase text-[#18181B]">
                Institutional &amp; Government Procurement (GeM &amp; ONDC)
              </h3>
            </div>
            <span className="font-mono text-xs font-bold bg-[#18181B] text-white px-2.5 py-1 border border-[#18181B] uppercase">
              HSN Code: 42021290 Compliant
            </span>
          </div>

          <p className="font-mono text-xs sm:text-sm text-[#52525B] leading-relaxed">
            Connecting our registered artisan collectives to CPSEs, ministries, and corporate bulk buyers. All products adhere to QCI Handloom certification, formal GST e-invoicing, and tiered minimum order quantity (MOQ) rates.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="border-2 border-[#18181B] bg-white p-4 space-y-2">
              <span className="font-bold text-amber-900 block uppercase">1. Government e-Marketplace (GeM)</span>
              <p className="text-[11px] text-[#52525B] leading-snug">
                Pre-classified under Handloom &amp; Jute bags. CPSEs can issue direct sanction orders with automated 30-day delivery milestones.
              </p>
            </div>

            <div className="border-2 border-[#18181B] bg-white p-4 space-y-2">
              <span className="font-bold text-blue-900 block uppercase">2. ONDC Open Commerce Sync</span>
              <p className="text-[11px] text-[#52525B] leading-snug">
                Real-time inventory and catalog broadcasting across national buyer apps with transparent settlement terms.
              </p>
            </div>

            <div className="border-2 border-[#18181B] bg-white p-4 space-y-2">
              <span className="font-bold text-emerald-900 block uppercase">3. Corporate Gifting &amp; Bulk Batches</span>
              <p className="text-[11px] text-[#52525B] leading-snug">
                Custom brass embossing, artisan story cards in each tote, and GST e-invoices for 10 to 500+ unit consignments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PM NARENDRA MODI CENTRAL HIGHLIGHT & HERITAGE VISION */}
      <section id="pm-modi-vision" className="px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 max-w-7xl mx-auto">
        <div className="border-2 border-[#18181B] bg-white p-6 sm:p-10 shadow-[6px_6px_0px_0px_#18181B]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* PM Portrait */}
            <div className="lg:col-span-4 flex flex-col items-center text-center font-mono">
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 border-2 border-[#18181B] overflow-hidden bg-[#FAFAF8] shadow-[4px_4px_0px_0px_#18181B]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/pm_modi.jpg"
                  alt="Hon'ble Prime Minister Narendra Modi"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div className="mt-3 flex items-center gap-1.5 font-bold text-sm text-[#18181B]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/emblem_india.svg" alt="Emblem" className="w-4 h-4 object-contain" />
                <span>Shri Narendra Modi</span>
              </div>
              <p className="text-[11px] text-[#71717A]">Hon&apos;ble Prime Minister of India</p>
            </div>

            {/* Directive Quote */}
            <div className="lg:col-span-8 space-y-4 font-mono">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                <Landmark className="w-4 h-4" />
                <span>National Craft Heritage &amp; Self-Reliance Directive</span>
              </div>

              <blockquote className="text-sm sm:text-base text-[#18181B] leading-relaxed italic border-l-4 border-amber-500 pl-4 bg-[#FAFAF8] p-3">
                &ldquo;Our Vishwakarma brothers and sisters and marginalized artisans are the true architects of India&apos;s living cultural soul. When every citizen chooses handcrafted Indian heritage goods over synthetic imports, we honour generational craftsmanship, empower rural families, and build an Atmanirbhar Bharat.&rdquo;
              </blockquote>

              <p className="text-xs text-[#52525B] leading-relaxed">
                Tote is built to realize the mission of the Ministry of Social Justice and Empowerment (MoSJE) and Government of India—empowering grassroots handloom weavers, leather stitchers, and craft cooperatives with an AI-driven virtual business manager, smart cataloging, and direct market linkages.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SIH PROBLEM STATEMENTS MODULAR BLOCK GRID */}
      <section id="sih-statements" className="px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 max-w-7xl mx-auto">
        <div className="border-2 border-[#18181B] bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_#18181B] space-y-6">
          <div className="border-b-2 border-[#18181B] pb-4">
            <span className="font-mono text-xs font-bold uppercase text-amber-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Smart India Hackathon &middot; MoSJE Focus
            </span>
            <h2 className="text-xl sm:text-2xl font-mono font-black uppercase text-[#18181B] mt-1">
              National Problem Statements Solved by Tote (SIH-26090 Flagship)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
            {SIH_PROBLEM_STATEMENTS.map((stmt) => (
              <div
                key={stmt.id}
                onClick={() => setActiveSihStatement(stmt)}
                className="border-2 border-[#18181B] p-4 bg-[#FAFAF8] hover:bg-white hover:shadow-[4px_4px_0px_0px_#18181B] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 border border-[#18181B] bg-amber-100 text-amber-950">
                      {stmt.code}
                    </span>
                    <span className="text-[10px] text-[#71717A] truncate max-w-[150px]">
                      {stmt.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-[#18181B] line-clamp-2 leading-snug">
                    {stmt.title}
                  </h3>
                  <p className="text-[11px] text-[#52525B] mt-2 line-clamp-2 leading-relaxed">
                    {stmt.toteSolution}
                  </p>
                </div>

                <div className="mt-4 pt-2 border-t border-[#18181B] flex items-center justify-between text-[11px] font-bold text-amber-900">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>

          {/* Active SIH Modal */}
          {activeSihStatement && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
              <div className="border-2 border-[#18181B] bg-white p-6 max-w-xl w-full shadow-[8px_8px_0px_0px_#18181B] space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b-2 border-[#18181B] pb-2">
                  <span className="text-xs font-bold uppercase bg-amber-100 px-2 py-0.5 border border-[#18181B]">
                    {activeSihStatement.code} &middot; {activeSihStatement.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSihStatement(null)}
                    className="p-1 border border-[#18181B] hover:bg-zinc-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-sm text-[#18181B]">
                  {activeSihStatement.title}
                </h3>

                <div className="text-[11px] bg-[#FAFAF8] border border-[#18181B] p-2 text-zinc-700">
                  🏛️ {activeSihStatement.ministry}
                </div>

                <div className="space-y-3 text-xs">
                  <div className="border border-red-800 bg-red-50 p-3">
                    <span className="font-bold text-red-900 block mb-1">National Challenge:</span>
                    <p className="text-red-950 leading-relaxed">{activeSihStatement.nationalChallenge}</p>
                  </div>

                  <div className="border border-emerald-800 bg-emerald-50 p-3">
                    <span className="font-bold text-emerald-900 block mb-1">Tote Platform Solution:</span>
                    <p className="text-emerald-950 leading-relaxed">{activeSihStatement.toteSolution}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSihStatement(null)}
                  className="w-full py-2 bg-[#18181B] text-white text-xs font-bold uppercase border-2 border-[#18181B]"
                >
                  Close Window
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FBFBF9] py-16 text-center text-xs font-mono text-[#71717A]">
          Loading artisan craft catalog &amp; virtual business manager...
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
