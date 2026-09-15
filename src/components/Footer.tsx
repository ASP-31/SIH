'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Heart, Sparkles, Store, Truck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#FFFFFF] border-t border-[#E5E5E0] text-[#71717A] text-xs py-12 px-4 sm:px-6 lg:px-8 mt-auto pb-20 md:pb-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Story */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#18181B] text-white flex items-center justify-center font-serif text-sm font-bold">
              T
            </div>
            <span className="font-bold text-base text-[#18181B] tracking-tight">
              Tote Marketplace
            </span>
          </div>
          <p className="text-xs text-[#71717A] leading-relaxed max-w-md">
            A conscious multi-vendor platform dedicated exclusively to independent tote bag artisans,
            loom weavers, and leatherworkers. Fair payouts, zero fast-fashion waste, and direct creator dispatches.
          </p>
          <div className="flex items-center gap-4 text-[11px] pt-1 text-[#18181B] font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Artisan Guarantee
            </span>
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-amber-600" />
              Pan-India Express Dispatch
            </span>
          </div>
        </div>

        {/* Quick Collections */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-[#18181B] tracking-wider uppercase">
            Artisanal Collections
          </h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link href="/?category=Canvas" className="hover:text-[#18181B] transition-colors">
                Organic Heavy Canvas
              </Link>
            </li>
            <li>
              <Link href="/?category=Crochet" className="hover:text-[#18181B] transition-colors">
                Hand-Crocheted Twine & Raffia
              </Link>
            </li>
            <li>
              <Link href="/?category=Heavy-Duty" className="hover:text-[#18181B] transition-colors">
                18oz Waxed Mariner Totes
              </Link>
            </li>
            <li>
              <Link href="/?category=Work%20%26%20Laptop" className="hover:text-[#18181B] transition-colors">
                Structured Laptop Totes
              </Link>
            </li>
          </ul>
        </div>

        {/* Creator Hub */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-[#18181B] tracking-wider uppercase">
            Artisan Studio
          </h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link href="/dashboard" className="hover:text-[#18181B] transition-colors flex items-center gap-1">
                <Store className="w-3 h-3 text-amber-700" />
                Seller Dashboard
              </Link>
            </li>
            <li>
              <Link href="/orders" className="hover:text-[#18181B] transition-colors">
                Track My Orders
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-[#18181B] transition-colors">
                Apply as a Creator
              </Link>
            </li>
            <li>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium mt-1">
                <Sparkles className="w-3 h-3" />
                Stripe Express & UPI Enabled
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-[#E5E5E0] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
        <span>
          © {new Date().getFullYear()} Tote Artisanal Marketplace Inc. Celebrating conscious slow fashion.
        </span>
        <span className="flex items-center gap-1 text-[#71717A]">
          Crafted with care for independent creators <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
        </span>
      </div>
    </footer>
  );
};
