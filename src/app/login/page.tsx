'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Store,
  Video,
  ArrowRight,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  registerUser,
  loginUser,
  getUserSession,
} from '@/lib/userSession';
import { useToastStore } from '@/hooks/useToastStore';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToast = useToastStore((s) => s.addToast);

  // Read initial role & redirect from query params
  const paramRole = searchParams.get('role');
  const paramRedirect = searchParams.get('redirect');

  // Form mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  // Role tab: 'buyer' | 'seller' | 'influencer'
  const [role, setRole] = useState<'buyer' | 'seller' | 'influencer'>(
    paramRole === 'seller' || paramRole === 'influencer' || paramRole === 'buyer'
      ? paramRole
      : 'buyer'
  );

  useEffect(() => {
    if (paramRole === 'seller' || paramRole === 'influencer' || paramRole === 'buyer') {
      setRole(paramRole);
    }
  }, [paramRole]);

  // Sign In inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up inputs
  const [name, setName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  // Buyer specifics
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('');
  // Artisan specifics
  const [studioName, setStudioName] = useState('');
  const [craftSpecialty, setCraftSpecialty] = useState('');
  const [gemUdyamId, setGemUdyamId] = useState('');
  const [upiId, setUpiId] = useState('');
  // Influencer specifics
  const [socialHandle, setSocialHandle] = useState('');
  const [socialPlatform, setSocialPlatform] = useState<'instagram' | 'youtube' | 'lifestyle_blog'>('instagram');
  const [followerCount, setFollowerCount] = useState('25K');
  const [contentNiche, setContentNiche] = useState('Sustainable Heritage & Slow Fashion');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRedirectDestination = (userRole: string) => {
    if (paramRedirect) return paramRedirect;
    if (userRole === 'seller') return '/dashboard';
    if (userRole === 'influencer') return '/influencer';
    return '/';
  };

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      const res = loginUser(email, password);
      if (res.success && res.user) {
        // Enforce that user role matches target role if coming from strict gating
        if (paramRole && res.user.role !== paramRole) {
          setErrorMessage(
            `This account is registered as a "${res.user.role.toUpperCase()}". The requested area requires a "${paramRole.toUpperCase()}" account. Please select the correct persona tab or register a new profile.`
          );
          setIsSubmitting(false);
          return;
        }

        addToast({
          title: `Authenticated: ${res.user.name}`,
          message:
            res.user.role === 'seller'
              ? 'Welcome to Artisan Studio Workbench.'
              : res.user.role === 'influencer'
              ? 'Welcome to Creator Hub.'
              : 'Buyer account session active.',
          type: 'success',
        });

        const target = getRedirectDestination(res.user.role);
        router.push(target);
      } else {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
      setIsSubmitting(false);
    }, 400);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      const res = registerUser({
        role,
        name,
        email,
        password,
        phone: signupPhone,
        street,
        city,
        state: stateName,
        postalCode,
        studioName,
        craftSpecialty,
        gemUdyamId,
        upiId,
        socialHandle,
        socialPlatform,
        followerCount,
        contentNiche,
      });

      if (res.success && res.user) {
        addToast({
          title: 'Account Created & Verified!',
          message:
            role === 'seller'
              ? 'Artisan Studio profile active. Redirecting to production pipeline...'
              : role === 'influencer'
              ? 'Creator profile activated. Ready for reel links & pitches.'
              : 'Buyer profile established.',
          type: 'success',
        });

        const target = getRedirectDestination(role);
        router.push(target);
      } else {
        setErrorMessage(res.error || 'Failed to create account.');
      }
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-8 sm:py-14 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-xl w-full mx-auto space-y-5">
        {/* Minimal Block Header */}
        <div className="border-2 border-[#18181B] bg-white p-6 rounded-none shadow-[4px_4px_0px_0px_#18181B] text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-[#18181B] text-white flex items-center justify-center font-serif text-xl font-black">
              T
            </div>
            <span className="font-mono text-xl font-bold tracking-tight text-[#18181B] uppercase">
              TOTE MARKETPLACE
            </span>
          </Link>
          <p className="text-xs font-mono text-[#52525B]">
            TRIFURCATED ACCESS &middot; BUYER &middot; ARTISAN WORKBENCH &middot; CREATOR STUDIO
          </p>
          {paramRole && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-300 text-amber-900 text-xs font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Authentication required to enter {paramRole.toUpperCase()} mode</span>
            </div>
          )}
        </div>

        {/* Primary Auth Form Block */}
        <div className="border-2 border-[#18181B] bg-white p-6 sm:p-8 rounded-none shadow-[4px_4px_0px_0px_#18181B] space-y-6 font-mono">
          {/* Top Switcher: Sign In vs Sign Up */}
          <div className="grid grid-cols-2 gap-0 border-2 border-[#18181B] p-0.5 bg-[#E5E5E0]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage('');
              }}
              className={`py-2 text-xs font-bold tracking-wider uppercase transition-colors ${
                authMode === 'signin' ? 'bg-[#18181B] text-white' : 'text-[#18181B] hover:bg-white/50'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMessage('');
              }}
              className={`py-2 text-xs font-bold tracking-wider uppercase transition-colors ${
                authMode === 'signup' ? 'bg-[#18181B] text-white' : 'text-[#18181B] hover:bg-white/50'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* 3 Role Switcher Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 border-b-2 border-[#E5E5E0] pb-3">
            <span className="text-xs font-bold uppercase text-[#71717A]">Persona:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`px-3 py-1 text-xs font-bold uppercase border border-[#18181B] flex items-center gap-1.5 transition-all ${
                  role === 'buyer'
                    ? 'bg-[#18181B] text-white shadow-[2px_2px_0px_0px_#18181B]'
                    : 'bg-white text-[#18181B] hover:bg-[#FAFAF8]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Buyer
              </button>
              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`px-3 py-1 text-xs font-bold uppercase border border-[#18181B] flex items-center gap-1.5 transition-all ${
                  role === 'seller'
                    ? 'bg-[#18181B] text-white shadow-[2px_2px_0px_0px_#18181B]'
                    : 'bg-white text-[#18181B] hover:bg-[#FAFAF8]'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                Artisan Maker
              </button>
              <button
                type="button"
                onClick={() => setRole('influencer')}
                className={`px-3 py-1 text-xs font-bold uppercase border border-[#18181B] flex items-center gap-1.5 transition-all ${
                  role === 'influencer'
                    ? 'bg-orange-600 text-white shadow-[2px_2px_0px_0px_#18181B]'
                    : 'bg-white text-orange-950 hover:bg-orange-50'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                Influencer / Creator
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="border-2 border-red-600 bg-red-50 p-3 text-xs font-mono text-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {authMode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#18181B] block">
                  {role === 'seller'
                    ? 'Artisan Studio Email'
                    : role === 'influencer'
                    ? 'Creator / Handle Email'
                    : 'Buyer Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      role === 'seller'
                        ? 'artisan@handlooms.in'
                        : role === 'influencer'
                        ? 'creator@craftculture.in'
                        : 'buyer@example.com'
                    }
                    className="w-full pl-9 pr-3 py-2.5 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-[#18181B] block">
                  Security Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#18181B] shadow-[3px_3px_0px_0px_#71717A] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>
                      {role === 'seller'
                        ? 'Access Artisan Workbench'
                        : role === 'influencer'
                        ? 'Enter Creator Studio'
                        : 'Enter Buyer Store'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* SIGN UP FORM */
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#18181B] block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Full Name"
                    className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#18181B] block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#18181B] block">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#18181B] block">
                    Create Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 4 characters"
                    className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Role Specific Fields */}
              {role === 'buyer' ? (
                <div className="border-t-2 border-[#E5E5E0] pt-3 space-y-3">
                  <p className="text-[11px] font-bold uppercase text-[#71717A]">
                    Delivery Address Details
                  </p>
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Door No, Street Name, Apartment"
                      className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                    />
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="State"
                      className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                    />
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="PIN Code"
                      className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                    />
                  </div>
                </div>
              ) : role === 'influencer' ? (
                <div className="border-t-2 border-[#E5E5E0] pt-3 space-y-3">
                  <p className="text-[11px] font-bold uppercase text-orange-700">
                    Creator Channel &amp; Social Reach Specs
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={socialHandle}
                      onChange={(e) => setSocialHandle(e.target.value)}
                      placeholder="Social Handle (e.g. @artisan_stories)"
                      className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                    />
                    <select
                      value={socialPlatform}
                      onChange={(e) => setSocialPlatform(e.target.value as any)}
                      className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono font-bold uppercase bg-[#FAFAF8] outline-none focus:bg-white"
                    >
                      <option value="instagram">Instagram Reels</option>
                      <option value="youtube">YouTube Shorts</option>
                      <option value="lifestyle_blog">Slow Fashion Blog</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={followerCount}
                      onChange={(e) => setFollowerCount(e.target.value)}
                      placeholder="Followers / Subscribers (e.g. 50K)"
                      className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                    />
                    <input
                      type="text"
                      value={contentNiche}
                      onChange={(e) => setContentNiche(e.target.value)}
                      placeholder="Niche (e.g. Heritage & Eco Lifestyle)"
                      className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="border-t-2 border-[#E5E5E0] pt-3 space-y-3">
                  <p className="text-[11px] font-bold uppercase text-[#71717A]">
                    Artisan Stall & GeM/B2B Specs
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      placeholder="Studio / Loom Name (e.g. Sahyadri Weaves)"
                      className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                    />
                    <input
                      type="text"
                      value={craftSpecialty}
                      onChange={(e) => setCraftSpecialty(e.target.value)}
                      placeholder="Craft Specialty (e.g. Indigo Dye)"
                      className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={gemUdyamId}
                      onChange={(e) => setGemUdyamId(e.target.value)}
                      placeholder="UDYAM / GeM ID (e.g. UDYAM-KL-07-991)"
                      className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                    />
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="UPI ID for Payouts (e.g. stall@upi)"
                      className="w-full px-3 py-2 border-2 border-[#18181B] text-xs font-mono text-[#18181B] bg-[#FAFAF8] outline-none focus:bg-white"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#18181B] shadow-[3px_3px_0px_0px_#71717A] active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Registering Profile...</span>
                ) : (
                  <>
                    <span>
                      Create &amp; Launch{' '}
                      {role === 'seller'
                        ? 'Artisan Studio'
                        : role === 'influencer'
                        ? 'Creator Studio'
                        : 'Buyer Profile'}
                    </span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Notes */}
          <div className="border-t-2 border-[#E5E5E0] pt-4 text-center">
            <p className="text-[10px] font-mono text-[#71717A]">
              100% DIRECT ARTISAN PAYMENTS &middot; ZERO PLATFORM CUT &middot; PM VISHWAKARMA & GeM SUPPORT
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center font-mono text-xs">
          Loading authentication gateway...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
