'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Video,
  Sparkles,
  Link as LinkIcon,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  Eye,
  MessageSquare,
  Send,
  SlidersHorizontal,
  Search,
  ShieldCheck,
  Award,
  ArrowRight,
  ExternalLink,
  Users,
  QrCode,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  Share2,
  Tag,
  Store,
} from 'lucide-react';
import { Product, Stall, CollabProposal, CollabMessage } from '@/lib/types';
import { getDemoProducts, formatINR } from '@/lib/demoData';
import {
  getCollabProposalsForInfluencer,
  submitCollabProposal,
  sendCollabMessage,
  recordReferralClick,
} from '@/lib/influencerService';
import { getUserSession, UserSession } from '@/lib/userSession';
import { useToastStore } from '@/hooks/useToastStore';
import { useRouter } from 'next/navigation';

export default function InfluencerPage() {
  const router = useRouter();
  const addToast = useToastStore((s) => s.addToast);
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);

  // Products & Collabs
  const [products, setProducts] = useState<Product[]>([]);
  const [collabs, setCollabs] = useState<CollabProposal[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minCommission, setMinCommission] = useState<number>(0);
  const [giTagOnly, setGiTagOnly] = useState(false);

  // Pitch Modal State
  const [pitchProduct, setPitchProduct] = useState<Product | null>(null);
  const [promoFormat, setPromoFormat] = useState<CollabProposal['promo_format']>('Instagram Reel');
  const [pitchMessage, setPitchMessage] = useState('');
  const [sampleRequested, setSampleRequested] = useState(true);
  const [proposedCommission, setProposedCommission] = useState(12);
  const [isSubmittingPitch, setIsSubmittingPitch] = useState(false);

  // Discussion Drawer State
  const [activeDiscussionCollab, setActiveDiscussionCollab] = useState<CollabProposal | null>(null);
  const [discussionInput, setDiscussionInput] = useState('');

  // Link Preview / QR Modal State
  const [linkModalProduct, setLinkModalProduct] = useState<Product | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setMounted(true);
    const curr = getUserSession();
    setSession(curr);

    const handle = curr?.influencerProfile?.handle?.replace('@', '').toLowerCase() || 'creator';
    setProducts(getDemoProducts());
    setCollabs(getCollabProposalsForInfluencer(handle));

    const handleUpdate = () => {
      const refreshed = getUserSession();
      const h = refreshed?.influencerProfile?.handle?.replace('@', '').toLowerCase() || 'creator';
      setCollabs(getCollabProposalsForInfluencer(h));
    };

    window.addEventListener('tote_collabs_updated', handleUpdate);
    window.addEventListener('tote_clicks_updated', handleUpdate);
    return () => {
      window.removeEventListener('tote_collabs_updated', handleUpdate);
      window.removeEventListener('tote_clicks_updated', handleUpdate);
    };
  }, []);

  const influencerProfile = session?.influencerProfile || {
    id: 'creator_guest',
    user_id: 'guest',
    name: session?.name || 'Cultural Creator',
    handle: '@creator',
    platform: 'instagram' as const,
    followers: '10K',
    category: 'Sustainable Handcrafts',
    bio: 'Championing Vocal for Local handlooms and authentic GI crafts.',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    preferred_rate_type: 'commission' as const,
    default_commission_pct: 12,
  };
  const currentHandle = influencerProfile.handle.replace('@', '').toLowerCase();

  // Keep active discussion in sync
  useEffect(() => {
    if (activeDiscussionCollab) {
      const refreshed = collabs.find((c) => c.id === activeDiscussionCollab.id);
      if (refreshed) setActiveDiscussionCollab(refreshed);
    }
  }, [collabs, activeDiscussionCollab]);

  // Compute live portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const totalClicks = collabs.reduce((acc, c) => acc + (c.clicks || 0), 0);
    const totalOrders = collabs.reduce((acc, c) => acc + (c.orders_count || 0), 0);
    const totalRevenue = collabs.reduce((acc, c) => acc + (c.revenue_generated || 0), 0);
    const totalCommissionEarned = collabs.reduce((acc, c) => {
      const rate = (c.commission_pct || 10) / 100;
      return acc + (c.revenue_generated || 0) * rate;
    }, 0);
    const activePartnerships = collabs.filter((c) => c.status === 'accepted').length;

    return {
      totalClicks,
      totalOrders,
      totalRevenue,
      totalCommissionEarned: Math.round(totalCommissionEarned),
      activePartnerships,
    };
  }, [collabs]);

  // Filter products for creator discovery
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.is_active || p.stock <= 0) return false;
      if (giTagOnly && !p.is_gi_tagged) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchStall = (p.stall_name || '').toLowerCase().includes(q);
        const matchState = (p.state_origin || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchStall && !matchState) return false;
      }
      return true;
    });
  }, [products, searchQuery, selectedCategory, giTagOnly]);

  // Handle pitching a new collab
  const handleOpenPitch = (product: Product) => {
    setPitchProduct(product);
    setPitchMessage(
      `Namaste! I would love to feature the ${product.title} in my upcoming Vocal for Local reel series. My audience loves authentic Indian heritage crafts. Let us discuss sending a sample and partnership details!`
    );
    setProposedCommission(12);
  };

  const handleSubmitPitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitchProduct) return;
    setIsSubmittingPitch(true);

    setTimeout(() => {
      const newCollab = submitCollabProposal({
        influencer_id: session?.id || 'inf_creator',
        influencer_name: session?.name || influencerProfile.name || 'Cultural Creator',
        influencer_handle: influencerProfile.handle,
        influencer_avatar: influencerProfile.avatar_url,
        influencer_followers: influencerProfile.followers,
        influencer_niche: influencerProfile.category,
        seller_id: 'seller_1',
        stall_id: pitchProduct.stall_id,
        stall_name: pitchProduct.stall_name || 'Artisan Stall',
        product_id: pitchProduct.id,
        product_title: pitchProduct.title,
        product_image: pitchProduct.images[0] || '',
        product_price: pitchProduct.price,
        promo_format: promoFormat,
        pitch_message: pitchMessage,
        sample_requested: sampleRequested,
        commission_pct: proposedCommission,
      });

      setIsSubmittingPitch(false);
      setPitchProduct(null);
      addToast({
        title: 'Collab Pitch Sent!',
        message: `Proposal submitted to ${pitchProduct.stall_name || 'Artisan'}. Tracking link generated.`,
        type: 'success',
      });
    }, 400);
  };

  // Handle in-app discussion message
  const handleSendDiscussionMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDiscussionCollab || !discussionInput.trim()) return;

    sendCollabMessage(
      activeDiscussionCollab.id,
      'influencer',
      session?.name || influencerProfile.name || 'Cultural Creator',
      discussionInput.trim()
    );
    setDiscussionInput('');
  };

  // Helper to copy tracking link
  const handleCopyLink = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    addToast({
      title: 'Reel Tracking Link Copied!',
      message: 'Paste this in your Instagram Reels caption, YouTube description, or Bio link.',
      type: 'success',
    });
  };

  // Simulate a test click so user can verify real-time counter immediately
  const handleSimulateClick = (refCode: string, productId: string) => {
    recordReferralClick(refCode, productId);
    addToast({
      title: 'Reel Click Simulated!',
      message: `Recorded 1 visitor visit via @${refCode}. Portfolio & Seller counter updated.`,
      type: 'info',
    });
  };

  if (mounted && (!session || session.role !== 'influencer')) {
    return (
      <div className="min-h-screen bg-[#FCFAF6] flex items-center justify-center p-4 font-mono">
        <div className="max-w-md w-full border-2 border-[#18181B] bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_#18181B] text-center space-y-4">
          <div className="w-12 h-12 rounded-none bg-orange-100 border-2 border-[#18181B] flex items-center justify-center mx-auto">
            <Video className="w-6 h-6 text-orange-600" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base sm:text-lg font-black uppercase text-[#18181B]">
              Creator Studio Gated
            </h2>
            <p className="text-xs text-zinc-600">
              To discover handcrafted items, pitch artisan collaborations, and generate real-time tracked affiliate links for your Instagram Reels & Shorts, please sign in or register as an <strong>Influencer / Creator</strong>.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              href="/login?role=influencer&redirect=/influencer"
              className="py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase border-2 border-[#18181B] shadow-[3px_3px_0px_0px_#18181B] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In as Cultural Creator</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="py-2 px-4 bg-white hover:bg-zinc-50 text-[#18181B] text-xs font-bold uppercase border border-[#18181B] transition-colors"
            >
              Return to Buyer Market
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-[#18181B] pb-28 sm:pb-20">
      {/* 1. CREATOR HERO HEADER WITH ATMANIRBHAR BHARAT VIBES */}
      <section className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 max-w-7xl mx-auto">
        <div className="border-2 border-[#18181B] bg-white p-6 sm:p-8 shadow-[6px_6px_0px_0px_#18181B] relative overflow-hidden">
          {/* Subtle Saffron Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FF9933] via-amber-400 to-[#138808]" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Creator Profile Info */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#18181B] overflow-hidden bg-amber-50 shadow-[3px_3px_0px_0px_#EA580C] shrink-0">
                <Image
                  src={influencerProfile.avatar_url}
                  alt={influencerProfile.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-mono font-black uppercase text-[#18181B]">
                    {influencerProfile.name}
                  </h1>
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-orange-100 text-orange-900 border border-orange-400">
                    {influencerProfile.handle}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-500 uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified Cultural Creator
                  </span>
                </div>

                <p className="text-xs font-mono text-zinc-600 max-w-xl">
                  {influencerProfile.bio}
                </p>

                <div className="flex items-center gap-4 text-xs font-mono font-bold text-zinc-700 pt-1">
                  <span>Audience: <strong className="text-orange-600">{influencerProfile.followers}</strong> followers</span>
                  <span>&bull;</span>
                  <span>Niche: <strong>{influencerProfile.category}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#creator-portfolio"
                className="py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-mono text-xs font-bold uppercase border-2 border-[#18181B] shadow-[3px_3px_0px_0px_#18181B] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>My Reel Portfolio ({collabs.length})</span>
              </a>

              <Link
                href="/"
                className="py-2.5 px-4 bg-white hover:bg-zinc-50 text-[#18181B] font-mono text-xs font-bold uppercase border-2 border-[#18181B] shadow-[3px_3px_0px_0px_#71717A] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1.5"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Buyer Marketplace</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME CREATOR PORTFOLIO ANALYTICS TILES */}
      <section id="creator-portfolio" className="px-4 sm:px-6 lg:px-8 pt-8 max-w-7xl mx-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#18181B] pb-2 font-mono">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <h2 className="text-base sm:text-lg font-black uppercase text-[#18181B]">
                Creator Portfolio &amp; Live Reel Link Analytics
              </h2>
            </div>
            <div className="text-[11px] text-zinc-500 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Visitor Sync Active</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {/* Tile 1: Total Clicks */}
            <div className="border-2 border-[#18181B] bg-white p-4 shadow-[4px_4px_0px_0px_#18181B] relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase">Reel Link Clicks</span>
                <Eye className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-2 text-[#18181B]">
                {portfolioMetrics.totalClicks.toLocaleString()}
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">Visitors routed from social reels</p>
            </div>

            {/* Tile 2: Orders Placed */}
            <div className="border-2 border-[#18181B] bg-white p-4 shadow-[4px_4px_0px_0px_#18181B]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase">Purchases Via Reel</span>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-2 text-[#18181B]">
                {portfolioMetrics.totalOrders}
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">Direct artisan orders generated</p>
            </div>

            {/* Tile 3: GMV Generated */}
            <div className="border-2 border-[#18181B] bg-white p-4 shadow-[4px_4px_0px_0px_#18181B]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500 uppercase">Artisan Sales (GMV)</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-2 text-emerald-700">
                {formatINR(portfolioMetrics.totalRevenue)}
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">Value routed to weavers</p>
            </div>

            {/* Tile 4: Estimated Commission */}
            <div className="border-2 border-[#18181B] bg-gradient-to-br from-amber-50 to-orange-100 p-4 shadow-[4px_4px_0px_0px_#EA580C]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-orange-950 uppercase">Earned Commission</span>
                <Award className="w-4 h-4 text-orange-700" />
              </div>
              <div className="text-2xl sm:text-3xl font-black mt-2 text-orange-900">
                {formatINR(portfolioMetrics.totalCommissionEarned)}
              </div>
              <p className="text-[10px] text-orange-800 font-bold mt-1">
                {portfolioMetrics.activePartnerships} Active brand collabs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. ACTIVE COLLABS & REEL LINKS TABLE */}
      <section className="px-4 sm:px-6 lg:px-8 pt-6 max-w-7xl mx-auto font-mono">
        <div className="border-2 border-[#18181B] bg-white p-5 sm:p-6 shadow-[6px_6px_0px_0px_#18181B] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#18181B] pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase text-[#18181B]">
                Your Connected Collabs &amp; Reel Links
              </h3>
              <p className="text-xs text-zinc-500">
                Copy your unique tracking link to post in Instagram reels, stories, or YouTube shorts.
              </p>
            </div>
            <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 border border-orange-300">
              {collabs.length} Partnerships Connected
            </span>
          </div>

          {collabs.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              <Video className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
              <p>No active collabs yet. Browse products below and click &quot;Pitch Collab&quot; to connect with weavers!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-[#18181B] bg-[#FAFAF8] text-zinc-700 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Product &amp; Artisan</th>
                    <th className="py-2.5 px-3">Format</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Reel Tracking Link</th>
                    <th className="py-2.5 px-3 text-center">Clicks</th>
                    <th className="py-2.5 px-3 text-center">Orders</th>
                    <th className="py-2.5 px-3 text-right">Commission</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-b border-[#18181B]">
                  {collabs.map((collab) => (
                    <tr key={collab.id} className="hover:bg-amber-50/40 transition-colors">
                      {/* Product & Artisan */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 border border-[#18181B] bg-zinc-100 shrink-0 overflow-hidden">
                            <Image
                              src={collab.product_image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=150&q=80'}
                              alt={collab.product_title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-[#18181B] block max-w-xs truncate">
                              {collab.product_title}
                            </span>
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                              <span>{collab.stall_name}</span>
                              <span>&bull;</span>
                              <span>{formatINR(collab.product_price)}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Format */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-300">
                          {collab.promo_format}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {collab.status === 'accepted' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-600 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            Active &bull; Live
                          </span>
                        ) : collab.status === 'in_discussion' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-500 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" />
                            In Discussion
                          </span>
                        ) : collab.status === 'declined' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-900 border border-red-400">
                            Declined
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-400">
                            Pending Review
                          </span>
                        )}
                      </td>

                      {/* Tracking Link & Copy */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <code className="text-[11px] bg-zinc-100 px-2 py-1 border border-zinc-300 text-orange-950 font-bold max-w-[170px] truncate block">
                            {collab.tracking_url}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(collab.tracking_url)}
                            className="p-1 border border-[#18181B] bg-white hover:bg-orange-50 text-zinc-800"
                            title="Copy Reel Link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSimulateClick(currentHandle, collab.product_id)}
                            className="text-[10px] px-1.5 py-0.5 bg-orange-100 hover:bg-orange-200 border border-orange-400 text-orange-900 font-bold"
                            title="Simulate 1 Visitor Click from Reel"
                          >
                            +1 Click
                          </button>
                        </div>
                      </td>

                      {/* Clicks */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-sm text-orange-600 bg-orange-50 px-2 py-0.5 border border-orange-300">
                          {collab.clicks || 0}
                        </span>
                      </td>

                      {/* Orders */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-bold text-sm text-emerald-800 bg-emerald-50 px-2 py-0.5 border border-emerald-300">
                          {collab.orders_count || 0}
                        </span>
                      </td>

                      {/* Commission */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-sm text-[#18181B] block">
                          {formatINR(Math.round(((collab.revenue_generated || 0) * (collab.commission_pct || 10)) / 100))}
                        </span>
                        <span className="text-[10px] text-zinc-500">{collab.commission_pct}% Rate</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setActiveDiscussionCollab(collab)}
                          className="px-2 py-1 text-[11px] font-bold uppercase bg-white border border-[#18181B] hover:bg-zinc-100 shadow-[1px_1px_0px_0px_#18181B]"
                        >
                          <MessageSquare className="w-3 h-3 inline mr-1 text-orange-600" />
                          Discuss ({collab.messages?.length || 0})
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* 4. PRODUCT DISCOVERY FOR INFLUENCERS (WITH RICH FILTERS) */}
      <section className="px-4 sm:px-6 lg:px-8 pt-10 max-w-7xl mx-auto font-mono">
        <div className="space-y-6">
          {/* Header & Filter Controls */}
          <div className="border-2 border-[#18181B] bg-white p-6 shadow-[6px_6px_0px_0px_#18181B] space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-[#18181B] pb-4">
              <div>
                <span className="text-xs font-bold uppercase text-orange-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Curated For Reels, Unboxings &amp; Swadeshi Features
                </span>
                <h2 className="text-xl sm:text-2xl font-black uppercase text-[#18181B] mt-0.5">
                  Artisan Product Discovery &amp; Collab Hub
                </h2>
              </div>
              <div className="text-xs text-zinc-500 font-bold">
                Showing {filteredProducts.length} Verified Totes Available for Collab
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter by craft, fabric, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border-2 border-[#18181B] bg-[#FAFAF8] text-xs outline-none focus:bg-white"
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-2 px-3 border-2 border-[#18181B] bg-[#FAFAF8] text-xs outline-none font-bold uppercase"
                >
                  <option value="all">All Tote Materials</option>
                  <option value="Canvas">Heavy Canvas</option>
                  <option value="Crochet">Handmade Crochet</option>
                  <option value="Eco Linen">Eco Linen / Khadi</option>
                  <option value="Everyday">Everyday Carry</option>
                  <option value="Work & Laptop">Work &amp; Laptop</option>
                </select>
              </div>

              {/* GI Tag Only Toggle */}
              <div className="flex items-center gap-2 border-2 border-[#18181B] px-3 py-1.5 bg-[#FAFAF8]">
                <input
                  type="checkbox"
                  id="giFilter"
                  checked={giTagOnly}
                  onChange={(e) => setGiTagOnly(e.target.checked)}
                  className="w-4 h-4 accent-orange-600 cursor-pointer"
                />
                <label htmlFor="giFilter" className="text-xs font-bold uppercase cursor-pointer select-none">
                  GI-Tagged Authentic Only
                </label>
              </div>

              {/* Reset Filters */}
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setGiTagOnly(false);
                  }}
                  className="w-full py-2 px-3 border-2 border-[#18181B] bg-zinc-100 hover:bg-zinc-200 text-xs font-bold uppercase"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const estCommission = Math.round(product.price * 0.12);
              const alreadyPitched = collabs.some((c) => c.product_id === product.id);

              return (
                <div
                  key={product.id}
                  className="border-2 border-[#18181B] bg-white shadow-[4px_4px_0px_0px_#18181B] flex flex-col justify-between"
                >
                  <div>
                    {/* Image Box */}
                    <div className="relative aspect-square w-full bg-[#F4F4F1] border-b-2 border-[#18181B] overflow-hidden group">
                      <Image
                        src={product.images[0] || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'}
                        alt={product.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-white border border-[#18181B] text-[#18181B] shadow-[1px_1px_0px_0px_#18181B]">
                          {product.category}
                        </span>

                        {product.is_gi_tagged && (
                          <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-100 text-amber-950 border border-amber-900">
                            GI Certified
                          </span>
                        )}
                      </div>

                      {/* Floating Commission Banner */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-[#18181B]/90 backdrop-blur-sm text-amber-300 text-[11px] font-mono font-bold px-2.5 py-1 border border-amber-400 flex items-center justify-between">
                        <span>Est. Commission:</span>
                        <span className="text-white font-black">{formatINR(estCommission)} / sale (12%)</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span className="font-bold text-zinc-800">{product.stall_name}</span>
                        <span>{product.state_origin || 'India'}</span>
                      </div>

                      <h3 className="font-black text-sm text-[#18181B] line-clamp-1 uppercase">
                        {product.title}
                      </h3>

                      <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>

                      <div className="flex items-baseline justify-between pt-2 border-t border-zinc-200">
                        <div>
                          <span className="text-base font-black text-[#18181B]">
                            {formatINR(product.price)}
                          </span>
                          {product.original_price && (
                            <span className="ml-1.5 text-xs text-zinc-400 line-through">
                              {formatINR(product.original_price)}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 border border-emerald-300">
                          High Reel Appeal
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPitch(product)}
                      className={`py-2 px-2 text-xs font-bold uppercase border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1 ${
                        alreadyPitched
                          ? 'bg-amber-100 text-amber-950 border-amber-600'
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{alreadyPitched ? 'Pitch More' : 'Pitch Collab'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLinkModalProduct(product)}
                      className="py-2 px-2 text-xs font-bold uppercase border-2 border-[#18181B] bg-white hover:bg-zinc-100 text-[#18181B] shadow-[2px_2px_0px_0px_#71717A] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1"
                    >
                      <LinkIcon className="w-3.5 h-3.5 text-orange-600" />
                      <span>Get Reel Link</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. PITCH COLLAB MODAL */}
      {pitchProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#18181B] w-full max-w-lg shadow-[8px_8px_0px_0px_#18181B] p-6 font-mono space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-[#18181B] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-orange-600">
                  Direct Partnership Proposal
                </span>
                <h3 className="text-base font-black uppercase text-[#18181B]">
                  Pitch Collab to {pitchProduct.stall_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPitchProduct(null)}
                className="p-1 border border-[#18181B] hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Product Summary */}
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-300">
              <div className="relative w-12 h-12 border border-[#18181B] overflow-hidden shrink-0">
                <Image
                  src={pitchProduct.images[0] || ''}
                  alt={pitchProduct.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-xs font-black text-[#18181B]">{pitchProduct.title}</p>
                <p className="text-[11px] text-zinc-600">
                  Retail: {formatINR(pitchProduct.price)} &bull; {pitchProduct.material}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitPitch} className="space-y-4 text-xs">
              {/* Promotion Format */}
              <div>
                <label className="font-bold uppercase text-zinc-700 block mb-1">
                  Proposed Promotion Format
                </label>
                <select
                  value={promoFormat}
                  onChange={(e) => setPromoFormat(e.target.value as CollabProposal['promo_format'])}
                  className="w-full p-2 border-2 border-[#18181B] bg-[#FAFAF8] outline-none font-bold"
                >
                  <option value="Instagram Reel">Instagram Reel (30-60s Aesthetic Feature)</option>
                  <option value="YouTube Short">YouTube Short / Review</option>
                  <option value="Story Series & Unboxing">Story Series &amp; Artisan Unboxing</option>
                  <option value="Affiliate Review">Affiliate Bio Link &amp; Carousel</option>
                </select>
              </div>

              {/* Commission Rate & Sample Request */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold uppercase text-zinc-700 block mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={30}
                    value={proposedCommission}
                    onChange={(e) => setProposedCommission(Number(e.target.value))}
                    className="w-full p-2 border-2 border-[#18181B] bg-[#FAFAF8] outline-none font-bold"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2 border-2 border-[#18181B] bg-[#FAFAF8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sampleRequested}
                      onChange={(e) => setSampleRequested(e.target.checked)}
                      className="accent-orange-600 w-4 h-4"
                    />
                    <span className="font-bold text-[11px] uppercase">Request Sample Tote</span>
                  </label>
                </div>
              </div>

              {/* Pitch Note */}
              <div>
                <label className="font-bold uppercase text-zinc-700 block mb-1">
                  Pitch Message &amp; Reel Concept
                </label>
                <textarea
                  rows={4}
                  value={pitchMessage}
                  onChange={(e) => setPitchMessage(e.target.value)}
                  className="w-full p-2.5 border-2 border-[#18181B] bg-[#FAFAF8] outline-none leading-relaxed"
                  placeholder="Explain why this tote fits your channel and when you plan to publish..."
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPitchProduct(null)}
                  className="py-2 px-4 border-2 border-[#18181B] bg-zinc-100 hover:bg-zinc-200 font-bold uppercase text-xs"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingPitch}
                  className="py-2 px-5 border-2 border-[#18181B] bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-xs shadow-[2px_2px_0px_0px_#18181B] flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingPitch ? 'Submitting...' : 'Send Collab Pitch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. INSTANT REEL LINK MODAL (WITH QR & ONE-CLICK COPY) */}
      {linkModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#18181B] w-full max-w-md shadow-[8px_8px_0px_0px_#18181B] p-6 font-mono space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b-2 border-[#18181B] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-orange-600">Reel Tracking Link</span>
                <h3 className="text-sm font-black uppercase text-[#18181B]">
                  Share &amp; Track Clicks in Real Time
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLinkModalProduct(null)}
                className="p-1 border border-[#18181B] hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-orange-50 border border-orange-300 space-y-1">
              <p className="text-xs font-black text-orange-950">{linkModalProduct.title}</p>
              <p className="text-[11px] text-zinc-600">Stall: {linkModalProduct.stall_name}</p>
            </div>

            {/* Generated Link URL */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-zinc-700">Your Unique Reel URL</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  readOnly
                  value={
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/?ref=${currentHandle}&prod=${linkModalProduct.id}`
                      : `/?ref=${currentHandle}&prod=${linkModalProduct.id}`
                  }
                  className="flex-1 p-2 bg-zinc-100 border-2 border-[#18181B] text-xs font-bold text-orange-950 truncate outline-none select-all"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleCopyLink(`/?ref=${currentHandle}&prod=${linkModalProduct.id}`)
                  }
                  className="p-2 border-2 border-[#18181B] bg-orange-600 hover:bg-orange-700 text-white"
                  title="Copy Link"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Simulate Visitor Click */}
            <div className="p-3 bg-zinc-50 border border-zinc-300 space-y-2">
              <span className="text-[10px] font-bold uppercase text-zinc-500 block">
                Verification &amp; Live Test
              </span>
              <p className="text-[11px] text-zinc-600 leading-snug">
                Click below to simulate a reel visitor arriving via this link. You will see the click counter increment immediately in your portfolio and the seller&apos;s dashboard!
              </p>
              <button
                type="button"
                onClick={() => {
                  handleSimulateClick(currentHandle, linkModalProduct.id);
                }}
                className="w-full py-2 bg-white hover:bg-amber-100 border border-[#18181B] text-xs font-bold uppercase text-orange-900 shadow-[2px_2px_0px_0px_#18181B]"
              >
                &rarr; Simulate Reel Click Now
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setLinkModalProduct(null)}
                className="py-1.5 px-4 border-2 border-[#18181B] bg-zinc-100 font-bold uppercase text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. LIVE DISCUSSION DRAWER WITH SELLER */}
      {activeDiscussionCollab && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white border-l-2 border-[#18181B] w-full max-w-md h-full shadow-[-8px_0px_0px_0px_#18181B] p-5 font-mono flex flex-col justify-between animate-fade-in">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b-2 border-[#18181B] pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-orange-600">
                    Artisan Collaboration Chat
                  </span>
                  <h3 className="text-base font-black uppercase text-[#18181B]">
                    {activeDiscussionCollab.stall_name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDiscussionCollab(null)}
                  className="p-1 border border-[#18181B] hover:bg-zinc-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Collab Info Card */}
              <div className="mt-3 p-3 bg-amber-50 border border-amber-300 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-amber-950 truncate max-w-[200px]">
                    {activeDiscussionCollab.product_title}
                  </span>
                  <span className="text-orange-700 bg-white px-1.5 py-0.5 border border-orange-300">
                    {activeDiscussionCollab.clicks || 0} Clicks
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600">
                  Format: {activeDiscussionCollab.promo_format} &bull; Commission: {activeDiscussionCollab.commission_pct}%
                </p>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1 text-xs">
              {activeDiscussionCollab.messages?.map((msg) => {
                const isMe = msg.sender_role === 'influencer';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] text-zinc-500 mb-0.5">
                      {msg.sender_name} &bull; {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div
                      className={`p-3 max-w-[85%] border-2 ${
                        isMe
                          ? 'bg-orange-600 text-white border-[#18181B] shadow-[2px_2px_0px_0px_#18181B]'
                          : 'bg-zinc-100 text-[#18181B] border-[#18181B] shadow-[2px_2px_0px_0px_#71717A]'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendDiscussionMessage} className="pt-2 border-t-2 border-[#18181B] flex gap-2">
              <input
                type="text"
                value={discussionInput}
                onChange={(e) => setDiscussionInput(e.target.value)}
                placeholder="Message artisan..."
                className="flex-1 p-2 border-2 border-[#18181B] bg-[#FAFAF8] text-xs outline-none focus:bg-white"
              />
              <button
                type="submit"
                className="py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase text-xs border-2 border-[#18181B] shadow-[2px_2px_0px_0px_#18181B]"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
