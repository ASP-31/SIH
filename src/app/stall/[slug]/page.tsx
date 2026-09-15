'use client';

import React, { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ShieldCheck,
  Star,
  MapPin,
  Sparkles,
  Share2,
  ArrowLeft,
  PackageCheck,
  Heart,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MessageSquare,
  Award,
  BookOpen,
  CheckCircle2,
  ThumbsUp,
} from 'lucide-react';
import { Stall, Product, ArtistReview } from '@/lib/types';
import {
  getDemoStalls,
  getDemoProducts,
  getArtisanReviews,
  addArtisanReview,
} from '@/lib/demoData';
import { ProductCard } from '@/components/ProductCard';
import { useToastStore } from '@/hooks/useToastStore';
import { getUserSession } from '@/lib/userSession';

interface StallPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ArtisanStallPage({ params }: StallPageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const addToast = useToastStore((s) => s.addToast);
  const session = getUserSession();

  const [stall, setStall] = useState<Stall | null>(null);
  const [stallProducts, setStallProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ArtistReview[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Review Form state
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewCraft, setNewReviewCraft] = useState('');
  const [newReviewName, setNewReviewName] = useState(session?.name || '');

  useEffect(() => {
    const stalls = getDemoStalls();
    const foundStall = stalls.find((s) => s.slug === slug);
    if (foundStall) {
      setStall(foundStall);
      const allProducts = getDemoProducts();
      setStallProducts(allProducts.filter((p) => p.stall_id === foundStall.id));
      const loadedReviews = getArtisanReviews(foundStall.id);
      setReviews(loadedReviews);
      if (allProducts.length > 0) {
        setNewReviewCraft(allProducts[0].title);
      }
    }
  }, [slug]);

  // Audio story timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioSeconds((prev) => {
          if (prev >= 48) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayingAudio]);

  if (!stall) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] py-16 text-center">
        <p className="text-sm text-[#71717A]">Loading artisan workshop...</p>
      </div>
    );
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast({
      title: 'Stall link copied',
      message: `Share ${stall.name} with friends.`,
      type: 'success',
    });
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] pb-16">
      {/* 1. STALL BANNER & PROFILE HEADER */}
      <div className="relative">
        <div className="relative h-48 sm:h-64 md:h-80 w-full bg-[#F2F0EB] overflow-hidden">
          <Image
            src={stall.banner_url}
            alt={stall.name}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#18181B]/60 via-transparent to-transparent" />
        </div>

        {/* Back navigation */}
        <div className="absolute top-4 left-4 sm:left-8 z-10">
          <Link
            href="/"
            className="py-2 px-3.5 rounded-full bg-[#FFFFFF]/90 backdrop-blur-md border border-[#E5E5E0] text-xs font-semibold text-[#18181B] hover:bg-[#FFFFFF] shadow-subtle flex items-center gap-1.5 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Marketplace</span>
          </Link>
        </div>

        {/* Stall Header Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-16 sm:-mt-20 bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] p-5 sm:p-8 shadow-elevated">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-4">
                {/* Stall Avatar */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-[#F2F0EB] border-2 border-[#FFFFFF] shadow-subtle shrink-0">
                  <Image
                    src={stall.logo_url}
                    alt={stall.artisan_name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Stall Titles */}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] tracking-tight">
                      {stall.name}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Verified Artisan
                    </span>
                  </div>
                  <p className="text-xs text-[#71717A] mt-0.5 flex items-center gap-1.5">
                    <span>By {stall.artisan_name}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-700" />
                      {stall.location}
                    </span>
                  </p>
                  <p className="text-[11px] font-mono text-[#71717A] mt-1">
                    tote.app/@{stall.slug}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-1 sm:flex-none py-2 px-4 rounded-full border border-[#E5E5E0] bg-[#FAFAF8] hover:bg-[#F2F0EB] text-xs font-semibold text-[#18181B] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Stall</span>
                </button>
              </div>
            </div>

            {/* Stall Story / Bio */}
            <div className="mt-5 pt-4 border-t border-[#E5E5E0]/60 max-w-3xl">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#71717A] mb-1">
                Craftsmanship Story
              </h3>
              <p className="text-xs sm:text-sm text-[#18181B] leading-relaxed">
                {stall.bio}
              </p>
            </div>

            {/* Stats Metrics Row */}
            <div className="mt-5 pt-4 border-t border-[#E5E5E0]/60 grid grid-cols-3 gap-2 sm:gap-6 text-center sm:text-left">
              <div>
                <p className="font-bold text-base sm:text-lg text-[#18181B] flex items-center justify-center sm:justify-start gap-1">
                  ★ {stall.rating}
                </p>
                <p className="text-[10px] sm:text-xs text-[#71717A]">
                  {reviews.length > 0 ? reviews.length : stall.review_count} Artisan Reviews
                </p>
              </div>
              <div>
                <p className="font-bold text-base sm:text-lg text-[#18181B]">
                  {stall.sales_count}+
                </p>
                <p className="text-[10px] sm:text-xs text-[#71717A]">
                  Totes Delivered
                </p>
              </div>
              <div>
                <p className="font-bold text-base sm:text-lg text-emerald-700">
                  Direct Payout
                </p>
                <p className="text-[10px] sm:text-xs text-[#71717A]">
                  Fair Studio Wages
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ARTISAN & CRAFT HERITAGE STORY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FAF6EE] to-[#F5EFE0] rounded-3xl border border-amber-200/80 p-6 sm:p-10 shadow-elevated relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Heritage Narrative & Quote */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-800" />
                  Living Craft Heritage
                </span>
                <span className="text-xs text-amber-800 font-medium">
                  {stall.location} • ODOP Certified
                </span>
              </div>

              {stall.artisan_quote && (
                <blockquote className="border-l-4 border-amber-600 pl-4 py-1 text-base sm:text-lg font-serif italic text-amber-950 leading-snug">
                  &ldquo;{stall.artisan_quote}&rdquo;
                  <span className="block mt-2 text-xs font-sans not-italic font-bold text-amber-800">
                    — {stall.artisan_name}, Master Artisan
                  </span>
                </blockquote>
              )}

              <p className="text-xs sm:text-sm text-amber-950/80 leading-relaxed font-sans">
                {stall.heritage_story || stall.bio}
              </p>

              {stall.craft_origin_history && (
                <div className="p-4 rounded-2xl bg-white/70 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <Award className="w-4 h-4 text-amber-700" />
                    Generational Technique &amp; Provenance
                  </p>
                  <p className="text-amber-900/80 leading-relaxed">
                    {stall.craft_origin_history}
                  </p>
                </div>
              )}
            </div>

            {/* Right: Audio Narration Player & Micro-Experience */}
            <div className="lg:col-span-5 bg-white/90 backdrop-blur-md rounded-2xl border border-amber-300/80 p-6 shadow-subtle space-y-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-amber-700" />
                    Audio Oral History
                  </span>
                  <span className="text-[11px] font-mono text-amber-700 font-bold">
                    0:{audioSeconds < 10 ? `0${audioSeconds}` : audioSeconds} / 0:48
                  </span>
                </div>
                <h4 className="font-bold text-sm text-[#18181B] mt-1">
                  Listen to Master Artisan {stall.artisan_name}
                </h4>
                <p className="text-[11px] text-[#71717A] mt-0.5">
                  Hear {stall.artisan_name} explain the loom setup and natural mordant dyeing.
                </p>
              </div>

              {/* Animated Soundwave Equalizer */}
              <div className="h-16 bg-[#FAFAF8] rounded-xl border border-amber-200/60 px-4 flex items-center justify-between gap-1">
                {[18, 35, 60, 45, 80, 50, 90, 70, 40, 85, 95, 65, 30, 75, 85, 45, 60, 30].map(
                  (height, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-300 ${
                        isPlayingAudio
                          ? 'bg-amber-600 animate-pulse'
                          : 'bg-amber-200'
                      }`}
                      style={{
                        height: isPlayingAudio
                          ? `${Math.max(12, Math.sin(audioSeconds + i) * 35 + 40)}%`
                          : `${height * 0.4}%`,
                      }}
                    />
                  )
                )}
              </div>

              {/* Play / Pause Toggle Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause Narration</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Play Artisan Story (0:48)</span>
                    </>
                  )}
                </button>
                {isPlayingAudio && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlayingAudio(false);
                      setAudioSeconds(0);
                    }}
                    className="p-2.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-amber-900"
                    title="Stop Audio"
                  >
                    <VolumeX className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="text-[10px] text-amber-800/80 text-center font-medium">
                Recorded on-site at the artisan workshop cluster in {stall.location}.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. STALL TOTE BAG CATALOG */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#18181B] tracking-tight">
              Bags by {stall.name}
            </h2>
            <p className="text-xs text-[#71717A]">
              Dispatched directly from the workshop in {stall.location}
            </p>
          </div>
          <span className="text-xs font-semibold text-[#71717A]">
            {stallProducts.length} pieces
          </span>
        </div>

        {stallProducts.length === 0 ? (
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E5E0] p-8 text-center text-xs text-[#71717A]">
            This artisan hasn&apos;t listed bags yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {stallProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* 4. ARTISAN REVIEWS & RATINGS SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] p-6 sm:p-10 shadow-elevated space-y-8">
          {/* Header & Write Review Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E0] pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                Collector Feedback &amp; Verification
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-[#18181B] tracking-tight">
                Artisan Reviews &amp; Testimonials
              </h3>
              <p className="text-xs text-[#71717A] mt-1">
                Real feedback from patrons who have collected pieces from {stall.name}.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="py-2.5 px-5 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-bold shadow-subtle flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Write a Review for Artisan</span>
            </button>
          </div>

          {/* Rating Breakdown & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-[#FAFAF8] rounded-2xl p-6 border border-[#E5E5E0]">
            {/* Overall Rating Score */}
            <div className="md:col-span-4 text-center md:text-left space-y-1">
              <div className="text-4xl font-extrabold text-[#18181B] tracking-tight">
                {stall.rating}
                <span className="text-lg font-normal text-[#71717A]"> / 5.0</span>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-[#71717A] font-medium">
                Based on {reviews.length} verified collector evaluations
              </p>
            </div>

            {/* Star Distribution Bars */}
            <div className="md:col-span-8 space-y-2">
              {[
                { stars: 5, pct: 88 },
                { stars: 4, pct: 10 },
                { stars: 3, pct: 2 },
                { stars: 2, pct: 0 },
                { stars: 1, pct: 0 },
              ].map((row) => (
                <div key={row.stars} className="flex items-center gap-3 text-xs text-[#71717A]">
                  <span className="w-12 font-medium">{row.stars} Stars</span>
                  <div className="flex-1 h-2 bg-[#E5E5E0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-[11px]">{row.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#71717A]">
                No reviews yet. Be the first to review this artisan!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-[#FAFAF8] border border-[#E5E5E0] space-y-3 shadow-subtle hover:border-[#71717A]/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#18181B]">
                            {rev.user_name || rev.buyer_name}
                          </span>
                          {rev.verified_purchase && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Verified Patron
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#71717A] mt-0.5">
                          Acquired: <span className="font-medium text-[#18181B]">{rev.craft_purchased}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-0.5 text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-zinc-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#18181B] leading-relaxed italic">
                      &ldquo;{rev.comment}&rdquo;
                    </p>

                    <div className="pt-2 border-t border-[#E5E5E0]/60 flex items-center justify-between text-[10px] text-[#71717A]">
                      <span>
                        {new Date(rev.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <ThumbsUp className="w-3 h-3" />
                        Authentic Handcraft Confirmed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WRITE A REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#FFFFFF] rounded-3xl border border-[#E5E5E0] shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-6 bg-[#FAF6EE] border-b border-amber-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#18181B] text-base">
                  Write a Review for {stall.name}
                </h3>
                <p className="text-xs text-[#71717A]">
                  Help other patrons appreciate {stall.artisan_name}&apos;s master craftsmanship
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#71717A] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newRev = addArtisanReview({
                  stall_id: stall.id,
                  user_name: newReviewName || 'Artisan Patron',
                  buyer_name: newReviewName || 'Artisan Patron',
                  rating: newReviewRating,
                  comment: newReviewComment,
                  craft_purchased: newReviewCraft || 'Handcrafted Artisan Tote',
                  verified_purchase: true,
                });
                setReviews([newRev, ...reviews]);
                setIsReviewModalOpen(false);
                setNewReviewComment('');
                addToast({
                  title: 'Review Published! ⭐',
                  message: `Thank you! Your review for ${stall.name} has been published.`,
                  type: 'success',
                });
              }}
              className="p-6 space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#71717A] tracking-wider">
                  Rating Stars
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReviewRating(star)}
                      className="p-1 text-2xl focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= newReviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-zinc-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#18181B] ml-2">
                    {newReviewRating} out of 5 stars
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#71717A] tracking-wider">
                  Your Name
                </label>
                <input
                  type="text"
                  value={newReviewName}
                  onChange={(e) => setNewReviewName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full text-xs bg-[#FAFAF8] border border-[#E5E5E0] rounded-xl px-3 py-2.5 text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#71717A] tracking-wider">
                  Craft / Tote Bag Purchased
                </label>
                <input
                  type="text"
                  value={newReviewCraft}
                  onChange={(e) => setNewReviewCraft(e.target.value)}
                  placeholder="e.g. Kasavu Heritage Canvas Tote"
                  className="w-full text-xs bg-[#FAFAF8] border border-[#E5E5E0] rounded-xl px-3 py-2.5 text-[#18181B] focus:outline-none focus:border-[#18181B]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#71717A] tracking-wider">
                  Your Artisan &amp; Quality Review
                </label>
                <textarea
                  rows={4}
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="Share details on the texture, stitching finish, natural dye smell, and your experience with this artisan's work."
                  className="w-full text-xs bg-[#FAFAF8] border border-[#E5E5E0] rounded-xl p-3 text-[#18181B] focus:outline-none focus:border-[#18181B] resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#E5E5E0] text-xs font-semibold text-[#71717A] hover:bg-[#FAFAF8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#18181B] hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
